import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ticketsApi } from "@/api/tickets";
import { PriorityBadge } from "@/components/Badge";
import type { Ticket } from "@/types";

export function PartsSourcingPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    ticketsApi
      .list({ status_filter: "awaiting_parts", limit: 100 })
      .then(setTickets)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div>
      <p style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 4px" }}>
        Workshop
      </p>
      <h1 style={{ fontSize: 22, fontWeight: 500, margin: "0 0 6px" }}>Parts & sourcing</h1>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 20px" }}>
        Tickets currently waiting on a replacement part.
      </p>

      <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
        {isLoading && <p style={{ padding: 16, fontSize: 13, color: "var(--text-secondary)" }}>Loading…</p>}
        {!isLoading && tickets.length === 0 && (
          <p style={{ padding: 16, fontSize: 13, color: "var(--text-secondary)" }}>
            Nothing is currently awaiting parts.
          </p>
        )}
        {tickets.map((ticket) => (
          <Link
            key={ticket.ticket_id}
            to={`/tickets/${ticket.ticket_id}`}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 16px",
              borderBottom: "1px solid var(--border)",
              textDecoration: "none",
              color: "var(--text-primary)",
            }}
          >
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, margin: "0 0 4px" }}>{ticket.subject}</p>
              {ticket.asset_reference && (
                <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>
                  Asset: {ticket.asset_reference}
                </p>
              )}
            </div>
            <PriorityBadge priority={ticket.priority} />
          </Link>
        ))}
      </div>

      <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 14 }}>
        Note: your backend doesn't yet track individual parts, suppliers, or lead times — this list is
        derived from ticket status only. A real parts-sourcing view would need a{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>parts_catalog</code> /{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>ticket_parts</code> table like the one in the
        original database design, which hasn't been built into the API yet.
      </p>
    </div>
  );
}
