"use client";
// components/geocon/ApplyForAccreditationModal.jsx
//
// Modal form for an org admin to submit / re-submit a Venn accreditation
// application. Captures (a) scope checkboxes — what the org wants to be
// accredited for; (b) supporting evidence as a small list of titled URLs;
// (c) a freeform application note. Posts to apply_for_org_accreditation.

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const SCOPE_OPTIONS = [
  { v: "field_collection",       label: "Field collection" },
  { v: "ex_situ_conservation",   label: "Ex-situ conservation" },
  { v: "tissue_culture",         label: "Tissue culture / micropropagation" },
  { v: "seed_banking",           label: "Seed banking" },
  { v: "molecular_analysis",     label: "Molecular / DNA analysis" },
  { v: "metabolite_analysis",    label: "Metabolite analysis" },
  { v: "bioactivity_screening",  label: "Bioactivity screening" },
  { v: "formulation",            label: "Formulation" },
  { v: "regulatory",             label: "Regulatory / dossier" },
  { v: "commercial_distribution",label: "Commercial distribution" },
  { v: "biomass_supply",         label: "Biomass supply" },
  { v: "propagation",            label: "Propagation services" },
  { v: "funding",                label: "Funding / sponsorship" },
];

export default function ApplyForAccreditationModal({
  orgId,
  orgName,
  initialScope = [],
  onClose,
  onSubmitted,
}) {
  const [scope, setScope] = useState(new Set(initialScope));
  const [note, setNote] = useState("");
  const [evidence, setEvidence] = useState([{ title: "", url: "" }]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    function onKey(e) { if (e.key === "Escape" && !busy) onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, busy]);

  function toggleScope(v) {
    setScope((s) => {
      const ns = new Set(s);
      if (ns.has(v)) ns.delete(v); else ns.add(v);
      return ns;
    });
  }

  function updateEvidence(i, field, value) {
    setEvidence((arr) => arr.map((row, idx) => idx === i ? { ...row, [field]: value } : row));
  }
  function addEvidenceRow() {
    setEvidence((arr) => [...arr, { title: "", url: "" }]);
  }
  function removeEvidenceRow(i) {
    setEvidence((arr) => arr.length > 1 ? arr.filter((_, idx) => idx !== i) : arr);
  }

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    if (scope.size === 0) { setError("Pick at least one scope item."); return; }
    setBusy(true); setError(null);
    try {
      const ev = evidence
        .filter((r) => (r.title || r.url || "").trim().length > 0)
        .map((r) => ({ title: r.title.trim(), url: r.url.trim(), kind: "link" }));
      const { error: rpcErr } = await supabase.rpc("apply_for_org_accreditation", {
        p_org_id: orgId,
        p_scope: Array.from(scope),
        p_evidence: ev,
        p_application_note: note.trim() || null,
      });
      if (rpcErr) throw rpcErr;
      onSubmitted();
    } catch (err) {
      setError(err.message || "Failed to submit application.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      onClick={() => !busy && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--gx-card-bg)", borderRadius: 12, width: "100%", maxWidth: 620, maxHeight: "90vh", overflow: "auto", boxShadow: "0 12px 40px rgba(0,0,0,0.2)" }}
      >
        <form onSubmit={submit}>
          <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid #f0eee8", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 1 }}>Venn accreditation</div>
              <div style={{ fontFamily: "var(--gx-font-serif)", fontSize: 18, fontWeight: 700, color: "var(--gx-ink)", marginTop: 2 }}>
                Apply on behalf of {orgName}
              </div>
            </div>
            <button type="button" onClick={onClose} disabled={busy} style={{ background: "none", border: "none", fontSize: 18, color: "#888", cursor: "pointer", padding: 4 }}>✕</button>
          </div>

          <div style={{ padding: 20 }}>
            <Field
              label="Scope *"
              hint="Pick everything you want this organization to be accredited for. Venn reviewers can narrow the scope when granting."
            >
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {SCOPE_OPTIONS.map(({ v, label }) => {
                  const on = scope.has(v);
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => toggleScope(v)}
                      style={{
                        fontSize: 11,
                        padding: "6px 11px",
                        borderRadius: 999,
                        border: "1px solid",
                        borderColor: on ? "#0a4a3e" : "#e8e6e1",
                        background: on ? "#0a4a3e" : "#fff",
                        color: on ? "#fff" : "#555",
                        cursor: "pointer",
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </Field>

            <Field label="Application note" hint="A few sentences on why this org should be accredited for the selected scope. Visible to reviewers and (later) on the public org page.">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                placeholder="Track record, qualifications, facilities, prior work…"
                style={inputStyle}
              />
            </Field>

            <Field label="Supporting evidence" hint="Links to certifications, accreditations, publications, lab profiles, etc.">
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {evidence.map((row, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: 6 }}>
                    <input
                      value={row.title}
                      onChange={(e) => updateEvidence(i, "title", e.target.value)}
                      placeholder="Title"
                      style={inputStyle}
                    />
                    <input
                      type="url"
                      value={row.url}
                      onChange={(e) => updateEvidence(i, "url", e.target.value)}
                      placeholder="https://…"
                      style={inputStyle}
                    />
                    <button
                      type="button"
                      onClick={() => removeEvidenceRow(i)}
                      disabled={evidence.length === 1}
                      style={{ background: "none", border: "1px solid var(--gx-card-border)", borderRadius: 6, color: "#888", cursor: evidence.length === 1 ? "not-allowed" : "pointer", padding: "0 10px", fontSize: 14 }}
                    >−</button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addEvidenceRow}
                  style={{ fontSize: 11, color: "#0a4a3e", background: "none", border: "1px dashed #0a4a3e", borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontWeight: 600 }}
                >
                  + Add evidence link
                </button>
              </div>
            </Field>

            {error && (
              <div style={{ marginTop: 10, padding: 10, background: "#fdecec", border: "1px solid #fcc", borderRadius: 6, fontSize: 11, color: "#A32D2D" }}>
                {error}
              </div>
            )}
          </div>

          <div style={{ padding: "12px 20px", borderTop: "1px solid #f0eee8", display: "flex", justifyContent: "flex-end", gap: 8, background: "var(--gx-surface-2)" }}>
            <button type="button" onClick={onClose} disabled={busy} style={{ padding: "8px 14px", fontSize: 12, color: "#666", background: "none", border: "1px solid var(--gx-card-border)", borderRadius: 7, cursor: busy ? "default" : "pointer" }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || scope.size === 0}
              style={{
                padding: "8px 16px",
                fontSize: 12,
                fontWeight: 700,
                background: busy || scope.size === 0 ? "#bfbfbf" : "#0a4a3e",
                color: "#fff",
                border: "none",
                borderRadius: 7,
                cursor: busy || scope.size === 0 ? "not-allowed" : "pointer",
              }}
            >
              {busy ? "Submitting…" : "Submit application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  fontSize: 12,
  border: "1px solid var(--gx-card-border)",
  borderRadius: 7,
  background: "var(--gx-card-bg)",
  fontFamily: "inherit",
  resize: "vertical",
};

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#444", marginBottom: 4 }}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: 10, color: "#999", marginTop: 4, lineHeight: 1.5 }}>{hint}</div>}
    </div>
  );
}
