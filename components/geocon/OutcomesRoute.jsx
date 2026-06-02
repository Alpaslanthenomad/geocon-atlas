"use client";
// /geocon/outcomes — public discovery feed for commercialized outcomes.
//
// Surfaces L5 recognition: products / publications / cultivars / partnerships
// that have been declared (and ideally endorsed) as outcomes of a program.
// Verification ladder filter at the top — toggling raises the bar
// (self_declared → peer_endorsed → org_declared → venn_verified).
//
// Public route — anyone can read this. Read-only.

import { useEffect, useState } from "react";
import Link from "next/link";
import { Award, ExternalLink, ShieldCheck } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { EmptyState } from "../shared";
import FilterBar from "../shared/FilterBar";

const TIERS = [
  { key: null,             label: "All",               tint: "var(--gx-ink-muted)" },
  { key: "self_declared",  label: "Self-declared+",    tint: "var(--gx-ink-soft)" },
  { key: "peer_endorsed",  label: "Peer-endorsed+",    tint: "var(--gx-info)" },
  { key: "org_declared",   label: "Org-declared+",     tint: "var(--gx-accent-violet)" },
  { key: "venn_verified",  label: "Venn-verified",     tint: "var(--gx-success)" },
];

const KIND_LABELS = {
  product:          "Product",
  cultivar:         "Cultivar",
  publication:      "Publication",
  partnership:      "Partnership",
  service:          "Service",
  open_source:      "Open source release",
  protocol:         "Protocol",
};

export default function OutcomesRoute() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase.rpc("list_public_outcomes", {
        p_limit: 100, p_offset: 0, p_min_verification: tier, p_outcome_kind: null,
      });
      if (cancelled) return;
      if (!error) setRows(Array.isArray(data) ? data : []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [tier]);

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto" }}>
      <header style={{ marginBottom: 18 }}>
        <div className="gx-overline" style={{ marginBottom: 4 }}>Commons</div>
        <h1 className="gx-h1" style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          Outcomes
          <span style={{ fontSize: 13, color: "var(--gx-ink-muted)", fontWeight: 400, fontFamily: "var(--gx-font-mono)" }}>
            {loading ? "…" : rows.length}
          </span>
        </h1>
        <p style={{ fontSize: 12, color: "var(--gx-ink-muted)", marginTop: 4, lineHeight: 1.5, maxWidth: 720 }}>
          GEOCON programlarından doğan ürünler, yayınlar, çeşit kayıtları,
          işbirlikleri. Doğrulama merdiveni: kendi-beyan → meslektaş onayı →
          kuruluş beyanı → Venn doğrulaması.
        </p>
        <div style={{ marginTop: 14 }}>
          <FilterBar
            allLabel="All tiers"
            value={tier}
            onChange={setTier}
            options={TIERS.filter((t) => t.key).map((t) => ({
              key: t.key, label: t.label.replace(/\+$/, ""), tint: t.tint,
            }))}
          />
        </div>
      </header>

      {loading ? (
        <div style={{ padding: 30, textAlign: "center", color: "var(--gx-ink-muted)", fontSize: 12 }}>Loading…</div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon="○"
          title={tier ? "Bu doğrulama tier'ında outcome yok" : "Henüz outcome yok"}
          hint="Outcome'lar program tamamlandıkça buraya akacak. Tüm outcome'lar herkese açık."
        />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
          {rows.map((r) => <OutcomeCard key={r.id} row={r} />)}
        </div>
      )}
    </div>
  );
}

function OutcomeCard({ row }) {
  const tier = TIERS.find((t) => t.key === row.verification) || TIERS[1];
  return (
    <article style={{
      padding: "var(--gx-card-pad-sm)",
      background: "var(--gx-card-bg)",
      border: "1px solid var(--gx-card-border)",
      borderRadius: "var(--gx-card-radius)",
      display: "flex", flexDirection: "column", gap: 8,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase",
          padding: "2px 7px", borderRadius: 999,
          background: "var(--gx-surface-2)", color: "var(--gx-ink-soft)",
          fontFamily: "var(--gx-font-mono)",
        }}>
          {KIND_LABELS[row.outcome_kind] || row.outcome_kind}
        </span>
        <span title={`Verification: ${row.verification}`}
          style={{
            fontSize: 9, fontWeight: 700, letterSpacing: 0.4,
            padding: "2px 7px", borderRadius: 999,
            background: `color-mix(in srgb, ${tier.tint} 14%, transparent)`,
            color: tier.tint,
            display: "inline-flex", alignItems: "center", gap: 4,
            fontFamily: "var(--gx-font-mono)",
          }}>
          <ShieldCheck size={10} strokeWidth={2.2} />
          {tier.label.replace(/\+$/, "")}
        </span>
        {row.endorsement_count > 0 && (
          <span style={{
            fontSize: 9, fontWeight: 700,
            padding: "2px 7px", borderRadius: 999,
            background: "var(--gx-success-soft)", color: "var(--gx-success)",
            fontFamily: "var(--gx-font-mono)",
          }}>
            ★ {row.endorsement_count}
          </span>
        )}
      </div>

      <h3 style={{
        fontFamily: "var(--gx-font-display)",
        fontSize: 16, fontWeight: 700, color: "var(--gx-ink)",
        margin: 0, lineHeight: 1.3,
      }}>
        {row.title}
      </h3>

      {row.description_md && (
        <p style={{
          fontSize: 12, color: "var(--gx-ink-soft)", lineHeight: 1.5,
          margin: 0,
          overflow: "hidden", textOverflow: "ellipsis",
          display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical",
        }}>
          {row.description_md}
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 11, color: "var(--gx-ink-muted)" }}>
        {row.species_name && (
          <Link href={`/geocon/species/${encodeURIComponent(row.species_id)}`}
            style={{ color: "var(--gx-ink-soft)", textDecoration: "none",
                     fontFamily: "var(--gx-font-serif)", fontStyle: "italic" }}>
            🌿 {row.species_name}
          </Link>
        )}
        {row.program_name && (
          <Link href={`/geocon/programs/${encodeURIComponent(row.program_id)}`}
            style={{ color: "var(--gx-ink-soft)", textDecoration: "none" }}>
            📋 {row.program_name}
          </Link>
        )}
        {row.org_name && (
          <Link href={`/geocon/organizations/${encodeURIComponent(row.org_id)}`}
            style={{ color: "var(--gx-ink-soft)", textDecoration: "none" }}>
            🏢 {row.org_name}
          </Link>
        )}
      </div>

      {row.external_url && (
        <a href={row.external_url} target="_blank" rel="noopener noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: 11, fontWeight: 600, color: "var(--gx-accent-azure)",
            textDecoration: "none", marginTop: 2,
          }}>
          <ExternalLink size={11} strokeWidth={1.9} /> Source
        </a>
      )}
    </article>
  );
}
