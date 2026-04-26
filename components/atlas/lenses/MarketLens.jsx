"use client";
import { useState } from "react";
import { S } from "../../../lib/constants";

/**
 * MarketLens — Atlas içinde market intelligence görünümü
 * (eski MarketView, misc/OtherViews.jsx'ten taşındı)
 */
export default function MarketLens({ markets }) {
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
