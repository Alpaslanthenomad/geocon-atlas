"use client";
// SpeciesDomainExtras — phenology calendar + living-collection / seed-bank
// rollups + propagation protocol heads, all from get_species_domain_extras.

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const STAGE_COLOR = {
  flowering: "#FFD15C",
  fruiting:  "#E5722B",
  leafing:   "#1D9E75",
  seeding:   "#534AB7",
  dormant:   "#90A4AE",
};

export default function SpeciesDomainExtras({ speciesId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!speciesId) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc("get_species_domain_extras", { p_id: speciesId });
      if (cancelled) return;
      if (!error) setData(data || null);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [speciesId]);

  if (loading || !data) return null;

  const phen = Array.isArray(data.phenology) ? data.phenology : [];
  const accOrgs = Array.isArray(data.accessions_orgs) ? data.accessions_orgs : [];
  const seedOrgs = Array.isArray(data.seed_lots_orgs) ? data.seed_lots_orgs : [];
  const protocols = Array.isArray(data.protocols) ? data.protocols : [];

  const hasAnything =
    phen.length > 0 ||
    accOrgs.length > 0 ||
    seedOrgs.length > 0 ||
    protocols.length > 0;

  if (!hasAnything) return null;

  return (
    <section className="gx-rise" style={{
      marginTop: 18,
      padding: 16,
      background: "var(--gx-surface)",
      border: "1px solid var(--gx-border)",
      borderRadius: "var(--gx-radius-4)",
    }}>
      <h2 style={{
        fontFamily: "var(--gx-font-serif)",
        fontSize: 18,
        fontWeight: 700,
        color: "var(--gx-ink)",
        margin: "0 0 14px",
      }}>
        Field & collection signal
      </h2>

      {phen.length > 0 && <PhenologyStrip rows={phen} />}

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: 12,
        marginTop: 14,
      }}>
        {accOrgs.length > 0 && (
          <OrgRollup
            title="Living collections"
            icon="🪴"
            total={data.accessions_total}
            totalLabel="individuals across"
            rows={accOrgs}
            valueKey="individuals"
          />
        )}
        {seedOrgs.length > 0 && (
          <OrgRollup
            title="Seed bank"
            icon="🌱"
            total={data.seed_lots_total_seeds}
            totalLabel="estimated seeds across"
            rows={seedOrgs}
            valueKey="seeds"
            subKey="lots"
            subSuffix="lots"
          />
        )}
      </div>

      {protocols.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <h3 style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "var(--gx-ink-muted)", margin: 0 }}>
            Propagation protocols · {protocols.length}
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
            {protocols.map((p) => (
              <div key={p.id} style={{
                padding: "8px 10px",
                background: "var(--gx-surface-2)",
                border: "1px solid var(--gx-border-soft)",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
              }}>
                <span style={{ fontSize: 13 }}>📄</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: "var(--gx-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.title}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--gx-ink-muted)" }}>
                    v{p.version}
                    {p.author_name && <> · by {p.author_name}</>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function PhenologyStrip({ rows }) {
  // collapse all stages per month into a max-intensity heatmap, but
  // keep stage list to show as tooltip
  const monthAgg = Array.from({ length: 12 }).map((_, i) => {
    const monthRows = rows.filter((r) => r.month_idx === i + 1);
    if (monthRows.length === 0) return null;
    const dominantStage = monthRows.sort((a, b) => (b.intensity || 0) - (a.intensity || 0))[0];
    const intensityAvg = Math.round(
      monthRows.reduce((s, r) => s + (r.intensity || 0), 0) / monthRows.length
    );
    return { stage: dominantStage.stage, intensity: intensityAvg, stages: monthRows.map((r) => r.stage) };
  });
  return (
    <div>
      <h3 style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "var(--gx-ink-muted)", margin: "0 0 6px" }}>
        Phenology · 12-month signal
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 3 }}>
        {monthAgg.map((agg, i) => {
          const color = agg ? (STAGE_COLOR[agg.stage] || "var(--gx-iucn-lc)") : "var(--gx-surface-3)";
          const alpha = agg ? Math.max(0.3, agg.intensity / 100) : 0;
          return (
            <div key={i} style={{ textAlign: "center" }}>
              <div
                title={agg ? `${MONTHS[i]} · ${agg.stage} (${agg.intensity}%)` : `${MONTHS[i]} · no data`}
                style={{
                  height: 38,
                  borderRadius: 6,
                  background: agg ? `color-mix(in srgb, ${color} ${Math.round(alpha * 100)}%, var(--gx-surface-3))` : "var(--gx-surface-3)",
                  border: `1px solid ${agg ? color : "var(--gx-border-soft)"}`,
                }}
              />
              <div style={{ fontSize: 9, color: "var(--gx-ink-muted)", marginTop: 3, fontWeight: 600 }}>
                {MONTHS[i]}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
        {Object.entries(STAGE_COLOR).map(([stage, color]) => {
          const used = rows.some((r) => r.stage === stage);
          if (!used) return null;
          return (
            <span key={stage} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, color: "var(--gx-ink-soft)" }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
              {stage}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function OrgRollup({ title, icon, total, totalLabel, rows, valueKey, subKey, subSuffix }) {
  return (
    <div style={{
      padding: 14,
      background: "var(--gx-surface-2)",
      border: "1px solid var(--gx-border-soft)",
      borderRadius: "var(--gx-radius-3)",
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--gx-ink)" }}>
          {title}
        </div>
      </div>
      <div style={{
        fontFamily: "var(--gx-font-display)",
        fontSize: 26,
        fontWeight: 900,
        color: "var(--gx-ink)",
        letterSpacing: -1,
        marginTop: 6,
        lineHeight: 1,
      }}>
        {Number(total || 0).toLocaleString()}
      </div>
      <div style={{ fontSize: 10, color: "var(--gx-ink-muted)", marginTop: 2 }}>
        {totalLabel} {rows.length} {rows.length === 1 ? "organization" : "organizations"}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 10 }}>
        {rows.slice(0, 5).map((r) => (
          <Link
            key={r.id}
            href={`/geocon/organizations/${r.id}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 8px",
              borderRadius: 6,
              fontSize: 11,
              color: "var(--gx-ink)",
              textDecoration: "none",
              background: "var(--gx-surface)",
              border: "1px solid var(--gx-border-soft)",
            }}
          >
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {r.name}
            </span>
            <span style={{ fontWeight: 700, color: "var(--gx-ink-soft)" }}>
              {Number(r[valueKey] || 0).toLocaleString()}
              {subKey && r[subKey] != null && (
                <span style={{ fontWeight: 400, color: "var(--gx-ink-muted)", marginLeft: 4 }}>
                  · {r[subKey]} {subSuffix}
                </span>
              )}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
