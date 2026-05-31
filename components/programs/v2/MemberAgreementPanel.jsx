"use client";
// Member Agreement panel for a Program.
//   - Outsiders see only an "Agreement on file" pill (existence flag).
//   - Members see the active terms_md + splits.
//   - Program owner can draft / activate a new version.
// Splits payload schema:
//   [{ actor_kind: "researcher" | "organization",
//      actor_id: "...",
//      actor_label: "...",         // display only
//      role: "lead" | "partner" | "service" | "advisor",
//      revenue_share_pct: 0-100,
//      ip_share_pct: 0-100 }]

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

const ROLES = ["lead", "partner", "service", "advisor"];

export default function MemberAgreementPanel({ programId, isOwner }) {
  const [agreement, setAgreement] = useState(null);
  const [exists, setExists]       = useState(false);
  const [loading, setLoading]     = useState(true);
  const [editing, setEditing]     = useState(false);

  async function load() {
    setLoading(true);
    // Outsider-safe existence probe
    const ex = await supabase.rpc("program_agreement_exists", { p_program_id: programId });
    setExists(!!ex.data);

    // Member-only contents (RLS filters)
    const { data } = await supabase
      .from("program_member_agreements")
      .select("*")
      .eq("program_id", programId)
      .eq("status", "active")
      .order("version", { ascending: false })
      .maybeSingle();
    setAgreement(data || null);
    setLoading(false);
  }

  useEffect(() => { if (programId) load(); /* eslint-disable-next-line */ }, [programId]);

  if (loading) {
    return <div className="gx-skeleton" style={{ height: 64, margin: "12px 0" }} />;
  }

  // Outsider view
  if (!agreement && !isOwner) {
    return exists ? (
      <div style={panelStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>🔐</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--gx-ink)" }}>
              Member Agreement on file
            </div>
            <div style={{ fontSize: 10, color: "var(--gx-ink-muted)", marginTop: 2 }}>
              Contents are visible only to active program members.
            </div>
          </div>
        </div>
      </div>
    ) : null;
  }

  // Member / owner view
  return (
    <section style={panelStyle}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
        <h2 style={{
          fontFamily: "var(--gx-font-serif)", fontSize: 16, fontWeight: 700,
          color: "var(--gx-ink)", margin: 0,
        }}>
          📜 Member Agreement
          {agreement && (
            <span style={{ fontSize: 10, marginLeft: 8, color: "var(--gx-ink-muted)" }}>
              v{agreement.version} · {agreement.status}
            </span>
          )}
        </h2>
        {isOwner && (
          <button
            onClick={() => setEditing((v) => !v)}
            className="gx-btn"
            style={{
              fontSize: 11, padding: "4px 10px", borderRadius: 7,
              background: "var(--gx-accent-bio-green)", color: "#fff",
              border: "none", cursor: "pointer", fontWeight: 700,
            }}
          >
            {editing ? "Close editor" : (agreement ? "Edit / new version" : "Draft first agreement")}
          </button>
        )}
      </div>

      {!agreement && !editing && (
        <div style={{ fontSize: 11, color: "var(--gx-ink-muted)", fontStyle: "italic" }}>
          No active agreement yet. Drafting one declares how this program splits revenue
          and IP between members — visible only to members.
        </div>
      )}

      {agreement && !editing && <ReadView agreement={agreement} />}

      {editing && (
        <Editor
          base={agreement}
          programId={programId}
          onSaved={() => { setEditing(false); load(); }}
        />
      )}
    </section>
  );
}

function ReadView({ agreement }) {
  const splits = Array.isArray(agreement.splits) ? agreement.splits : [];
  const revTotal = splits.reduce((s, r) => s + Number(r.revenue_share_pct || 0), 0);
  return (
    <div>
      {splits.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--gx-ink-muted)", marginBottom: 6 }}>
            Splits ({revTotal}% revenue allocated)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {splits.map((s, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "6px 10px",
                background: "var(--gx-surface-2)",
                border: "1px solid var(--gx-border-soft)",
                borderRadius: 8, fontSize: 12,
              }}>
                <span style={{ fontWeight: 700, color: "var(--gx-ink)", flex: 1 }}>
                  {s.actor_label || s.actor_id} <span style={{ color: "var(--gx-ink-muted)", fontWeight: 400, fontSize: 10 }}>· {s.actor_kind} · {s.role}</span>
                </span>
                <span style={{ fontFamily: "var(--gx-font-mono)", fontSize: 11, color: "var(--gx-ink-soft)" }}>
                  rev {s.revenue_share_pct ?? 0}% · ip {s.ip_share_pct ?? 0}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {agreement.terms_md && (
        <div style={termsBox}>
          <div style={termsLabel}>Terms</div>
          <pre style={termsPre}>{agreement.terms_md}</pre>
        </div>
      )}
      {agreement.ip_clause && (
        <div style={termsBox}>
          <div style={termsLabel}>IP clause</div>
          <pre style={termsPre}>{agreement.ip_clause}</pre>
        </div>
      )}
      {agreement.dispute_clause && (
        <div style={termsBox}>
          <div style={termsLabel}>Dispute clause</div>
          <pre style={termsPre}>{agreement.dispute_clause}</pre>
        </div>
      )}
    </div>
  );
}

function Editor({ base, programId, onSaved }) {
  const [terms, setTerms] = useState(base?.terms_md || "");
  const [ip,    setIp]    = useState(base?.ip_clause || "");
  const [disp,  setDisp]  = useState(base?.dispute_clause || "");
  const [splits, setSplits] = useState(
    Array.isArray(base?.splits) && base.splits.length
      ? base.splits
      : [{ actor_kind: "organization", actor_id: "", actor_label: "", role: "lead", revenue_share_pct: 0, ip_share_pct: 0 }]
  );
  const [activate, setActivate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  function update(i, k, v) {
    setSplits((arr) => arr.map((row, idx) => idx === i ? { ...row, [k]: v } : row));
  }
  function add() {
    setSplits((arr) => [...arr, { actor_kind: "researcher", actor_id: "", actor_label: "", role: "partner", revenue_share_pct: 0, ip_share_pct: 0 }]);
  }
  function remove(i) {
    setSplits((arr) => arr.filter((_, idx) => idx !== i));
  }

  async function save() {
    setSaving(true); setErr(null);
    try {
      const { error } = await supabase.rpc("upsert_program_member_agreement", {
        p_program_id: programId,
        p_terms_md: terms,
        p_splits: splits,
        p_ip_clause: ip || null,
        p_dispute_clause: disp || null,
        p_activate: activate,
      });
      if (error) throw error;
      onSaved?.();
    } catch (e) {
      setErr(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 10 }}>
        <div style={termsLabel}>Splits</div>
        {splits.map((s, i) => (
          <div key={i} style={{
            display: "grid",
            gridTemplateColumns: "100px 1fr 130px 90px 80px 80px 30px",
            gap: 6, alignItems: "center", marginBottom: 4,
          }}>
            <select value={s.actor_kind} onChange={(e) => update(i, "actor_kind", e.target.value)} style={inputSm}>
              <option value="organization">Organization</option>
              <option value="researcher">Researcher</option>
            </select>
            <input value={s.actor_label} onChange={(e) => update(i, "actor_label", e.target.value)}
              placeholder="Display label" style={inputSm} />
            <input value={s.actor_id} onChange={(e) => update(i, "actor_id", e.target.value)}
              placeholder="UUID / researcher id" style={{ ...inputSm, fontFamily: "var(--gx-font-mono)", fontSize: 10 }} />
            <select value={s.role} onChange={(e) => update(i, "role", e.target.value)} style={inputSm}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <input type="number" min={0} max={100} value={s.revenue_share_pct} placeholder="rev %"
              onChange={(e) => update(i, "revenue_share_pct", Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
              style={inputSm} />
            <input type="number" min={0} max={100} value={s.ip_share_pct} placeholder="ip %"
              onChange={(e) => update(i, "ip_share_pct", Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
              style={inputSm} />
            <button onClick={() => remove(i)} style={removeBtn}>×</button>
          </div>
        ))}
        <button onClick={add} className="gx-btn" style={{
          marginTop: 6, padding: "4px 10px", fontSize: 10, fontWeight: 700,
          background: "transparent", color: "var(--gx-accent-bio-green)",
          border: "1px dashed var(--gx-border)", borderRadius: 6, cursor: "pointer",
        }}>+ Add member</button>
      </div>

      <Field label="Terms (Markdown)" v={terms} setV={setTerms} rows={4} />
      <Field label="IP clause"        v={ip}    setV={setIp}    rows={3} />
      <Field label="Dispute clause"   v={disp}  setV={setDisp}  rows={3} />

      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, marginTop: 8 }}>
        <input type="checkbox" checked={activate} onChange={(e) => setActivate(e.target.checked)} />
        Activate immediately (supersedes previous version)
      </label>

      {err && <div style={{ color: "var(--gx-accent-rose)", fontSize: 11, marginTop: 6 }}>{err}</div>}

      <div style={{ marginTop: 12 }}>
        <button onClick={save} disabled={saving} className="gx-btn"
          style={{
            padding: "8px 16px", fontSize: 12, fontWeight: 700,
            background: "var(--gx-accent-bio-green)", color: "#fff",
            border: "none", borderRadius: 8, cursor: "pointer",
            opacity: saving ? 0.6 : 1,
          }}>
          {saving ? "Saving…" : (activate ? "Save & activate" : "Save draft")}
        </button>
      </div>
    </div>
  );
}

function Field({ label, v, setV, rows = 3 }) {
  return (
    <div style={{ marginTop: 10 }}>
      <div style={termsLabel}>{label}</div>
      <textarea value={v} onChange={(e) => setV(e.target.value)} rows={rows}
        style={{
          width: "100%", padding: "8px 10px", fontSize: 12,
          background: "var(--gx-surface-2)", color: "var(--gx-ink)",
          border: "1px solid var(--gx-border-soft)", borderRadius: 7,
          fontFamily: "inherit", resize: "vertical",
          boxSizing: "border-box",
        }} />
    </div>
  );
}

const panelStyle = {
  marginTop: 14, padding: 14,
  background: "var(--gx-surface)",
  border: "1px solid var(--gx-border)",
  borderRadius: "var(--gx-radius-4)",
};
const termsBox  = { marginTop: 8, padding: 8, background: "var(--gx-surface-2)", border: "1px solid var(--gx-border-soft)", borderRadius: 7 };
const termsLabel = { fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--gx-ink-muted)", marginBottom: 4 };
const termsPre  = { margin: 0, fontSize: 11, color: "var(--gx-ink)", whiteSpace: "pre-wrap", fontFamily: "var(--gx-font-body)" };
const inputSm   = { padding: "4px 7px", fontSize: 11, background: "var(--gx-surface-2)", color: "var(--gx-ink)", border: "1px solid var(--gx-border-soft)", borderRadius: 5 };
const removeBtn = { padding: 0, width: 24, height: 24, fontSize: 14, color: "var(--gx-accent-rose)", background: "transparent", border: "1px solid var(--gx-border-soft)", borderRadius: 4, cursor: "pointer" };
