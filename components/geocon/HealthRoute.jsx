"use client";
// /geocon/admin/health — admin-only health snapshot.
// Top-line counts, data-coverage %, recent activity, integrity checks.

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";

export default function HealthRoute() {
  const { user, profile } = useAuthContext();
  const isAdmin = profile?.role === "admin";

  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true); setErr(null);
    try {
      const { data, error } = await supabase.rpc("get_admin_health_snapshot");
      if (error) throw error;
      setData(data || null);
    } catch (e) {
      setErr(e?.message || "Could not load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  if (!user) return <Gate>Sign in via BEE.</Gate>;
  if (!isAdmin) return <Gate>Admin role required.</Gate>;
  if (loading) return <Loading />;
  if (err) return <Gate tone="error">{err}</Gate>;
  if (!data) return <Gate>No data.</Gate>;

  const c = data.counts || {};
  const cov = data.coverage || {};
  const r = data.recent || {};
  const integ = data.integrity || {};

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", paddingBottom: 40 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <h1 style={{ fontFamily: "var(--gx-font-serif)", fontSize: 28, fontWeight: 700, color: "var(--gx-ink)", margin: 0 }}>
            🩺 Atlas health
          </h1>
          <div style={{ fontSize: 11, color: "var(--gx-ink-muted)", marginTop: 4 }}>
            Snapshot as of {new Date(data.as_of).toLocaleString()}
          </div>
        </div>
        <button
          onClick={load}
          className="gx-btn"
          style={{ padding: "8px 14px", fontSize: 11, fontWeight: 700, background: "var(--gx-accent-bio-green)", color: "#fff", border: "none", borderRadius: 7, cursor: "pointer" }}
        >
          ↻ Refresh
        </button>
      </div>

      <Section title="Catalog">
        <Grid>
          <Stat label="Species"            value={c.species} />
          <Stat label="With photo"         value={c.species_with_photo} sub={cov.species_with_photo_pct != null ? `${cov.species_with_photo_pct}% covered` : null} tint="var(--gx-accent-bio-green)" />
          <Stat label="Threatened (CR/EN/VU)" value={c.species_threat} tint="#A32D2D" />
          <Stat label="Families"           value={c.families} />
          <Stat label="Genera"             value={c.genera} />
          <Stat label="Metabolites"        value={c.metabolites} />
          <Stat label="Publications"       value={c.publications} />
        </Grid>
      </Section>

      <Section title="People & places">
        <Grid>
          <Stat label="Profiles (BEE)"     value={c.profiles} />
          <Stat label="Researchers"        value={c.researchers} />
          <Stat label="Organizations"      value={c.organizations} />
          <Stat label="Active memberships" value={c.org_memberships} />
        </Grid>
      </Section>

      <Section title="Activity surface">
        <Grid>
          <Stat label="Programs"           value={c.programs} />
          <Stat label="Open proposals"     value={c.proposals_open} tint="var(--gx-accent-bee-warm)" />
          <Stat label="Field obs"          value={c.field_obs} />
          <Stat label="Threads"            value={c.entity_threads} />
          <Stat label="Messages"           value={c.entity_messages} />
          <Stat label="API keys"           value={c.api_keys} />
          <Stat label="Push subscriptions" value={c.push_subs} />
        </Grid>
      </Section>

      <Section title="Domain depth (Phase 3 tables)">
        <Grid>
          <Stat label="Phenology rows"     value={c.phenology_rows} sub={c.phenology_rows === 0 ? "seed me!" : null} />
          <Stat label="Accessions"         value={c.accessions} sub={c.accessions === 0 ? "seed me!" : null} />
          <Stat label="Seed lots"          value={c.seed_lots} sub={c.seed_lots === 0 ? "seed me!" : null} />
          <Stat label="Propagation protocols" value={c.protocols} sub={c.protocols === 0 ? "seed me!" : null} />
        </Grid>
      </Section>

      <Section title="Last 24 hours">
        <Grid>
          <Stat label="New profiles"       value={r.profiles_24h} />
          <Stat label="New messages"       value={r.messages_24h} />
          <Stat label="New proposals"      value={r.proposals_24h} />
          <Stat label="New programs"       value={r.programs_24h} />
          <Stat label="New observations"   value={r.observations_24h} />
        </Grid>
      </Section>

      <Section title="Data coverage">
        <CoverageBar label="With family"  value={cov.species_with_family}  total={c.species} />
        <CoverageBar label="With IUCN"    value={cov.species_with_iucn}    total={c.species} />
        <CoverageBar label="With country" value={cov.species_with_country} total={c.species} />
        <CoverageBar label="With photo"   value={c.species_with_photo}     total={c.species} />
      </Section>

      {Array.isArray(data.iucn_breakdown) && data.iucn_breakdown.length > 0 && (
        <Section title="IUCN tier breakdown">
          <div style={{ padding: 16, background: "var(--gx-surface)", border: "1px solid var(--gx-border)", borderRadius: 12 }}>
            <div style={{ fontSize: 11, color: "var(--gx-ink-muted)", marginBottom: 10, fontStyle: "italic" }}>
              Of {Number(c.species || 0).toLocaleString()} catalogued species, only{" "}
              <strong>{Number(cov.species_with_iucn || 0).toLocaleString()}</strong>{" "}
              have a published IUCN status — the rest are taxonomic stubs awaiting evaluation.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {data.iucn_breakdown.map((r) => (
                <CoverageBar key={r.tier} label={r.tier} value={r.n} total={c.species} />
              ))}
            </div>
          </div>
        </Section>
      )}

      <Section title="Integrity checks">
        <Grid>
          <Stat label="Orphan programs"     value={integ.orphan_programs}     tint={integ.orphan_programs     ? "#A32D2D" : "var(--gx-ink-muted)"} />
          <Stat label="Orphan metabolites"  value={integ.orphan_metabolites}  tint={integ.orphan_metabolites  ? "#A32D2D" : "var(--gx-ink-muted)"} />
          <Stat label="Orphan publications" value={integ.orphan_publications} tint={integ.orphan_publications ? "#A32D2D" : "var(--gx-ink-muted)"} />
        </Grid>
      </Section>

      <div style={{ marginTop: 24, padding: 14, background: "var(--gx-surface-2)", border: "1px solid var(--gx-border-soft)", borderRadius: 10, fontSize: 11, color: "var(--gx-ink-muted)", lineHeight: 1.6 }}>
        Errors & per-user traces live in Sentry · Engagement analytics in PostHog.
        Add <code>NEXT_PUBLIC_SENTRY_DSN</code> and <code>NEXT_PUBLIC_POSTHOG_KEY</code>{" "}
        to Vercel env vars to activate either.
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
        <Link href="/geocon/admin" style={linkBtn}>← Admin home</Link>
        <Link href="/geocon/programs/analytics" style={linkBtn}>Program fleet analytics</Link>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 20 }}>
      <h2 style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--gx-ink-muted)", margin: "0 0 10px" }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Grid({ children }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
      {children}
    </div>
  );
}

function Stat({ label, value, sub, tint }) {
  return (
    <div style={{ padding: 14, background: "var(--gx-surface)", border: "1px solid var(--gx-border)", borderRadius: "var(--gx-radius-3)" }}>
      <div style={{
        fontFamily: "var(--gx-font-display)",
        fontSize: 26,
        fontWeight: 900,
        color: tint || "var(--gx-ink)",
        letterSpacing: -1,
        lineHeight: 1,
      }}>
        {value == null ? "—" : Number(value).toLocaleString()}
      </div>
      <div style={{ fontSize: 10, color: "var(--gx-ink-muted)", marginTop: 6, fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase" }}>
        {label}
      </div>
      {sub && (
        <div style={{ fontSize: 9, color: "var(--gx-ink-muted)", marginTop: 4, fontStyle: "italic" }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function CoverageBar({ label, value, total }) {
  const pct = total ? Math.min(100, Math.round((Number(value) / Number(total)) * 100)) : 0;
  const tint = pct >= 90 ? "#0F6E56" : pct >= 50 ? "#BA7517" : "#A32D2D";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
      <div style={{ width: 120, fontSize: 11, color: "var(--gx-ink)", fontWeight: 600 }}>{label}</div>
      <div style={{ flex: 1, height: 14, background: "var(--gx-surface-3)", borderRadius: 7, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: tint, transition: "width 0.4s ease" }} />
      </div>
      <div style={{ width: 110, textAlign: "right", fontSize: 11, color: "var(--gx-ink-muted)", fontFamily: "var(--gx-font-mono)" }}>
        {Number(value || 0).toLocaleString()} / {Number(total || 0).toLocaleString()} ({pct}%)
      </div>
    </div>
  );
}

function Gate({ children, tone }) {
  return (
    <div style={{ maxWidth: 460, margin: "60px auto", padding: 36, background: "var(--gx-surface)", border: "1px solid var(--gx-border)", borderRadius: 12, textAlign: "center" }}>
      <div style={{ fontSize: 13, color: tone === "error" ? "var(--gx-accent-rose)" : "var(--gx-ink-muted)" }}>{children}</div>
    </div>
  );
}
function Loading() {
  return <div style={{ padding: 30, color: "var(--gx-ink-muted)", fontStyle: "italic" }}>Loading health snapshot…</div>;
}

const linkBtn = {
  padding: "7px 12px",
  fontSize: 11,
  fontWeight: 700,
  background: "var(--gx-surface)",
  color: "var(--gx-ink-soft)",
  border: "1px solid var(--gx-border-soft)",
  borderRadius: 7,
  textDecoration: "none",
};
