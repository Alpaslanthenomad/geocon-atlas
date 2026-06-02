"use client";
// components/geocon/ResearcherDetailRoute.jsx
//
// /geocon/researchers/[id] — full researcher profile as a real route (not the
// legacy slide-over modal). Reuses the existing fetch helpers from
// lib/researchers.js so it always tracks whatever the modal showed, but
// renders in normal route flow with shareable metadata (set in page.js).

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  fetchResearcherById,
  fetchResearcherPublications,
  fetchResearcherSpecies,
  fetchResearcherProgramMemberships,
  fetchResearcherAuthority,
  fetchResearcherContributions,
} from "../../lib/researchers";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";
import WatchToggle from "./WatchToggle";
import { SkeletonStack } from "../shared";
import CommercializedOutcomes from "./CommercializedOutcomes";
import ImpactFactorPanel from "./ImpactFactorPanel";

const TABS = [
  { key: "programs",      label: "Programs" },
  { key: "publications",  label: "Publications" },
  { key: "species",       label: "Species" },
  { key: "contributions", label: "Contributions" },
  { key: "authority",     label: "Authority" },
];

export default function ResearcherDetailRoute({ researcherId }) {
  const router = useRouter();
  const { user, researcher: myResearcher } = useAuthContext();
  const [researcher, setResearcher] = useState(null);
  const [publications, setPublications] = useState([]);
  const [species, setSpecies] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [authority, setAuthority] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [orgAffiliations, setOrgAffiliations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("programs");

  useEffect(() => {
    if (!researcherId) return;
    let mounted = true;
    setLoading(true);
    Promise.all([
      fetchResearcherById(researcherId),
      fetchResearcherPublications(researcherId),
      fetchResearcherSpecies(researcherId),
      fetchResearcherProgramMemberships(researcherId),
      fetchResearcherAuthority(researcherId),
      fetchResearcherContributions(researcherId),
      supabase.rpc("get_researcher_org_affiliations", { p_researcher_id: researcherId })
        .then(({ data }) => data || []).catch(() => []),
    ])
      .then(([r, p, s, m, a, c, orgs]) => {
        if (!mounted) return;
        setResearcher(r);
        setPublications(Array.isArray(p) ? p : []);
        setSpecies(Array.isArray(s) ? s : []);
        setMemberships(Array.isArray(m) ? m : []);
        setAuthority(Array.isArray(a) ? a : []);
        setContributions(Array.isArray(c) ? c : []);
        setOrgAffiliations(Array.isArray(orgs) ? orgs : []);
        setLoading(false);
      })
      .catch(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [researcherId]);

  const aggregate = useMemo(() => {
    if (authority.length === 0) return null;
    const totalAuth = authority.reduce((s, a) => s + (parseFloat(a.authority_score) || 0), 0);
    const totalContribs = authority.reduce((s, a) => s + (parseInt(a.contribution_count) || 0), 0);
    const totalVerified = authority.reduce((s, a) => s + (parseInt(a.verified_count) || 0), 0);
    return { avg: totalAuth / authority.length, programs: authority.length, contributions: totalContribs, verified: totalVerified };
  }, [authority]);

  if (loading) return <Loading />;
  if (!researcher) return <NotFound />;

  const isSelf = user && myResearcher?.id === researcher.id;

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto" }}>
      <div style={{ marginBottom: 12 }}>
        <Link href="/geocon/researchers" style={{ fontSize: 11, color: "#888", textDecoration: "none" }}>← Researchers</Link>
      </div>

      {/* Hero */}
      <section style={{
        background: "linear-gradient(150deg,#3C3489 0%,#534AB7 65%,#7F77DD 100%)",
        borderRadius: 14, padding: "22px 26px", marginBottom: 16, color: "#fff",
      }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
              {researcher.id}
            </div>
            <h1 className="gx-display" style={{ color: "#fff", fontSize: 36, lineHeight: 1.05, margin: 0 }}>
              {researcher.name}
            </h1>
            {researcher.orcid && (
              <div style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 8 }}>
                <a
                  href={`https://orcid.org/${researcher.orcid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    fontSize: 11, fontWeight: 700, padding: "4px 11px",
                    borderRadius: 999, color: "#fff",
                    background: "rgba(255,255,255,0.18)",
                    border: "1px solid rgba(255,255,255,0.3)",
                    fontFamily: "var(--gx-font-mono)", letterSpacing: 0.8,
                    textDecoration: "none", backdropFilter: "blur(8px)",
                  }}
                  title="View ORCID public record"
                >
                  ✦ {researcher.orcid}
                </a>
              </div>
            )}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10, fontSize: 12, color: "rgba(255,255,255,0.9)" }}>
              {researcher.institution && <span>{researcher.institution}</span>}
              {researcher.country && <span>· {researcher.country}</span>}
              {researcher.expertise_area && <span>· {researcher.expertise_area}</span>}
            </div>

            {orgAffiliations.length > 0 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
                {orgAffiliations.map((a) => (
                  <Link
                    key={a.membership_id}
                    href={`/geocon/organizations/${a.organization.id}`}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      fontSize: 11, padding: "4px 10px", borderRadius: 999,
                      background: "rgba(255,255,255,0.18)", color: "#fff",
                      textDecoration: "none",
                      border: "1px solid rgba(255,255,255,0.25)",
                      fontWeight: 600,
                    }}
                  >
                    🏢 {a.organization.name}{a.title && <span style={{ opacity: 0.8, fontWeight: 400 }}> · {a.title}</span>}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {aggregate && (
            <div style={{ textAlign: "right", color: "#fff" }}>
              <div style={{ fontFamily: "var(--gx-font-serif)", fontSize: 44, fontWeight: 700, lineHeight: 1 }}>
                {aggregate.avg.toFixed(0)}
              </div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: 0.8, marginTop: 4 }}>
                Avg authority · {aggregate.programs} {aggregate.programs === 1 ? "program" : "programs"}
              </div>
            </div>
          )}
        </div>

        {/* Metric strip */}
        <div style={{ display: "flex", gap: 18, marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.18)", fontSize: 11, color: "rgba(255,255,255,0.92)", flexWrap: "wrap" }}>
          {researcher.h_index != null   && <Stat label="h-index" value={researcher.h_index} />}
          {researcher.publications_count != null && <Stat label="Publications (total)" value={researcher.publications_count} />}
          <Stat label="In GEOCON" value={`${publications.length} pub · ${species.length} species · ${memberships.length} membership${memberships.length === 1 ? "" : "s"}`} />
          {contributions.length > 0 && <Stat label="Contributions" value={contributions.length} />}
        </div>

        {/* Cross-actor CTAs */}
        <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
          {user && !isSelf && (
            <Link
              href={`/geocon/proposals/new?to_kind=researcher&to_id=${encodeURIComponent(researcher.id)}&to_name=${encodeURIComponent(researcher.name || "")}`}
              style={{ fontSize: 11, fontWeight: 700, padding: "7px 14px", background: "var(--gx-card-bg)", color: "#3C3489", borderRadius: 8, textDecoration: "none" }}
            >
              📬 Propose collaboration
            </Link>
          )}
          {user && !isSelf && (
            <div style={{ display: "inline-flex" }}>
              <WatchToggle
                kind="researcher"
                entityId={researcher.id}
                label={researcher.name}
                url={`/geocon/researchers/${researcher.id}`}
              />
            </div>
          )}
        </div>
      </section>

      {/* Tabs */}
      <div style={{ display: "flex", padding: "0 2px", borderBottom: "1px solid #ece9e2", marginBottom: 16, overflowX: "auto" }}>
        {TABS.map((t) => {
          const counts = {
            programs: memberships.length,
            publications: publications.length,
            species: species.length,
            contributions: contributions.length,
            authority: authority.length,
          };
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                flexShrink: 0,
                padding: "10px 16px",
                background: "none", border: "none",
                borderBottom: active ? "2px solid #534AB7" : "2px solid transparent",
                color: active ? "#534AB7" : "#888",
                cursor: "pointer", fontSize: 12, fontWeight: 600,
              }}
            >
              {t.label} <span style={{ color: "#bbb", fontSize: 10 }}>{counts[t.key]}</span>
            </button>
          );
        })}
      </div>

      {/* Tab body */}
      {tab === "programs"      && <ProgramsTab rows={memberships} />}
      {tab === "publications"  && <PublicationsTab rows={publications} researcher={researcher} />}
      {tab === "species"       && <SpeciesTab rows={species} />}
      {tab === "contributions" && <ContributionsTab rows={contributions} />}
      {tab === "authority"     && <AuthorityTab rows={authority} />}

      {/* Impact factor — visible across tabs, persistent above recognition. */}
      <ImpactFactorPanel
        contributorKind="researcher"
        contributorId={researcher.id}
        allowHideWhenEmpty={!isSelf}
      />

      {/* Recognition — visible across tabs. Researcher commercialization
          credits live here; the panel hides itself for outside viewers when
          there's nothing to show, so it doesn't add noise. */}
      <div style={{ marginTop: 24 }}>
        <CommercializedOutcomes
          contributorKind="researcher"
          contributorId={researcher.id}
          allowDeclare={isSelf}
        />
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <span>
      <strong style={{ color: "#fff" }}>{label}</strong> {value}
    </span>
  );
}

function ProgramsTab({ rows }) {
  if (rows.length === 0) return <Empty line="Not on any program yet." />;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
      {rows.map((m) => (
        <Link key={m.id || `${m.program_id}-${m.role}`} href={`/geocon/programs/${m.program_id}`} style={tile}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gx-ink)" }}>
            {m.program_name || m.program_code || "Program"}
          </div>
          <div style={{ fontSize: 10, color: "#888", marginTop: 3 }}>
            role: {m.role}{m.is_owner && " · owner"}
          </div>
        </Link>
      ))}
    </div>
  );
}

function PublicationsTab({ rows, researcher }) {
  if (rows.length === 0) return <Empty line="No GEOCON-curated publications yet." />;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {rows.map((p) => (
        <div key={p.id} style={tile}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gx-ink)", lineHeight: 1.3 }}>
            {p.title}
          </div>
          <div style={{ fontSize: 10, color: "#888", marginTop: 3 }}>
            {p.journal || ""}{p.year && ` · ${p.year}`}
            {p.author_as_listed && p.author_as_listed !== researcher.name && <> · as <em>{p.author_as_listed}</em></>}
          </div>
          {p.doi && (
            <a href={`https://doi.org/${p.doi}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: "#185FA5", textDecoration: "none", marginTop: 4, display: "inline-block" }}>
              doi.org/{p.doi}
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

function SpeciesTab({ rows }) {
  if (rows.length === 0) return <Empty line="Not linked to any species yet." />;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
      {rows.map((s) => (
        <Link key={s.species_id || s.id} href={`/geocon/species/${s.species_id || s.id}`} style={tile}>
          <div style={{ fontFamily: "var(--gx-font-serif)", fontStyle: "italic", fontSize: 14, fontWeight: 700, color: "var(--gx-ink)" }}>
            {s.accepted_name || s.species_name || s.species_id}
          </div>
          {s.family && <div style={{ fontSize: 10, color: "#888", marginTop: 3 }}>{s.family}</div>}
        </Link>
      ))}
    </div>
  );
}

function ContributionsTab({ rows }) {
  if (rows.length === 0) return <Empty line="No tracked contributions yet." />;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {rows.map((c) => (
        <div key={c.id} style={tile}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#534AB7", textTransform: "uppercase", letterSpacing: 1 }}>
            {c.contribution_type || "contribution"}
          </div>
          <div style={{ fontSize: 13, color: "var(--gx-ink)", marginTop: 4 }}>
            {c.summary || c.title || "—"}
          </div>
          {c.program_name && (
            <Link href={`/geocon/programs/${c.program_id}`} style={{ fontSize: 10, color: "#185FA5", textDecoration: "none", marginTop: 4, display: "inline-block" }}>
              → {c.program_name}
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}

function AuthorityTab({ rows }) {
  if (rows.length === 0) return <Empty line="No authority scoring yet." />;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
      {rows.map((a) => (
        <div key={a.program_id || a.id} style={tile}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--gx-ink)" }}>
              {a.program_name || a.program_code || "Program"}
            </span>
            <span style={{ fontFamily: "var(--gx-font-serif)", fontSize: 20, fontWeight: 700, color: "#534AB7" }}>
              {a.authority_score != null ? Number(a.authority_score).toFixed(0) : "—"}
            </span>
          </div>
          <div style={{ fontSize: 10, color: "#888", marginTop: 4 }}>
            {a.contribution_count || 0} contributions
            {typeof a.verified_count === "number" && <> · {a.verified_count} verified</>}
          </div>
        </div>
      ))}
    </div>
  );
}

const tile = {
  display: "block", padding: 12,
  background: "var(--gx-card-bg)", border: "1px solid var(--gx-card-border)", borderRadius: 10,
  textDecoration: "none", color: "inherit",
};

function Empty({ line }) {
  return <div style={{ padding: 30, border: "1px dashed #ece9e2", borderRadius: 10, textAlign: "center", color: "#888", fontSize: 12, background: "var(--gx-surface-2)" }}>{line}</div>;
}
function Loading() {
  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: 16 }}>
      <SkeletonStack rows={4} />
    </div>
  );
}
function NotFound() {
  return (
    <div style={{ padding: 60, textAlign: "center", color: "#888", fontSize: 13 }}>
      Researcher not found.
      <div style={{ marginTop: 10 }}>
        <Link href="/geocon/researchers" style={{ color: "#185FA5", fontSize: 11 }}>← Back to researchers</Link>
      </div>
    </div>
  );
}
