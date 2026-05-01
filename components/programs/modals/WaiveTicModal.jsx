"use client";
import { useState } from "react";
import { waiveTic, ticLabel } from "../../../lib/programTics";
import { ModalShell } from "./CompleteTicModal";

/* ─────────────────────────────────────────────────────────
   WaiveTicModal
   - Owner explains why a tic is waived (min 10 chars)
   - Extra warning when tic is core+required
───────────────────────────────────────────────────────── */

export default function WaiveTicModal({ programId, tic, onClose, onWaived }) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const isCoreReq = tic.is_core && tic.is_required;
  const minLen = 10;
  const valid = reason.trim().length >= minLen;

  const submit = async () => {
    setError(null);
    if (!valid) {
      setError(`Reason must be at least ${minLen} characters.`);
      return;
    }
    setSubmitting(true);
    const res = await waiveTic(programId, tic.tic_id, reason);
    setSubmitting(false);
    if (res.success) {
      onWaived();
    } else {
      setError(res.error || "Could not waive tic.");
    }
  };

  return (
    <ModalShell title={`Waive tic: ${ticLabel(tic)}`} onClose={onClose}>
      {isCoreReq && (
        <div style={{
          padding: 10,
          background: "#FEF3C7",
          border: "1px solid #FDE68A",
          color: "#92400E",
          borderRadius: 6,
          fontSize: 12,
          marginBottom: 12,
        }}>
          ⚠️ This is a <strong>core required</strong> tic. Waiving it is unusual and is recorded in the audit trail. The waiver is permanent until the tic is re-completed.
        </div>
      )}

      <p style={p}>
        Waivers are visible to the network and audited. State the reason clearly so reviewers and observers understand the choice.
      </p>

      <div style={{ marginBottom: 12 }}>
        <label style={lbl}>Reason <span style={{ color: "#A32D2D" }}>*</span></label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why this tic is being waived (min. 10 characters)…"
          rows={4}
          style={{
            width: "100%",
            padding: "8px 10px",
            borderRadius: 6,
            border: "1px solid #D1D5DB",
            fontSize: 13,
            fontFamily: "inherit",
            boxSizing: "border-box",
            resize: "vertical",
          }}
        />
        <div style={{
          fontSize: 11,
          color: valid ? "#10B981" : "#9CA3AF",
          marginTop: 4,
          textAlign: "right",
        }}>
          {reason.trim().length}/{minLen}+ chars
        </div>
      </div>

      {error && (
        <div style={{ padding: 8, background: "#FEE2E2", color: "#991B1B", borderRadius: 6, fontSize: 13, marginBottom: 12 }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button onClick={onClose} disabled={submitting} style={btnSecondary}>Cancel</button>
        <button onClick={submit} disabled={submitting || !valid} style={(submitting || !valid) ? btnDisabled : btnDanger}>
          {submitting ? "Saving…" : "Waive tic"}
        </button>
      </div>
    </ModalShell>
  );
}

const p = { fontSize: 13, color: "#6B7280", margin: "0 0 14px 0" };
const lbl = { display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 };

const btnDanger = {
  fontSize: 13,
  padding: "8px 16px",
  borderRadius: 6,
  border: "1px solid #B91C1C",
  background: "#B91C1C",
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
