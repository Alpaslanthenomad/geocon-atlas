"use client";
// v4.3-a — IUCN historical status strip.
//
// Mini timeline showing how a species' IUCN Red List status has
// changed across editions. Pure SVG, no chart library.
//
// Renders silently empty if no history rows yet — the cron seeds them
// gradually over weeks.

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const TIER_TINT = {
  CR: "#E5484D", EN: "#F76808", VU: "#F5D90A",
  NT: "#A8DDD4", LC: "#9AE6B4", DD: "#C5CDD3", NE: "#9AA5AD",
  EX: "#3F3F3F", EW: "#6B6B6B",
};

const TIER_LABEL = {
  CR: "Critically endangered", EN: "Endangered", VU: "Vulnerable",
  NT: "Near threatened", LC: "Least concern", DD: "Data deficient",
  NE: "Not evaluated", EX: "Extinct", EW: "Extinct in the wild",
};

export default function IucnHistoryStrip({ speciesId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!speciesId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.rpc("list_species_iucn_history", { p_species_id: speciesId });
      if (!cancelled) {
        setRows(Array.isArray(data) ? data : []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [speciesId]);

  if (loading) return null;
  if (rows.length < 2) return null; // single point = boring, skip

  const minYear = rows[0].year;
  const maxYear = rows[rows.length - 1].year;
  const span = Math.max(1, maxYear - minYear);

  return (
    <section style={{
      marginTop: 16, padding: "var(--gx-card-pad)",
      background: "var(--gx-card-bg)",
      border: "1px solid var(--gx-card-border)",
      borderRadius: "var(--gx-card-radius)",
    }}>
      <div className="gx-overline" style={{ marginBottom: 4 }}>
        Red List history
      </div>
      <h3 style={{
        fontFamily: "var(--gx-font-display)", fontSize: 14, fontWeight: 700,
        color: "var(--gx-ink)", margin: "2px 0 12px 0",
      }}>
        Status trajectory {minYear} → {maxYear}
      </h3>

      <div style={{ position: "relative", padding: "0 4px" }}>
        {/* Axis */}
        <div style={{
          height: 1, background: "var(--gx-border)",
          position: "absolute", left: 0, right: 0, top: 18,
        }} />
        {/* Dots */}
        <div style={{ position: "relative", height: 36 }}>
          {rows.map((r, i) => {
            const x = ((r.year - minYear) / span) * 100;
            const color = TIER_TINT[r.status] || TIER_TINT.NE;
            return (
              <div key={i}
                title={`${r.year} — ${r.status} (${TIER_LABEL[r.status] || r.status})`}
                style={{
                  position: "absolute",
                  left: `calc(${x}% - 7px)`,
                  top: 11,
                  width: 14, height: 14, borderRadius: "50%",
                  background: color,
                  border: "2px solid var(--gx-card-bg)",
                  boxShadow: "0 0 0 1px var(--gx-border)",
                }} />
            );
          })}
        </div>
        {/* Year labels under first / last */}
        <div style={{
          display: "flex", justifyContent: "space-between",
          fontSize: 9, color: "var(--gx-ink-muted)",
          fontFamily: "var(--gx-font-mono)",
        }}>
          <span>{minYear}</span>
          <span>{maxYear}</span>
        </div>
      </div>

      {/* Legend chips for the tiers present */}
      <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
        {Array.from(new Set(rows.map((r) => r.status))).map((tier) => (
          <span key={tier} style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
            padding: "2px 8px", borderRadius: 999,
            background: `color-mix(in srgb, ${TIER_TINT[tier]} 22%, transparent)`,
            color: TIER_TINT[tier],
            fontFamily: "var(--gx-font-mono)",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: TIER_TINT[tier] }} />
            {tier}
          </span>
        ))}
      </div>
      <div style={{ fontSize: 9, color: "var(--gx-ink-faint)", marginTop: 6, fontStyle: "italic" }}>
        Source: Wikidata P141 statements with point-in-time qualifier.
      </div>
    </section>
  );
}
