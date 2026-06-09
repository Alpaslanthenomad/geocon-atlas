"use client";
// components/exchange/ExchangeTape.jsx
//
// THE TAPE — the money-free ticker spine of Venn Exchange, mounted once in the
// shell so it runs across every layer. Reads get_exchange_tape() (real counts
// only). The borsa feel comes from the perpetual scroll + the monospace numerals
// + the sector strip + the status nameplate — NOT from fake prices. Each cell is
// LABEL · NUMERAL · GLYPH, where the glyph is a typographic direction marker on a
// real count: ▲ green = append-only/growing, ◆ amber = curated steady set,
// ‖ muted = flat / pre-open. No $, %, or moving numeral anywhere.

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const GREEN = "#7BE3BE", AMBER = "#F5A623", VIOLET = "#b39ddb", MUTED = "#9b8c74";
const fmt = (n) => (typeof n === "number" ? n.toLocaleString("en-US") : n);

function buildSegs(t) {
  const a = t.atlas || {}, m = t.market || {}, k = m.fund_kinds || {}, iu = a.iucn || {};
  const seg = (label, num, glyph, color) => ({ label, num, glyph, color });
  const evid = [
    seg("ATLAS", fmt(a.species) + " spp", "▲", GREEN),
    seg("IUCN ASSESSED", fmt(a.iucn_assessed), "▲", GREEN),
    seg("THREATENED", `CR ${iu.cr} EN ${iu.en} VU ${iu.vu}`, "◆", GREEN),
    seg("PUBLICATIONS", fmt(a.publications), "▲", GREEN),
    seg("CHAIN", fmt(a.chain_facts) + " facts", "▲", GREEN),
    seg("LINK TYPES", a.chain_types, "◆", GREEN),
  ];
  const market = [
    seg("FUNDS", m.funds, "◆", AMBER),
    seg("VC", k.vc || 0, "◆", AMBER),
    seg("IMPACT", k.impact_fund || 0, "◆", AMBER),
    seg("CORP", k.corp_vc || 0, "◆", AMBER),
    seg("STRATEGIC", k.strategic || 0, "◆", AMBER),
    seg("FOUNDATION", k.foundation || 0, "◆", AMBER),
    seg("SECTOR", (t.sectors || []).map((s) => s.vertical).join(" · "), "◆", VIOLET),
    seg("DEALS", m.opportunities, "‖", MUTED),
    seg("VENTURES", m.ventures, "‖", MUTED),
  ];
  return [...evid, "FW", ...market];
}

function Cell({ s }) {
  if (s === "FW") return <span style={{ color: "rgba(245,166,35,0.4)", letterSpacing: 2, padding: "0 4px", fontSize: 11 }}>‖ firewall ‖</span>;
  return (
    <span style={{ display: "inline-flex", alignItems: "baseline", gap: 6, whiteSpace: "nowrap" }}>
      <span style={{ fontSize: 9.5, letterSpacing: 0.8, color: "rgba(255,222,170,0.45)", textTransform: "uppercase" }}>{s.label}</span>
      <span style={{ fontFamily: "ui-monospace, Menlo, Consolas, monospace", fontSize: 12, fontWeight: 600, color: "#FFE6BC" }}>{s.num}</span>
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

  return (
    <div style={{ height: 34, display: "flex", alignItems: "center", background: "rgba(21,8,33,0.9)", backdropFilter: "blur(8px)", borderBottom: "1px solid rgba(245,166,35,0.14)", overflow: "hidden" }}>
      <style>{`@keyframes vx-tape{from{transform:translate3d(0,0,0)}to{transform:translate3d(-50%,0,0)}}@keyframes vx-blink{0%,100%{opacity:.35}50%{opacity:1}}@media(prefers-reduced-motion:reduce){.vx-tape-track{animation:none!important}}`}</style>
      {/* status nameplate (fixed) */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "0 14px", height: "100%", background: "rgba(245,166,35,0.10)", borderRight: "1px solid rgba(245,166,35,0.2)", flexShrink: 0, zIndex: 2 }}>
        <span style={{ width: 7, height: 7, borderRadius: 99, background: "#7BE3BE", animation: "vx-blink 2s ease-in-out infinite" }} />
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2, color: "#FFD15C" }}>{statusLabel}</span>
      </div>
      {/* scrolling tape */}
      <div style={{ position: "relative", flex: 1, overflow: "hidden", height: "100%", display: "flex", alignItems: "center" }}>
        {segs ? (
          <div className="vx-tape-track" style={{ display: "flex", gap: 26, paddingLeft: 26, whiteSpace: "nowrap", animation: "vx-tape 70s linear infinite", willChange: "transform" }}>
            {[...segs, ...segs].map((s, i) => <Cell key={i} s={s} />)}
          </div>
        ) : (
          <span style={{ paddingLeft: 26, fontSize: 11, color: "rgba(255,222,170,0.4)" }}>tape yükleniyor…</span>
        )}
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 36, background: "linear-gradient(90deg, transparent, rgba(21,8,33,0.95))", pointerEvents: "none" }} />
      </div>
    </div>
  );
}
