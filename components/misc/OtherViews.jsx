"use client";
import { useState } from "react";
import { S } from "../../lib/constants";

/* ── Market ── */
export function MarketView({ markets }) {
  const [expanded, setExpanded] = useState(null);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { l: "Hypotheses", v: markets.length },
          { l: "Spin-offs",  v: [...new Set(markets.map((m) => m.spinoff_link).filter(Boolean))].length },
        ].map((s) => (
          <div key={s.l} style={{ flex: "1 1 110px", ...S.metric }}>
            <div style={S.mLabel}>{s.l}</div>
            <div style={S.mVal()}>{s.v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))", gap: 10 }}>
        {markets.map((m) => (
          <div
            key={m.id}
            onClick={() => setExpanded(expanded === m.id ? null : m.id)}
            style={{ ...S.card, padding: 16, cursor: "pointer" }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, color: "#2c2c2a", marginBottom: 4 }}>{m.application_area}</div>
            <div style={{ fontSize: 10, fontStyle: "italic", color: "#888" }}>
              {m.species?.accepted_name || "—"} — {m.market_segment || m.market_type || "—"}
            </div>
            {expanded === m.id && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #e8e6e1" }}>
                {m.justification && <div style={{ fontSize: 11, color: "#5f5e5a", lineHeight: 1.6, marginBottom: 6 }}>{m.justification}</div>}
                {m.notes         && <div style={{ fontSize: 10, color: "#888" }}>{m.notes}</div>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Partners / Institutions ── */
export function PartnerView({ institutions }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 8 }}>
      {institutions.map((i) => (
        <div key={i.id} style={{ ...S.card, padding: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#2c2c2a" }}>{i.name}</div>
          <div style={{ fontSize: 10, color: "#888" }}>
            {i.city ? `${i.city}, ` : ""}{i.country || "—"}
          </div>
          <div style={{ fontSize: 11, color: "#5f5e5a", marginTop: 4 }}>{i.research_focus || i.focus_area || "—"}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Sources ── */
const freshC = (v) => (v > 0.85 ? "#0F6E56" : v > 0.65 ? "#BA7517" : "#A32D2D");

export function SourcesPanel({ sources }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 8 }}>
      {sources.map((src) => (
        <div key={src.id} style={{ ...S.card, padding: "10px 12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#2c2c2a" }}>{src.source_name || src.name}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: freshC(src.freshness_score || 0), display: "inline-block" }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: freshC(src.freshness_score || 0) }}>
                {Math.round((src.freshness_score || 0) * 100)}%
              </span>
            </div>
          </div>
          <div style={S.sub}>{src.data_domain || src.source_type || "—"} · {src.update_frequency || "—"}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Portfolio ── */
export function PortfolioView({ species }) {
  return (
    <div>
      <p style={S.sub}>Composite vs urgency · bubble = value score</p>
      <div style={{ position: "relative", width: "100%", height: 320, background: "#fff", borderRadius: 14, border: "1px solid #e8e6e1", overflow: "hidden", marginTop: 8 }}>
        {species.map((sp) => {
          const c  = sp.composite_score || 50;
          const con = sp.score_conservation || 50;
          const v  = sp.score_venture || 50;
          const x  = ((c - 40) / 50) * 82 + 9;
          const y  = 100 - ((con - 20) / 80) * 88;
          const sz = 16 + (v / 100) * 28;
          return (
            <div
              key={sp.id}
              title={`${sp.accepted_name}\nComp:${c}`}
              style={{ position: "absolute", left: `${x}%`, top: `${y}%`, width: sz, height: sz, borderRadius: "50%", background: "#1D9E75", opacity: 0.75, transform: "translate(-50%,-50%)", border: "2px solid #fff" }}
            />
          );
        })}
      </div>
    </div>
  );
}
