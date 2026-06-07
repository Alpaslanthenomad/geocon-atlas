"use client";
// DI-6 — native distribution (POWO/Kew, authoritative TDWG regions).
//
// Shows the species' native range as WGSRPD botanical regions exactly
// as Kew's Plants of the World Online asserts them — more precise than
// ISO countries (e.g. "Cape Provinces" not just "South Africa"). ISO2
// conversion is a separate gated step (STAGE-GATES.md); until then we
// show the authoritative truth and never guess a country.

import { useEffect, useState } from "react";
import { Globe2 } from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function NativeRegions({ speciesId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!speciesId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.rpc("list_species_native_regions", { p_species_id: speciesId });
      if (!cancelled) { setRows(Array.isArray(data) ? data : []); setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [speciesId]);

  if (loading || rows.length === 0) return null;

  return (
    <section style={{
      marginTop: 16, padding: "var(--gx-card-pad)",
      background: "var(--gx-card-bg)",
      border: "1px solid var(--gx-card-border)",
      borderRadius: "var(--gx-card-radius)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 9 }}>
        <Globe2 size={14} strokeWidth={1.85} style={{ color: "var(--gx-success)" }} />
        <div>
          <div className="gx-overline" style={{ marginBottom: 0 }}>Native distribution</div>
          <h3 style={{ fontFamily: "var(--gx-font-display)", fontSize: 14, fontWeight: 700, color: "var(--gx-ink)", margin: 0 }}>
            {rows.length} native region{rows.length === 1 ? "" : "s"}
          </h3>
        </div>
      </div>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        {rows.map((r) => (
          <span key={r.region_name}
            title={r.tdwg_code ? `WGSRPD ${r.tdwg_code}` : undefined}
            style={{
              fontSize: 11, fontWeight: 600,
              padding: "4px 10px", borderRadius: 999,
              background: "color-mix(in srgb, var(--gx-success) 12%, var(--gx-surface-2))",
              color: "var(--gx-ink)",
              border: "1px solid color-mix(in srgb, var(--gx-success) 25%, transparent)",
            }}>
            {r.region_name}
          </span>
        ))}
      </div>
      <div style={{ fontSize: 9, color: "var(--gx-ink-faint)", marginTop: 9, fontStyle: "italic" }}>
        Source: POWO / Kew (WGSRPD botanical regions, native only). ISO country
        mapping is a later step — botanical regions are the more precise truth.
      </div>
    </section>
  );
}
