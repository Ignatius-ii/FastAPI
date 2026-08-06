from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import User, UserRole, RefreshToken, PasswordResetToken
from schemas import (
    RegisterRequest, LoginRequest, TokenResponse, RefreshRequest,
    ForgotPasswordRequest, ResetPasswordRequest, UserResponse,
)
from auth_utils import (
    hash_password, verify_password, create_access_token,
    generate_refresh_token, refresh_token_expiry,
    generate_reset_token, reset_token_expiry,
)
from dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 15


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    """
    Public self-signup. Always creates a 'customer' role account —
    staff/admin accounts must be created by an existing admin (see users router).
    """
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        role=UserRole.customer,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    # In production: send an email verification link here.
    return user


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()

    # Deliberately vague error message — don't reveal whether the email exists.
    invalid_creds = HTTPException(status_code=401, detail="Incorrect email or password")

    if not user:
        raise invalid_creds

    if user.locked_until and user.locked_until > datetime.utcnow():
        raise HTTPException(
            status_code=423,
            detail=f"Account locked until {user.locked_until.isoformat()} due to repeated failed logins",
        )

    if not verify_password(payload.password, user.password_hash):
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= MAX_FAILED_ATTEMPTS:
            from datetime import timedelta
            user.locked_until = datetime.utcnow() + timedelta(minutes=LOCKOUT_MINUTES)
        db.commit()
        raise invalid_creds

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account has been deactivated")

    # Successful login — reset lockout counters
    user.failed_login_attempts = 0
    user.locked_until = None
    user.last_login_at = datetime.utcnow()
    db.commit()

    return _issue_token_pair(user, db)


@router.post("/refresh", response_model=TokenResponse)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)):
    stored = db.query(RefreshToken).filter(
        RefreshToken.token == payload.refresh_token
    ).first()

    if not stored or stored.revoked or stored.expires_at < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    user = db.query(User).filter(User.user_id == stored.user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    # Rotate: revoke the used refresh token and issue a brand new pair.
    # This limits the damage if a refresh token is ever stolen.
    stored.revoked = True
    db.commit()

    return _issue_token_pair(user, db)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(payload: RefreshRequest, db: Session = Depends(get_db)):
    stored = db.query(RefreshToken).filter(
        RefreshToken.token == payload.refresh_token
    ).first()
    if stored:
        stored.revoked = True
        db.commit()
    return None


@router.post("/forgot-password", status_code=status.HTTP_202_ACCEPTED)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()

    # Always return the same response whether or not the email exists,
    # so this endpoint can't be used to enumerate registered emails.
    if user:
        token = generate_reset_token()
        reset = PasswordResetToken(
            user_id=user.user_id, token=token, expires_at=reset_token_expiry()
        )
        db.add(reset)
        db.commit()
        # In production: email `token` as a link, never return it in the API response.

    return {"message": "If that email is registered, a reset link has been sent."}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    reset = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == payload.token
    ).first()

    if not reset or reset.used or reset.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    user = db.query(User).filter(User.user_id == reset.user_id).first()
    user.password_hash = hash_password(payload.new_password)
    reset.used = True

    # Invalidate all existing refresh tokens on password reset for safety.
    db.query(RefreshToken).filter(RefreshToken.user_id == user.user_id).update(
        {"revoked": True}
    )
    db.commit()

    return {"message": "Password has been reset successfully"}


@router.get("/me", response_model=UserResponse)
def read_own_profile(current_user: User = Depends(get_current_user)):
    return current_user


def _issue_token_pair(user: User, db: Session) -> TokenResponse:
    access_token = create_access_token(user.user_id, user.role.value)

    refresh_value = generate_refresh_token()
    refresh_record = RefreshToken(
        user_id=user.user_id, token=refresh_value, expires_at=refresh_token_expiry()
    )
    db.add(refresh_record)
    db.commit()

    return TokenResponse(access_token=access_token, refresh_token=refresh_value)
