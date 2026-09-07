import { useEffect, useState } from "react";
import { ticketsApi } from "@/api/tickets";
import type { Ticket, TicketStatus } from "@/types";

const STATUS_ORDER: TicketStatus[] = [
  "new",
  "triaged",
  "awaiting_parts",
  "in_repair",
  "escalated",
  "resolved",
  "closed",
];

export function ReportsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    ticketsApi.list({ limit: 200 }).then(setTickets).finally(() => setIsLoading(false));
  }, []);

  const byStatus = STATUS_ORDER.map((status) => ({
    status,
    count: tickets.filter((t) => t.status === status).length,
  }));

  const resolvedWithTimes = tickets.filter((t) => t.resolved_at);
  const avgTurnaroundDays =
    resolvedWithTimes.length > 0
      ? resolvedWithTimes.reduce((sum, t) => {
          const ms = new Date(t.resolved_at as string).getTime() - new Date(t.created_at).getTime();
          return sum + ms / (1000 * 60 * 60 * 24);
        }, 0) / resolvedWithTimes.length
      : null;

  const byPriority = (["low", "medium", "high", "critical"] as const).map((priority) => ({
    priority,
    count: tickets.filter((t) => t.priority === priority).length,
  }));

  if (isLoading) return <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Loading…</p>;

  return (
    <div>
      <p style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 4px" }}>
        Workshop
      </p>
      <h1 style={{ fontSize: 22, fontWeight: 500, margin: "0 0 20px" }}>Reports</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.25rem" }}>
          <p style={{ fontSize: 14, fontWeight: 500, margin: "0 0 12px" }}>Tickets by status</p>
          {byStatus.map(({ status, count }) => (
            <BarRow key={status} label={status} count={count} max={tickets.length || 1} />
          ))}
        </div>

        <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.25rem" }}>
          <p style={{ fontSize: 14, fontWeight: 500, margin: "0 0 12px" }}>Tickets by priority</p>
          {byPriority.map(({ priority, count }) => (
            <BarRow key={priority} label={priority} count={count} max={tickets.length || 1} />
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 20 }}>
        <StatBox label="Total tickets" value={tickets.length} />
        <StatBox
          label="Avg. turnaround (resolved)"
          value={avgTurnaroundDays !== null ? `${avgTurnaroundDays.toFixed(1)} days` : "No resolved tickets yet"}
        />
      </div>

      <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 16 }}>
        These are computed live from the same <code style={{ fontFamily: "var(--font-mono)" }}>/tickets</code> data
        the queue uses — there's no separate reporting backend, so nothing here is pre-aggregated or historical
        beyond what's currently in the database.
      </p>
    </div>
  );
}

function BarRow({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = Math.round((count / max) * 100);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
        <span style={{ textTransform: "capitalize", color: "var(--text-secondary)" }}>{label}</span>
        <span style={{ fontWeight: 500 }}>{count}</span>
      </div>
      <div style={{ height: 6, background: "var(--surface-1)", borderRadius: 999 }}>
        <div style={{ height: 6, width: `${pct}%`, background: "var(--fill-accent)", borderRadius: 999 }} />
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "1rem" }}>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 6px" }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 500, margin: 0 }}>{value}</p>
    </div>
  );
}
