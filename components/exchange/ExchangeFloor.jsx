"use client";
// components/exchange/ExchangeFloor.jsx
//
// THE FLOOR — the Overview as a living trading floor, driven entirely by the
// money-free get_exchange_tape() payload. Band A = the board (status pill +
// count-up totes + a real UTC clock — the ONLY genuinely ticking element, because
// it is the time, never a price). Band B = the sector heatmap (verticals x stages
// or x fund-kinds), tiles colored by REAL fund density; empty cells are open
// territory (dashed green), not dead. No prices, %, or moving numerals anywhere.

import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";

const STAGE_ORDER = ["pre-seed", "seed", "series-a", "growth", "multi-stage"];
const KIND_ORDER = ["vc", "impact_fund", "corp_vc", "strategic", "foundation"];
const KIND_LABEL = { vc: "VC", impact_fund: "Impact", corp_vc: "Corp", strategic: "Strategic", foundation: "Foundation" };
const fmt = (n) => (typeof n === "number" ? n.toLocaleString("en-US") : n);

function heat(d) {
  if (!d) return null;
  const stops = ["#7a3d12", "#9e561d", "#C24E17", "#E5722B", "#F5A623", "#FFD15C"];
  return stops[Math.round(Math.max(0, Math.min(1, d)) * (stops.length - 1))];
}

function CountUp({ target, suffix = "" }) {
  const [v, setV] = useState(0);
  const ref = useRef();
  useEffect(() => {
    if (typeof target !== "number") return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setV(target); return; }
    let raf, t0;
    const step = (t) => {
      if (!t0) t0 = t;
      const p = Math.min(1, (t - t0) / 850);
      setV(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    ref.current = raf;
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return <span>{fmt(v)}{suffix}</span>;
}

function UTCClock() {
  const [t, setT] = useState("--:--:--");
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setT([d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()].map((x) => String(x).padStart(2, "0")).join(":"));
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);
  return <span style={{ fontFamily: "ui-monospace, Menlo, Consolas, monospace" }}>{t}</span>;
}

export default function ExchangeFloor() {
  const [tape, setTape] = useState(null);
  const [pivot, setPivot] = useState("stage");
  const [hover, setHover] = useState(null);

  useEffect(() => {
    let on = true;
    supabase.rpc("get_exchange_tape").then(({ data }) => { if (on) setTape(data || null); }).catch(() => {});
    return () => { on = false; };
  }, []);

  if (!tape) return <div style={{ height: 320, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,222,170,0.4)", fontSize: 13 }}>floor yükleniyor…</div>;

  const verts = (tape.sectors || []).map((s) => s.vertical);
  const cols = pivot === "stage" ? STAGE_ORDER : KIND_ORDER;
  const gridRows = pivot === "stage" ? (tape.grid_by_stage || []) : (tape.grid_by_kind || []);
  const colKey = pivot === "stage" ? "stage" : "kind";
  const lookup = {};
  gridRows.forEach((g) => { lookup[g.vertical + "|" + g[colKey]] = g.funds; });
  const max = Math.max(1, ...gridRows.map((g) => g.funds));
  const colLabel = (c) => pivot === "stage" ? c : (KIND_LABEL[c] || c);

  const statusLabel = tape.status === "open" ? "OPEN" : tape.status === "opening" ? "OPENING" : "CURATING · first listings forming";

  return (
    <div style={{ marginBottom: 30 }}>
      <style>{`@keyframes vx-scan{0%{transform:translateX(-12%);opacity:0}12%{opacity:.5}88%{opacity:.5}100%{transform:translateX(112%);opacity:0}}@keyframes vx-dot{0%,100%{opacity:.4}50%{opacity:1}}@media(prefers-reduced-motion:reduce){.vx-scan{animation:none!important;opacity:0!important}}`}</style>

      {/* BAND A — the board */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", padding: "16px 22px", borderRadius: 16, background: "linear-gradient(180deg, rgba(40,20,60,0.6), rgba(28,12,44,0.55))", border: "1px solid rgba(245,166,35,0.2)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ width: 8, height: 8, borderRadius: 99, background: "#7BE3BE", animation: "vx-dot 2s ease-in-out infinite" }} />
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: "#FFD15C" }}>{statusLabel}</span>
        </div>
        <div style={{ display: "flex", gap: 26, flexWrap: "wrap" }}>
          <Tote n={<CountUp target={tape.market?.funds} />} label="FUNDS MAPPED" />
          <Tote n={<CountUp target={(tape.sectors || []).length} />} label="SECTORS" />
          <Tote n={<CountUp target={tape.atlas?.species} />} label="SPECIES BACKING" />
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#FFE6BC", letterSpacing: 0.5 }}><UTCClock /> <span style={{ fontSize: 10, color: "#8a6f56" }}>UTC</span></div>
          <div style={{ fontSize: 9, color: "#8a6f56", letterSpacing: 1.5 }}>EST. 2026 · TALLINN</div>
        </div>
      </div>

      {/* pivot toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 10, color: "#8a6f56", textTransform: "uppercase", letterSpacing: 1 }}>The floor — fund density by</span>
        {[["stage", "stage"], ["kind", "fund type"]].map(([k, lbl]) => (
          <button key={k} onClick={() => setPivot(k)} style={{
            fontSize: 11, padding: "3px 10px", borderRadius: 99, cursor: "pointer",
            border: "1px solid " + (pivot === k ? "rgba(245,166,35,0.5)" : "rgba(245,166,35,0.14)"),
            background: pivot === k ? "rgba(245,166,35,0.16)" : "transparent",
            color: pivot === k ? "#FFE6BC" : "rgba(255,222,170,0.6)",
          }}>{lbl}</button>
        ))}
      </div>

      {/* BAND B — the heatmap */}
      <div style={{ position: "relative", overflow: "hidden", borderRadius: 14, border: "1px solid rgba(245,166,35,0.16)", background: "rgba(20,8,33,0.45)", padding: "14px 16px" }}>
        <div className="vx-scan" style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: 80, background: "linear-gradient(90deg, transparent, rgba(245,166,35,0.10), transparent)", animation: "vx-scan 9s ease-in-out infinite", pointerEvents: "none" }} />
        {/* top axis */}
        <div style={{ display: "grid", gridTemplateColumns: "120px repeat(" + cols.length + ", 1fr)", gap: 6, marginBottom: 6 }}>
          <div />
          {cols.map((c, ci) => (
            <div key={c} style={{ fontSize: 10, textAlign: "center", color: hover && hover.c === ci ? "#FFE6BC" : "#9b86c9", fontWeight: hover && hover.c === ci ? 700 : 500, textTransform: "uppercase", letterSpacing: 0.5 }}>{colLabel(c)}</div>
          ))}
        </div>
        {/* rows */}
        {verts.map((v, ri) => (
          <div key={v} style={{ display: "grid", gridTemplateColumns: "120px repeat(" + cols.length + ", 1fr)", gap: 6, marginBottom: 6 }}>
            <div style={{ fontSize: 11.5, display: "flex", alignItems: "center", color: hover && hover.r === ri ? "#FFE6BC" : "#C8B89E", fontWeight: hover && hover.r === ri ? 700 : 500, textTransform: "capitalize" }}>{v}</div>
            {cols.map((c, ci) => {
              const funds = lookup[v + "|" + c] || 0;
              const d = funds / max;
              const col = heat(d);
              const on = hover && hover.r === ri && hover.c === ci;
              return (
                <div key={c}
                  onMouseEnter={() => setHover({ r: ri, c: ci, v, c2: c, funds })}
                  onMouseLeave={() => setHover(null)}
                  title={v + " × " + colLabel(c) + " — " + funds + (funds === 1 ? " fund" : " funds")}
                  style={{
                    position: "relative", minHeight: 48, borderRadius: 8, cursor: "default",
                    background: col || "rgba(40,20,60,0.45)",
                    border: col ? "1px solid rgba(0,0,0,0.2)" : "1px dashed rgba(125,168,111,0.35)",
                    transform: on ? "scale(1.05)" : "scale(1)", transition: "transform .15s",
                    display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 3,
                    boxShadow: on ? "0 4px 18px rgba(245,166,35,0.25)" : "none", zIndex: on ? 3 : 1,
                  }}>
                  <span style={{ fontFamily: "ui-monospace, Menlo, Consolas, monospace", fontSize: 15, fontWeight: 700, color: col ? "#1a0d2e" : "rgba(125,168,111,0.5)" }}>{funds || ""}</span>
                  {col && <span style={{ width: Math.max(8, d * 36), height: 3, borderRadius: 2, background: "rgba(26,13,46,0.4)" }} />}
                </div>
              );
            })}
          </div>
        ))}
        {/* provenance */}
        <div style={{ fontSize: 10.5, color: "#8a6f56", marginTop: 10, lineHeight: 1.5 }}>
          Heat = curated fund density ({tape.market?.funds} funds) × conservation backing ({fmt(tape.atlas?.species)} species, {tape.atlas?.iucn_assessed} IUCN-assessed). No prices. Empty cells = open territory, no fund mapped yet. Verified {tape.as_of}.
        </div>
      </div>
    </div>
  );
}

function Tote({ n, label }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontFamily: "ui-monospace, Menlo, Consolas, monospace", fontSize: 22, fontWeight: 700, color: "#FFE6BC" }}>{n}</div>
      <div style={{ fontSize: 9, color: "#8a6f56", letterSpacing: 1, textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}
