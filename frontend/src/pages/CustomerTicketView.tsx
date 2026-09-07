import { StatusBadge } from "@/components/Badge";
import type { Ticket, TicketEvent } from "@/types";

const STATUS_HEADLINE: Record<string, string> = {
  new: "Your machine has been received",
  triaged: "Your machine is being diagnosed",
  awaiting_parts: "Your machine is in for service",
  in_repair: "Your machine is being repaired",
  escalated: "Your repair needs extra attention",
  resolved: "Your machine is ready",
  closed: "Repair complete",
};

// Same 5-stage simplification used in TicketTagCard for the staff view —
// kept as a separate small copy here since the customer copy per step reads
// differently ("Machine received" vs the technician-facing "Received").
const STAGES: { key: string; title: string }[] = [
  { key: "new", title: "Machine received" },
  { key: "triaged", title: "Diagnosed by engineer" },
  { key: "awaiting_parts", title: "Part on its way" },
  { key: "in_repair", title: "Under repair" },
  { key: "resolved", title: "Ready for pickup" },
];

export function CustomerTicketView({ ticket, events }: { ticket: Ticket; events: TicketEvent[] }) {
  const stageOrder = ["new", "triaged", "awaiting_parts", "in_repair", "resolved"];
  const currentIndex = ticket.status === "closed" ? stageOrder.length : stageOrder.indexOf(ticket.status);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        <div>
          <p style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 6px" }}>
            Repair tracking
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 500, margin: 0 }}>
            {STATUS_HEADLINE[ticket.status] ?? ticket.subject}
          </h1>
        </div>
        <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 999, padding: "8px 16px", fontSize: 13 }}>
          Ticket <strong style={{ fontFamily: "var(--font-mono)" }}>{ticket.ticket_id.slice(0, 8).toUpperCase()}</strong>
          {" · opened "}
          {new Date(ticket.created_at).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 20, alignItems: "start" }}>
        <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.25rem" }}>
          <div
            style={{
              height: 140,
              borderRadius: "var(--radius)",
              background: "var(--text-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 14,
            }}
          >
            <i className="ti ti-device-laptop" style={{ fontSize: 40, color: "var(--surface-2)" }} aria-hidden="true" />
          </div>
          <p style={{ fontWeight: 500, fontSize: 16, margin: "0 0 4px" }}>{ticket.subject}</p>
          {ticket.asset_reference && (
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 14px" }}>
              Asset reference: {ticket.asset_reference}
            </p>
          )}

          <MetaRow label="Priority" value={ticket.priority} />
          {ticket.issue_category && <MetaRow label="Category" value={ticket.issue_category} />}
          <MetaRow label="Reported issue" value={ticket.subject} />
        </div>

        <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <p style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>Repair progress</p>
            <StatusBadge status={ticket.status} />
          </div>

          {STAGES.map((stage, i) => {
            const done = currentIndex > i || currentIndex === STAGES.length;
            const isCurrent = i === currentIndex;
            const matchingEvent = events.find(
              (e) => e.event_type === "StatusChange" && e.new_value === stage.key
            );
            return (
              <div key={stage.key} style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: done ? "var(--text-success)" : "transparent",
                      border: `2px solid ${done ? "var(--text-success)" : isCurrent ? "var(--text-warning)" : "var(--border-strong)"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {done && <i className="ti ti-check" style={{ fontSize: 12, color: "#fff" }} aria-hidden="true" />}
                    {isCurrent && !done && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--text-warning)" }} />}
                  </span>
                  {i < STAGES.length - 1 && <div style={{ width: 2, flex: 1, background: "var(--border)", marginTop: 4 }} />}
                </div>
                <div style={{ paddingBottom: 4 }}>
                  <p style={{ fontWeight: 500, fontSize: 14, margin: "0 0 2px", color: isCurrent ? "var(--text-warning)" : "var(--text-primary)" }}>
                    {stage.title}
                  </p>
                  {matchingEvent && (
                    <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 4px", fontFamily: "var(--font-mono)" }}>
                      {new Date(matchingEvent.timestamp).toLocaleString()}
                    </p>
                  )}
                  {isCurrent && (
                    <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>In progress</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid var(--border)", fontSize: 13 }}>
      <span style={{ color: "var(--text-secondary)" }}>{label}</span>
      <span style={{ fontWeight: 500, textTransform: "capitalize" }}>{value}</span>
    </div>
  );
}
