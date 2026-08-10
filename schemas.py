from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict

from models import UserRole, TicketStatus, TicketPriority, TicketCreatedVia


# ---------- Auth payloads ----------

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)


# ---------- User CRUD payloads ----------

class UserCreateByAdmin(BaseModel):
    """Only admins can hit this — lets them create staff or admin accounts directly."""
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str
    role: UserRole


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None


class UserRoleUpdate(BaseModel):
    role: UserRole


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: str
    email: EmailStr
    full_name: str
    role: UserRole
    is_active: bool
    is_email_verified: bool
    created_at: datetime
    last_login_at: Optional[datetime] = None


# ---------- Ticket payloads ----------

class TicketCreate(BaseModel):
    subject: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=1)
    issue_category: Optional[str] = None
    priority: TicketPriority = TicketPriority.medium
    asset_reference: Optional[str] = None
    created_via: TicketCreatedVia = TicketCreatedVia.portal
    # Only honored when the caller is admin/staff creating a ticket on a
    # customer's behalf (e.g. phone-in request). Ignored for customer callers,
    # who can only ever create tickets for themselves.
    customer_id: Optional[str] = None


class TicketUpdate(BaseModel):
    """
    Every field optional (PATCH semantics). Which fields a given role is
    actually allowed to change is enforced in the router, not here —
    a customer sending `status` in the body is simply ignored rather than
    rejected, since PATCH bodies commonly carry unrelated fields.
    """
    subject: Optional[str] = Field(default=None, min_length=3, max_length=200)
    description: Optional[str] = None
    issue_category: Optional[str] = None
    priority: Optional[TicketPriority] = None
    status: Optional[TicketStatus] = None
    assigned_technician_id: Optional[str] = None
    asset_reference: Optional[str] = None


class TicketEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    event_id: str
    event_type: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    actor_id: str
    timestamp: datetime


class TicketResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    ticket_id: str
    customer_id: str
    assigned_technician_id: Optional[str] = None
    asset_reference: Optional[str] = None
    subject: str
    description: str
    issue_category: Optional[str] = None
    status: TicketStatus
    priority: TicketPriority
    created_via: TicketCreatedVia
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
