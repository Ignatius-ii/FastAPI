import uuid
import enum
from datetime import datetime

from sqlalchemy import Column, String, Boolean, DateTime, Enum, ForeignKey, Integer
from sqlalchemy.orm import relationship

from database import Base


def gen_uuid():
    return str(uuid.uuid4())


class UserRole(str, enum.Enum):
    admin = "admin"
    staff = "staff"
    customer = "customer"


class User(Base):
    __tablename__ = "users"

    user_id = Column(String, primary_key=True, default=gen_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.customer)

    is_active = Column(Boolean, default=True)          # soft-delete flag
    is_email_verified = Column(Boolean, default=False)

    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    last_login_at = Column(DateTime, nullable=True)

    refresh_tokens = relationship(
        "RefreshToken", back_populates="user", cascade="all, delete-orphan"
    )
    reset_tokens = relationship(
        "PasswordResetToken", back_populates="user", cascade="all, delete-orphan"
    )


class RefreshToken(Base):
    """
    Refresh tokens are stored server-side so they can be revoked individually
    (e.g. on logout, or by an admin disabling a staff account immediately).
    """
    __tablename__ = "refresh_tokens"

    token_id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False)
    token = Column(String, unique=True, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    revoked = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="refresh_tokens")


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    token_id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False)
    token = Column(String, unique=True, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="reset_tokens")


# ---------- Tickets ----------

class TicketStatus(str, enum.Enum):
    new = "new"
    triaged = "triaged"
    awaiting_parts = "awaiting_parts"
    in_repair = "in_repair"
    resolved = "resolved"
    closed = "closed"
    escalated = "escalated"


class TicketPriority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class TicketCreatedVia(str, enum.Enum):
    portal = "portal"
    phone = "phone"
    email = "email"
    ai_agent = "ai_agent"


# Statuses a ticket can never leave once reached — enforced in the router,
# defined here so model and API logic can't drift out of sync.
TERMINAL_STATUSES = {TicketStatus.resolved, TicketStatus.closed}


class Ticket(Base):
    __tablename__ = "tickets"

    ticket_id = Column(String, primary_key=True, default=gen_uuid)
    customer_id = Column(String, ForeignKey("users.user_id"), nullable=False, index=True)
    assigned_technician_id = Column(String, ForeignKey("users.user_id"), nullable=True)

    # No FK constraint to a formal assets table in this service — asset registry
    # is a separate concern. Stored as a free-text reference (e.g. serial number).
    asset_reference = Column(String, nullable=True)

    subject = Column(String, nullable=False)
    description = Column(String, nullable=False)
    issue_category = Column(String, nullable=True)  # Hardware / Software / Diagnostic
    status = Column(Enum(TicketStatus), nullable=False, default=TicketStatus.new)
    priority = Column(Enum(TicketPriority), nullable=False, default=TicketPriority.medium)
    created_via = Column(Enum(TicketCreatedVia), nullable=False, default=TicketCreatedVia.portal)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    customer = relationship("User", foreign_keys=[customer_id])
    assigned_technician = relationship("User", foreign_keys=[assigned_technician_id])
    events = relationship(
        "TicketEvent", back_populates="ticket",
        cascade="all, delete-orphan", order_by="TicketEvent.timestamp",
    )


class TicketEvent(Base):
    """
    Append-only audit trail for a ticket. Every status change, assignment
    change, or note is recorded here rather than overwriting a single field —
    this is what gives customers a transparent, replayable history.
    """
    __tablename__ = "ticket_events"

    event_id = Column(String, primary_key=True, default=gen_uuid)
    ticket_id = Column(String, ForeignKey("tickets.ticket_id"), nullable=False, index=True)
    event_type = Column(String, nullable=False)  # StatusChange / Note / Assignment / Created
    old_value = Column(String, nullable=True)
    new_value = Column(String, nullable=True)
    actor_id = Column(String, ForeignKey("users.user_id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    ticket = relationship("Ticket", back_populates="events")
    actor = relationship("User")
