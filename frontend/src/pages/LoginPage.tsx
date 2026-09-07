import { useState, type FormEvent, type CSSProperties } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/api/client";

export function LoginPage() {
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
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: 340,
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-card)",
          padding: "2rem",
        }}
      >
        <Link
          to="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 13,
            color: "var(--text-secondary)",
            textDecoration: "none",
            marginBottom: 16,
          }}
        >
          <i className="ti ti-arrow-left" style={{ fontSize: 15 }} aria-hidden="true" />
          Back to home
        </Link>
        <h1 style={{ fontSize: 18, fontWeight: 500, margin: "0 0 4px" }}>Sign in</h1>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 20px" }}>
          Lenovo IT support portal
        </p>

        <label style={fieldLabelStyle}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@company.com"
          style={inputStyle}
          autoComplete="email"
        />

        <label style={fieldLabelStyle}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          style={inputStyle}
          autoComplete="current-password"
        />

        {error && (
          <p style={{ fontSize: 13, color: "var(--text-danger)", margin: "4px 0 0" }}>{error}</p>
        )}

        <button type="submit" disabled={isSubmitting} style={submitStyle}>
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>

        <p style={{ fontSize: 12, textAlign: "center", margin: "12px 0 0" }}>
          <Link to="/forgot-password" style={{ color: "var(--text-accent)" }}>
            Forgot password?
          </Link>
        </p>
      </form>
    </div>
  );
}

const fieldLabelStyle: CSSProperties = {
  display: "block",
  fontSize: 13,
  color: "var(--text-secondary)",
  margin: "12px 0 4px",
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
};

const submitStyle: CSSProperties = {
  width: "100%",
  height: 38,
  marginTop: 20,
  borderRadius: "var(--radius)",
  border: "none",
  background: "var(--fill-accent)",
  color: "#fff",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
};
