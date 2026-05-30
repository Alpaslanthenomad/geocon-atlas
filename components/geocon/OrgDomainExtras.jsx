"use client";
// OrgDomainExtras — shown on an organization detail page.
// Pulls accession + seed-bank rollups, plus the org's top tracked
// species by both metrics.

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

const IUCN_TINT = {
  CR: "#FF8B96", EN: "#FFB870", VU: "#FFE875",
  NT: "#B2DFDB", LC: "#A5D6A7", DD: "#CFD8DC", NE: "#90A4AE",
};

export default function OrgDomainExtras({ orgId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc("get_org_domain_extras", { p_org: orgId });
      if (cancelled) return;
      if (!error) setData(data || null);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [orgId]);

  if (loading || !data) return null;
  const empty =
    !data.accessions_count && !data.seed_lots_count;
  if (empty) return null;

  const accTop = Array.isArray(data.top_accessions) ? data.top_accessions : [];
  const seedTop = Array.isArray(data.top_seed_lots) ? data.top_seed_lots : [];

  return (
    <section style={{
      marginTop: 16,
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
        Holdings
      </h2>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: 10,
        marginBottom: 14,
      }}>
        <Stat label="Accessions"        value={data.accessions_count} />
        <Stat label="Species in collection" value={data.accessions_species} />
        <Stat label="Seed lots"         value={data.seed_lots_count} />
        <Stat label="Species banked"    value={data.seed_lots_species} />
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: 12,
      }}>
        {accTop.length > 0 && (
          <SpeciesList title="🪴 Most-held species" rows={accTop} valueKey="individuals" valueSuffix="ind." />
        )}
        {seedTop.length > 0 && (
          <SpeciesList title="🌱 Most-banked species" rows={seedTop} valueKey="seeds" valueSuffix="seeds" subKey="lots" subSuffix="lots" />
        )}
      </div>
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{
      padding: 12,
      background: "var(--gx-surface-2)",
      border: "1px solid var(--gx-border-soft)",
      borderRadius: "var(--gx-radius-3)",
    }}>
      <div style={{
        fontFamily: "var(--gx-font-display)",
        fontSize: 24,
        fontWeight: 900,
        color: "var(--gx-ink)",
        letterSpacing: -1,
        lineHeight: 1,
      }}>
        {Number(value || 0).toLocaleString()}
      </div>
      <div style={{ fontSize: 10, color: "var(--gx-ink-muted)", marginTop: 4, fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase" }}>
        {label}
      </div>
    </div>
  );
}

function SpeciesList({ title, rows, valueKey, valueSuffix, subKey, subSuffix }) {
  return (
    <div>
      <h3 style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "var(--gx-ink-muted)", margin: "0 0 8px" }}>
        {title}
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {rows.map((r) => (
          <Link
            key={r.species_id}
            href={`/geocon/species/${r.species_id}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 8px",
              borderRadius: 7,
              fontSize: 11,
              textDecoration: "none",
              color: "var(--gx-ink)",
              background: "var(--gx-surface-2)",
              border: "1px solid var(--gx-border-soft)",
            }}
          >
            <span style={{
              flex: 1,
              fontFamily: "var(--gx-font-serif)",
              fontStyle: "italic",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {r.accepted_name || r.species_id}
            </span>
            {r.iucn_status && (
              <span style={{
                fontSize: 8,
                fontWeight: 700,
                padding: "1px 5px",
                borderRadius: 3,
                background: IUCN_TINT[r.iucn_status] || "#ccc",
                color: "#2c2c2a",
              }}>
                {r.iucn_status}
              </span>
            )}
            <span style={{ fontWeight: 700, color: "var(--gx-ink-soft)", fontSize: 11 }}>
              {Number(r[valueKey] || 0).toLocaleString()} {valueSuffix}
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
