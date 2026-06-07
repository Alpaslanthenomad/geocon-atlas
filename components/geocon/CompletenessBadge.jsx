"use client";
// Data Integrity DI-3 — record completeness indicator on species detail.
//
// Honest transparency: shows how complete THIS record is + which fields
// are missing, and invites the user to help fill the gaps. Stubs are
// labelled as stubs (not hidden) — an upper-segment product shows what
// it doesn't know. Turns a passive reader into a potential contributor.

import { useEffect, useState } from "react";
import { Gauge, AlertTriangle, CheckCircle2, PencilLine } from "lucide-react";
import { supabase } from "../../lib/supabase";

const FIELD_LABEL = {
  family: "Family", genus: "Genus", authority: "Authority",
  iucn_status: "IUCN status", native_countries: "Native countries",
  geophyte_type: "Geophyte type", discovery_year: "Discovery year",
  endemic: "Endemic flag",
};

export default function CompletenessBadge({ speciesId }) {
  const [d, setD] = useState(null);

  useEffect(() => {
    if (!speciesId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.rpc("species_completeness", { p_id: speciesId });
      if (!cancelled) setD(data || null);
    })();
    return () => { cancelled = true; };
  }, [speciesId]);

  if (!d) return null;

  const score = d.score || 0;
  const isStub = d.is_stub;
  const missing = Array.isArray(d.missing) ? d.missing : [];
  const tint = score >= 70 ? "var(--gx-success)" : score >= 45 ? "var(--gx-warning)" : "var(--gx-danger)";
  const Icon = score >= 70 ? CheckCircle2 : AlertTriangle;

  return (
    <div style={{
      marginTop: 12, padding: "10px 12px",
      background: "var(--gx-surface-2)",
      border: `1px solid color-mix(in srgb, ${tint} 30%, var(--gx-border-soft))`,
      borderRadius: 9,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <Icon size={13} strokeWidth={2} style={{ color: tint, flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--gx-ink)" }}>
          Record {score}% complete
        </span>
        {isStub && (
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase",
            padding: "2px 7px", borderRadius: 999,
            background: "var(--gx-warning-soft)", color: "var(--gx-warning)",
            fontFamily: "var(--gx-font-mono)",
          }}>
            stub record
          </span>
        )}
        {/* mini progress */}
        <div style={{ flex: 1, minWidth: 80, height: 6, background: "var(--gx-surface-3)", borderRadius: 999, overflow: "hidden" }}>
          <div style={{ width: `${score}%`, height: "100%", background: tint, borderRadius: 999 }} />
        </div>
      </div>

      {missing.length > 0 && (
        <div style={{ marginTop: 8, fontSize: 11, color: "var(--gx-ink-soft)", lineHeight: 1.5 }}>
          Eksik:{" "}
          {missing.map((m, i) => (
            <span key={m}>
              <span style={{ color: "var(--gx-ink-muted)", fontWeight: 600 }}>{FIELD_LABEL[m] || m}</span>
              {i < missing.length - 1 ? ", " : ""}
            </span>
          ))}
          {". "}
          <a href="#edit" style={{
            color: "var(--gx-accent-azure)", fontWeight: 600, textDecoration: "none",
            display: "inline-flex", alignItems: "center", gap: 3,
          }}>
            <PencilLine size={10} strokeWidth={2} /> Bilgi ekle
          </a>
        </div>
      )}
    </div>
  );
}
