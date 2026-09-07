import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ticketsApi } from "@/api/tickets";
import { usersApi } from "@/api/users";
import { TicketTagCard } from "@/components/TicketTagCard";
import { StatusBadge, PriorityBadge } from "@/components/Badge";
import type { Ticket } from "@/types";

export function AdminDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [technicianName, setTechnicianName] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    ticketsApi
      .list({ limit: 100 })
      .then((data) => {
        setTickets(data);
        if (data.length > 0) setSelectedId(data[0].ticket_id);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const selected = tickets.find((t) => t.ticket_id === selectedId) ?? null;

  useEffect(() => {
    setTechnicianName(undefined);
    if (selected?.assigned_technician_id) {
      usersApi
        .get(selected.assigned_technician_id)
        .then((u) => setTechnicianName(u.full_name))
        .catch(() => {});
    }
  }, [selected?.assigned_technician_id]);

  const inWorkshop = tickets.filter((t) => !["resolved", "closed"].includes(t.status));
  const awaitingParts = tickets.filter((t) => t.status === "awaiting_parts");
  const escalated = tickets.filter((t) => t.status === "escalated");

  const resolvedWithTimes = tickets.filter((t) => t.resolved_at);
  const avgTurnaroundDays =
    resolvedWithTimes.length > 0
      ? resolvedWithTimes.reduce((sum, t) => {
          const ms = new Date(t.resolved_at as string).getTime() - new Date(t.created_at).getTime();
          return sum + ms / (1000 * 60 * 60 * 24);
        }, 0) / resolvedWithTimes.length
      : null;

  return (
    <div>
      <p style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 4px" }}>
        Repair queue
      </p>
      <h1 style={{ fontSize: 22, fontWeight: 500, margin: "0 0 20px" }}>Repair queue</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12, marginBottom: 24 }}>
        <MetricCard label="Machines in workshop" value={inWorkshop.length} />
        <MetricCard
          label="Awaiting parts"
          value={awaitingParts.length}
          tone="warning"
        />
        <MetricCard
          label="Avg. turnaround"
          value={avgTurnaroundDays !== null ? `${avgTurnaroundDays.toFixed(1)}d` : "—"}
        />
        <MetricCard label="Escalated" value={escalated.length} tone={escalated.length > 0 ? "danger" : "default"} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 20, alignItems: "start" }}>
        <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
          {isLoading && <p style={{ padding: 16, fontSize: 13, color: "var(--text-secondary)" }}>Loading…</p>}
          {!isLoading && tickets.length === 0 && (
            <p style={{ padding: 16, fontSize: 13, color: "var(--text-secondary)" }}>No tickets yet.</p>
          )}
          {tickets.map((ticket) => (
            <button
              key={ticket.ticket_id}
              onClick={() => setSelectedId(ticket.ticket_id)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "10px 14px",
                border: "none",
                borderBottom: "1px solid var(--border)",
                background: ticket.ticket_id === selectedId ? "var(--surface-1)" : "transparent",
                cursor: "pointer",
              }}
            >
              <p style={{ fontSize: 13, fontWeight: 500, margin: "0 0 4px" }}>{ticket.subject}</p>
              <div style={{ display: "flex", gap: 6 }}>
                <PriorityBadge priority={ticket.priority} />
                <StatusBadge status={ticket.status} />
              </div>
            </button>
          ))}
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
              Service tag · selected repair
            </p>
            {selected && (
              <Link
                to={`/tickets/${selected.ticket_id}`}
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--text-accent)",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                Open full ticket
                <i className="ti ti-arrow-right" style={{ fontSize: 14 }} aria-hidden="true" />
              </Link>
            )}
          </div>
          {selected ? (
            <TicketTagCard ticket={selected} technicianName={technicianName} />
          ) : (
            <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Select a ticket to view its tag.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "warning" | "danger";
}) {
  const color =
    tone === "danger" ? "var(--text-danger)" : tone === "warning" ? "var(--text-warning)" : "var(--text-primary)";
  return (
    <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "1rem" }}>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 6px" }}>{label}</p>
      <p style={{ fontSize: 26, fontWeight: 500, margin: 0, color }}>{value}</p>
    </div>
  );
}
