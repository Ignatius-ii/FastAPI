import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { authApi } from "@/api/auth";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Enter your email.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Backend always returns the same generic message whether or not the
      // email exists — this deliberately can't be used to check which emails
      // are registered. Don't change this to show a different message on
      // failure, or you'd reintroduce that leak on the frontend.
      await authApi.forgotPassword(email.trim());
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: "0 auto", padding: "2.5rem 1rem" }}>
      <Link
        to="/login"
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
        Back to sign in
      </Link>

      <h1 style={{ fontSize: 18, fontWeight: 500, margin: "0 0 4px" }}>Reset your password</h1>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 20px" }}>
        Enter your email and we'll send you a link to choose a new password.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.5rem" }}
      >
        {submitted ? (
          <p style={{ fontSize: 14, lineHeight: 1.6 }}>
            If that email is registered, a password reset link is on its way. Check your inbox —
            the link expires in 30 minutes.
          </p>
        ) : (
          <>
            <label style={{ display: "block", fontSize: 13, color: "var(--text-secondary)", margin: "0 0 4px" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              style={{
                width: "100%",
                height: 36,
                padding: "0 10px",
                borderRadius: "var(--radius)",
                border: "1px solid var(--border-strong)",
                fontSize: 14,
                marginBottom: 14,
                boxSizing: "border-box",
              }}
              autoComplete="email"
            />

            {error && <p style={{ fontSize: 13, color: "var(--text-danger)", margin: "0 0 10px" }}>{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: "100%",
                height: 38,
                borderRadius: "var(--radius)",
                border: "none",
                background: "var(--fill-accent)",
                color: "#fff",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {isSubmitting ? "Sending…" : "Send reset link"}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
