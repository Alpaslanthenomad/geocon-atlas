"use client";
// A compact, label-less chain-maturity strip for the SOURCE species of a
// commercialized outcome / bridge opportunity. Read-only across the firewall:
// it reads get_species_chain (conservation data) and shows maturity as evidence
// — it never writes back, and carries no price/deal data. This is the
// chain -> commerce provenance link (Bahçe Ring 1). Label-less on purpose so it
// does not commit to the (still-deferred) spine vocabulary.

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const CLASS_COLOR = {
  bench_measured: "#0F6E56", field: "#1D9E75", literature: "#185FA5",
  imported: "#BA7517", inferred: "#9AA5AD",
};

export default function ChainReadinessStrip({ speciesId, caption = "Source-species chain maturity (read-only)" }) {
  const [links, setLinks] = useState(null);

  useEffect(() => {
    let on = true;
    if (!speciesId) return undefined;
    supabase.rpc("get_species_chain", { p_species_id: speciesId }).then(({ data }) => {
      if (on) setLinks(Array.isArray(data) ? data : []);
    }).catch(() => { if (on) setLinks([]); });
    return () => { on = false; };
  }, [speciesId]);

  if (!links || !links.length) return null;
  const evidenced = links.filter((l) => l.fill_state !== "empty").length;
  const pct = Math.round((evidenced / links.length) * 100);

  return (
    <div style={{ marginTop: 8 }} title={`${evidenced}/${links.length} chain links evidenced for the source species`}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ display: "flex", gap: 2, flex: 1 }}>
          {links.map((l) => {
            const filled = l.fill_state !== "empty";
            return (
              <div key={l.link} style={{
                flex: 1, height: 5, borderRadius: 2,
                background: filled ? (CLASS_COLOR[l.evidence_class] || "#9AA5AD") : "transparent",
                border: filled ? "none" : "1px dashed var(--gx-card-border)",
                opacity: filled ? Math.max(0.55, Number(l.fill_strength) || 0) : 1,
              }} />
            );
          })}
        </div>
        <span style={{ fontSize: 9, fontFamily: "var(--gx-font-mono)", color: "var(--gx-ink-muted)", minWidth: 26, textAlign: "right" }}>{pct}%</span>
      </div>
      <div style={{ fontSize: 8.5, color: "var(--gx-ink-faint)", marginTop: 3, letterSpacing: 0.3 }}>{caption}</div>
    </div>
  );
}
