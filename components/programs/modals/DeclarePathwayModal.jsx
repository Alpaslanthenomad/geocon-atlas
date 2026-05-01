"use client";
import { useState } from "react";
import { declarePathway } from "../../../lib/programPathways";
import { ModalShell } from "./CompleteTicModal";

/* ─────────────────────────────────────────────────────────
   DeclarePathwayModal
   - Custom pathway declaration
   - Library declarations are inline buttons in PathwaysTab
───────────────────────────────────────────────────────── */

export default function DeclarePathwayModal({ programId, onClose, onDone }) {
  const [label, setLabel] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const submit = async () => {
    setError(null);
    if (!label.trim() || label.trim().length < 3) {
      setError("Pathway name must be at least 3 characters.");
      return;
    }
    setSubmitting(true);
    const res = await declarePathway(programId, { customLabel: label.trim() });
    setSubmitting(false);
    if (res.success) {
      onDone(true, label.trim());
    } else {
      setError(res.error || "Could not declare pathway.");
    }
  };

  return (
    <ModalShell title="Declare custom pathway" onClose={onClose}>
      <p style={{ fontSize: 13, color: "#6B7280", margin: "0 0 14px 0" }}>
        Use a custom pathway when none of the library options fit the value direction you have in mind.
        AI suggestions are disabled for custom pathways — you maintain full control over prerequisites.
      </p>

      <div style={{ marginBottom: 12 }}>
        <label style={lbl}>Pathway name <span style={{ color: "#A32D2D" }}>*</span></label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Functional food ingredient"
          autoFocus
          style={{
            width: "100%",
            padding: "8px 10px",
            borderRadius: 6,
            border: "1px solid #D1D5DB",
            fontSize: 13,
            fontFamily: "inherit",
            boxSizing: "border-box",
          }}
        />
      </div>

      {error && (
        <div style={{ padding: 8, background: "#FEE2E2", color: "#991B1B", borderRadius: 6, fontSize: 13, marginBottom: 12 }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button onClick={onClose} disabled={submitting} style={btnSecondary}>Cancel</button>
        <button onClick={submit} disabled={submitting} style={submitting ? btnDisabled : btnPrimary}>
          {submitting ? "Saving…" : "Declare"}
        </button>
      </div>
    </ModalShell>
  );
}

const lbl = { display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 };
const btnPrimary = {
  fontSize: 13,
  padding: "8px 16px",
  borderRadius: 6,
  border: "1px solid #0E7C66",
  background: "#0E7C66",
  color: "#FFFFFF",
  cursor: "pointer",
  fontWeight: 600,
};
const btnSecondary = {
  fontSize: 13,
  padding: "8px 16px",
  borderRadius: 6,
  border: "1px solid #D1D5DB",
  background: "#FFFFFF",
  color: "#374151",
  cursor: "pointer",
};
const btnDisabled = {
  fontSize: 13,
  padding: "8px 16px",
  borderRadius: 6,
  border: "1px solid #E5E7EB",
  background: "#F3F4F6",
  color: "#9CA3AF",
  cursor: "not-allowed",
};
