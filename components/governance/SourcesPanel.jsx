"use client";
import { S } from "../../lib/constants";

const freshC = (v) => (v > 0.85 ? "#0F6E56" : v > 0.65 ? "#BA7517" : "#A32D2D");

/**
 * SourcesPanel — Veri kaynaklarının güvenilirlik / freshness gösterimi
 * (eski SourcesPanel, misc/OtherViews.jsx'ten taşındı)
 */
export default function SourcesPanel({ sources }) {
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
