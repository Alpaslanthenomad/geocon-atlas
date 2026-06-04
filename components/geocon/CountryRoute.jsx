"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { countryName } from "../../lib/countryNames";
import { flag, familyTokens } from "../../lib/atlas/format";
import RelatedOpenCalls from "./RelatedOpenCalls";
import EntityDiscussion from "./EntityDiscussion";
import { EmptyState as SharedEmptyState } from "../shared";
import { FamilyDonut } from "../ui";

const IUCN_COLORS = {
  CR: "#FF1744", EN: "#FF9100", VU: "#FFD600",
  NT: "#80CBC4", LC: "#66BB6A", DD: "#B0BEC5", NE: "#78909C",
};
const IUCN_LABEL = {
  CR: "Critically endangered",
  EN: "Endangered",
  VU: "Vulnerable",
  NT: "Near threatened",
  LC: "Least concern",
  DD: "Data deficient",
  NE: "Not evaluated",
};
const MODULE_COLORS = {
  Origin: "#1D9E75", Forge: "#BA7517", Mesh: "#185FA5",
  Exchange: "#D85A30", Accord: "#5F5E5A",
};

export default function CountryRoute({ code }) {
  const iso = (code || "").toUpperCase();
  const [data, setData] = useState(null);
  const [extras, setExtras] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (!iso) return;
    setLoading(true);
    (async () => {
      try {
        const [dashboardResp, extrasResp] = await Promise.all([
          supabase.rpc("get_country_dashboard", { p_country: iso, p_top: 24 }),
          supabase.rpc("get_country_extras",     { p_country: iso }),
        ]);
        if (cancelled) return;
        if (dashboardResp.error) throw dashboardResp.error;
        setData(dashboardResp.data);
        setExtras(extrasResp.data || null);
        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        setError(e.message || "Failed to load");
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [iso]);

  if (loading) return <Skeleton />;
  if (error) return <ErrorBox iso={iso} message={error} />;
  if (!data) return null;

  const summary = data.summary || {};
  const top = data.top || [];
  const programs = data.programs || [];
  const name = countryName(iso);
  const total = summary.total || 0;
  const tierCounts = {
    CR: summary.cr_count || 0,
    EN: summary.en_count || 0,
    VU: summary.vu_count || 0,
    NT: summary.nt_count || 0,
    LC: summary.lc_count || 0,
    DD: summary.dd_count || 0,
    NE: (summary.ne_count || 0) + (summary.null_count || 0),
  };
  const families = summary.family_breakdown || [];

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto" }}>
      <Link href="/geocon/explore" style={{ fontSize: 11, color: "var(--gx-ink-muted)", textDecoration: "none", letterSpacing: 0.5 }}>
        ← Explore
      </Link>

      {/* Hero */}
      <section style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap", marginTop: 12, marginBottom: 14 }}>
        <h1 style={{ fontFamily: "var(--gx-font-serif)", fontSize: 40, fontWeight: 700, color: "var(--gx-ink)", letterSpacing: -1, margin: 0, lineHeight: 1 }}>
          <span style={{ marginRight: 12 }}>{flag(iso)}</span>{name}
        </h1>
        <span style={{ fontSize: 12, color: "var(--gx-ink-muted)", letterSpacing: 1, textTransform: "uppercase", fontWeight: 600 }}>
          {iso}
        </span>
      </section>

      {total === 0 ? (
        <SharedEmptyState
          icon="🗺"
          title={`No species tagged with ${iso} yet`}
          hint="GBIF is still backfilling country distributions — check back as the sync completes."
        />
      ) : (
        <>
          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 20 }}>
            <StatBlock label="Total species" value={total.toLocaleString()} color="var(--gx-ink)" />
            {summary.endemic_count > 0 && (
              <StatBlock label="Endemic" value={summary.endemic_count.toLocaleString()} color="#085041" />
            )}
            {Object.entries(tierCounts).filter(([t, v]) => v > 0).slice(0, 4).map(([t, v]) => (
              <StatBlock key={t} label={t} value={v.toLocaleString()} color={IUCN_COLORS[t]} sub={IUCN_LABEL[t]} />
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20, alignItems: "start" }}>
            <main style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Top species */}
              <Section title={`Highlight species · ${top.length}`}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
                  {top.map((s) => <SpeciesMiniCard key={s.id} s={s} />)}
                </div>
                <div style={{ marginTop: 12, textAlign: "right" }}>
                  <Link
                    href={`/geocon/species?country=${iso}`}
                    style={{ fontSize: 11, color: "#1D9E75", textDecoration: "none", fontWeight: 600 }}
                  >
                    Browse all {total.toLocaleString()} in ATLAS →
                  </Link>
                </div>
              </Section>

              {/* Programs in country */}
              {programs.length > 0 && (
                <Section title={`Programs · ${programs.length}`}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {programs.map((p) => <ProgramRow key={p.id} p={p} />)}
                  </div>
                </Section>
              )}

              {extras?.orgs?.length > 0 && (
                <Section title={`Organizations · ${extras.orgs.length}`}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8 }}>
                    {extras.orgs.map((o) => (
                      <Link key={o.id} href={`/geocon/organizations/${o.id}`}
                        style={{ display: "block", padding: 10, background: "var(--gx-card-bg)", border: "1px solid var(--gx-card-border)", borderRadius: 8, textDecoration: "none", color: "inherit" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--gx-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          🏢 {o.name}
                        </div>
                        <div style={{ fontSize: 10, color: "var(--gx-ink-muted)", marginTop: 2 }}>
                          {o.kind}
                          {o.accreditation_status === "accredited" && (
                            <span style={{ marginLeft: 4, padding: "1px 6px", borderRadius: 4, background: "#0F6E56", color: "#fff", fontSize: 8, fontWeight: 700 }}>
                              ✓ {o.accreditation_level || "accredited"}
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </Section>
              )}

              {extras?.researchers?.length > 0 && (
                <Section title={`Researchers · ${extras.researchers.length}`}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
                    {extras.researchers.map((r) => (
                      <Link key={r.id} href={`/geocon/researchers/${encodeURIComponent(r.id)}`}
                        style={{ display: "block", padding: 10, background: "var(--gx-card-bg)", border: "1px solid var(--gx-card-border)", borderRadius: 8, textDecoration: "none", color: "inherit" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--gx-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          👤 {r.name}
                        </div>
                        <div style={{ fontSize: 10, color: "var(--gx-ink-muted)", marginTop: 2 }}>
                          {r.institution || "—"}
                          {r.h_index != null && <span> · h={r.h_index}</span>}
                        </div>
                      </Link>
                    ))}
                  </div>
                </Section>
              )}

              <RelatedOpenCalls
                rpcName="list_open_proposals_for_country"
                rpcArgs={{ p_country: iso }}
                title={`Open calls from ${name}`}
              />

              <EntityDiscussion
                kind="country"
                entityKey={iso}
                title={`Notes on ${name}`}
              />
            </main>

            <aside style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Tier breakdown */}
              <Card>
                <Heading>IUCN breakdown</Heading>
                <TierBars tierCounts={tierCounts} total={total} />
              </Card>

              {/* Family donut */}
              {families.length > 0 && (
                <Card>
                  <Heading>Family distribution</Heading>
                  <FamilyDonut
                    data={families.map((f) => ({ name: f.family, value: f.count }))}
                    maxSlices={8}
                    height={220}
                  />
                </Card>
              )}

              {/* Family breakdown list */}
              {families.length > 0 && (
                <Card>
                  <Heading>Families · {families.length}</Heading>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {families.slice(0, 10).map((f) => {
                      const tok = familyTokens(f.family);
                      return (
                        <Link
                          key={f.family}
                          href={`/geocon/species?family=${encodeURIComponent(f.family)}&country=${iso}`}
                          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 8px", borderRadius: 6, background: tok.bg, color: tok.text, textDecoration: "none", fontSize: 11, fontWeight: 600 }}
                        >
                          <span>{f.family}</span>
                          <span style={{ opacity: 0.7 }}>{f.count.toLocaleString()}</span>
                        </Link>
                      );
                    })}
                    {families.length > 10 && (
                      <div style={{ fontSize: 10, color: "var(--gx-ink-muted)", marginTop: 4, textAlign: "right" }}>
                        +{families.length - 10} more
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </aside>
          </div>
        </>
      )}
    </div>
  );
}

function StatBlock({ label, value, color, sub }) {
  return (
    <div style={{ background: "var(--gx-card-bg)", border: "1px solid var(--gx-card-border)", borderRadius: 12, padding: "14px 16px" }}>
      <div style={{ fontSize: 9, color: "var(--gx-ink-faint)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: "var(--gx-font-serif)", fontSize: 26, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: "var(--gx-ink-muted)", marginTop: 4, fontStyle: "italic" }}>{sub}</div>}
    </div>
  );
}

function SpeciesMiniCard({ s }) {
  const tier = s.iucn_status;
  const tierColor = IUCN_COLORS[tier];
  const famTok = familyTokens(s.family);
  return (
    <Link
      href={`/geocon/species/${s.id}`}
      style={{
        display: "block",
        background: "var(--gx-card-bg)",
        border: "1px solid var(--gx-card-border)",
        borderTop: `3px solid ${famTok.border}`,
        borderRadius: 8,
        overflow: "hidden",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div style={{ position: "relative", aspectRatio: "1/1", background: "var(--gx-surface-3)", overflow: "hidden" }}>
        {s.thumbnail_url ? (
          <img src={s.thumbnail_url} alt={s.accepted_name} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "var(--gx-ink-faint)", letterSpacing: 1 }}>no image</div>
        )}
        {tier && (
          <span style={{ position: "absolute", top: 6, right: 6, fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 999, background: tierColor, color: "#fff" }}>{tier}</span>
        )}
        {s.endemic && (
          <span style={{ position: "absolute", top: 6, left: 6, fontSize: 8, padding: "2px 5px", borderRadius: 999, background: "rgba(8, 80, 65, 0.85)", color: "#fff", fontWeight: 600 }}>endemic</span>
        )}
      </div>
      <div style={{ padding: "8px 10px" }}>
        <div style={{ fontFamily: "var(--gx-font-serif)", fontStyle: "italic", fontSize: 12, color: "var(--gx-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.15 }}>
          {s.accepted_name}
        </div>
        <div style={{ fontSize: 9, color: "var(--gx-ink-muted)", marginTop: 2 }}>{s.family}</div>
      </div>
    </Link>
  );
}

function ProgramRow({ p }) {
  const mod = MODULE_COLORS[p.current_module] || "#888";
  return (
    <Link
      href={`/geocon/programs/${p.id}`}
      style={{
        display: "block",
        background: "var(--gx-card-bg)",
        border: "1px solid var(--gx-card-border)",
        borderLeft: `4px solid ${mod}`,
        borderRadius: 10,
        padding: "10px 14px",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--gx-ink)" }}>{p.program_name}</div>
      <div style={{ fontSize: 11, color: "#9a978f", marginTop: 2 }}>
        {p.species_name && <span style={{ fontStyle: "italic" }}>{p.species_name}</span>}
        {p.current_module && <span> · {p.current_module}</span>}
        {p.status && <span> · {p.status}</span>}
      </div>
    </Link>
  );
}

function TierBars({ tierCounts, total }) {
  const entries = Object.entries(tierCounts).filter(([, v]) => v > 0);
  if (entries.length === 0) return <div style={{ fontSize: 11, color: "var(--gx-ink-muted)" }}>—</div>;
  const max = Math.max(...entries.map(([, v]) => v));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {entries.map(([tier, count]) => (
        <Link
          key={tier}
          href={`/geocon/species?country=${tierCountsToParam(tierCounts)}`}
          style={{ display: "block", textDecoration: "none" }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, color: "var(--gx-ink-soft)", marginBottom: 3 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: IUCN_COLORS[tier] }} />
              {tier}
            </span>
            <span style={{ color: "var(--gx-ink)", fontWeight: 600 }}>{count.toLocaleString()}</span>
          </div>
          <div style={{ height: 5, background: "var(--gx-surface-3)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(count / max) * 100}%`, background: IUCN_COLORS[tier], borderRadius: 99 }} />
          </div>
        </Link>
      ))}
    </div>
  );
}

function tierCountsToParam() { return ""; } // placeholder for future tier-filter URL

function Section({ title, children }) {
  return (
    <section style={{ background: "var(--gx-card-bg)", border: "1px solid var(--gx-card-border)", borderRadius: 12, padding: 16 }}>
      <h3 style={{ fontFamily: "var(--gx-font-serif)", fontSize: 15, fontWeight: 700, color: "var(--gx-ink)", margin: "0 0 12px" }}>{title}</h3>
      {children}
    </section>
  );
}

function Card({ children }) {
  return (
    <div style={{ background: "var(--gx-card-bg)", border: "1px solid var(--gx-card-border)", borderRadius: 12, padding: 14 }}>
      {children}
    </div>
  );
}

function Heading({ children }) {
  return (
    <div style={{ fontSize: 10, color: "var(--gx-ink-faint)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>{children}</div>
  );
}

function Skeleton() {
  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: 14 }}>
      <div style={{ height: 60, background: "var(--gx-surface-3)", borderRadius: 10, marginBottom: 12, animation: "pulse 1.5s ease-in-out infinite" }} />
      <div style={{ height: 240, background: "var(--gx-surface-3)", borderRadius: 14, animation: "pulse 1.5s ease-in-out infinite" }} />
    </div>
  );
}

function ErrorBox({ iso, message }) {
  return (
    <div style={{ maxWidth: 720, margin: "60px auto", padding: 24, border: "1px solid #FCEBEB", background: "#FFF6F6", borderRadius: 12, color: "#A32D2D" }}>
      <div style={{ fontSize: 13, fontWeight: 600 }}>Couldn't load country {iso}</div>
      <div style={{ fontSize: 12, marginTop: 4 }}>{message}</div>
      <Link href="/geocon/explore" style={{ display: "inline-block", marginTop: 14, fontSize: 12, color: "#1D9E75" }}>
        ← Explore
      </Link>
    </div>
  );
}
