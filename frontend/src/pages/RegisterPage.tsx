import { useState, type FormEvent, type CSSProperties } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "@/api/auth";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/api/client";

export function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError("Enter your full name.");
      return;
    }
    if (!email.trim()) {
      setError("Enter your email.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.register({ email: email.trim(), password, full_name: fullName.trim() });
      // Registration doesn't return tokens, so log in immediately after for a smooth flow.
      await login({ email: email.trim(), password });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 400) {
        setError("That email is already registered.");
      } else {
        setError("Something went wrong. Try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: "0 auto", padding: "2.5rem 1rem" }}>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 8px", textAlign: "center" }}>
        Lenovo IT support
      </p>
      <h1 style={{ fontSize: 22, fontWeight: 500, margin: "0 0 20px", textAlign: "center" }}>
        Create your account
      </h1>

      <form
        onSubmit={handleSubmit}
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "1.5rem",
        }}
      >
        <label style={labelStyle}>Full name</label>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Jane Otieno"
          style={inputStyle}
          autoComplete="name"
        />

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
          placeholder="At least 8 characters"
          style={{ ...inputStyle, marginBottom: 14 }}
          autoComplete="new-password"
        />

        {error && (
          <p style={{ fontSize: 13, color: "var(--text-danger)", margin: "0 0 10px" }}>{error}</p>
        )}

        <button type="submit" disabled={isSubmitting} style={submitStyle}>
          {isSubmitting ? "Creating account…" : "Create account"}
        </button>

        <p style={{ fontSize: 12, color: "var(--text-secondary)", textAlign: "center", margin: "12px 0 0" }}>
          Already have an account?{" "}
          <Link to="/" style={{ color: "var(--text-accent)" }}>
            Sign in
          </Link>
        </p>
      </form>
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
