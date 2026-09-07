import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ticketsApi } from "@/api/tickets";
import type { Ticket } from "@/types";

interface NavItem {
  icon: string;
  label: string;
  to?: string; // omit for not-yet-built sections — shown but inactive
  count?: number;
}

export function Sidebar() {
  const location = useLocation();
  const [tickets, setTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    ticketsApi.list({ limit: 200 }).then(setTickets).catch(() => {});
  }, []);

  const queueCount = tickets.filter((t) => !["resolved", "closed"].includes(t.status)).length;
  const awaitingPartsCount = tickets.filter((t) => t.status === "awaiting_parts").length;

  const items: NavItem[] = [
    { icon: "ti-clipboard-list", label: "Repair queue", to: "/dashboard", count: queueCount },
    { icon: "ti-package", label: "Parts & sourcing", to: "/parts-sourcing", count: awaitingPartsCount },
    { icon: "ti-shield-check", label: "Warranty claims", to: "/warranty-claims" },
    { icon: "ti-chart-bar", label: "Reports", to: "/reports" },
  ];

  return (
    <aside
      style={{
        width: 200,
        borderRight: "1px solid var(--border)",
        padding: "20px 12px",
        flexShrink: 0,
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: "0.06em",
          color: "var(--text-muted)",
          textTransform: "uppercase",
          margin: "0 8px 10px",
        }}
      >
        Workshop
      </p>
      {items.map((item) => {
        const isActive = item.to && location.pathname === item.to;
        const content = (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 8px",
              borderRadius: "var(--radius)",
              background: isActive ? "var(--surface-1)" : "transparent",
              color: item.to ? "var(--text-primary)" : "var(--text-muted)",
              fontSize: 13,
              fontWeight: isActive ? 500 : 400,
              cursor: item.to ? "pointer" : "default",
            }}
          >
            <i className={`ti ${item.icon}`} style={{ fontSize: 17 }} aria-hidden="true" />
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.count !== undefined && item.count > 0 && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  background: "var(--surface-1)",
                  color: "var(--text-secondary)",
                  borderRadius: 999,
                  padding: "1px 7px",
                }}
              >
                {item.count}
              </span>
            )}
          </div>
        );

        return item.to ? (
          <Link key={item.label} to={item.to} style={{ textDecoration: "none", display: "block" }}>
            {content}
          </Link>
        ) : (
          <div key={item.label} title="Not built yet in this demo">
            {content}
          </div>
        );
      })}
    </aside>
  );
}
