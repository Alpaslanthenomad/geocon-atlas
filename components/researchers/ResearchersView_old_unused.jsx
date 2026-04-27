"use client";
import { useState } from "react";
import { S } from "../../lib/constants";

export default function ResearchersView({ researchers }) {
  const [search, setSearch] = useState("");

  const filtered = researchers.filter((r) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (r.name || "").toLowerCase().includes(s) ||
      (r.expertise_area || "").toLowerCase().includes(s) ||
      (r.country || "").toLowerCase().includes(s)
    );
  });

  const sorted   = [...filtered].sort((a, b) => (b.h_index || 0) - (a.h_index || 0));
  const countries = [...new Set(researchers.map((r) => r.country).filter(Boolean))];

  return (
    <div>
      <input
        type="text"
        placeholder="Search name, expertise, or country..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: "100%", marginBottom: 12, ...S.input }}
      />

      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        {[
          { l: "Total researchers", v: researchers.length },
          { l: "Countries",         v: countries.length },
          { l: "With h-index",      v: researchers.filter((r) => r.h_index).length },
        ].map((s) => (
          <div key={s.l} style={{ flex: "1 1 100px", ...S.metric }}>
            <div style={S.mLabel}>{s.l}</div>
            <div style={S.mVal()}>{s.v}</div>
          </div>
        ))}
      </div>

      <p style={S.sub}>{sorted.length} researchers · Sorted by h-index</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 8 }}>
        {sorted.slice(0, 80).map((r) => (
          <div key={r.id} style={{ ...S.card, padding: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#2c2c2a" }}>{r.name}</div>
            <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>{r.expertise_area || "—"}</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
              {r.country && (
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: "#E6F1FB", color: "#0C447C" }}>
                  {r.country}
                </span>
              )}
              {r.h_index && (
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: "#EEEDFE", color: "#3C3489" }}>
                  h: {r.h_index}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

