"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";
import { IUCN_COLORS } from "../../lib/iucn";

import { Loading } from "../shared";
import GEOCONHome from "../home/GEOCONHome";
import MyDashboard from "./MyDashboard";
import OnboardingChecklist from "./OnboardingChecklist";
import SpotlightRibbon from "./SpotlightRibbon";
import TrendingThreads from "./TrendingThreads";
// QuickTools removed — the sidebar already exposes every destination
// QuickTools listed, so it was a duplicate entry point. TrendingPanel
// removed — TrendingThreads carries the same "what's hot" signal in a
// more discussable form (threads vs counts). MyAtlasHistory removed —
// MyDashboard absorbs the "your recent work" cell.
import SpeciesDetailPanel from "../species/SpeciesDetailPanel";
import StartProgramModal from "../programs/StartProgramModal";
import CompassWidget from "../programs/CompassWidget";
import LeaderboardPanel from "./LeaderboardPanel";
import OrcidConnectBanner from "./OrcidConnectBanner";
import MyMissionFeed from "./MyMissionFeed";
import TodayOnGeocon from "./TodayOnGeocon";
import IntentRouter from "./IntentRouter";
import WorkDesk from "./WorkDesk";
import ErrorBoundary from "../shared/ErrorBoundary";
import { TrustStrip } from "../ui";

// Wrap every top-level home widget so one crashing component doesn't
// take the whole dashboard down. Default fallback is null (silent) —
// the user just doesn't see that widget instead of an infinite spinner.
function W({ label, children }) {
  return <ErrorBoundary label={label}>{children}</ErrorBoundary>;
}

// Compact integer formatter (47066 → "47,066", 1300000 → "1.3M").
function fmt(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  if (x >= 1_000_000) return (x / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (x >= 1_000)     return x.toLocaleString();
  return String(x);
}

// ── Observer (logged-out) public face ──────────────────────────────
// The signed-in home is a "Command Center": its personal widgets (WorkDesk,
// MyDashboard, OrcidConnectBanner…) all return null for an anonymous visitor,
// and most community widgets are empty at cold start — so a first-time
// observer landed on a near-empty shell. This block is the public face:
// it introduces GEOCON, surfaces the live atlas numbers, links to the four
// public discovery surfaces (Species · EndemiCon · The Chain · Explore), and
// shows a real threatened-species grid. It is `!user`-gated and additive —
// signed-in users never see it. Locked brand language throughout (green hero
// #0F6E56 / #9FE1CB / #D6F3E8, serif-italic wordmark, radial conservation ring).

const OBS_R = 18;
const OBS_CIRC = 2 * Math.PI * OBS_R;
const CONS_GREEN = "#639922"; // conservation axis color (locked)

// Radial progress ring (strokeDasharray) — the locked "fill" visual.
function ObsRing({ fill }) {
  const vis = Math.max(0, Math.min(1, (Number(fill) || 0) / 100)) * OBS_CIRC;
  return (
    <svg width="46" height="46" viewBox="0 0 46 46" style={{ flexShrink: 0 }} aria-hidden="true">
      <circle cx="23" cy="23" r={OBS_R} fill="none" stroke="var(--gx-border-soft)" strokeWidth="4.5" />
      <circle cx="23" cy="23" r={OBS_R} fill="none" stroke={CONS_GREEN} strokeWidth="4.5" strokeLinecap="round"
        strokeDasharray={`${vis.toFixed(1)} ${OBS_CIRC.toFixed(1)}`} transform="rotate(-90 23 23)" />
      <text x="23" y="27" textAnchor="middle" fontSize="11" fill="var(--gx-ink)">{Math.round(Number(fill) || 0)}</text>
    </svg>
  );
}

function ObsStat({ value, label, tint }) {
  return (
    <div style={{ background: "var(--gx-surface-2)", borderRadius: 10, padding: "12px 14px", flex: "1 1 130px", minWidth: 120 }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: tint || "var(--gx-ink)" }}>{value}</div>
      <div style={{ fontSize: 11.5, color: "var(--gx-ink-soft)", marginTop: 2 }}>{label}</div>
    </div>
  );
}

const OBS_NAV = [
  { href: "/geocon/species",   label: "Atlas türleri" },
  { href: "/geocon/endemicon", label: "EndemiCon" },
  { href: "/geocon/chain",     label: "Değer zinciri" },
  { href: "/geocon/explore",   label: "Globe" },
];

function ObserverHero({ species, counts }) {
  // Highest-signal threatened rows from the already-fetched species list — no
  // new query. composite_score (0–100) doubles as the conservation-ring fill.
  const featured = (Array.isArray(species) ? species : [])
    .filter((s) => ["CR", "EN", "VU"].includes(s.iucn_status))
    .slice(0, 8);

  return (
    <section style={{ marginBottom: 22 }}>
      {/* Green brand hero — the public introduction. */}
      <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid var(--gx-card-border)", marginBottom: 14 }}>
        <div style={{ background: "#0F6E56", padding: "clamp(20px, 5vw, 26px) clamp(18px, 5vw, 28px)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
            <span style={{ width: 26, height: 26, borderRadius: 7, background: "rgba(159,225,203,0.14)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#9FE1CB", fontSize: 15 }}>✿</span>
            <span style={{ fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase", color: "#9FE1CB" }}>VENN BioVentures · koruma girişimi</span>
          </div>
          <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic", fontSize: "clamp(26px, 8vw, 33px)", lineHeight: 1.05, color: "#fff", marginBottom: 11 }}>
            GEOCON Atlas
          </div>
          <div style={{ fontSize: 14, color: "#D6F3E8", maxWidth: 640, lineHeight: 1.6 }}>
            Tehdit altındaki ~47.000 geofit türünün — soğanlı, yumrulu, rizomlu bitkilerin — açık koruma atlası. Henüz bilmediğimiz şeyleri görünür kılar: hangi tür değerlendirilmemiş, hangi boşluk doldurulmayı bekliyor. Ticaret korumayı asla kirletmez.
          </div>
          {/* Public discovery destinations — never deletes a route, only links. */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
            {OBS_NAV.map((n, i) => (
              <Link key={n.href} href={n.href}
                style={{
                  fontSize: 12.5, fontWeight: 600, textDecoration: "none",
                  padding: "8px 14px", borderRadius: 9,
                  background: i === 0 ? "#9FE1CB" : "rgba(255,255,255,0.10)",
                  color: i === 0 ? "#0a4a3e" : "#E1F5EE",
                  border: i === 0 ? "none" : "1px solid rgba(159,225,203,0.4)",
                }}>
                {n.label}
              </Link>
            ))}
          </div>
        </div>
        {/* Live atlas numbers — the trust band. */}
        <div style={{ background: "var(--gx-card-bg)", padding: "14px 16px", display: "flex", gap: 10, flexWrap: "wrap" }}>
          <ObsStat value={fmt(counts.species)}     label="atlas türü" />
          <ObsStat value={fmt(counts.threatened)}  label="tehdit altında" tint="#A32D2D" />
          <ObsStat value={fmt(counts.researchers)} label="araştırmacı" />
          <ObsStat value={fmt(counts.publications)} label="yayın" tint="#185FA5" />
        </div>
      </div>

      {/* Real species discovery grid — mirrors the EndemiCon card grammar. */}
      {featured.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
            <h2 style={{ margin: 0, fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic", fontSize: 18, color: "var(--gx-ink)" }}>
              En yüksek öncelikli tehdit altındaki türler
            </h2>
            <Link href="/geocon/species" style={{ fontSize: 12, fontWeight: 600, color: "#0F6E56", textDecoration: "none" }}>
              Tümünü gör →
            </Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 240px), 1fr))", gap: 12 }}>
            {featured.map((s) => {
              const iucnColor = IUCN_COLORS[s.iucn_status] || "#888780";
              return (
                <Link key={s.id} href={`/geocon/species/${s.id}`}
                  style={{ display: "flex", gap: 12, alignItems: "center", textDecoration: "none", background: "var(--gx-card-bg)", border: "1px solid var(--gx-card-border)", borderRadius: 12, padding: "0.85rem 1rem" }}>
                  <ObsRing fill={s.composite_score} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic", fontSize: 14.5, color: "var(--gx-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.accepted_name}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 4 }}>
                      {s.family && <span style={{ fontSize: 11, color: "var(--gx-ink-faint)" }}>{s.family}</span>}
                      {s.iucn_status && (
                        <span style={{ fontSize: 9.5, fontWeight: 700, color: "#fff", background: iucnColor, padding: "1px 6px", borderRadius: 4 }}>{s.iucn_status}</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

/**
 * /geocon home route — loads the snapshot data the command center needs
 * (species + programs + secondary publications/metabolites/researchers).
 * Species/researcher detail panels still live here as modals until those
 * routes land in Phase 2.
 */
export default function HomeRoute() {
  const router = useRouter();
  const { user, profile, researcher } = useAuthContext();

  const [loading, setLoading] = useState(true);

  const [species, setSpecies] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [recentPublications, setRecentPublications] = useState([]);
  const [counts, setCounts] = useState({});

  const [detailSpecies, setDetailSpecies] = useState(null);
  const [startProgramSp, setStartProgramSp] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // 3 lightweight calls — allSettled so one slow / broken endpoint
        // doesn't take down the whole home page (e.g., the recent 400 on
        // a species select that wedged users on the loading skeleton).
        const settled = await Promise.allSettled([
          supabase.rpc("get_home_metrics"),
          supabase
            .from("species")
            .select("id, accepted_name, family, genus, iucn_status, country_focus, thumbnail_url, composite_score, geocon_module, geophyte_type")
            .order("composite_score", { ascending: false, nullsFirst: false })
            .limit(200),
          supabase
            .from("programs")
            .select("id, program_name, status, priority_score, current_module, current_gate, next_action, species_id, created_by, species:species_id(accepted_name, iucn_status, thumbnail_url)")
            .order("priority_score", { ascending: false })
            .limit(50),
        ]);
        if (cancelled) return;

        const metricsRes = settled[0].status === "fulfilled" ? settled[0].value : { data: {} };
        const spRes      = settled[1].status === "fulfilled" ? settled[1].value : { data: [] };
        const progRes    = settled[2].status === "fulfilled" ? settled[2].value : { data: [] };
        for (const s of settled) {
          if (s.status === "rejected") console.warn("[HomeRoute fetch]", s.reason?.message || s.reason);
        }

        const m = metricsRes.data || {};
        setCounts(m.counts || {});
        setRecentPublications(Array.isArray(m.recent_publications) ? m.recent_publications : []);

        const speciesRows = spRes.data || [];
        speciesRows.__threatenedCount = m.counts?.threatened || 0;
        speciesRows.__totalCount = m.counts?.species || 0;
        setSpecies(speciesRows);

        setPrograms(progRes.data || []);
      } catch (e) {
        if (!cancelled) console.warn("[HomeRoute]", e?.message || e);
        // silent — home still renders with whatever was set so far
      } finally {
        if (!cancelled) setLoading(false);
      }
    })().catch(() => { /* swallow unhandled rejection */ });
    return () => { cancelled = true; };
  }, []);

  // GEOCONHome calls setView(key). Adapt to real routes.
  function setView(key) {
    if (!key) return;
    router.push(`/geocon/${key}`);
  }

  if (loading) return <Loading />;

  const userRole = profile?.role || "observer";
  const homeUser = user
    ? { role: userRole, name: profile?.full_name || researcher?.name || user.email.split("@")[0] }
    : { role: "observer", name: "Observer" };

  return (
    <>
      {/* 0. THE ACT — the one verb that moves the metric: assert a fact, mint a receipt.
          The single-player loop the whole system exists to enable (Phase 0 pivot). */}
      <W label="the-act">
        <a href="/geocon/contribute" style={{ display: "block", textDecoration: "none", margin: "0 0 16px", padding: "18px 22px", borderRadius: 16, background: "linear-gradient(120deg, #1B5E20 0%, #0E7A66 100%)", color: "#fff", boxShadow: "0 8px 26px rgba(14,122,102,0.18)" }}>
          <div style={{ fontSize: 10.5, letterSpacing: 1.8, textTransform: "uppercase", opacity: 0.85, fontWeight: 700 }}>The one act that matters</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6, letterSpacing: -0.5 }}>Move one fact from 0 to 1</div>
          <div style={{ fontSize: 13.5, opacity: 0.93, marginTop: 6, lineHeight: 1.55, maxWidth: 580 }}>
            Assert one real, evidence-backed fact about a threatened plant and leave with a money-blind, citable Provenance Receipt with your name on it. <span style={{ fontWeight: 700, borderBottom: "1.5px solid rgba(255,255,255,0.6)" }}>Assert a fact →</span>
          </div>
        </a>
      </W>

      {/* 0b. THE PUBLIC FACE — for logged-out observers only. The signed-in
          home below is a personal Command Center whose widgets (WorkDesk,
          MyDashboard, OrcidConnectBanner…) all return null when there is no
          user, leaving a first-time visitor on a near-empty shell. This block
          introduces GEOCON, surfaces the live atlas numbers, links to the four
          public discovery surfaces, and shows a real threatened-species grid.
          Additive + `!user`-gated: signed-in users never see it. */}
      {!user && (
        <W label="observer-hero">
          <ObserverHero species={species} counts={counts} />
        </W>
      )}

      {/* 1. One onboarding surface, not three (Phase 0 pivot — the grand map flagged
          IntentRouter / OnboardingChecklist / MyMissionFeed as competing cognitive tax).
          The act-hero above is the primary CTA; the intent router is the one router kept.
          OnboardingChecklist + MyMissionFeed are retired from the home render (components
          preserved for reuse). OrcidConnectBanner stays — it auto-hides once connected. */}
      <W label="orcid-connect-banner"><OrcidConnectBanner /></W>

      {/* IA v2 — intent router: "what do you want to do?" — the one kept router. */}
      <W label="intent-router"><IntentRouter /></W>

      {/* THE BOOK — your work-desk (positions portfolio) at the top for signed-in researchers. */}
      <W label="work-desk"><WorkDesk /></W>

      <W label="today-on-geocon"><TodayOnGeocon /></W>

      {/* 2. Trust strip — 4 marketing numbers as the page anchor. */}
      <W label="trust-strip">
        <TrustStrip cells={[
          { value: fmt(counts.species),     label: "Atlas species" },
          { value: fmt(counts.threatened),  label: "Threatened", tint: "var(--gx-danger)" },
          { value: fmt(counts.researchers), label: "Researchers indexed" },
          { value: fmt(counts.programs),    label: "Active programs", tint: "var(--gx-accent-violet)" },
        ]} />
      </W>

      {/* 3. THE ACTUAL CONTENT — species grid + modules. Was buried at
          position 12 in the old layout; now lands fold-of-screen. */}
      <W label="geocon-home">
        <GEOCONHome
          species={species}
          publications={recentPublications}
          metabolites={Array(counts.metabolites || 0).fill(null)}
          researchers={Array(counts.researchers || 0).fill(null)}
          programs={programs}
          user={homeUser}
          setView={setView}
          onSpeciesClick={setDetailSpecies}
          onStartProgram={(sp) => setStartProgramSp(sp)}
        />
      </W>

      {/* 4. Editorial picks — what the team wants you to look at. */}
      <W label="spotlight-ribbon"><SpotlightRibbon /></W>

      {/* 5. Activity & community signals (consolidated). */}
      <W label="trending-threads"><TrendingThreads /></W>
      <W label="my-dashboard"><MyDashboard /></W>
      <W label="leaderboard"><LeaderboardPanel compact /></W>

      {detailSpecies && (
        <SpeciesDetailPanel
          species={detailSpecies}
          programs={programs}
          metabolitePublications={[]}
          onClose={() => setDetailSpecies(null)}
          onStartProgram={(sp) => { setStartProgramSp(sp); setDetailSpecies(null); }}
          onOpenProgram={(prog) => { router.push(`/geocon/programs/${prog.id}`); setDetailSpecies(null); }}
          onOpenResearcher={(r) => {
            if (r?.id) {
              router.push(`/geocon/researchers/${encodeURIComponent(r.id)}`);
              setDetailSpecies(null);
            }
          }}
        />
      )}

      {startProgramSp && (
        <StartProgramModal
          species={startProgramSp}
          user={user}
          profile={profile}
          researcher={researcher}
          onClose={() => setStartProgramSp(null)}
          onSuccess={() => { setStartProgramSp(null); window.location.reload(); }}
        />
      )}

      {/* CompassWidget surfaces a program's pathway compass on the home
          page. Only render when the user has at least one program they
          can act on, otherwise the widget points at a stale demo UUID
          and 404s for visitors who don't own that program. The first
          row of `programs` is the highest-priority candidate (the same
          ordering the dashboard already uses). */}
      {programs.length > 0 && programs[0]?.id && (
        <CompassWidget programId={programs[0].id} />
      )}
    </>
  );
}
