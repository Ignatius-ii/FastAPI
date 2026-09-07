import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ticketsApi } from "@/api/tickets";
import { StatusBadge } from "@/components/Badge";
import type { Ticket } from "@/types";

export function CustomerDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    ticketsApi
      .list()
      .then(setTickets)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h1 style={{ fontSize: 18, fontWeight: 500, margin: 0 }}>Your tickets</h1>
        <Link
          to="/tickets/new"
          style={{
            fontSize: 13,
            padding: "8px 14px",
            borderRadius: "var(--radius)",
            border: "1px solid var(--border-strong)",
            textDecoration: "none",
            color: "var(--text-primary)",
          }}
        >
          + New ticket
        </Link>
      </div>

      {isLoading && <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Loading…</p>}

      {!isLoading && tickets.length === 0 && (
        <div
          style={{
            background: "var(--surface-1)",
            borderRadius: "var(--radius-card)",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 14, margin: "0 0 4px" }}>No tickets yet.</p>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
            Something not working? Open a ticket and we'll take a look.
          </p>
        </div>
      )}

      {tickets.map((ticket) => (
        <Link
          key={ticket.ticket_id}
          to={`/tickets/${ticket.ticket_id}`}
          style={{
            display: "block",
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-card)",
            padding: "14px 16px",
            marginBottom: 10,
            textDecoration: "none",
            color: "var(--text-primary)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontWeight: 500, fontSize: 14, margin: "0 0 4px" }}>{ticket.subject}</p>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>
                Opened {new Date(ticket.created_at).toLocaleDateString()}
              </p>
            </div>
            <StatusBadge status={ticket.status} />
          </div>
        </Link>
      ))}
    </div>
  );
}
