"use client";
// THE BENCH — your working bench. Claimed geophytes as cards; each card is the
// live chain bar (heals in front of you), a private Field Log, and a
// co-investigator that drafts a cited Move on a chosen link. Claim -> Log ->
// Draft -> Promote -> heal. Signed-in only. Owner-RLS throughout.

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";
import { useToast } from "../ui";

const CLASS_COLOR = {
  bench_measured: "#0F6E56", field: "#1D9E75", literature: "#185FA5",
  imported: "#BA7517", inferred: "#9AA5AD",
};
const EVIDENCE_CLASSES = [
  { key: "bench_measured", label: "Measured (your bench)" },
  { key: "field", label: "Field observation" },
  { key: "literature", label: "From literature" },
  { key: "inferred", label: "Inferred (capped)" },
];

export default function BenchRoute() {
  const { user, loading: authLoading } = useAuthContext();
  const [bench, setBench] = useState(null);

  const load = useCallback(() => {
    supabase.rpc("list_my_bench").then(({ data }) => setBench(Array.isArray(data) ? data : []));
  }, []);
  useEffect(() => { if (user) load(); }, [user, load]);

  if (authLoading) return <div style={{ padding: 30, fontSize: 12, color: "var(--gx-ink-muted)" }}>Loading…</div>;
  if (!user) return (
    <div style={{ maxWidth: 560, margin: "40px auto", textAlign: "center" }}>
      <h1 className="gx-h1">Your bench</h1>
      <p style={{ fontSize: 13, color: "var(--gx-ink-muted)", marginTop: 8 }}>Sign in to claim geophytes and work them.</p>
    </div>
  );

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        <div>
          <div className="gx-overline">The bench</div>
          <h1 className="gx-h1">Your bench</h1>
          <div style={{ fontSize: 12, color: "var(--gx-ink-muted)", marginTop: 2 }}>
            The geophytes you&apos;ve claimed. Keep private notes, draft a move, promote it — and watch the chain heal.
          </div>
        </div>
        <Link href="/geocon/profile" style={{ fontSize: 11.5, color: "var(--gx-ink-muted)", textDecoration: "none" }}>Settings ⚙</Link>
      </div>

      {bench === null ? (
        <div style={{ padding: 30, fontSize: 12, color: "var(--gx-ink-muted)" }}>Loading your bench…</div>
      ) : bench.length === 0 ? (
        <div style={{ border: "1px dashed var(--gx-card-border)", borderRadius: 14, padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--gx-ink)" }}>Your bench is empty</div>
          <div style={{ fontSize: 12, color: "var(--gx-ink-muted)", marginTop: 6, lineHeight: 1.6 }}>
            Open any species and <strong>claim it to your bench</strong> — then this becomes your private lab.
          </div>
          <Link href="/geocon/species" style={{ display: "inline-block", marginTop: 14, fontSize: 12, fontWeight: 700, color: "#fff", background: "#0a4a3e", padding: "8px 16px", borderRadius: 8, textDecoration: "none" }}>
            Browse the atlas →
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {bench.map((b) => <BenchCard key={b.species_id} species={b} onChange={load} />)}
        </div>
      )}
    </div>
  );
}

function BenchCard({ species, onChange }) {
  const toast = useToast();
  const [chain, setChain] = useState(null);
  const [log, setLog] = useState([]);
  const [activeLink, setActiveLink] = useState(null);   // {link,label}
  const [note, setNote] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [evClass, setEvClass] = useState("bench_measured");

  const sid = species.species_id;
  const loadChain = useCallback(() => {
    supabase.rpc("get_species_chain", { p_species_id: sid }).then(({ data }) => setChain(Array.isArray(data) ? data : []));
  }, [sid]);
  const loadLog = useCallback(() => {
    supabase.rpc("list_bench_log", { p_species_id: sid }).then(({ data }) => setLog(Array.isArray(data) ? data : []));
  }, [sid]);
  useEffect(() => { loadChain(); loadLog(); }, [loadChain, loadLog]);

  async function draft() {
    if (!activeLink) return;
    setDrafting(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess?.session?.access_token;
      const res = await fetch("/api/bench/draft-move", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ speciesId: sid, linkKind: activeLink.link }),
      });
      const j = await res.json();
      if (!res.ok) { toast?.error?.(j.error || "Draft failed"); return; }
      setNote((n) => (n ? n + "\n\n" : "") + (j.draft || ""));
    } catch (e) {
      toast?.error?.("Draft failed");
    } finally { setDrafting(false); }
  }

  async function saveNote() {
    if (!note.trim()) return;
    setBusy(true);
    const { error } = await supabase.rpc("add_bench_log", { p_species_id: sid, p_body: note.trim(), p_link_kind: activeLink?.link || null });
    setBusy(false);
    if (error) { toast?.error?.(error.message); return; }
    setNote(""); loadLog(); toast?.success?.("Saved to your log");
  }

  async function promote() {
    if (!activeLink) return;
    setBusy(true);
    const lastForLink = log.find((l) => l.link_kind === activeLink.link && !l.promoted_at);
    const { error } = await supabase.rpc("promote_bench_move", {
      p_species_id: sid, p_link_kind: activeLink.link, p_evidence_class: evClass, p_log_id: lastForLink?.id || null,
    });
    setBusy(false);
    if (error) { toast?.error?.(error.message); return; }
    toast?.success?.(`${activeLink.label} link evidenced`);
    loadChain(); loadLog();   // the bar heals
  }

  const linkLog = activeLink ? log.filter((l) => l.link_kind === activeLink.link) : [];

  return (
    <section style={{ border: "1px solid var(--gx-card-border)", borderRadius: 14, background: "var(--gx-card-bg)", overflow: "hidden" }}>
      <div style={{ display: "flex", gap: 12, padding: 14, alignItems: "flex-start" }}>
        {species.thumbnail_url && (
          <img src={species.thumbnail_url} alt="" style={{ width: 56, height: 56, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
            <Link href={`/geocon/species/${sid}`} style={{ fontFamily: "var(--gx-font-serif)", fontStyle: "italic", fontSize: 16, fontWeight: 700, color: "var(--gx-ink)", textDecoration: "none" }}>
              {species.accepted_name}
            </Link>
            {species.iucn_status && <span style={{ fontSize: 9, fontFamily: "var(--gx-font-mono)", color: "var(--gx-ink-muted)" }}>{species.iucn_status}</span>}
          </div>

          {/* the live chain bar — click a link to work it */}
          {chain && chain.length > 0 && (
            <div style={{ display: "flex", gap: 3, marginTop: 8 }}>
              {chain.map((l) => {
                const filled = l.fill_state !== "empty";
                const active = activeLink?.link === l.link;
                return (
                  <button key={l.link}
                    onClick={() => setActiveLink(active ? null : { link: l.link, label: l.label })}
                    title={`${l.label}: ${l.fill_state}`}
                    style={{
                      flex: 1, height: 14, borderRadius: 3, cursor: "pointer", padding: 0,
                      background: filled ? (CLASS_COLOR[l.evidence_class] || "#9AA5AD") : "transparent",
                      border: active ? "2px solid var(--gx-accent-violet)" : (filled ? "none" : "1.5px dashed var(--gx-card-border)"),
                      opacity: filled ? Math.max(0.55, Number(l.fill_strength) || 0) : 1,
                    }} />
                );
              })}
            </div>
          )}

          {species.last_note ? (
            <div style={{ fontSize: 11, color: "var(--gx-ink-soft)", marginTop: 8, fontStyle: "italic", lineHeight: 1.5 }}>
              “{species.last_note.length > 130 ? species.last_note.slice(0, 130) + "…" : species.last_note}”
            </div>
          ) : (
            <div style={{ fontSize: 10.5, color: "var(--gx-ink-faint)", marginTop: 8 }}>No bench notes yet — click a link to start.</div>
          )}
        </div>
      </div>

      {/* the work panel for the selected link */}
      {activeLink && (
        <div style={{ borderTop: "1px solid var(--gx-border-soft)", padding: 14, background: "var(--gx-surface-2)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--gx-ink)" }}>{activeLink.label}</div>
            <button onClick={draft} disabled={drafting}
              style={{ fontSize: 11, fontWeight: 700, padding: "6px 12px", borderRadius: 7, border: "none", cursor: "pointer", background: "#3C3489", color: "#fff", opacity: drafting ? 0.6 : 1 }}>
              {drafting ? "Drafting…" : "✦ Draft this move"}
            </button>
          </div>

          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={note ? 7 : 3}
            placeholder="Your private bench note — a germination %, a method, a failed trial… or draft a move above and fill the [EKLE: …] blanks."
            style={{ width: "100%", fontSize: 12, lineHeight: 1.5, padding: 10, borderRadius: 8, border: "1px solid var(--gx-card-border)", background: "var(--gx-card-bg)", color: "var(--gx-ink)", resize: "vertical", fontFamily: "inherit" }} />

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            <button onClick={saveNote} disabled={busy || !note.trim()}
              style={{ fontSize: 11, fontWeight: 600, padding: "6px 12px", borderRadius: 7, border: "1px solid var(--gx-card-border)", cursor: "pointer", background: "var(--gx-card-bg)", color: "var(--gx-ink-soft)" }}>
              Save to log
            </button>
            <span style={{ flex: 1 }} />
            <select value={evClass} onChange={(e) => setEvClass(e.target.value)}
              style={{ fontSize: 11, padding: "5px 8px", borderRadius: 7, border: "1px solid var(--gx-card-border)", background: "var(--gx-card-bg)", color: "var(--gx-ink-soft)" }}>
              {EVIDENCE_CLASSES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
            <button onClick={promote} disabled={busy}
              title="Write this as evidence — the chain heals"
              style={{ fontSize: 11, fontWeight: 700, padding: "6px 14px", borderRadius: 7, border: "none", cursor: "pointer", background: "#0a4a3e", color: "#fff", opacity: busy ? 0.6 : 1 }}>
              Promote → heal
            </button>
          </div>

          {/* Spawn — when the work needs a vehicle, start it from the coordinate */}
          <div style={{ fontSize: 10.5, color: "var(--gx-ink-muted)", marginTop: 10 }}>
            Need a vehicle?{" "}
            <Link
              href={`/geocon/proposals/new?subject_kind=species&subject_id=${encodeURIComponent(sid)}&subject_name=${encodeURIComponent(species.accepted_name || "")}`}
              style={{ color: "var(--gx-ink-soft)", textDecoration: "none", fontWeight: 600 }}>
              Propose work on {species.accepted_name} →
            </Link>
          </div>

          {linkLog.length > 0 && (
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
              {linkLog.map((l) => (
                <div key={l.id} style={{ fontSize: 11, color: "var(--gx-ink-soft)", lineHeight: 1.5, paddingLeft: 10, borderLeft: `2px solid ${l.promoted_at ? "#0F6E56" : "var(--gx-card-border)"}` }}>
                  {l.promoted_at && <span style={{ fontSize: 9, color: "#0F6E56", fontWeight: 700, marginRight: 5 }}>EVIDENCED</span>}
                  {l.body.length > 200 ? l.body.slice(0, 200) + "…" : l.body}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
