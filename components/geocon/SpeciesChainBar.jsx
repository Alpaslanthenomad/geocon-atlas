"use client";
// THE CHAIN — L0 surface. The six-segment value-chain for one species, drawn so
// the EMPTY MIDDLE is undeniable: a filled link is a solid segment coloured by
// evidence class; an empty link is a hollow break. Integrity = the weakest link
// (min strength), NOT a sum — a strong taxonomy/metabolite end cannot mask a gap.
// Reads get_species_chain (lib/iucn-independent; conservation data, open-read).

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

// evidence-class → segment colour (deterministic; matches chain_strength tiers)
const CLASS_COLOR = {
  bench_measured: "#0F6E56", // measured — strongest
  field:          "#1D9E75",
  literature:     "#185FA5",
  imported:       "#BA7517", // harvested — capped
  inferred:       "#9AA5AD", // inferred — half-weight
};
const CLASS_LABEL = {
  bench_measured: "measured", field: "field", literature: "literature",
  imported: "imported", inferred: "inferred",
};

export default function SpeciesChainBar({ speciesId }) {
  const [links, setLinks] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (!speciesId) return undefined;
    supabase.rpc("get_species_chain", { p_species_id: speciesId }).then(({ data }) => {
      if (!cancelled) setLinks(Array.isArray(data) ? data : []);
    });
    return () => { cancelled = true; };
  }, [speciesId]);

  if (!links || links.length === 0) return null;

  const evidenced = links.filter((l) => l.fill_state !== "empty").length;
  // the break = the first link going down the value chain that is not evidenced
  const breakLink = links.find((l) => l.fill_state === "empty");

  return (
    <section style={{
      border: "1px solid var(--gx-card-border)", borderRadius: 12,
      background: "var(--gx-card-bg)", padding: "14px 16px", marginBottom: 16,
    }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
        <div className="gx-overline">Knowledge chain</div>
        <div style={{ fontSize: 11, color: "var(--gx-ink-muted)" }}>
          <span style={{ fontFamily: "var(--gx-font-mono)", fontWeight: 700, color: "var(--gx-ink-soft)" }}>{evidenced}/6</span> links evidenced
          {breakLink && (
            <>
              {" · breaks at "}
              <span style={{ fontWeight: 700, color: "#A32D2D" }}>{breakLink.label}</span>
            </>
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "stretch", gap: 0 }}>
        {links.map((l, i) => {
          const filled = l.fill_state !== "empty";
          const color = CLASS_COLOR[l.evidence_class] || "var(--gx-ink-faint)";
          const strength = Number(l.fill_strength) || 0;
          return (
            <div key={l.link} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "stretch" }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <div
                  title={filled
                    ? `${l.label}: evidenced (${CLASS_LABEL[l.evidence_class] || l.evidence_class})`
                    : `${l.label}: empty — an opening`}
                  style={{
                    flex: 1, height: 10, borderRadius: 3,
                    background: filled ? color : "transparent",
                    border: filled ? "none" : "1.5px dashed var(--gx-card-border)",
                    opacity: filled ? Math.max(0.55, strength) : 1,
                  }}
                />
                {/* connector / break between links */}
                {i < links.length - 1 && (
                  <div style={{
                    width: 6, height: 2,
                    background: (filled && links[i + 1].fill_state !== "empty")
                      ? "var(--gx-border)" : "transparent",
                  }} />
                )}
              </div>
              <div style={{
                fontSize: 8.5, marginTop: 5, letterSpacing: 0.2, textAlign: "center",
                color: filled ? "var(--gx-ink-soft)" : "var(--gx-ink-faint)",
                fontWeight: filled ? 600 : 400,
              }}>
                {l.label}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: 10, color: "var(--gx-ink-faint)", marginTop: 9, lineHeight: 1.5 }}>
        Each link is filled only by real evidence; an empty link is an open
        contribution. A chain is only as complete as its weakest link.
      </div>
    </section>
  );
}
