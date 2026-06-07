"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  fetchSpeciesDetail,
  fetchPublicationsForSpecies,
  fetchMetabolitesForSpecies,
} from "../../lib/atlas/queries";
import { flag } from "../../lib/atlas/format";
import { useAuthContext } from "../../lib/authContext";
import { supabase } from "../../lib/supabase";
import RelatedOpenCalls from "./RelatedOpenCalls";
import WatchToggle from "./WatchToggle";
import SpeciesDomainExtras from "./SpeciesDomainExtras";
import EntityDiscussion from "./EntityDiscussion";
import ExportButtons from "./ExportButtons";
import CommercializedOutcomes from "./CommercializedOutcomes";
import IndigenousKnowledge from "./IndigenousKnowledge";
import SpeciesAISummary from "./SpeciesAISummary";
import GenusSiblings from "./GenusSiblings";
import SpeciesEditProposal from "./SpeciesEditProposal";
import WatchButton from "./WatchButton";
import SpeciesTimeline from "./SpeciesTimeline";
import SpecimenLinker from "./SpecimenLinker";
import ProvenanceTip from "./ProvenanceTip";
import INatObservations from "./INatObservations";
import IucnHistoryStrip from "./IucnHistoryStrip";
import ClimateProjections from "./ClimateProjections";
import CompletenessBadge from "./CompletenessBadge";
import NativeRegions from "./NativeRegions";
import { IUCN_COLORS, IUCN_LABEL } from "../../lib/iucn";

const MODULE_COLORS = {
  Origin: "#1D9E75", Forge: "#BA7517", Mesh: "#185FA5",
  Exchange: "#D85A30", Accord: "#5F5E5A",
};
const STATUS_COLORS = {
  Active: "#0F6E56", Draft: "#888", Blocked: "#A32D2D",
  "On Hold": "#BA7517", Completed: "#185FA5",
};

export default function SpeciesDetailRoute({ speciesId }) {
  const { user } = useAuthContext();
  const [species, setSpecies] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [publications, setPublications] = useState([]);
  const [metabolites, setMetabolites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const sp = await fetchSpeciesDetail(speciesId);
        if (cancelled) return;
        if (!sp) { setError("Species not found"); setLoading(false); return; }
        setSpecies(sp);
        const [progsResp, pubs, mets] = await Promise.all([
          supabase.rpc("get_programs_for_species_rich", { p_species_id: speciesId }),
          fetchPublicationsForSpecies(speciesId),
          fetchMetabolitesForSpecies(speciesId),
        ]);
        if (cancelled) return;
        setPrograms(Array.isArray(progsResp.data) ? progsResp.data : []);
        setPublications(pubs);
        setMetabolites(mets);
        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        setError(e.message || "Failed to load");
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [speciesId]);

  if (loading) return <Skeleton />;
  if (error) return <ErrorBox message={error} />;
  if (!species) return null;

  const tier = species.iucn_status;
  const tierColor = IUCN_COLORS[tier];
  const externalIds = species.external_ids || {};

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto" }}>
      <BreadcrumbBack />

      <Hero species={species} tier={tier} tierColor={tierColor} />

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20, marginTop: 22, alignItems: "start" }}>
        <main style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Section title="Programs">
            {user && (
              <div style={{ marginBottom: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Link
                  href={`/geocon/proposals/new?subject_kind=species&subject_id=${encodeURIComponent(species.id)}&subject_name=${encodeURIComponent(species.accepted_name || "")}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "7px 12px",
                    background: "#0a4a3e",
                    color: "#fff",
                    borderRadius: 7,
                    textDecoration: "none",
                  }}
                >
                  📬 Propose a program around this species
                </Link>
                <WatchToggle
                  kind="species"
                  entityId={species.id}
                  label={species.accepted_name}
                  url={`/geocon/species/${species.id}`}
                />
                <Link
                  href={`/geocon/compare?a=${encodeURIComponent(species.id)}`}
                  style={{
                    padding: "9px 12px",
                    fontSize: 11,
                    fontWeight: 700,
                    background: "var(--gx-surface)",
                    color: "var(--gx-accent-violet)",
                    border: "1px solid var(--gx-border-soft)",
                    borderRadius: 7,
                    textDecoration: "none",
                  }}
                  title="Compare this species with another"
                >
                  ⇄ Compare
                </Link>
              </div>
            )}
            {programs.length === 0 ? (
              <Empty
                line="No active programs for this species yet."
                cta={user ? "Start a program →" : null}
                ctaHref="/geocon/programs"
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {programs.map((p) => <ProgramRow key={p.id} p={p} />)}
              </div>
            )}
            {!user && programs.length === 0 && (
              <div style={{ marginTop: 10, fontSize: 11, color: "var(--gx-ink-muted)" }}>
                Sign in via BEE to start a program for this species.
              </div>
            )}
          </Section>

          {publications.length > 0 && (
            <Section title={`Publications · ${publications.length}`}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {publications.slice(0, 10).map((p) => <PublicationRow key={p.id} p={p} />)}
              </div>
              {publications.length > 10 && (
                <div style={{ marginTop: 6, fontSize: 11, color: "var(--gx-ink-muted)" }}>
                  +{publications.length - 10} more in the Publications module
                </div>
              )}
            </Section>
          )}

          <SpeciesAISummary speciesId={species.id} />

          <GenusSiblings speciesId={species.id} genus={species.genus} />

          <SpeciesDomainExtras speciesId={species.id} />

          <ExportButtons speciesId={species.id} />

          <SpeciesEditProposal species={species} />

          <SpeciesTimeline speciesId={species.id} />

          <IndigenousKnowledge
            speciesId={species.id}
            speciesName={species.accepted_name}
          />

          <SpecimenLinker speciesId={species.id} speciesName={species.accepted_name} />

          <NativeRegions speciesId={species.id} />

          <INatObservations speciesId={species.id} />

          <IucnHistoryStrip speciesId={species.id} />

          <ClimateProjections speciesId={species.id} />

          <CommercializedOutcomes
            speciesId={species.id}
            allowDeclare={!!user}
            title={`Commercialization recognition · ${species.accepted_name || ""}`}
          />

          <EntityDiscussion
            kind="species"
            entityKey={species.id}
            title={`Notes on ${species.accepted_name || "this species"}`}
          />

          <RelatedOpenCalls
            rpcName="list_open_proposals_for_species"
            rpcArgs={{ p_species_id: species.id }}
            title={`Open calls for ${species.accepted_name || "this species"}`}
          />

          {metabolites.length > 0 && (
            <Section title={`Metabolites · ${metabolites.length}`}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8 }}>
                {metabolites.slice(0, 18).map((m) => <MetaboliteCard key={m.id} m={m} />)}
              </div>
              {metabolites.length > 18 && (
                <div style={{ marginTop: 6, fontSize: 11, color: "var(--gx-ink-muted)" }}>
                  +{metabolites.length - 18} more in the Metabolites module
                </div>
              )}
            </Section>
          )}
        </main>

        <aside style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <DistributionPanel species={species} />
          <IdentityPanel species={species} externalIds={externalIds} />
          {typeof species.composite_score === "number" && (
            <ScorePanel species={species} />
          )}
        </aside>
      </div>
    </div>
  );
}

function Hero({ species, tier, tierColor }) {
  // Prefer full-res photo_url; fall back to thumbnail_url for the ~11k
  // legacy species that only have the small image. Some photo_urls turn
  // into 404s if iNat removed them — onError flips to the thumbnail.
  const heroSrc = species.photo_url || species.thumbnail_url;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20, alignItems: "start", marginTop: 14 }}>
      <div
        style={{
          aspectRatio: "1/1",
          background: "var(--gx-surface-3)",
          borderRadius: 14,
          overflow: "hidden",
          border: "1px solid var(--gx-card-border)",
          position: "relative",
        }}
      >
        {heroSrc ? (
          <>
            <img
              src={heroSrc}
              alt={species.accepted_name}
              loading="eager"
              onError={(e) => {
                if (e.currentTarget.src !== species.thumbnail_url && species.thumbnail_url) {
                  e.currentTarget.src = species.thumbnail_url;
                } else {
                  e.currentTarget.style.display = "none";
                }
              }}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            {(species.photo_credit || species.photo_source) && (
              <div
                style={{
                  position: "absolute",
                  left: 0, right: 0, bottom: 0,
                  padding: "6px 10px",
                  fontSize: 9,
                  letterSpacing: 0.4,
                  color: "#fff",
                  background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 100%)",
                }}
              >
                {species.photo_credit ? `© ${species.photo_credit}` : "Photo"}
                {species.photo_source && (
                  <span style={{ opacity: 0.85 }}> · {species.photo_source.replace("_genus", " (genus)")}</span>
                )}
              </div>
            )}
          </>
        ) : (
          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gx-ink-faint)", fontSize: 11, letterSpacing: 1 }}>
            no image
          </div>
        )}
      </div>

      <div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {tier && (
            <span style={{ display: "inline-flex", alignItems: "center" }}>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 999, background: tierColor, color: "#fff", letterSpacing: 0.6 }}>
                {tier} · {IUCN_LABEL[tier] || tier}
              </span>
              <ProvenanceTip speciesId={species.id} field="iucn_status" />
            </span>
          )}
          {species.endemic && (
            <span style={{ display: "inline-flex", alignItems: "center" }}>
              <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: "#E1F5EE", color: "#085041", letterSpacing: 0.4 }}>
                endemic
              </span>
              <ProvenanceTip speciesId={species.id} field="endemic" />
            </span>
          )}
          {species.source && species.source !== "manual" && (
            <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: "var(--gx-surface-3)", color: "var(--gx-ink-soft)", letterSpacing: 0.5 }}>
              source · {species.source}
            </span>
          )}
        </div>

        <h1
          style={{
            fontFamily: "var(--gx-font-serif)",
            fontStyle: "italic",
            fontWeight: 700,
            fontSize: 38,
            color: "var(--gx-ink)",
            letterSpacing: -0.5,
            margin: "10px 0 4px",
            lineHeight: 1.05,
          }}
        >
          {species.accepted_name}
        </h1>

        {species.accepted_name_authority && (
          <div style={{ fontSize: 13, color: "#6f6d66", marginBottom: 4 }}>
            {species.accepted_name_authority}
            <ProvenanceTip speciesId={species.id} field="accepted_name_authority" />
          </div>
        )}

        <div style={{ marginTop: 8 }}>
          <WatchButton speciesId={species.id} />
        </div>

        {/* DI-3 — honest record completeness */}
        <CompletenessBadge speciesId={species.id} />

        <div style={{ fontSize: 13, color: "var(--gx-ink-soft)", marginTop: 6 }}>
          {species.family ? (
            <>
              <Link
                href={`/geocon/families/${encodeURIComponent(species.family)}`}
                style={{ color: "#1D9E75", fontWeight: 700, textDecoration: "none" }}
              >
                {species.family}
              </Link>
              <ProvenanceTip speciesId={species.id} field="family" />
            </>
          ) : (
            <strong style={{ color: "var(--gx-ink)" }}>—</strong>
          )}
          {species.geophyte_type && (
            <> · {species.geophyte_type}<ProvenanceTip speciesId={species.id} field="geophyte_type" /></>
          )}
          {species.discovery_year && (
            <> · described {species.discovery_year}<ProvenanceTip speciesId={species.id} field="discovery_year" /></>
          )}
        </div>

        {species.population_trend && (
          <div style={{ marginTop: 12, fontSize: 12, color: "#6f6d66" }}>
            <span style={{ color: "var(--gx-ink-faint)", letterSpacing: 1, textTransform: "uppercase", fontSize: 9, marginRight: 6 }}>population trend</span>
            {species.population_trend}
            <ProvenanceTip speciesId={species.id} field="population_trend" align="left" />
          </div>
        )}
      </div>
    </div>
  );
}

function DistributionPanel({ species }) {
  const native = species.native_countries || [];
  const introduced = species.introduced_countries || [];
  const focus = species.country_focus;
  const hasAny = native.length > 0 || introduced.length > 0 || focus;

  return (
    <div style={card}>
      <Heading>Distribution</Heading>
      {!hasAny && (
        <div style={{ fontSize: 11, color: "var(--gx-ink-muted)" }}>No country data yet — GBIF sync pending.</div>
      )}
      {focus && (
        <div style={{ marginBottom: 8 }}>
          <Label>Primary occurrence</Label>
          <Link
            href={`/geocon/countries/${focus}`}
            style={{ fontSize: 14, fontWeight: 700, color: "#085041", letterSpacing: 1, textDecoration: "none" }}
          >
            <span style={{ marginRight: 6 }}>{flag(focus)}</span>{focus}
          </Link>
        </div>
      )}
      {native.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <Label>Native ({native.length})</Label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {native.map((c) => (
              <Link key={c} href={`/geocon/countries/${c}`} style={{ ...chip("#E1F5EE", "#085041"), textDecoration: "none" }}>
                <span style={{ marginRight: 4 }}>{flag(c)}</span>{c}
              </Link>
            ))}
          </div>
        </div>
      )}
      {introduced.length > 0 && (
        <div>
          <Label>Introduced ({introduced.length})</Label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {introduced.map((c) => (
              <Link key={c} href={`/geocon/countries/${c}`} style={{ ...chip("var(--gx-surface-3)", "var(--gx-ink-soft)"), textDecoration: "none" }}>
                <span style={{ marginRight: 4 }}>{flag(c)}</span>{c}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function IdentityPanel({ species, externalIds }) {
  const entries = [
    species.id && ["GEOCON", species.id.slice(0, 8) + "…"],
    externalIds.wcvp && [
      "WCVP / POWO",
      <a key="powo" href={`https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:${externalIds.wcvp}`} target="_blank" rel="noreferrer" style={extLink}>
        {externalIds.wcvp}
      </a>,
    ],
    externalIds.gbif && [
      "GBIF",
      <a key="gbif" href={`https://www.gbif.org/species/${externalIds.gbif}`} target="_blank" rel="noreferrer" style={extLink}>
        {externalIds.gbif}
      </a>,
    ],
    externalIds.iucn && [
      "IUCN",
      <a key="iucn" href={`https://www.iucnredlist.org/species/${externalIds.iucn}/0`} target="_blank" rel="noreferrer" style={extLink}>
        {externalIds.iucn}
      </a>,
    ],
  ].filter(Boolean);

  return (
    <div style={card}>
      <Heading>Identity</Heading>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {entries.map(([label, value], i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
            <span style={{ fontSize: 10, color: "var(--gx-ink-faint)", textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</span>
            <span style={{ color: "var(--gx-ink)", fontFamily: "monospace" }}>{value}</span>
          </div>
        ))}
      </div>
      {species.last_synced_at && (
        <div style={{ fontSize: 10, color: "var(--gx-ink-faint)", marginTop: 10, textAlign: "right" }}>
          last synced · {new Date(species.last_synced_at).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}

function ScorePanel({ species }) {
  const score = species.composite_score;
  return (
    <div style={card}>
      <Heading>Composite score</Heading>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ fontFamily: "var(--gx-font-serif)", fontSize: 36, fontWeight: 700, color: "#1D9E75", lineHeight: 1 }}>
          {Number(score).toFixed(1)}
        </span>
        <span style={{ fontSize: 11, color: "var(--gx-ink-muted)" }}>/ 100</span>
      </div>
      <div style={{ fontSize: 11, color: "var(--gx-ink-muted)", marginTop: 6 }}>
        Manually curated priority blend.
      </div>
    </div>
  );
}

function ProgramRow({ p }) {
  const mod = MODULE_COLORS[p.current_module] || "#888";
  const st = STATUS_COLORS[p.status] || "#888";
  const isPrimary = (p.link_role || "").toLowerCase() === "primary";
  return (
    <Link
      href={`/geocon/programs/${p.id}`}
      style={{
        display: "block",
        background: "var(--gx-card-bg)",
        border: "1px solid var(--gx-card-border)",
        borderLeft: `4px solid ${mod}`,
        borderRadius: 10,
        padding: "12px 14px",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--gx-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {p.program_name}
            </span>
            {isPrimary ? (
              <span style={{ fontSize: 8, padding: "1px 6px", borderRadius: 999, background: "#085041", color: "#fff", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
                primary
              </span>
            ) : (
              <span style={{ fontSize: 8, padding: "1px 6px", borderRadius: 999, background: "var(--gx-surface-3)", color: "var(--gx-ink-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
                {p.link_role || "linked"}
              </span>
            )}
          </div>
          <div style={{ fontSize: 10, color: "#9a978f", marginTop: 2 }}>
            {p.program_code && <>{p.program_code} · </>}
            {p.current_module}
            {p.current_gate && <> · {p.current_gate}</>}
            {typeof p.member_count === "number" && p.member_count > 0 && <> · 👥 {p.member_count}</>}
          </div>
        </div>
        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: `${st}22`, color: st, fontWeight: 700 }}>
          {p.status}
        </span>
        {typeof p.readiness_score === "number" && (
          <span style={{ fontSize: 14, fontWeight: 700, color: "#1D9E75", fontFamily: "var(--gx-font-serif)" }}>
            {p.readiness_score}
          </span>
        )}
      </div>
    </Link>
  );
}

function PublicationRow({ p }) {
  return (
    <Link
      href={`/geocon/publications/${encodeURIComponent(p.id)}`}
      style={{
        display: "block",
        padding: "8px 10px",
        border: "1px solid var(--gx-border-soft)",
        borderRadius: 8,
        background: "var(--gx-surface)",
        textDecoration: "none",
        color: "inherit",
        transition: "border-color 120ms ease, transform 120ms ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--gx-accent-violet)";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--gx-border-soft)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--gx-ink)" }}>{p.title || "(untitled)"}</div>
      <div style={{ fontSize: 11, color: "var(--gx-ink-muted)", marginTop: 2 }}>
        {p.authors && <span>{p.authors}</span>}
        {p.year && <span> · {p.year}</span>}
        {p.journal && <span> · {p.journal}</span>}
      </div>
      {p.doi && (
        <span
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            window.open(
              p.doi.startsWith("http") ? p.doi : `https://doi.org/${p.doi}`,
              "_blank",
              "noopener,noreferrer"
            );
          }}
          style={{
            fontSize: 10,
            color: "var(--gx-accent-bio-leaf)",
            marginTop: 3,
            display: "inline-block",
            cursor: "pointer",
          }}
        >
          🔗 {p.doi}
        </span>
      )}
    </Link>
  );
}

function MetaboliteCard({ m }) {
  return (
    <div style={{ padding: "9px 11px", border: "1px solid var(--gx-card-border)", borderRadius: 8, background: "var(--gx-card-bg)" }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--gx-ink)" }}>{m.compound_name || "(unnamed)"}</div>
      {m.compound_class && <div style={{ fontSize: 10, color: "var(--gx-ink-muted)", marginTop: 2 }}>{m.compound_class}</div>}
      {m.cas_number && <div style={{ fontSize: 10, color: "var(--gx-ink-faint)", marginTop: 2, fontFamily: "monospace" }}>CAS {m.cas_number}</div>}
    </div>
  );
}

function BreadcrumbBack() {
  return (
    <Link href="/geocon/species" style={{ fontSize: 11, color: "var(--gx-ink-muted)", textDecoration: "none", letterSpacing: 0.5 }}>
      ← ATLAS
    </Link>
  );
}

function Section({ title, children }) {
  return (
    <section style={{ background: "var(--gx-card-bg)", border: "1px solid var(--gx-card-border)", borderRadius: 12, padding: 16 }}>
      <h3 style={{ fontFamily: "var(--gx-font-serif)", fontSize: 15, fontWeight: 700, color: "var(--gx-ink)", margin: "0 0 12px" }}>{title}</h3>
      {children}
    </section>
  );
}

function Empty({ line, cta, ctaHref }) {
  return (
    <div style={{ padding: "16px 12px", border: "1px dashed var(--gx-border-soft)", borderRadius: 10, textAlign: "center", color: "var(--gx-ink-muted)" }}>
      <div style={{ fontSize: 12 }}>{line}</div>
      {cta && (
        <Link href={ctaHref} style={{ display: "inline-block", marginTop: 8, fontSize: 11, fontWeight: 600, color: "#1D9E75", textDecoration: "none" }}>
          {cta}
        </Link>
      )}
    </div>
  );
}

function Heading({ children }) {
  return (
    <div style={{ fontSize: 10, color: "var(--gx-ink-faint)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
      {children}
    </div>
  );
}

function Label({ children }) {
  return (
    <div style={{ fontSize: 10, color: "#9a978f", letterSpacing: 0.4, marginBottom: 4 }}>{children}</div>
  );
}

function Skeleton() {
  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: 14 }}>
      <div style={{ height: 240, background: "var(--gx-surface-3)", borderRadius: 14, animation: "pulse 1.5s ease-in-out infinite" }} />
    </div>
  );
}

function ErrorBox({ message }) {
  return (
    <div style={{ maxWidth: 720, margin: "60px auto", padding: 24, border: "1px solid #FCEBEB", background: "#FFF6F6", borderRadius: 12, color: "#A32D2D" }}>
      <div style={{ fontSize: 13, fontWeight: 600 }}>Couldn't load species</div>
      <div style={{ fontSize: 12, marginTop: 4 }}>{message}</div>
      <Link href="/geocon/species" style={{ display: "inline-block", marginTop: 14, fontSize: 12, color: "#1D9E75" }}>
        ← Back to ATLAS
      </Link>
    </div>
  );
}

const card = {
  background: "var(--gx-card-bg)",
  border: "1px solid var(--gx-card-border)",
  borderRadius: 12,
  padding: 14,
};

function chip(bg, color) {
  return {
    fontSize: 10,
    padding: "3px 7px",
    borderRadius: 999,
    background: bg,
    color,
    letterSpacing: 0.5,
    fontWeight: 600,
  };
}

const extLink = {
  color: "#1D9E75",
  textDecoration: "none",
};
