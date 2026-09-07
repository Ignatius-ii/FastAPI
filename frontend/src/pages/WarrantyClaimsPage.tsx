export function WarrantyClaimsPage() {
  return (
    <div>
      <p style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 4px" }}>
        Workshop
      </p>
      <h1 style={{ fontSize: 22, fontWeight: 500, margin: "0 0 20px" }}>Warranty claims</h1>

      <div
        style={{
          background: "var(--surface-1)",
          borderRadius: 12,
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: 14, margin: "0 0 8px" }}>Not built yet</p>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 auto", maxWidth: 420, lineHeight: 1.6 }}>
          Your backend's <code style={{ fontFamily: "var(--font-mono)" }}>Ticket</code> model doesn't track
          warranty status, expiry dates, or claim numbers yet — the original database design had a separate{" "}
          <code style={{ fontFamily: "var(--font-mono)" }}>assets</code> table for that, but it was never
          added to the API. This page is a placeholder so the nav link goes somewhere real, rather than
          faking warranty data that doesn't exist.
        </p>
      </div>
    </div>
  );
}
