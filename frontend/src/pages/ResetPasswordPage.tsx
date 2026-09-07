import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "@/api/auth";
import { ApiRequestError } from "@/api/client";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("This reset link is missing its token. Request a new one.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate("/login", { replace: true }), 2000);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 400) {
        setError("This reset link is invalid or has expired. Request a new one.");
      } else {
        setError("Something went wrong. Try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: "0 auto", padding: "2.5rem 1rem" }}>
      <h1 style={{ fontSize: 18, fontWeight: 500, margin: "0 0 4px" }}>Choose a new password</h1>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 20px" }}>
        This link came from the reset email you requested.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.5rem" }}
      >
        {done ? (
          <p style={{ fontSize: 14, lineHeight: 1.6 }}>
            Password updated. Redirecting you to sign in…
          </p>
        ) : (
          <>
            {!token && (
              <p style={{ fontSize: 13, color: "var(--text-danger)", margin: "0 0 14px" }}>
                No reset token found in this link. Make sure you opened it directly from the email.
              </p>
            )}

            <label style={labelStyle}>New password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              style={inputStyle}
              autoComplete="new-password"
            />

            <label style={labelStyle}>Confirm new password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your new password"
              style={{ ...inputStyle, marginBottom: 14 }}
              autoComplete="new-password"
            />

            {error && <p style={{ fontSize: 13, color: "var(--text-danger)", margin: "0 0 10px" }}>{error}</p>}

            <button type="submit" disabled={isSubmitting} style={submitStyle}>
              {isSubmitting ? "Updating…" : "Update password"}
            </button>

            <p style={{ fontSize: 12, color: "var(--text-secondary)", textAlign: "center", margin: "12px 0 0" }}>
              <Link to="/login" style={{ color: "var(--text-accent)" }}>
                Back to sign in
              </Link>
            </p>
          </>
        )}
      </form>
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: 13,
  color: "var(--text-secondary)",
  margin: "0 0 4px",
} as const;

const inputStyle = {
  width: "100%",
  height: 36,
  padding: "0 10px",
  borderRadius: "var(--radius)",
  border: "1px solid var(--border-strong)",
  fontSize: 14,
  marginBottom: 10,
  boxSizing: "border-box",
} as const;

const submitStyle = {
  width: "100%",
  height: 38,
  borderRadius: "var(--radius)",
  border: "none",
  background: "var(--fill-accent)",
  color: "#fff",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
} as const;
