from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session

from database import get_db
from models import User, UserRole
from auth_utils import decode_access_token

oauth2_scheme = HTTPBearer()

def get_current_user(
    credentials = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    token = credentials.credentials
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
   
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_error
    
    

    user_id = payload.get("sub")
    user = db.query(User).filter(User.user_id == user_id).first()
    if user is None:
        raise credentials_error
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account has been deactivated")

    return user


def require_roles(*allowed_roles: UserRole):
    """
    Usage: Depends(require_roles(UserRole.admin, UserRole.staff))
    Raises 403 if the current user's role isn't in the allowed set.
    """
    def checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action",
            )
        return current_user

    return checker


def require_self_or_roles(*allowed_roles: UserRole):
    """
    For routes with a {user_id} path param: allows the request through if the
    caller IS that user, OR if the caller's role is in allowed_roles.
    e.g. a customer can edit their own profile; an admin can edit anyone's.
    """
    def checker(
        user_id: str, current_user: User = Depends(get_current_user)
    ) -> User:
        if current_user.user_id == user_id or current_user.role in allowed_roles:
            return current_user
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action",
        )

    return checker
