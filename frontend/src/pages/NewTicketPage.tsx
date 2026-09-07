import { useState, type FormEvent, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { ticketsApi } from "@/api/tickets";
import type { TicketPriority } from "@/types";

export function NewTicketPage() {
  const navigate = useNavigate();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (subject.trim().length < 3) {
      setError("Give the ticket a short subject (at least 3 characters).");
      return;
    }
    if (!description.trim()) {
      setError("Describe what's going wrong.");
      return;
    }

    setIsSubmitting(true);
    try {
      const ticket = await ticketsApi.create({
        subject: subject.trim(),
        description: description.trim(),
        priority,
      });
      navigate(`/tickets/${ticket.ticket_id}`);
    } catch {
      setError("Couldn't create the ticket. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
      <h1 style={{ fontSize: 18, fontWeight: 500, margin: "0 0 16px" }}>New ticket</h1>

      <label style={labelStyle}>Subject</label>
      <input
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Laptop won't power on"
        style={inputStyle}
      />

      <label style={labelStyle}>Description</label>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What's happening? Include any error messages you've seen."
        rows={5}
        style={{ ...inputStyle, height: "auto", padding: 10, resize: "vertical" }}
      />

      <label style={labelStyle}>Priority</label>
      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value as TicketPriority)}
        style={inputStyle}
      >
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="critical">Critical</option>
      </select>

      {error && <p style={{ fontSize: 13, color: "var(--text-danger)" }}>{error}</p>}

      <button type="submit" disabled={isSubmitting} style={submitStyle}>
        {isSubmitting ? "Submitting…" : "Submit ticket"}
      </button>
    </form>
  );
}

const labelStyle: CSSProperties = {
  display: "block",
  fontSize: 13,
  color: "var(--text-secondary)",
  margin: "14px 0 4px",
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
  marginTop: 20,
  height: 38,
  padding: "0 20px",
  borderRadius: "var(--radius)",
  border: "none",
  background: "var(--fill-accent)",
  color: "#fff",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
};
