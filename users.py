from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import User, UserRole, RefreshToken
from schemas import UserCreateByAdmin, UserUpdate, UserRoleUpdate, UserResponse
from auth_utils import hash_password
from dependencies import get_current_user, require_roles, require_self_or_roles

router = APIRouter(prefix="/users", tags=["users"])


# ---------- CREATE ----------

@router.post(
    "",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(UserRole.admin))],
)
def create_user(payload: UserCreateByAdmin, db: Session = Depends(get_db)):
    """Admin-only: create staff or admin accounts directly (customers self-register via /auth/register)."""
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        role=payload.role,
        is_email_verified=True,  # admin-created accounts are pre-verified
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# ---------- READ ----------

@router.get(
    "",
    response_model=List[UserResponse],
    dependencies=[Depends(require_roles(UserRole.admin, UserRole.staff))],
)
def list_users(
    role: UserRole | None = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """Admin and staff can list all users; optionally filtered by role."""
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    return query.offset(skip).limit(min(limit, 200)).all()


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_self_or_roles(UserRole.admin, UserRole.staff)),
):
    """Admin/staff can view any user; a customer can only view their own record."""
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# ---------- UPDATE ----------

@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: str,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_self_or_roles(UserRole.admin)),
):
    """A user can edit their own name/email; only an admin can edit someone else's."""
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.email and payload.email != user.email:
        clash = db.query(User).filter(User.email == payload.email).first()
        if clash:
            raise HTTPException(status_code=400, detail="Email already in use")
        user.email = payload.email
        user.is_email_verified = False  # re-verify on email change

    if payload.full_name:
        user.full_name = payload.full_name

    db.commit()
    db.refresh(user)
    return user


@router.patch(
    "/{user_id}/role",
    response_model=UserResponse,
    dependencies=[Depends(require_roles(UserRole.admin))],
)
def update_user_role(user_id: str, payload: UserRoleUpdate, db: Session = Depends(get_db)):
    """Admin-only: promote/demote a user between customer, staff, and admin."""
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = payload.role
    db.commit()
    db.refresh(user)
    return user


# ---------- DELETE ----------

@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_roles(UserRole.admin))],
)
def deactivate_user(user_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Admin-only soft delete: sets is_active=False and revokes all sessions,
    rather than hard-deleting the row (tickets/history reference user_id).
    """
    if user_id == current_user.user_id:
        raise HTTPException(status_code=400, detail="Admins cannot deactivate their own account")

    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = False
    db.query(RefreshToken).filter(RefreshToken.user_id == user_id).update({"revoked": True})
    db.commit()
    return None
