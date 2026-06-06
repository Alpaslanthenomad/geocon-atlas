"use client";
// v5.4-b — Cross-species outcome timeline.
//
// /geocon/outcomes/timeline — every commercialized_outcomes row across
// species, grouped by month with a verification-tier chip on each card.
// Acts as a "what happened on the platform this year" reel for partners,
// funders, and IUCN reviewers.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Award, ExternalLink, Building2, ArrowLeft } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { SkeletonList } from "../shared/Skeleton";

const VERIFICATION_META = {
  self_declared:    { label: "Self-declared",   tint: "var(--gx-ink-muted)" },
  peer_endorsed:    { label: "Peer-endorsed",   tint: "var(--gx-accent-azure)" },
  org_declared:     { label: "Org-declared",    tint: "var(--gx-accent-violet)" },
  venn_verified:    { label: "Venn-verified",   tint: "var(--gx-success)" },
};

const KIND_LABEL = {
  pharma:      "Pharmaceutical",
  cosmetic:    "Cosmetic",
  agriculture: "Agricultural",
  policy:      "Policy adoption",
  cultivar:    "Cultivar",
  patent:      "Patent (ex-platform)",
  product:     "Commercial product",
  service:     "Service",
  conservation:"Conservation action",
};

export default function OutcomeTimelineRoute() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifFilter, setVerifFilter] = useState([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase.rpc("get_outcome_timeline", { p_limit: 200 });
      setRows(Array.isArray(data) ? data : []);
      setLoading(false);
    })();
  }, []);

  const visible = useMemo(() => {
    if (verifFilter.length === 0) return rows;
    return rows.filter((r) => verifFilter.includes(r.verification));
  }, [rows, verifFilter]);

  const groups = useMemo(() => {
    const out = new Map();
    for (const r of visible) {
      const dt = new Date(r.event_at);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      const label = dt.toLocaleString(undefined, { month: "long", year: "numeric" });
      if (!out.has(key)) out.set(key, { label, rows: [] });
      out.get(key).rows.push(r);
    }
    return Array.from(out.values());
  }, [visible]);

  function toggleVerif(v) {
    setVerifFilter((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]);
  }

  return (
    <main style={{ maxWidth: 880, margin: "0 auto", padding: "20px 16px 60px" }}>
      <Link href="/geocon/outcomes" style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        fontSize: 11, color: "var(--gx-ink-soft)", textDecoration: "none", marginBottom: 14,
      }}>
        <ArrowLeft size={11} strokeWidth={2} /> Outcomes overview
      </Link>

      <header style={{ marginBottom: 16 }}>
        <div className="gx-overline">Commercialization recognition</div>
        <h1 style={{
          fontFamily: "var(--gx-font-display)",
          fontSize: 28, fontWeight: 700, color: "var(--gx-ink)",
          letterSpacing: "-0.02em", margin: "2px 0 6px 0",
          display: "inline-flex", alignItems: "center", gap: 8,
        }}>
          <Award size={20} strokeWidth={1.85} style={{ color: "var(--gx-accent-violet)" }} />
          Outcome timeline
        </h1>
        <p style={{ fontSize: 12, color: "var(--gx-ink-muted)", lineHeight: 1.55, maxWidth: 580 }}>
          Tüm türlerin commercialization + conservation outcome'ları, ay
          ay sıralı. Verification tier chip'leri her kartın üstünde
          görünür — verification ladder (self-declared → peer-endorsed
          → org-declared → venn-verified).
        </p>
      </header>

      {/* Filter chips */}
      <div style={{
        display: "flex", gap: 5, flexWrap: "wrap",
        padding: 10, marginBottom: 14,
        background: "var(--gx-card-bg)",
        border: "1px solid var(--gx-card-border)",
        borderRadius: 10,
      }}>
        {Object.entries(VERIFICATION_META).map(([k, m]) => {
          const on = verifFilter.includes(k);
          return (
            <button key={k} onClick={() => toggleVerif(k)}
              style={{
                fontSize: 10, fontWeight: 700, letterSpacing: 0.3,
                padding: "4px 11px", borderRadius: 999,
                background: on ? m.tint : "transparent",
                color: on ? "#fff" : m.tint,
                border: `1px solid ${m.tint}`,
                cursor: "pointer",
              }}>
              {m.label}
            </button>
          );
        })}
        {verifFilter.length > 0 && (
          <button onClick={() => setVerifFilter([])}
            style={{
              fontSize: 10, fontWeight: 600, color: "var(--gx-ink-muted)",
              background: "transparent", border: "none",
              marginLeft: "auto", cursor: "pointer", textDecoration: "underline",
            }}>
            Clear
          </button>
        )}
      </div>

      {/* Timeline */}
      {loading ? <SkeletonList rows={8} rowHeight={70} /> : (
        groups.length === 0 ? <Empty /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            {groups.map((g) => (
              <MonthGroup key={g.label} label={g.label} rows={g.rows} />
            ))}
          </div>
        )
      )}
    </main>
  );
}

function MonthGroup({ label, rows }) {
  return (
    <section>
      <div style={{
        position: "sticky", top: 60, zIndex: 2,
        padding: "6px 0 8px",
        background: "linear-gradient(180deg, var(--gx-surface) 0%, color-mix(in srgb, var(--gx-surface) 92%, transparent) 100%)",
        marginBottom: 8,
      }}>
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase",
          color: "var(--gx-accent-violet)",
          fontFamily: "var(--gx-font-mono)",
        }}>
          {label} · {rows.length}
        </div>
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        {rows.map((r) => <OutcomeRow key={r.id} row={r} />)}
      </ul>
    </section>
  );
}

function OutcomeRow({ row }) {
  const v = VERIFICATION_META[row.verification] || VERIFICATION_META.self_declared;
  return (
    <li style={{
      padding: 11,
      background: "var(--gx-card-bg)",
      border: "1px solid var(--gx-card-border)",
      borderRadius: 9,
      borderLeft: `3px solid ${v.tint}`,
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase",
          padding: "2px 7px", borderRadius: 999,
          background: `color-mix(in srgb, ${v.tint} 18%, transparent)`,
          color: v.tint,
          fontFamily: "var(--gx-font-mono)",
        }}>
          {v.label}
        </span>
        {row.outcome_kind && (
          <span style={{ fontSize: 10, color: "var(--gx-ink-muted)" }}>
            {KIND_LABEL[row.outcome_kind] || row.outcome_kind}
          </span>
        )}
        {row.endorsement_count > 0 && (
          <span style={{ fontSize: 10, color: "var(--gx-accent-azure)", fontWeight: 700 }}>
            ★ {row.endorsement_count}
          </span>
        )}
        <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--gx-ink-muted)" }}>
          {row.event_at ? new Date(row.event_at).toLocaleDateString() : ""}
        </span>
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gx-ink)", marginBottom: 4 }}>
        {row.title || "(Untitled outcome)"}
      </div>

      {row.species_id && row.species_name && (
        <div style={{
          fontSize: 11, color: "var(--gx-ink-soft)",
          display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap",
        }}>
          <Link href={`/geocon/species/${encodeURIComponent(row.species_id)}`}
            style={{
              fontFamily: "var(--gx-font-serif)", fontStyle: "italic",
              color: "var(--gx-accent-azure)", fontWeight: 600,
              textDecoration: "none",
            }}>
            {row.species_name}
          </Link>
          {row.family && <span>· {row.family}</span>}
          {row.iucn_status && (
            <span style={{
              fontSize: 9, fontWeight: 700,
              padding: "1px 5px", borderRadius: 999,
              background: "var(--gx-surface-3)", color: "var(--gx-ink-soft)",
              fontFamily: "var(--gx-font-mono)",
            }}>
              {row.iucn_status}
            </span>
          )}
        </div>
      )}

      {row.org_name && (
        <div style={{ fontSize: 11, color: "var(--gx-ink-muted)", marginTop: 3, display: "inline-flex", alignItems: "center", gap: 4 }}>
          <Building2 size={9} strokeWidth={2} />
          <Link href={`/geocon/organizations/${row.org_id}`}
            style={{ color: "inherit", textDecoration: "none" }}>
            {row.org_name}
          </Link>
        </div>
      )}

      {row.external_url && (
        <a href={row.external_url} target="_blank" rel="noopener noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: 3,
            fontSize: 10, color: "var(--gx-accent-azure)", fontWeight: 600,
            textDecoration: "none", marginTop: 4,
          }}>
          <ExternalLink size={9} strokeWidth={2.2} />
          External link
        </a>
      )}
    </li>
  );
}

function Empty() {
  return (
    <div style={{
      padding: 30, textAlign: "center",
      background: "var(--gx-surface-2)",
      border: "1px dashed var(--gx-border-soft)",
      borderRadius: 10,
      color: "var(--gx-ink-muted)", fontSize: 12, lineHeight: 1.5,
    }}>
      Filtre kriterlerine uyan outcome yok.
    </div>
  );
}
