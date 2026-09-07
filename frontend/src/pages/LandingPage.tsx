import { useState, type FormEvent, type CSSProperties } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/api/client";

export function LandingPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        setError("Incorrect email or password.");
      } else if (err instanceof ApiRequestError && err.status === 423) {
        setError("Account temporarily locked due to repeated failed logins.");
      } else {
        setError("Something went wrong. Try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "2.5rem 1rem", textAlign: "center" }}>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 8px", letterSpacing: "0.02em" }}>
        Lenovo IT support
      </p>
      <h1 style={{ fontSize: 22, fontWeight: 500, margin: "0 0 12px" }}>Welcome back</h1>
      <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-secondary)", margin: "0 auto 2rem", maxWidth: 440 }}>
        Track a repair, see real-time part sourcing updates, and message your technician directly
        — all from one place, replacing phone calls and spreadsheets.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "1.5rem",
          textAlign: "left",
          maxWidth: 360,
          margin: "0 auto 1rem",
        }}
      >
        <p style={{ fontSize: 13, fontWeight: 500, margin: "0 0 4px" }}>Customer login</p>
        <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 14px" }}>
          Track your device or open a new support ticket.
        </p>

        <label style={labelStyle}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@company.com"
          style={inputStyle}
          autoComplete="email"
        />

        <label style={labelStyle}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          style={{ ...inputStyle, marginBottom: 14 }}
          autoComplete="current-password"
        />

        {error && (
          <p style={{ fontSize: 13, color: "var(--text-danger)", margin: "0 0 10px" }}>{error}</p>
        )}

        <button type="submit" disabled={isSubmitting} style={submitStyle}>
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>

        <p style={{ fontSize: 12, textAlign: "center", margin: "10px 0 0" }}>
          <Link to="/forgot-password" style={{ color: "var(--text-accent)" }}>
            Forgot password?
          </Link>
        </p>

        <p style={{ fontSize: 12, color: "var(--text-secondary)", textAlign: "center", margin: "6px 0 0" }}>
          Don't have an account yet?{" "}
          <Link to="/register" style={{ color: "var(--text-accent)" }}>
            Sign up here
          </Link>
        </p>
      </form>

      <div style={{ display: "flex", alignItems: "center", gap: 10, maxWidth: 360, margin: "1.25rem auto" }}>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>or</span>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      </div>

      <Link
        to="/login"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 13,
          color: "var(--text-secondary)",
          textDecoration: "none",
          border: "1px solid var(--border-strong)",
          borderRadius: "var(--radius)",
          padding: "8px 16px",
        }}
      >
        Staff and admin login
      </Link>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 28,
          marginTop: "2.5rem",
          paddingTop: "1.5rem",
          borderTop: "1px solid var(--border)",
          flexWrap: "wrap",
        }}
      >
        <FeatureNote text="Live ticket tracking, no phone calls needed" />
        <FeatureNote text="Real-time part sourcing, local or imported" />
        <FeatureNote text="Instant warranty status on every device" />
      </div>
    </div>
  );
}

function FeatureNote({ text }: { text: string }) {
  return (
    <div style={{ maxWidth: 150 }}>
      <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>{text}</p>
    </div>
  );
}

const labelStyle: CSSProperties = {
  display: "block",
  fontSize: 13,
  color: "var(--text-secondary)",
  margin: "0 0 4px",
};

const inputStyle: CSSProperties = {
  width: "100%",
  height: 36,
  padding: "0 10px",
  borderRadius: "var(--radius)",
  border: "1px solid var(--border-strong)",
  fontSize: 14,
  background: "var(--surface-2)",
  color: "var(--text-primary)",
  marginBottom: 10,
};

const submitStyle: CSSProperties = {
  width: "100%",
  height: 38,
  borderRadius: "var(--radius)",
  border: "none",
  background: "var(--fill-accent)",
  color: "#fff",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
};
