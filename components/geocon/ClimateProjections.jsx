"use client";
// v4.3-b — Climate projection mini-strip.
//
// Renders silently empty until the climate_projections table is
// seeded (raster harvest is a separate workstream). When data is
// present, shows the three IPCC SSP scenarios with projected range
// change, so a researcher can see at a glance how a species fares
// under low/mid/high emissions.

import { useEffect, useState } from "react";
import { CloudRain, ChevronsDown, ChevronsUp, Equal } from "lucide-react";
import { supabase } from "../../lib/supabase";

const SCENARIO_META = {
  SSP126: { label: "SSP1-2.6", desc: "Low emissions / 1.5°C pathway", tint: "var(--gx-success)" },
  SSP245: { label: "SSP2-4.5", desc: "Middle of the road",            tint: "var(--gx-warning)" },
  SSP585: { label: "SSP5-8.5", desc: "Fossil-fueled development",     tint: "var(--gx-danger)"  },
};

export default function ClimateProjections({ speciesId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!speciesId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.rpc("list_species_climate_projections", { p_species_id: speciesId });
      if (!cancelled) {
        setRows(Array.isArray(data) ? data : []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [speciesId]);

  if (loading) return null;
  if (rows.length === 0) return null;

  // Find a "current" / baseline row to compare against. Use scenario=BASELINE
  // if present, else use the smallest range value to compute relative shifts.
  const baseline = rows.find((r) => /baseline|current/i.test(r.scenario)) || rows[0];

  return (
    <section style={{
      marginTop: 16, padding: "var(--gx-card-pad)",
      background: "var(--gx-card-bg)",
      border: "1px solid var(--gx-card-border)",
      borderRadius: "var(--gx-card-radius)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <CloudRain size={14} strokeWidth={1.8} style={{ color: "var(--gx-accent-azure)" }} />
        <div>
          <div className="gx-overline" style={{ marginBottom: 0 }}>Climate vulnerability</div>
          <h3 style={{
            fontFamily: "var(--gx-font-display)", fontSize: 14, fontWeight: 700,
            color: "var(--gx-ink)", margin: 0,
          }}>
            Projected range under IPCC scenarios
          </h3>
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${Math.min(rows.length, 3)}, 1fr)`,
        gap: 8,
      }}>
        {rows.slice(0, 3).map((r) => {
          const meta = SCENARIO_META[r.scenario?.toUpperCase()] || {
            label: r.scenario, desc: "", tint: "var(--gx-ink-soft)",
          };
          const baseSize = Number(baseline.range_size_km2 || 0);
          const sz = Number(r.range_size_km2 || 0);
          const pct = baseSize > 0 ? Math.round(((sz - baseSize) / baseSize) * 100) : null;
          let Arrow = Equal;
          if (pct != null && pct < -5)  Arrow = ChevronsDown;
          if (pct != null && pct > 5)   Arrow = ChevronsUp;
          return (
            <div key={r.scenario} style={{
              padding: 10, borderRadius: 8,
              background: "var(--gx-surface-2)",
              border: "1px solid var(--gx-border-soft)",
            }}>
              <div style={{
                fontSize: 9, fontWeight: 700, letterSpacing: 0.6,
                color: meta.tint, fontFamily: "var(--gx-font-mono)",
              }}>
                {meta.label}
              </div>
              <div style={{ marginTop: 4, fontSize: 10, color: "var(--gx-ink-muted)", lineHeight: 1.4, minHeight: 28 }}>
                {meta.desc}
              </div>
              <div style={{
                marginTop: 6, display: "flex", alignItems: "baseline", gap: 4,
                fontFamily: "var(--gx-font-mono)", fontSize: 14, fontWeight: 700,
                color: "var(--gx-ink)",
              }}>
                {sz > 0 ? `${Math.round(sz).toLocaleString()} km²` : "—"}
              </div>
              {pct != null && r !== baseline && (
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 3,
                  marginTop: 4, fontSize: 11, fontWeight: 700,
                  color: pct < 0 ? "var(--gx-danger)" : pct > 0 ? "var(--gx-success)" : "var(--gx-ink-soft)",
                }}>
                  <Arrow size={11} strokeWidth={2.3} />
                  {pct > 0 ? "+" : ""}{pct}% vs baseline
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 9, color: "var(--gx-ink-faint)", marginTop: 10, fontStyle: "italic" }}>
        Source: {rows[0].model_source || "—"}. Range estimates are MaxEnt SDM
        projections over WorldClim/Chelsa bioclimatic layers; treat as scenario
        comparison, not absolute biology.
      </div>
    </section>
  );
}
