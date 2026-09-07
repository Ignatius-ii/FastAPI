interface StatCardProps {
  label: string;
  value: string | number;
  tone?: "default" | "danger" | "warning";
}

const TONE_COLOR: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "var(--text-primary)",
  danger: "var(--text-danger)",
  warning: "var(--text-warning)",
};

export function StatCard({ label, value, tone = "default" }: StatCardProps) {
  return (
    <div
      style={{
        background: "var(--surface-1)",
        borderRadius: "var(--radius)",
        padding: "1rem",
      }}
    >
      <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 4px" }}>{label}</p>
      <p style={{ fontSize: 24, fontWeight: 500, margin: 0, color: TONE_COLOR[tone] }}>{value}</p>
    </div>
  );
}
