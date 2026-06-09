"use client";
// components/exchange/ExchangeTape.jsx
//
// THE TAPE — the money-free ticker spine, mounted once in the shell. Reads
// get_exchange_tape() (real counts only). Each cell is LABEL · NUMERAL · GLYPH,
// the glyph a typographic direction marker on a real count (▲ growing / ◆ curated
// / ‖ pre-open). No $, %, or moving numeral. Light biotech-venture skin.

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { T } from "./theme";

const fmt = (n) => (typeof n === "number" ? n.toLocaleString("en-US") : n);

function buildSegs(t) {
  const a = t.atlas || {}, m = t.market || {}, k = m.fund_kinds || {}, iu = a.iucn || {};
  const seg = (label, num, glyph, color) => ({ label, num, glyph, color });
  const evid = [
    seg("ATLAS", fmt(a.species) + " spp", "▲", T.emerald),
    seg("IUCN ASSESSED", fmt(a.iucn_assessed), "▲", T.emerald),
    seg("THREATENED", `CR ${iu.cr} EN ${iu.en} VU ${iu.vu}`, "◆", T.emerald),
    seg("PUBLICATIONS", fmt(a.publications), "▲", T.emerald),
    seg("CHAIN", fmt(a.chain_facts) + " facts", "▲", T.emerald),
    seg("LINK TYPES", a.chain_types, "◆", T.emerald),
  ];
  const market = [
    seg("FUNDS", m.funds, "◆", T.gold),
    seg("VC", k.vc || 0, "◆", T.gold),
    seg("IMPACT", k.impact_fund || 0, "◆", T.gold),
    seg("CORP", k.corp_vc || 0, "◆", T.gold),
    seg("STRATEGIC", k.strategic || 0, "◆", T.gold),
    seg("FOUNDATION", k.foundation || 0, "◆", T.gold),
    seg("SECTOR", (t.sectors || []).map((s) => s.vertical).join(" · "), "◆", T.venn.sapphire),
    seg("DEALS", m.opportunities, "‖", T.faint),
    seg("VENTURES", m.ventures, "‖", T.faint),
  ];
  return [...evid, "FW", ...market];
}

function Cell({ s }) {
  if (s === "FW") return <span style={{ color: T.emerald, opacity: 0.55, letterSpacing: 2, padding: "0 4px", fontSize: 11 }}>‖ firewall ‖</span>;
  return (
    <span style={{ display: "inline-flex", alignItems: "baseline", gap: 6, whiteSpace: "nowrap" }}>
      <span style={{ fontSize: 9.5, letterSpacing: 0.8, color: T.muted, textTransform: "uppercase" }}>{s.label}</span>
      <span style={{ fontFamily: "ui-monospace, Menlo, Consolas, monospace", fontSize: 12, fontWeight: 700, color: T.ink }}>{s.num}</span>
      <span style={{ color: s.color, fontSize: 11 }}>{s.glyph}</span>
    </span>
  );
}

export default function ExchangeTape() {
  const [tape, setTape] = useState(null);
  useEffect(() => {
    let on = true;
    const load = () => supabase.rpc("get_exchange_tape").then(({ data }) => { if (on) setTape(data || null); }).catch(() => {});
    load();
    const iv = setInterval(load, 90000);
    return () => { on = false; clearInterval(iv); };
  }, []);

  const segs = tape ? buildSegs(tape) : null;
  const status = tape?.status || "curating";
  const statusLabel = status === "open" ? "OPEN" : status === "opening" ? "OPENING" : "CURATING";
  const live = tape?.activity_state === "live" || status !== "curating";

  return (
    <div style={{ height: 34, display: "flex", alignItems: "center", background: "rgba(244,250,247,0.92)", backdropFilter: "blur(8px)", borderBottom: "1px solid " + T.line, overflow: "hidden" }}>
      <style>{`@keyframes vx-tape{from{transform:translate3d(0,0,0)}to{transform:translate3d(-50%,0,0)}}@keyframes vx-blink{0%,100%{opacity:.4}50%{opacity:1}}@media(prefers-reduced-motion:reduce){.vx-tape-track{animation:none!important}}`}</style>
      <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "0 14px", height: "100%", background: "rgba(14,156,138,0.10)", borderRight: "1px solid " + T.line2, flexShrink: 0, zIndex: 2 }}>
        <span style={{ width: 7, height: 7, borderRadius: 99, background: live ? T.emerald : T.muted, animation: live ? "vx-blink 2s ease-in-out infinite" : "none" }} />
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2, color: T.tealDeep }}>{statusLabel}</span>
      </div>
      <div style={{ position: "relative", flex: 1, overflow: "hidden", height: "100%", display: "flex", alignItems: "center" }}>
        {segs ? (
          <div className="vx-tape-track" style={{ display: "flex", gap: 26, paddingLeft: 26, whiteSpace: "nowrap", animation: "vx-tape 70s linear infinite", willChange: "transform" }}>
            {[...segs, ...segs].map((s, i) => <Cell key={i} s={s} />)}
          </div>
        ) : (
          <span style={{ paddingLeft: 26, fontSize: 11, color: T.faint }}>tape yükleniyor…</span>
        )}
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 36, background: "linear-gradient(90deg, transparent, rgba(244,250,247,0.95))", pointerEvents: "none" }} />
      </div>
    </div>
  );
}
