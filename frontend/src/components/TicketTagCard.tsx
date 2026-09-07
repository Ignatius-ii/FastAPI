import type { CSSProperties } from "react";
import type { Ticket } from "@/types";

// Our backend's status enum doesn't map 1:1 onto a physical intake pipeline,
// so this is a deliberate simplification: these 5 stages are the "happy path"
// a repair usually takes. "escalated" is a side-branch (see note below), not
// a 6th stage, matching how we modeled it on the backend.
const STAGE_ORDER = ["new", "triaged", "awaiting_parts", "in_repair", "resolved"] as const;
const STAGE_LABELS = ["Received", "Diagnosed", "Parts", "Repaired", "QC · ready"];

function stageIndex(ticket: Ticket): number {
  if (ticket.status === "closed") return STAGE_ORDER.length; // fully done
  const idx = STAGE_ORDER.indexOf(ticket.status as (typeof STAGE_ORDER)[number]);
  return idx; // -1 for "escalated" — see render logic below
}

function Barcode({ seed }: { seed: string }) {
  // Purely decorative — generates a deterministic bar pattern from the ticket
  // id so the same ticket always renders the same "barcode", without needing
  // a real barcode library for what is just a visual flourish.
  const bars = Array.from(seed).map((ch, i) => 1 + ((ch.charCodeAt(0) + i) % 4));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 40, margin: "10px 0 4px" }}>
      {bars.map((w, i) => (
        <div key={i} style={{ width: w, height: "100%", background: "var(--text-primary)" }} />
      ))}
    </div>
  );
}

export function TicketTagCard({ ticket, technicianName }: { ticket: Ticket; technicianName?: string }) {
  const currentStage = stageIndex(ticket);
  const isEscalated = ticket.status === "escalated";

  return (
    <div
      style={{
        display: "flex",
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <div style={{ width: 10, background: "var(--text-primary)", flexShrink: 0 }} />

      <div style={{ flex: 1, padding: "18px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 20, fontWeight: 500 }}>
            {ticket.ticket_id.slice(0, 8).toUpperCase()}
          </span>
          {isEscalated && (
            <span style={badgeStyle("var(--bg-danger)", "var(--text-danger)")}>Escalated</span>
          )}
          {ticket.priority === "critical" && !isEscalated && (
            <span style={badgeStyle("var(--bg-danger)", "var(--text-danger)")}>Critical</span>
          )}
        </div>

        <p style={{ fontWeight: 500, fontSize: 15, margin: "0 0 2px" }}>{ticket.subject}</p>
        {ticket.asset_reference && (
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 4px" }}>
            Asset: {ticket.asset_reference}
          </p>
        )}

        <Barcode seed={ticket.ticket_id} />
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", margin: "0 0 16px" }}>
          {ticket.ticket_id}
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 16,
            fontSize: 12,
          }}
        >
          <MetaItem label="Opened" value={new Date(ticket.created_at).toLocaleDateString()} />
          <MetaItem label="Priority" value={ticket.priority} />
          <MetaItem label="Technician" value={technicianName ?? "Unassigned"} />
        </div>
      </div>

      <div
        style={{
          width: 150,
          borderLeft: "1px solid var(--border)",
          padding: "18px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          flexShrink: 0,
        }}
      >
        {STAGE_LABELS.map((label, i) => {
          const done = currentStage > i || currentStage === STAGE_ORDER.length;
          const isCurrent = i === currentStage;
          return (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 4,
                  border: `1.5px solid ${
                    done ? "var(--text-success)" : isCurrent ? "var(--text-warning)" : "var(--border-strong)"
                  }`,
                  background: done ? "var(--text-success)" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {done && <i className="ti ti-check" style={{ fontSize: 10, color: "#fff" }} aria-hidden="true" />}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  letterSpacing: "0.03em",
                  textTransform: "uppercase",
                  color: done ? "var(--text-primary)" : isCurrent ? "var(--text-warning)" : "var(--text-muted)",
                }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ color: "var(--text-muted)", textTransform: "uppercase", fontSize: 10, margin: "0 0 2px", letterSpacing: "0.04em" }}>
        {label}
      </p>
      <p style={{ margin: 0, fontWeight: 500, textTransform: "capitalize" }}>{value}</p>
    </div>
  );
}

function badgeStyle(bg: string, fg: string): CSSProperties {
  return {
    fontSize: 11,
    fontWeight: 500,
    padding: "2px 9px",
    borderRadius: 999,
    background: bg,
    color: fg,
  };
}
