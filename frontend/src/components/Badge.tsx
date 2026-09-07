import type { CSSProperties } from "react";
import type { TicketStatus, TicketPriority } from "@/types";

const STATUS_STYLES: Record<TicketStatus, { bg: string; fg: string; label: string }> = {
  new: { bg: "var(--bg-info)", fg: "var(--text-info)", label: "New" },
  triaged: { bg: "var(--bg-warning)", fg: "var(--text-warning)", label: "Triaged" },
  awaiting_parts: { bg: "var(--bg-warning)", fg: "var(--text-warning)", label: "Awaiting parts" },
  in_repair: { bg: "var(--bg-info)", fg: "var(--text-info)", label: "In repair" },
  resolved: { bg: "var(--bg-success)", fg: "var(--text-success)", label: "Resolved" },
  closed: { bg: "var(--surface-1)", fg: "var(--text-secondary)", label: "Closed" },
  escalated: { bg: "var(--bg-danger)", fg: "var(--text-danger)", label: "Escalated" },
};

const PRIORITY_STYLES: Record<TicketPriority, { bg: string; fg: string; label: string }> = {
  low: { bg: "var(--surface-1)", fg: "var(--text-secondary)", label: "Low" },
  medium: { bg: "var(--surface-1)", fg: "var(--text-secondary)", label: "Medium" },
  high: { bg: "var(--bg-warning)", fg: "var(--text-warning)", label: "High" },
  critical: { bg: "var(--bg-danger)", fg: "var(--text-danger)", label: "Critical" },
};

const badgeStyle: CSSProperties = {
  display: "inline-block",
  fontSize: 12,
  fontWeight: 500,
  padding: "2px 10px",
  borderRadius: 999,
  lineHeight: "18px",
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span style={{ ...badgeStyle, background: s.bg, color: s.fg }}>{s.label}</span>
  );
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const p = PRIORITY_STYLES[priority];
  return (
    <span style={{ ...badgeStyle, background: p.bg, color: p.fg }}>{p.label}</span>
  );
}
