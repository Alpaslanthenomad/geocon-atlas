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
              <div style={{ marginTop: 10, fontSize: 11, color: "#888" }}>
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
                <div style={{ marginTop: 6, fontSize: 11, color: "#888" }}>
                  +{publications.length - 10} more in the Publications module
                </div>
              )}
            </Section>
          )}

          <SpeciesDomainExtras speciesId={species.id} />

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
                <div style={{ marginTop: 6, fontSize: 11, color: "#888" }}>
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
  return (
    <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20, alignItems: "start", marginTop: 14 }}>
      <div
        style={{
          aspectRatio: "1/1",
          background: "#f4f3ef",
          borderRadius: 14,
          overflow: "hidden",
          border: "1px solid #ece9e2",
        }}
      >
        {species.thumbnail_url ? (
          <img
            src={species.thumbnail_url}
            alt={species.accepted_name}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#b4b2a9", fontSize: 11, letterSpacing: 1 }}>
            no image
          </div>
        )}
      </div>

      <div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {tier && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 999, background: tierColor, color: "#fff", letterSpacing: 0.6 }}>
              {tier} · {IUCN_LABEL[tier] || tier}
            </span>
          )}
          {species.endemic && (
            <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: "#E1F5EE", color: "#085041", letterSpacing: 0.4 }}>
              endemic
            </span>
          )}
          {species.source && species.source !== "manual" && (
            <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: "#f4f3ef", color: "#5f5e5a", letterSpacing: 0.5 }}>
              source · {species.source}
            </span>
          )}
        </div>

        <h1
          style={{
            fontFamily: "Georgia, serif",
            fontStyle: "italic",
            fontWeight: 700,
            fontSize: 38,
            color: "#2c2c2a",
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
          </div>
        )}

        <div style={{ fontSize: 13, color: "#5f5e5a", marginTop: 6 }}>
          {species.family ? (
            <Link
              href={`/geocon/families/${encodeURIComponent(species.family)}`}
              style={{ color: "#1D9E75", fontWeight: 700, textDecoration: "none" }}
            >
              {species.family}
            </Link>
          ) : (
            <strong style={{ color: "#2c2c2a" }}>—</strong>
          )}
          {species.geophyte_type && <> · {species.geophyte_type}</>}
          {species.discovery_year && <> · described {species.discovery_year}</>}
        </div>

        {species.population_trend && (
          <div style={{ marginTop: 12, fontSize: 12, color: "#6f6d66" }}>
            <span style={{ color: "#b4b2a9", letterSpacing: 1, textTransform: "uppercase", fontSize: 9, marginRight: 6 }}>population trend</span>
            {species.population_trend}
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
        <div style={{ fontSize: 11, color: "#888" }}>No country data yet — GBIF sync pending.</div>
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
              <Link key={c} href={`/geocon/countries/${c}`} style={{ ...chip("#f4f3ef", "#5f5e5a"), textDecoration: "none" }}>
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
            <span style={{ fontSize: 10, color: "#b4b2a9", textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</span>
            <span style={{ color: "#2c2c2a", fontFamily: "monospace" }}>{value}</span>
          </div>
        ))}
      </div>
      {species.last_synced_at && (
        <div style={{ fontSize: 10, color: "#b4b2a9", marginTop: 10, textAlign: "right" }}>
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
        <span style={{ fontFamily: "Georgia, serif", fontSize: 36, fontWeight: 700, color: "#1D9E75", lineHeight: 1 }}>
          {Number(score).toFixed(1)}
        </span>
        <span style={{ fontSize: 11, color: "#888" }}>/ 100</span>
      </div>
      <div style={{ fontSize: 11, color: "#888", marginTop: 6 }}>
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
        background: "#fff",
        border: "1px solid #ece9e2",
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
            <span style={{ fontSize: 13, fontWeight: 600, color: "#2c2c2a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {p.program_name}
            </span>
            {isPrimary ? (
              <span style={{ fontSize: 8, padding: "1px 6px", borderRadius: 999, background: "#085041", color: "#fff", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
                primary
              </span>
            ) : (
              <span style={{ fontSize: 8, padding: "1px 6px", borderRadius: 999, background: "#f4f3ef", color: "#888", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
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
          <span style={{ fontSize: 14, fontWeight: 700, color: "#1D9E75", fontFamily: "Georgia, serif" }}>
            {p.readiness_score}
          </span>
        )}
      </div>
    </Link>
  );
}

function PublicationRow({ p }) {
  return (
    <div style={{ padding: "8px 10px", border: "1px solid #ece9e2", borderRadius: 8, background: "#fff" }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#2c2c2a" }}>{p.title || "(untitled)"}</div>
      <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
        {p.authors && <span>{p.authors}</span>}
        {p.year && <span> · {p.year}</span>}
        {p.journal && <span> · {p.journal}</span>}
      </div>
      {p.doi && (
        <a href={p.doi.startsWith("http") ? p.doi : `https://doi.org/${p.doi}`} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: "#1D9E75", marginTop: 3, display: "inline-block" }}>
          🔗 {p.doi}
        </a>
      )}
    </div>
  );
}

function MetaboliteCard({ m }) {
  return (
    <div style={{ padding: "9px 11px", border: "1px solid #ece9e2", borderRadius: 8, background: "#fff" }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#2c2c2a" }}>{m.compound_name || "(unnamed)"}</div>
      {m.compound_class && <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>{m.compound_class}</div>}
      {m.cas_number && <div style={{ fontSize: 10, color: "#b4b2a9", marginTop: 2, fontFamily: "monospace" }}>CAS {m.cas_number}</div>}
    </div>
  );
}

function BreadcrumbBack() {
  return (
    <Link href="/geocon/species" style={{ fontSize: 11, color: "#888", textDecoration: "none", letterSpacing: 0.5 }}>
      ← ATLAS
    </Link>
  );
}

function Section({ title, children }) {
  return (
    <section style={{ background: "#fff", border: "1px solid #ece9e2", borderRadius: 12, padding: 16 }}>
      <h3 style={{ fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 700, color: "#2c2c2a", margin: "0 0 12px" }}>{title}</h3>
      {children}
    </section>
  );
}

function Empty({ line, cta, ctaHref }) {
  return (
    <div style={{ padding: "16px 12px", border: "1px dashed #ece9e2", borderRadius: 10, textAlign: "center", color: "#888" }}>
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
    <div style={{ fontSize: 10, color: "#b4b2a9", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
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
      <div style={{ height: 240, background: "#f4f3ef", borderRadius: 14, animation: "pulse 1.5s ease-in-out infinite" }} />
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
  background: "#fff",
  border: "1px solid #ece9e2",
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
