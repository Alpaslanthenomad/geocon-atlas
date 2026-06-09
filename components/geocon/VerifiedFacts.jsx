"use client";
// components/geocon/VerifiedFacts.jsx
//
// Lead with the moat: surface a species' money-blind Provenance Receipts right on
// its page, so the inimitable asset is visible (not buried in an admin desk). Reads
// the money-free get_species_receipts RPC; renders NOTHING when a species has no
// verified facts yet, so it appears only where a real closed loop exists.

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

function strengthLabel(s) {
  if (s >= 0.9) return "verified";
  if (s >= 0.7) return "strong";
  if (s >= 0.4) return "moderate";
  return "weak";
}

export default function VerifiedFacts({ speciesId }) {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    let on = true;
    supabase.rpc("get_species_receipts", { p_species_id: speciesId })
      .then(({ data }) => { if (on) setRows(Array.isArray(data) ? data : []); })
      .catch(() => { if (on) setRows([]); });
    return () => { on = false; };
  }, [speciesId]);

  if (!rows || rows.length === 0) return null;

  return (
    <div style={{ marginBottom: 18, padding: "16px 18px", borderRadius: 12, background: "var(--gx-surface)", border: "1px solid var(--gx-border-soft)", borderLeft: "3px solid var(--gx-success)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--gx-success)" }}>Verified facts</span>
        <span style={{ fontSize: 10.5, color: "var(--gx-ink-muted)" }}>· money-blind provenance receipts</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rows.map((r) => (
          <a key={r.pid} href={`/receipt/${r.pid}`} target="_blank" rel="noopener noreferrer"
            style={{ textDecoration: "none", display: "block", padding: "11px 13px", borderRadius: 10, background: "var(--gx-surface-sunken, rgba(0,0,0,0.02))", border: "1px solid var(--gx-border-soft)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--gx-ink)" }}>{r.compound || r.node}</span>
              <span style={{ fontSize: 10, color: "var(--gx-ink-muted)", textTransform: "lowercase" }}>{r.node}</span>
            </div>
            {r.activity && <div style={{ fontSize: 12, color: "var(--gx-ink-soft)", marginTop: 3, lineHeight: 1.45 }}>{r.activity}</div>}
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 9.5, fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: "rgba(27,94,32,0.12)", color: "var(--gx-success)" }}>{r.evidence_class} · {strengthLabel(r.strength)}</span>
              {r.doi && <span style={{ fontSize: 10.5, color: "var(--gx-ink-muted)", fontFamily: "ui-monospace, Menlo, Consolas, monospace" }}>DOI:{r.doi}</span>}
              <span style={{ fontSize: 11, color: "var(--gx-success)", fontWeight: 600, marginLeft: "auto" }}>View receipt · cite →</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
