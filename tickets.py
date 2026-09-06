from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import (
    User, UserRole, Ticket, TicketEvent, TicketStatus, TERMINAL_STATUSES,
)
from schemas import TicketCreate, TicketUpdate, TicketResponse, TicketEventResponse
from dependencies import get_current_user, require_roles

router = APIRouter(prefix="/tickets", tags=["tickets"])

STAFF_OR_ADMIN = (UserRole.admin, UserRole.staff)


# ---------- Shared helpers ----------

def _get_ticket_or_404(ticket_id: str, db: Session) -> Ticket:
    ticket = db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


def _assert_can_view(ticket: Ticket, user: User) -> None:
    if user.role in STAFF_OR_ADMIN:
        return
    if ticket.customer_id != user.user_id:
        raise HTTPException(status_code=403, detail="You do not have access to this ticket")


def _log_event(db: Session, ticket_id: str, actor_id: str, event_type: str,
                old_value: Optional[str], new_value: Optional[str]) -> None:
    db.add(TicketEvent(
        ticket_id=ticket_id, event_type=event_type,
        old_value=old_value, new_value=new_value, actor_id=actor_id,
    ))


# ---------- CREATE ----------

@router.post("", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
def create_ticket(
    payload: TicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Customers can only create tickets for themselves — any `customer_id` they
    pass is ignored. Admin/staff may create a ticket on behalf of any customer
    (e.g. a phone-in request), and must supply a valid `customer_id`.
    """
    if current_user.role == UserRole.customer:
        customer_id = current_user.user_id
    else:
        if not payload.customer_id:
            raise HTTPException(
                status_code=400,
                detail="customer_id is required when staff/admin create a ticket on behalf of a customer",
            )
        customer = db.query(User).filter(
            User.user_id == payload.customer_id, User.role == UserRole.customer
        ).first()
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        customer_id = customer.user_id

    ticket = Ticket(
        customer_id=customer_id,
        subject=payload.subject,
        description=payload.description,
        issue_category=payload.issue_category,
        priority=payload.priority,
        asset_reference=payload.asset_reference,
        created_via=payload.created_via,
        status=TicketStatus.new,
    )
    db.add(ticket)
    db.flush()  # populates ticket.ticket_id before we log the event

    _log_event(db, ticket.ticket_id, current_user.user_id, "Created", None, TicketStatus.new.value)

    db.commit()
    db.refresh(ticket)
    return ticket


# ---------- READ ----------

@router.get("", response_model=List[TicketResponse])
def list_tickets(
    status_filter: Optional[TicketStatus] = None,
    priority: Optional[str] = None,
    assigned_technician_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Admin/staff see all tickets (optionally filtered); customers see only their own."""
    query = db.query(Ticket)

    if current_user.role == UserRole.customer:
        query = query.filter(Ticket.customer_id == current_user.user_id)

    if status_filter:
        query = query.filter(Ticket.status == status_filter)
    if priority:
        query = query.filter(Ticket.priority == priority)
    if assigned_technician_id:
        if current_user.role == UserRole.customer:
            raise HTTPException(status_code=403, detail="Not permitted to filter by technician")
        query = query.filter(Ticket.assigned_technician_id == assigned_technician_id)

    return (
        query.order_by(Ticket.created_at.desc())
        .offset(skip).limit(min(limit, 200)).all()
    )


@router.get("/{ticket_id}", response_model=TicketResponse)
def get_ticket(
    ticket_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ticket = _get_ticket_or_404(ticket_id, db)
    _assert_can_view(ticket, current_user)
    return ticket


@router.get("/{ticket_id}/events", response_model=List[TicketEventResponse])
def get_ticket_events(
    ticket_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """The audit trail behind the ticket — powers a customer-facing 'live status' view."""
    ticket = _get_ticket_or_404(ticket_id, db)
    _assert_can_view(ticket, current_user)
    return (
        db.query(TicketEvent)
        .filter(TicketEvent.ticket_id == ticket_id)
        .order_by(TicketEvent.timestamp.asc())
        .all()
    )


# ---------- UPDATE ----------

@router.patch("/{ticket_id}", response_model=TicketResponse)
def update_ticket(
    ticket_id: str,
    payload: TicketUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    - Admin/staff can update any field, including status and assignment.
    - Customers may only edit subject/description/priority on their OWN ticket,
      and only while it's still in 'new' status (i.e. before triage begins).
      Any status/assignment fields they send are silently ignored.
    Every change is written to ticket_events rather than just overwritten.
    """
    ticket = _get_ticket_or_404(ticket_id, db)
    is_staff = current_user.role in STAFF_OR_ADMIN

    if not is_staff:
        if ticket.customer_id != current_user.user_id:
            raise HTTPException(status_code=403, detail="You do not have access to this ticket")
        if ticket.status != TicketStatus.new:
            raise HTTPException(
                status_code=409,
                detail="Ticket is already being worked on and can no longer be edited by the customer",
            )

    if ticket.status in TERMINAL_STATUSES and payload.status and payload.status not in TERMINAL_STATUSES:
        # Reopening a closed/resolved ticket is a deliberate action worth flagging,
        # but we still allow it for admin/staff rather than hard-blocking it.
        if not is_staff:
            raise HTTPException(status_code=409, detail="Cannot modify a closed or resolved ticket")

    if payload.subject is not None:
        ticket.subject = payload.subject
    if payload.description is not None:
        ticket.description = payload.description
    if payload.issue_category is not None:
        ticket.issue_category = payload.issue_category
    if payload.asset_reference is not None:
        ticket.asset_reference = payload.asset_reference

    if payload.priority is not None and payload.priority != ticket.priority:
        _log_event(db, ticket_id, current_user.user_id, "PriorityChange",
                   ticket.priority.value, payload.priority.value)
        ticket.priority = payload.priority

    if is_staff:
        if payload.status is not None and payload.status != ticket.status:
            _log_event(db, ticket_id, current_user.user_id, "StatusChange",
                       ticket.status.value, payload.status.value)
            ticket.status = payload.status
            if payload.status == TicketStatus.resolved:
                ticket.resolved_at = datetime.utcnow()
            elif payload.status in (TicketStatus.new, TicketStatus.in_repair):
                ticket.resolved_at = None  # reopened

        if payload.assigned_technician_id is not None:
            if current_user.role != UserRole.admin:
                raise HTTPException(
                    status_code=403,
                    detail="Only admins can assign or reassign a ticket's technician",
                )
            technician = db.query(User).filter(
                User.user_id == payload.assigned_technician_id,
                User.role.in_(STAFF_OR_ADMIN),
            ).first()
            if not technician:
                raise HTTPException(status_code=404, detail="Technician not found")
            _log_event(db, ticket_id, current_user.user_id, "Assignment",
                       ticket.assigned_technician_id, technician.user_id)
            ticket.assigned_technician_id = technician.user_id

    ticket.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(ticket)
    return ticket


@router.post("/{ticket_id}/notes", response_model=TicketEventResponse, status_code=status.HTTP_201_CREATED)
def add_ticket_note(
    ticket_id: str,
    note: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a free-text note to the ticket's audit trail. Owner customer or staff/admin only."""
    ticket = _get_ticket_or_404(ticket_id, db)
    _assert_can_view(ticket, current_user)

    event = TicketEvent(
        ticket_id=ticket_id, event_type="Note",
        old_value=None, new_value=note, actor_id=current_user.user_id,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


# ---------- DELETE ----------

@router.delete(
    "/{ticket_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_roles(UserRole.admin))],
)
def delete_ticket(ticket_id: str, db: Session = Depends(get_db)):
    """
    Admin-only, and a genuinely destructive hard delete (cascades ticket_events).
    In most real support systems you'd prefer closing a ticket over deleting it,
    to preserve history for audits/CSAT/reporting — consider whether you actually
    want this endpoint exposed, versus just supporting status='closed' via PATCH.
    """
    ticket = _get_ticket_or_404(ticket_id, db)
    db.delete(ticket)
    db.commit()
    return None