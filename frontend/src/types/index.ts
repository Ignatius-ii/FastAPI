// Mirrors backend/models.py and backend/schemas.py.
// Keep these enums in lockstep with the FastAPI backend — if you remove a
// status there (e.g. "triaged"), remove it here too, or the type checker
// won't catch the drift.

export type UserRole = "admin" | "staff" | "customer";

export type TicketStatus =
  | "new"
  | "triaged"
  | "awaiting_parts"
  | "in_repair"
  | "resolved"
  | "closed"
  | "escalated";

export type TicketPriority = "low" | "medium" | "high" | "critical";

export type TicketCreatedVia = "portal" | "phone" | "email" | "ai_agent";

export interface User {
  user_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  is_email_verified: boolean;
  created_at: string;
  last_login_at: string | null;
}

export interface Ticket {
  ticket_id: string;
  customer_id: string;
  assigned_technician_id: string | null;
  asset_reference: string | null;
  subject: string;
  description: string;
  issue_category: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  created_via: TicketCreatedVia;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface TicketEvent {
  event_id: string;
  event_type: string; // "Created" | "StatusChange" | "PriorityChange" | "Assignment" | "Note"
  old_value: string | null;
  new_value: string | null;
  actor_id: string;
  timestamp: string;
}

export interface TicketCreatePayload {
  subject: string;
  description: string;
  issue_category?: string;
  priority?: TicketPriority;
  asset_reference?: string;
  created_via?: TicketCreatedVia;
  customer_id?: string; // only used/required for admin & staff callers
}

export interface TicketUpdatePayload {
  subject?: string;
  description?: string;
  issue_category?: string;
  priority?: TicketPriority;
  status?: TicketStatus;
  assigned_technician_id?: string;
  asset_reference?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
}

export interface ApiError {
  detail: string;
}
