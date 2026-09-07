import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ticketsApi } from "@/api/tickets";
import { usersApi } from "@/api/users";
import { useAuth } from "@/context/AuthContext";
import { TicketTagCard } from "@/components/TicketTagCard";
import { CustomerTicketView } from "@/pages/CustomerTicketView";
import type { Ticket, TicketEvent, TicketStatus, TicketPriority, User } from "@/types";

const STATUS_OPTIONS: TicketStatus[] = [
  "new",
  "triaged",
  "awaiting_parts",
  "in_repair",
  "escalated",
  "resolved",
  "closed",
];

const PRIORITY_OPTIONS: TicketPriority[] = ["low", "medium", "high", "critical"];

export function TicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [events, setEvents] = useState<TicketEvent[]>([]);
  const [technicianName, setTechnicianName] = useState<string | undefined>();
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Local editable copies of subject/description — only written back on "Save",
  // so a staff member can't accidentally overwrite the ticket on every keystroke.
  const [subjectDraft, setSubjectDraft] = useState("");
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  const isStaffOrAdmin = user?.role === "admin" || user?.role === "staff";
  const isAdmin = user?.role === "admin";

  async function refresh() {
    if (!ticketId) return;
    const [t, e] = await Promise.all([ticketsApi.get(ticketId), ticketsApi.getEvents(ticketId)]);
    setTicket(t);
    setEvents(e);
    setSubjectDraft(t.subject);
    setDescriptionDraft(t.description);
    if (t.assigned_technician_id) {
      usersApi.get(t.assigned_technician_id).then((u) => setTechnicianName(u.full_name)).catch(() => {});
    } else {
      setTechnicianName(undefined);
    }
  }

  useEffect(() => {
    setIsLoading(true);
    refresh().finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  useEffect(() => {
    if (!isAdmin) return;
    usersApi
      .list()
      .then((all) => setTechnicians(all.filter((u) => u.role === "admin" || u.role === "staff")))
      .catch(() => {});
  }, [isAdmin]);

  async function handleStatusChange(newStatus: TicketStatus) {
    if (!ticketId) return;
    await ticketsApi.update(ticketId, { status: newStatus });
    refresh();
  }

  async function handlePriorityChange(newPriority: TicketPriority) {
    if (!ticketId) return;
    await ticketsApi.update(ticketId, { priority: newPriority });
    refresh();
  }

  async function handleAssignTechnician(technicianId: string) {
    if (!ticketId || !technicianId) return;
    await ticketsApi.update(ticketId, { assigned_technician_id: technicianId });
    refresh();
  }

  async function handleSaveDetails() {
    if (!ticketId) return;
    setIsSavingDetails(true);
    try {
      await ticketsApi.update(ticketId, {
        subject: subjectDraft.trim(),
        description: descriptionDraft.trim(),
      });
      refresh();
    } finally {
      setIsSavingDetails(false);
    }
  }

  async function handleAddNote() {
    if (!ticketId || !note.trim()) return;
    await ticketsApi.addNote(ticketId, note.trim());
    setNote("");
    refresh();
  }

  if (isLoading || !ticket) {
    return <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Loading ticket…</p>;
  }

  if (!isStaffOrAdmin) {
    return <CustomerTicketView ticket={ticket} events={events} />;
  }

  const detailsDirty = subjectDraft !== ticket.subject || descriptionDraft !== ticket.description;

  return (
    <div>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 10px" }}>Service tag</p>
      <TicketTagCard ticket={ticket} technicianName={technicianName} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 24 }}>
        <div>
          <label style={labelStyle}>Subject</label>
          <input
            value={subjectDraft}
            onChange={(e) => setSubjectDraft(e.target.value)}
            style={inputStyle}
          />

          <label style={labelStyle}>Description</label>
          <textarea
            value={descriptionDraft}
            onChange={(e) => setDescriptionDraft(e.target.value)}
            rows={4}
            style={{ ...inputStyle, height: "auto", padding: 10, resize: "vertical", marginBottom: 8 }}
          />
          {detailsDirty && (
            <button
              onClick={handleSaveDetails}
              disabled={isSavingDetails}
              style={{ ...buttonStyle, marginBottom: 20 }}
            >
              {isSavingDetails ? "Saving…" : "Save changes"}
            </button>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <div>
              <label style={labelStyle}>Status</label>
              <select
                value={ticket.status}
                onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                style={inputStyle}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Priority</label>
              <select
                value={ticket.priority}
                onChange={(e) => handlePriorityChange(e.target.value as TicketPriority)}
                style={inputStyle}
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isAdmin && (
            <>
              <label style={labelStyle}>Assign technician</label>
              <select
                value={ticket.assigned_technician_id ?? ""}
                onChange={(e) => handleAssignTechnician(e.target.value)}
                style={{ ...inputStyle, marginBottom: 20 }}
              >
                <option value="" disabled>
                  {ticket.assigned_technician_id ? "Reassign to…" : "Unassigned — choose a technician"}
                </option>
                {technicians.map((t) => (
                  <option key={t.user_id} value={t.user_id}>
                    {t.full_name} ({t.role})
                  </option>
                ))}
              </select>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: -14, marginBottom: 20 }}>
                Note: this can assign or reassign, but the API has no "unassign" action — once a ticket has
                a technician, it can only be handed to someone else, not cleared back to unassigned.
              </p>
            </>
          )}
          {!isAdmin && ticket.assigned_technician_id && (
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 20px" }}>
              Assigned to: <strong>{technicianName ?? "…"}</strong>
              <span style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                Only admins can reassign a ticket's technician.
              </span>
            </p>
          )}

          <label style={labelStyle}>Add a note</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add an update…"
              style={{ ...inputStyle, flex: 1, marginBottom: 0 }}
            />
            <button onClick={handleAddNote} style={buttonStyle}>
              Add
            </button>
          </div>
        </div>

        <div>
          <p style={{ fontSize: 13, fontWeight: 500, margin: "0 0 8px" }}>Activity</p>
          <div style={{ borderLeft: "2px solid var(--border)", paddingLeft: 12 }}>
            {events.map((event) => (
              <div key={event.event_id} style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 13, margin: "0 0 2px" }}>{describeEvent(event)}</p>
                <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
                  {new Date(event.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function describeEvent(event: TicketEvent): string {
  switch (event.event_type) {
    case "Created":
      return "Ticket created";
    case "StatusChange":
      return `Status changed to ${event.new_value}`;
    case "PriorityChange":
      return `Priority changed to ${event.new_value}`;
    case "Assignment":
      return "Technician assigned";
    case "Note":
      return event.new_value ?? "Note added";
    default:
      return event.event_type;
  }
}

const labelStyle = {
  display: "block",
  fontSize: 13,
  color: "var(--text-secondary)",
  margin: "0 0 4px",
} as const;

const inputStyle = {
  display: "block",
  width: "100%",
  height: 36,
  padding: "0 10px",
  borderRadius: "var(--radius)",
  border: "1px solid var(--border-strong)",
  fontSize: 14,
  marginBottom: 14,
  boxSizing: "border-box",
} as const;

const buttonStyle = {
  height: 36,
  padding: "0 14px",
  borderRadius: "var(--radius)",
  border: "1px solid var(--border-strong)",
  background: "transparent",
  cursor: "pointer",
  fontSize: 14,
} as const;
