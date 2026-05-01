"use client";
import { useState, useEffect } from "react";
import { completeTic, ticLabel, ticDescription } from "../../../lib/programTics";

/* ─────────────────────────────────────────────────────────
   CompleteTicModal
   - Shows tic info + accepted evidence options
   - Owner selects evidence_type, link, notes
   - Validates evidence_type against tic.evidence_options
───────────────────────────────────────────────────────── */

export default function CompleteTicModal({ programId, tic, onClose, onCompleted }) {
  const [evidenceType, setEvidenceType] = useState("");
  const [evidenceLink, setEvidenceLink] = useState("");
  const [evidenceNotes, setEvidenceNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const options = tic.evidence_options || [];
  const requiresEvidence = !!tic.evidence_required;

  // Default to highest-preference option
  useEffect(() => {
    if (options.length > 0 && !evidenceType) {
      const sorted = [...options].sort((a, b) => (a.preference_rank || 99) - (b.preference_rank || 99));
      setEvidenceType(sorted[0].evidence_type);
    }
  }, [options, evidenceType]);

  const submit = async () => {
    setError(null);
    if (requiresEvidence && !evidenceType) {
      setError("Please select an evidence type.");
      return;
    }
    setSubmitting(true);
    const res = await completeTic(programId, tic.tic_id, {
      evidenceType: evidenceType || null,
      evidenceLink: evidenceLink.trim() || null,
      evidenceNotes: evidenceNotes.trim() || null,
    });
    setSubmitting(false);
    if (res.success) {
      onCompleted();
    } else {
      setError(res.error || "Could not complete tic.");
    }
  };

  return (
    <ModalShell title={`Complete tic: ${ticLabel(tic)}`} onClose={onClose}>
      <p style={p}>{ticDescription(tic)}</p>

      {options.length > 0 && (
        <div style={field}>
          <label style={lbl}>
            Evidence type {requiresEvidence && <span style={{ color: "#A32D2D" }}>*</span>}
          </label>
          <select
            value={evidenceType}
            onChange={(e) => setEvidenceType(e.target.value)}
            style={input}
          >
            <option value="">— Select —</option>
            {options
              .slice()
              .sort((a, b) => (a.preference_rank || 99) - (b.preference_rank || 99))
              .map((o) => (
                <option key={o.evidence_type} value={o.evidence_type}>
                  {o.evidence_type}
                  {o.preference_rank === 1 ? " (preferred)" : ""}
                </option>
              ))}
          </select>
        </div>
      )}

      <div style={field}>
        <label style={lbl}>Evidence link (URL, DOI, file ref)</label>
        <input
          type="text"
          value={evidenceLink}
          onChange={(e) => setEvidenceLink(e.target.value)}
          placeholder="https://… or doi:10.…"
          style={input}
        />
      </div>

      <div style={field}>
        <label style={lbl}>Notes (optional)</label>
        <textarea
          value={evidenceNotes}
          onChange={(e) => setEvidenceNotes(e.target.value)}
          placeholder="Any context for reviewers"
          rows={3}
          style={{ ...input, resize: "vertical" }}
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
          {submitting ? "Saving…" : "Complete tic"}
        </button>
      </div>
    </ModalShell>
  );
}

/* ─── Shared modal shell (used across modals) ─── */
export function ModalShell({ title, children, onClose, width = 480 }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(17,24,39,0.45)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#FFFFFF",
          borderRadius: 12,
          width: "100%",
          maxWidth: width,
          maxHeight: "90vh",
          overflow: "auto",
          padding: 20,
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: 16, color: "#111827" }}>{title}</h2>
          <button onClick={onClose} style={{
            background: "transparent",
            border: "none",
            fontSize: 22,
            color: "#9CA3AF",
            cursor: "pointer",
            lineHeight: 1,
          }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ─── styles ─── */
const p = { fontSize: 13, color: "#6B7280", margin: "0 0 14px 0" };
const field = { marginBottom: 12 };
const lbl = { display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 };
const input = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 6,
  border: "1px solid #D1D5DB",
  fontSize: 13,
  fontFamily: "inherit",
  boxSizing: "border-box",
};
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
