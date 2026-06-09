"use client";
// components/exchange/ExchangeDirectory.jsx
//
// The investor/industry directory — its own page. Reads the public, money-free,
// PII-free list_exchange_directory RPC (status='directory' reference rows). These
// are curated REFERENCE funds whose public thesis fits — not engaged participants.
// Light biotech-venture skin.

import { useEffect, useMemo, useState } from "react";
import ExchangeShell from "./ExchangeShell";
import { supabase } from "../../lib/supabase";
import { T } from "./theme";

const KIND_META = {
  vc: { label: "VC", c: T.gold },
  impact_fund: { label: "Impact", c: T.emerald },
  corp_vc: { label: "Corp VC", c: T.teal },
  strategic: { label: "Strategic", c: T.tealDeep },
  foundation: { label: "Foundation", c: "#6B9B7E" },
};

export default function ExchangeDirectory() {
  const [rows, setRows] = useState(null);
  const [kind, setKind] = useState("all");
  const [vert, setVert] = useState("all");

  useEffect(() => {
    let on = true;
    supabase.rpc("list_exchange_directory")
      .then(({ data }) => { if (on) setRows(Array.isArray(data) ? data : []); })
      .catch(() => { if (on) setRows([]); });
    return () => { on = false; };
  }, []);

  const verticals = useMemo(() => {
    const s = new Set();
    (rows || []).forEach((r) => (r.vertical_focus || []).forEach((v) => s.add(v)));
    return Array.from(s).sort();
  }, [rows]);

  const filtered = useMemo(() => (rows || []).filter((r) =>
    (kind === "all" || r.kind === kind) &&
    (vert === "all" || (r.vertical_focus || []).includes(vert))
  ), [rows, kind, vert]);

  const kinds = ["all", ...Object.keys(KIND_META)];

  return (
    <ExchangeShell
      title="Directory"
      tagline="A curated reference directory of funds whose public thesis fits conservation-grounded value — biodiversity, bioeconomy, impact, and bio-actives. Reference data, sourced and dated; these are not engaged participants."
      wide
    >
      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginBottom: 8 }}>
        <FilterRow label="Type" value={kind} set={setKind} opts={kinds} labelFor={(k) => k === "all" ? "All" : (KIND_META[k]?.label || k)} />
        {verticals.length > 0 && <FilterRow label="Focus" value={vert} set={setVert} opts={["all", ...verticals]} labelFor={(v) => v === "all" ? "All" : v} />}
      </div>
      <div style={{ fontSize: 12, color: T.muted, marginBottom: 18 }}>
        {rows == null ? "Yükleniyor…" : `${filtered.length} fon` + (kind !== "all" || vert !== "all" ? ` (toplam ${rows.length})` : "")}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
        {filtered.map((r) => {
          const km = KIND_META[r.kind] || { label: r.kind, c: T.muted };
          return (
            <div key={r.name} style={{ padding: "16px 18px", borderRadius: 14, background: T.surface, border: "1px solid " + T.line, boxShadow: "0 3px 12px rgba(16,90,78,0.04)", display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.ink, lineHeight: 1.25 }}>{r.name}</div>
                <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 99, background: km.c + "1A", color: km.c, whiteSpace: "nowrap", border: "1px solid " + km.c + "40" }}>{km.label}</span>
              </div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {(r.thesis_tags || []).slice(0, 5).map((t) => (
                  <span key={t} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 99, background: "rgba(14,156,138,0.08)", color: T.tealDeep }}>{t}</span>
                ))}
              </div>
              <div style={{ fontSize: 11, color: T.body, display: "flex", gap: 12, flexWrap: "wrap", marginTop: "auto" }}>
                {(r.stage_focus || [])[0] && <span><span style={{ color: T.faint }}>stage</span> {(r.stage_focus || [])[0]}</span>}
                {(r.vertical_focus || [])[0] && <span><span style={{ color: T.faint }}>focus</span> {(r.vertical_focus || []).join(" · ")}</span>}
              </div>
              {r.pitch_path && /^https?:/.test(r.pitch_path) && (
                <a href={r.pitch_path} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11.5, color: T.teal, textDecoration: "none", fontWeight: 600 }}>Public pitch path →</a>
              )}
            </div>
          );
        })}
      </div>
      {rows && rows.length === 0 && (
        <div style={{ padding: 40, textAlign: "center", color: T.muted, fontSize: 13 }}>Directory boş.</div>
      )}
    </ExchangeShell>
  );
}

function FilterRow({ label, value, set, opts, labelFor }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
      <span style={{ fontSize: 11, color: T.faint, textTransform: "uppercase", letterSpacing: 0.5, marginRight: 2 }}>{label}</span>
      {opts.map((o) => {
        const a = value === o;
        return (
          <button key={o} onClick={() => set(o)} style={{
            fontSize: 11.5, padding: "4px 11px", borderRadius: 99, cursor: "pointer",
            border: "1px solid " + (a ? T.teal : T.line2),
            background: a ? "rgba(14,156,138,0.12)" : "transparent",
            color: a ? T.tealDeep : T.body,
          }}>{labelFor(o)}</button>
        );
      })}
    </div>
  );
}
