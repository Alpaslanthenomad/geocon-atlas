"use client";
// Admin ops snapshot tiles — IUCN coverage, edit queue, accreditation
// backlog, ORCID adoption. Calls get_admin_ops_snapshot (admin-only).
// Auto-hides for non-admin viewers.

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";

export default function AdminOpsTiles() {
  const { profile } = useAuthContext();
  const isAdmin = profile?.role === "admin";
  const [snap, setSnap] = useState(null);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.rpc("get_admin_ops_snapshot");
        if (!cancelled && !error) setSnap(data || null);
      } catch { /* silent */ }
    })().catch(() => {});
    return () => { cancelled = true; };
  }, [isAdmin]);

  if (!isAdmin || !snap) return null;

  const iucnCoverage = snap.species_total
    ? Math.round((snap.species_iucn_set / snap.species_total) * 1000) / 10
    : 0;
  const orcidCoverage = snap.researchers_total
    ? Math.round((snap.researchers_with_orcid / snap.researchers_total) * 1000) / 10
    : 0;
  const pubCoverage = snap.publications_total
    ? Math.round((snap.publications_categorized / snap.publications_total) * 1000) / 10
    : 0;
  const metCoverage = snap.metabolites_total
    ? Math.round((snap.metabolites_classified / snap.metabolites_total) * 1000) / 10
    : 0;

  return (
    <section style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
      gap: 10, marginTop: 14,
    }}>
      <Tile
        icon="🛡"
        label="IUCN coverage"
        value={`${iucnCoverage}%`}
        sub={`${snap.species_iucn_set.toLocaleString()} / ${snap.species_total.toLocaleString()} · ${snap.species_iucn_unset.toLocaleString()} unset`}
        tint="var(--gx-danger)"
      />
      <Tile
        icon="✎"
        label="Edit proposals"
        value={snap.edit_proposals_pending}
        sub={`${snap.edit_proposals_accepted} accepted · ${snap.edit_proposals_rejected} rejected`}
        tint={snap.edit_proposals_pending > 0 ? "var(--gx-warning)" : "var(--gx-success)"}
      />
      <Tile
        icon="🏢"
        label="Accreditations pending"
        value={snap.org_accreditations_pending}
        sub="Organizations waiting"
        tint={snap.org_accreditations_pending > 0 ? "var(--gx-warning)" : "var(--gx-success)"}
      />
      <Tile
        icon="✦"
        label="ORCID adoption"
        value={`${orcidCoverage}%`}
        sub={`${snap.researchers_with_orcid.toLocaleString()} of ${snap.researchers_total.toLocaleString()} researchers · ${snap.researchers_placeholder.toLocaleString()} placeholders`}
        tint="var(--gx-accent-violet)"
      />
      <Tile
        icon="📚"
        label="Programs"
        value={snap.programs_total}
        sub={`${snap.contribution_events_total.toLocaleString()} contribution events`}
        tint="var(--gx-accent-azure)"
      />
      <Tile
        icon="📄"
        label="Pub categories"
        value={`${pubCoverage}%`}
        sub={`${(snap.publications_categorized ?? 0).toLocaleString()} of ${(snap.publications_total ?? 0).toLocaleString()} · ${(snap.publications_uncategorized ?? 0).toLocaleString()} uncategorized`}
        tint="var(--gx-info)"
      />
      <Tile
        icon="🧪"
        label="Metabolite class"
        value={`${metCoverage}%`}
        sub={`${(snap.metabolites_classified ?? 0).toLocaleString()} of ${(snap.metabolites_total ?? 0).toLocaleString()} · ${(snap.metabolites_weak_label ?? 0).toLocaleString()} weak`}
        tint="var(--gx-warning)"
      />
    </section>
  );
}

function Tile({ icon, label, value, sub, tint }) {
  return (
    <div style={{
      padding: 14,
      background: "var(--gx-surface)",
      border: "1px solid var(--gx-border-soft)",
      borderRadius: 12,
      borderLeft: `3px solid ${tint}`,
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ fontSize: 16 }} aria-hidden>{icon}</span>
        <div className="gx-overline">{label}</div>
      </div>
      <div style={{
        fontFamily: "var(--gx-font-display)",
        fontSize: 26, fontWeight: 700, color: "var(--gx-ink)",
        letterSpacing: "-0.02em", lineHeight: 1, marginTop: 6,
      }}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {sub && (
        <div style={{ fontSize: 10, color: "var(--gx-ink-muted)", marginTop: 6, lineHeight: 1.5 }}>
          {sub}
        </div>
      )}
    </div>
  );
}
