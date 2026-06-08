"use client";
// MyAssignments (VIS-3) — the member work loop, in the personal room. The tics
// assigned to you across all programs. Draft privately (only you), then PROMOTE:
// the evidence flows into the program tic. Personal room = private production;
// program = shared result; bridge = promote.

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";

const STATUS = {
  pending:     { label: "To do",       bg: "#F3F4F6", color: "#6B7280" },
  in_progress: { label: "In progress", bg: "#FEF3C7", color: "#92400E" },
  completed:   { label: "Done",        bg: "#DCFCE7", color: "#166534" },
  waived:      { label: "Waived",      bg: "#E0E7FF", color: "#3730A3" },
};
const card = { border: "1px solid var(--gx-card-border)", borderRadius: 14, background: "var(--gx-card-bg)", padding: "14px 16px", marginBottom: 18 };
const sel = { fontSize: 11, padding: "5px 8px", borderRadius: 7, border: "1px solid var(--gx-card-border)", background: "var(--gx-card-bg)", color: "var(--gx-ink-soft)" };
const inp = { fontSize: 11.5, padding: "6px 9px", borderRadius: 7, border: "1px solid var(--gx-card-border)", background: "var(--gx-card-bg)", color: "var(--gx-ink)" };

export default function MyAssignments() {
  const { user } = useAuthContext();
  const [rows, setRows] = useState(null);
  const [openKey, setOpenKey] = useState(null);

  const load = useCallback(() => {
    supabase.rpc("get_my_assignments").then(({ data }) => setRows(Array.isArray(data) ? data : [])).catch(() => setRows([]));
  }, []);
  useEffect(() => { if (user) load(); }, [user, load]);

  if (!user || rows === null || rows.length === 0) return null;

  return (
    <section style={card}>
      <div className="gx-overline">Your assignments</div>
      <div style={{ fontSize: 11, color: "var(--gx-ink-muted)", margin: "3px 0 10px", lineHeight: 1.5 }}>
        Tasks assigned to you across programs. Draft privately, then promote — your evidence flows into the program.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rows.map((r) => {
          const key = `${r.program_id}-${r.tic_id}`;
          return <AssignmentRow key={key} r={r} open={openKey === key}
            onToggle={() => setOpenKey(openKey === key ? null : key)} onChange={load} />;
        })}
      </div>
    </section>
  );
}

function AssignmentRow({ r, open, onToggle, onChange }) {
  const [draft, setDraft] = useState(r.draft || "");
  const [evType, setEvType] = useState(r.evidence_options?.[0]?.evidence_type || "");
  const [evLink, setEvLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const st = STATUS[r.status] || STATUS.pending;
  const done = r.status === "completed" || r.status === "waived";

  function saveDraft() {
    supabase.rpc("upsert_tic_draft", { p_program_id: r.program_id, p_tic_id: r.tic_id, p_body: draft }).catch(() => {});
  }
  async function promote() {
    setBusy(true); setErr(null);
    const { error } = await supabase.rpc("complete_program_tic", {
      p_program_id: r.program_id, p_tic_id: r.tic_id,
      p_evidence_link: evLink.trim() || null,
      p_evidence_type: evType || null,
      p_evidence_notes: draft.trim() || null,
    });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    onChange();
  }

  return (
    <div style={{ border: "1px solid var(--gx-card-border)", borderRadius: 10, overflow: "hidden" }}>
      <button onClick={onToggle} style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 8, padding: "9px 11px", background: "transparent", border: "none", cursor: "pointer" }}>
        <span style={{ fontSize: 9.5, fontWeight: 700, padding: "2px 7px", borderRadius: 999, background: st.bg, color: st.color, whiteSpace: "nowrap" }}>{st.label}</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--gx-ink)" }}>{r.tic_label}</span>
          <span style={{ fontSize: 10.5, color: "var(--gx-ink-muted)", marginLeft: 6 }}>· {r.program_name}</span>
        </span>
        <span style={{ fontSize: 11, color: "var(--gx-ink-faint)" }}>{open ? "▴" : "▾"}</span>
      </button>
      {open && (
        <div style={{ padding: "0 11px 11px", borderTop: "1px solid var(--gx-border-soft)" }}>
          {!done ? (
            <>
              <div className="gx-overline" style={{ fontSize: 8, margin: "8px 0 4px" }}>Private draft — only you</div>
              <textarea value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={saveDraft} rows={3}
                placeholder="Your working notes — method, numbers, a failed trial…"
                style={{ width: "100%", fontSize: 12, padding: 8, borderRadius: 7, border: "1px solid var(--gx-card-border)", background: "var(--gx-card-bg)", color: "var(--gx-ink)", resize: "vertical", fontFamily: "inherit" }} />
              <div className="gx-overline" style={{ fontSize: 8, margin: "10px 0 4px" }}>Promote — evidence flows into the program</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                {r.evidence_options?.length > 0 && (
                  <select value={evType} onChange={(e) => setEvType(e.target.value)} style={sel}>
                    {r.evidence_options.map((o) => <option key={o.evidence_type} value={o.evidence_type}>{o.evidence_type}</option>)}
                  </select>
                )}
                <input value={evLink} onChange={(e) => setEvLink(e.target.value)} placeholder="Evidence link (optional)" style={{ ...inp, flex: 1, minWidth: 130 }} />
                <button onClick={promote} disabled={busy}
                  style={{ fontSize: 11, fontWeight: 700, padding: "6px 13px", borderRadius: 7, border: "none", cursor: "pointer", background: "#0a4a3e", color: "#fff", opacity: busy ? 0.6 : 1 }}>
                  {busy ? "…" : "Promote → complete"}
                </button>
              </div>
              {err && <div style={{ fontSize: 11, color: "#C9554F", marginTop: 6 }}>{err}</div>}
            </>
          ) : (
            <div style={{ fontSize: 11.5, color: "var(--gx-ink-muted)", padding: "8px 0" }}>Promoted — this contribution is in the program.</div>
          )}
          <Link href={`/geocon/programs/${r.program_id}`} style={{ fontSize: 10.5, color: "var(--gx-ink-muted)", textDecoration: "none" }}>Open program →</Link>
        </div>
      )}
    </div>
  );
}
