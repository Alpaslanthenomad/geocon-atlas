"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { getCentroid } from "../../lib/countryCentroids";
import { pointInCountry } from "../../lib/countryBboxes";
import { countryName } from "../../lib/countryNames";
import { IUCN_COLORS, IUCN_TINT as IUCN_PANEL_TINT, IUCN_LABEL } from "../../lib/iucn";
import GlobeSpotlight from "./GlobeSpotlight";
import GlobeLayerPanel from "./GlobeLayerPanel";
import GlobeRadiusPanel from "./GlobeRadiusPanel";
// GlobeTimeline mount removed — bottom strip was muddying the globe's
// visual rhythm. Component file kept in repo for future re-mount on a
// dedicated /geocon/timeline route if appetite returns.
// import GlobeTimeline from "./GlobeTimeline";

// react-globe.gl pulls in three.js which only runs in the browser.
const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

// All IUCN tiers in severity order (worst → least). Cluster colour picks the
// first tier present in a country.
const IUCN_TIER_ORDER = ["CR", "EN", "VU", "NT", "LC", "DD", "NE"];
// IUCN colors/labels now come from the single source: lib/iucn.js
// (imported above as IUCN_COLORS / IUCN_PANEL_TINT / IUCN_LABEL).

// Per-tier toggle state — each of the 7 IUCN classes can be on/off
// independently. Plus an explicit "unevaluated" toggle for rows where
// iucn_status IS NULL (species without an IUCN assessment yet).
//
// Replaced the old 3-mode bundle (Threat / Evaluated / All) — researchers
// asked for finer-grained control to see plant diversity on the globe
// without losing the threatened tiers in the noise.
const TIER_KEYS = ["CR", "EN", "VU", "NT", "LC", "DD", "NE"];

// Default state: threatened triple on, everything else off (preserves
// the old "Threat" first-impression).
const DEFAULT_TIER_STATE = { CR: true, EN: true, VU: true, NT: false, LC: false, DD: false, NE: false };
const DEFAULT_INCLUDE_NULL = false;

// Quick-set presets surfaced as small buttons inside the filter panel.
// The user still chooses any combination; presets are time-savers.
const TIER_PRESETS = [
  { key: "threat",    label: "Threat",    tiers: ["CR","EN","VU"],                       includeNull: false },
  { key: "evaluated", label: "Evaluated", tiers: ["CR","EN","VU","NT","LC"],             includeNull: false },
  { key: "all",       label: "All",       tiers: ["CR","EN","VU","NT","LC","DD","NE"],   includeNull: true  },
  { key: "diversity", label: "Diversity", tiers: ["NT","LC","DD"],                       includeNull: true  },
];

// Marker size grows sub-linearly with cluster count so dense countries stay
// readable rather than swallowing the globe.
function clusterRadius(count) {
  return 0.25 + 0.12 * Math.sqrt(count);
}

// Zoom altitude at which the globe switches from country clusters to per-species
// pins. Globe.gl uses 2.5 for the default full-globe view; below ~1.5 the user
// has visibly zoomed in on a region.
const LOD_ALTITUDE = 1.45;

/**
 * Golden-angle spiral around a centroid for per-species pin placement.
 * Longitude offset is scaled by 1/cos(lat) so the visual spread stays circular
 * at high latitudes instead of squashing east-west.
 */
function spreadPoint(centroidLat, centroidLng, idx) {
  // Golden-angle Fermat spiral — even density that grows as sqrt(idx),
  // keeping pins inside a reasonable country-sized disk even at idx=2000.
  const angle = (idx * 137.508) * (Math.PI / 180);
  const r = 0.45 * Math.sqrt(idx + 1);
  const lngScale = 1 / Math.max(Math.cos((centroidLat * Math.PI) / 180), 0.3);
  return [
    centroidLat + Math.cos(angle) * r,
    centroidLng + Math.sin(angle) * r * lngScale,
  ];
}

export default function ExploreRoute() {
  // Note: next/dynamic does not forward refs, so we can't grab the Globe
  // instance directly. Auto-rotate is wired via the polar coordinates props
  // below instead of mutating controls() through a ref.
  const containerRef = useRef(null);

  const [countrySummary, setCountrySummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [selected, setSelected] = useState(null);   // { kind:'country', cluster, species[] }
  const [selectedSpeciesLoading, setSelectedSpeciesLoading] = useState(false);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [altitude, setAltitude] = useState(2.5);
  // Per-tier on/off + an unevaluated/null toggle. Replaces the old
  // bundled filterMode. `mode` is derived below for downstream code
  // that still wants {tiers, includeNullStatus, scopeLabel} shape.
  const [tierState, setTierState] = useState(DEFAULT_TIER_STATE);
  const [includeNull, setIncludeNull] = useState(DEFAULT_INCLUDE_NULL);

  // Country multi-select (ISO-2 codes). Empty = no country filter.
  const [countryFilter, setCountryFilter] = useState([]);
  const [allCountries, setAllCountries] = useState([]); // [{country, total}]

  const [familyFilter, setFamilyFilter] = useState([]); // array of family names; empty = all
  const [allFamilies, setAllFamilies] = useState([]);
  const [pulseCountries, setPulseCountries] = useState([]); // [{country, cr_count}]
  const [arcRows, setArcRows] = useState([]);               // [{from_country, to_country, weight}]
  const [speciesPins, setSpeciesPins] = useState([]);       // per-species rows {id, country, iucn, family, accepted_name}
  const [researchIds, setResearchIds] = useState(new Set()); // v2.4 — species_ids with ≥1 active program

  // v2.6 — radius search. Shift+click on the globe → set this to the
  // clicked coord; UI renders a ring + side panel listing every species
  // pin inside the radius (Haversine, km).
  const [radiusPoint, setRadiusPoint] = useState(null); // { lat, lng }
  const [radiusKm, setRadiusKm] = useState(200);

  // v2.7 — Discovery timeline. activeDecade is the start year of a
  // decade (e.g. 1990 → 1990s); when set, the globe highlights species
  // whose first publication year falls in that decade. The 187-species
  // set with literature coverage gets a chronological lens; the rest
  // of the corpus stays muted so the time signal isn't washed out.
  const [activeDecade, setActiveDecade] = useState(null);
  const [decadeSpeciesIds, setDecadeSpeciesIds] = useState(new Set());

  // Re-fetch the per-decade species id set whenever the decade changes.
  useEffect(() => {
    if (activeDecade == null) { setDecadeSpeciesIds(new Set()); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase.rpc("list_species_first_pub_in_decade",
        { p_decade_start: activeDecade });
      if (!cancelled) setDecadeSpeciesIds(new Set((data || []).map((r) => r.id)));
    })();
    return () => { cancelled = true; };
  }, [activeDecade]);

  // Globe v2 — layer toggles. Layer panel (v2.3) wires these up so a
  // user can dial down to "just pins" or crank up to "every signal at
  // once". Defaults match the most engaging first-load impression.
  // v4 perf — heat off by default. The hex-bin layer is the most
  // expensive (47k pin → ~hundreds of hex objects in three.js).
  // Users can toggle it from the layer panel; pins + pulse + arcs +
  // research still tell the story on first load and feel responsive.
  const [layersOn, setLayersOn] = useState({
    heat:       false,  // hex-bin density heatmap of species pins (off by default)
    pulse:      true,   // CR pulse rings
    arcs:       true,   // collaboration arcs
    pins:       true,   // per-species IUCN-coloured dots
    research:   true,   // green glow for species with active programs
  });

  // Derive the old shape ({tiers, includeNullStatus, label, desc}) from
  // the new fine-grained state so existing call sites need no rewrite.
  const enabledTiers = useMemo(() => TIER_KEYS.filter((t) => tierState[t]), [tierState]);
  const mode = useMemo(() => {
    const presetMatch = TIER_PRESETS.find((p) =>
      p.tiers.length === enabledTiers.length
      && p.tiers.every((k) => enabledTiers.includes(k))
      && p.includeNull === includeNull
    );
    return {
      label: presetMatch?.label || "Custom",
      desc:  presetMatch?.label || enabledTiers.join("+") + (includeNull ? "+unrated" : ""),
      tiers: enabledTiers.length > 0 ? enabledTiers : null,
      includeNullStatus: includeNull,
    };
  }, [enabledTiers, includeNull]);

  // Load the full family list + country list + pulse + arc data once
  useEffect(() => {
    (async () => {
      const [fams, countries, pulse, arcs, research] = await Promise.all([
        supabase.rpc("get_atlas_family_counts"),
        supabase.rpc("list_atlas_countries"),
        supabase.rpc("get_globe_pulse_countries", { p_limit: 12 }),
        supabase.rpc("get_globe_arcs",            { p_limit: 25 }),
        supabase.rpc("list_active_research_species"),
      ]);
      setAllFamilies(Array.isArray(fams.data)      ? fams.data      : []);
      setAllCountries(Array.isArray(countries.data) ? countries.data : []);
      setPulseCountries(Array.isArray(pulse.data)  ? pulse.data    : []);
      setArcRows(Array.isArray(arcs.data)          ? arcs.data     : []);
      setResearchIds(new Set((research.data || []).map((r) => r.species_id)));
    })();
  }, []);

  // CR pulse rings — convert ISO codes → centroids.
  // Honour the country filter: when the user has narrowed to a subset
  // of countries (e.g. TR only) the red CR pulses should disappear
  // from everywhere else, not stay globally pinging. Without this the
  // user sees "111 species across 1 country" in the header but still
  // sees pulses on Iran / Africa / etc., which reads as inconsistent.
  const ringsData = useMemo(() => {
    const allow = countryFilter.length > 0 ? new Set(countryFilter) : null;
    return pulseCountries
      .filter((c) => !allow || allow.has(c.country))
      .map((c) => {
        const centroid = getCentroid(c.country);
        if (!centroid) return null;
        return {
          lat: centroid[0],
          lng: centroid[1],
          color: ["rgba(255,23,68,0.85)", "rgba(255,23,68,0)"],
          maxR: 6 + Math.log2((c.cr_count || 1) + 1) * 1.6,
        };
      })
      .filter(Boolean);
  }, [pulseCountries, countryFilter]);

  // v2.6 — extra ring at the radius search point. Painted in a softer
  // saffron so it reads as "your search anchor" not "another CR pulse".
  const radiusRingData = useMemo(() => {
    if (!radiusPoint) return [];
    // Globe.gl ring radius is in degrees (rough deg≈111km at the
    // equator), so radius_km / 111 gives a usable visual.
    return [{
      lat: radiusPoint.lat,
      lng: radiusPoint.lng,
      color: ["rgba(245,166,35,0.85)", "rgba(245,166,35,0)"],
      maxR: radiusKm / 60,  // a bit larger than literal so it reads as a ring not a dot
    }];
  }, [radiusPoint, radiusKm]);

  // Collaboration arcs — same logic: hide arcs that don't have at
  // least one endpoint in the current country filter set.
  const arcsData = useMemo(() => {
    const allow = countryFilter.length > 0 ? new Set(countryFilter) : null;
    return arcRows
      .filter((a) => !allow || allow.has(a.from_country) || allow.has(a.to_country))
      .map((a) => {
        const f = getCentroid(a.from_country);
        const t = getCentroid(a.to_country);
        if (!f || !t) return null;
        return {
          startLat: f[0], startLng: f[1],
          endLat:   t[0], endLng:   t[1],
          color: ["rgba(245,166,35,0.9)", "rgba(83,74,183,0.55)"],
        };
      })
      .filter(Boolean);
  }, [arcRows, countryFilter]);

  // Track explore-area dimensions so the globe canvas fills it on resize.
  useEffect(() => {
    if (!containerRef.current) return;
    function measure() {
      const r = containerRef.current.getBoundingClientRect();
      setSize({ w: Math.floor(r.width), h: Math.floor(r.height) });
    }
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Fetch country-level aggregation from the get_explore_country_summary RPC.
  // Re-runs when the user toggles the filter mode. Single DB-side aggregation
  // returns ~250 rows max regardless of how many species the atlas holds.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    const timeout = setTimeout(() => {
      if (cancelled) return;
      setLoadError("Timed out waiting for country summary — check console / network.");
      setLoading(false);
    }, 12000);

    (async () => {
      try {
        const [summaryRes, pinsRes] = await Promise.all([
          supabase.rpc("get_explore_country_summary", {
            p_tiers: mode.tiers,
            p_include_null: mode.includeNullStatus || false,
            p_families: familyFilter.length > 0 ? familyFilter : null,
            p_countries: countryFilter.length > 0 ? countryFilter : null,
          }),
          supabase.rpc("get_explore_species_pins", {
            p_tiers: mode.tiers,
            p_include_null: mode.includeNullStatus || false,
            p_families: familyFilter.length > 0 ? familyFilter : null,
            p_countries: countryFilter.length > 0 ? countryFilter : null,
            // v4 perf — was 5,000, halved to 2,500. RPC ranks by
            // composite_score so we keep the most relevant species
            // visible; the rest are still reachable via the country
            // panel + radius search. Cut three.js point count in half,
            // material throughput in half, hover hit-test halved.
            p_limit: 2500,
          }),
        ]);
        clearTimeout(timeout);
        if (cancelled) return;
        if (summaryRes.error) throw summaryRes.error;
        console.log(`[explore] tiers=[${enabledTiers.join(",")}]${includeNull ? "+null" : ""}, families=${familyFilter.length || "all"}, countries=${countryFilter.length || "all"}, ${summaryRes.data?.length || 0} country rows, ${pinsRes.data?.length || 0} species pins`);
        setCountrySummary(summaryRes.data || []);
        setSpeciesPins(Array.isArray(pinsRes.data) ? pinsRes.data : []);
        setLoading(false);
      } catch (e) {
        clearTimeout(timeout);
        if (cancelled) return;
        console.warn("[explore] country summary error", e.message);
        setLoadError(e?.message || "Country summary failed.");
        setLoading(false);
      }
    })();

    return () => { cancelled = true; clearTimeout(timeout); };
  }, [enabledTiers, includeNull, familyFilter, countryFilter]);

  // Build cluster points from the country summary — kept as a per-country
  // index so we can look up cluster meta (tier counts) when a species pin
  // is clicked. Defensive: every tier count and total coerced to 0 in case
  // a future RPC variant returns nulls.
  const clustersByCountry = useMemo(() => {
    const out = new Map();
    if (!Array.isArray(countrySummary)) return out;
    for (const c of countrySummary) {
      if (!c || !c.country) continue;
      const centroid = getCentroid(c.country);
      if (!centroid) continue;
      const tierCounts = {
        CR: c.cr_count || 0,
        EN: c.en_count || 0,
        VU: c.vu_count || 0,
        NT: c.nt_count || 0,
        LC: c.lc_count || 0,
        DD: c.dd_count || 0,
        NE: (c.ne_count || 0) + (c.null_count || 0),
      };
      const dominant = IUCN_TIER_ORDER.find((t) => tierCounts[t] > 0) || "NE";
      out.set(c.country, {
        kind: "country",
        country: c.country,
        lat: centroid[0],
        lng: centroid[1],
        tierCounts,
        iucn: dominant,
        color: IUCN_COLORS[dominant],
        count: c.total || 0,
        crCount: c.cr_count || 0,
        enCount: c.en_count || 0,
        vuCount: c.vu_count || 0,
      });
    }
    return out;
  }, [countrySummary]);

  // Per-species pin distribution. Spatial fidelity v3 — each species
  // hashes its id into a deterministic point INSIDE its country's
  // bounding box, so multiple species in the same country no longer
  // pile up at the centroid. Falls back to the old golden-angle spiral
  // around the centroid for countries that lack a bbox entry.
  const speciesPinPoints = useMemo(() => {
    const perCountryIdx = new Map();
    const out = [];
    for (const sp of speciesPins) {
      let lat, lng;
      const bboxPoint = pointInCountry(sp.country, sp.id);
      if (bboxPoint) {
        [lat, lng] = bboxPoint;
      } else {
        const centroid = getCentroid(sp.country);
        if (!centroid) continue;
        const idx = perCountryIdx.get(sp.country) || 0;
        perCountryIdx.set(sp.country, idx + 1);
        [lat, lng] = spreadPoint(centroid[0], centroid[1], idx);
      }
      const tier = sp.iucn || "NE";
      const hasResearch = researchIds.has(sp.id);
      const inDecade = decadeSpeciesIds.size > 0 && decadeSpeciesIds.has(sp.id);
      out.push({
        kind: "species",
        id: sp.id,
        country: sp.country,
        accepted_name: sp.accepted_name,
        family: sp.family,
        iucn: tier,
        population_trend: sp.population_trend,   // v2.5 — for trend arrow
        endemic: sp.endemic === true,            // v2.1 — for endemic chip
        hasResearch,                              // v2.4 — for green glow
        inDecade,                                 // v2.7 — chronological lens
        lat,
        lng,
        color: IUCN_COLORS[tier] || IUCN_COLORS.NE,
      });
    }
    return out;
  }, [speciesPins, researchIds, decadeSpeciesIds]);

  // v2.6 — Haversine distance helper + radius-filtered species list.
  // Pure client-side filter against speciesPinPoints (already in scope).
  const radiusSpecies = useMemo(() => {
    if (!radiusPoint) return [];
    const { lat: la1, lng: lo1 } = radiusPoint;
    const R = 6371; // km
    const toRad = (d) => (d * Math.PI) / 180;
    return speciesPinPoints
      .map((p) => {
        const dLat = toRad(p.lat - la1);
        const dLng = toRad(p.lng - lo1);
        const a = Math.sin(dLat/2) ** 2 +
                  Math.cos(toRad(la1)) * Math.cos(toRad(p.lat)) *
                  Math.sin(dLng/2) ** 2;
        const d = 2 * R * Math.asin(Math.sqrt(a));
        return { ...p, distKm: d };
      })
      .filter((p) => p.distKm <= radiusKm)
      .sort((a, b) => a.distKm - b.distKm)
      .slice(0, 200);
  }, [radiusPoint, radiusKm, speciesPinPoints]);

  // Globe v2.1 — endemism / density heat layer. Hex-bin every species
  // pin coordinate; the bin's height + colour reflect how many species
  // landed inside it. Reveals Anatolia, Med basin, Andes, Cape, NZ
  // alpine as biodiversity hotspots even before any pin is clicked.
  //
  // Built from speciesPinPoints (already filter-respecting), so when
  // the user narrows by country / IUCN tier / family, the heatmap
  // narrows in lockstep — never lying about where the pins really are.
  const heatPoints = useMemo(
    () => speciesPinPoints.map((p) => ({ lat: p.lat, lng: p.lng })),
    [speciesPinPoints]
  );

  const points = speciesPinPoints;
  const totalSpeciesCount = useMemo(
    () => Array.from(clustersByCountry.values()).reduce((s, c) => s + c.count, 0),
    [clustersByCountry]
  );
  const countryCount = clustersByCountry.size;

  // A globe point click can come from either a species pin or a (legacy)
  // country cluster — both resolve to opening the country panel.
  async function handlePointClick(p) {
    if (!p) return;
    const cluster = p.kind === "species"
      ? clustersByCountry.get(p.country)
      : p;
    if (!cluster) return;
    return openCountryPanel({ ...cluster, focusSpeciesId: p.kind === "species" ? p.id : null });
  }

  // Lazy-load species list + open-call count when a cluster is selected
  async function openCountryPanel(cluster) {
    setSelected({ ...cluster, kind: "country", species: [], openCalls: null });
    setSelectedSpeciesLoading(true);
    try {
      const [speciesRes, callsRes] = await Promise.all([
        supabase.rpc("get_explore_country_species", {
          p_country: cluster.country,
          p_tiers: mode.tiers,
          p_include_null: mode.includeNullStatus || false,
          p_limit: 200,
          p_offset: 0,
          p_families: familyFilter.length > 0 ? familyFilter : null,
        }),
        supabase.rpc("list_open_proposals_for_country", { p_country: cluster.country }),
      ]);
      if (speciesRes.error) throw speciesRes.error;
      const openCalls = Array.isArray(callsRes.data) ? callsRes.data.length : 0;
      setSelected((cur) => cur && cur.country === cluster.country
        ? { ...cur, species: speciesRes.data || [], openCalls }
        : cur
      );
    } catch (e) {
      console.warn("[explore] country species load failed:", e.message);
    } finally {
      setSelectedSpeciesLoading(false);
    }
  }


  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        height: "calc(100vh - 80px)",
        width: "100%",
        background:
          "radial-gradient(ellipse at center, #0a0a14 0%, #03030a 70%, #000 100%)",
        borderRadius: 14,
        overflow: "hidden",
        marginTop: -6,
      }}
    >
      <style>{`
        @media (max-width: 640px) {
          .geocon-country-panel {
            top: auto !important;
            right: 8px !important;
            left: 8px !important;
            bottom: 8px !important;
            width: auto !important;
            max-height: 60vh !important;
          }
          .geocon-family-filter { right: 12px !important; top: 56px !important; }
        }
      `}</style>
      <Header
        countryCount={countryCount}
        speciesCount={totalSpeciesCount}
        pinsShown={speciesPinPoints.length}
        loading={loading}
        error={loadError}
        zoomedIn={altitude <= LOD_ALTITUDE}
        mode={mode}
      />

      {/* Left rail — IUCN tier toggles + country picker.
          Replaced the old top-right 3-mode toggle. Researchers asked
          for finer-grained control so plant diversity (NT/LC) and
          unrated rows could surface alongside the threatened triple. */}
      <FilterRail
        tierState={tierState}
        setTierState={setTierState}
        includeNull={includeNull}
        setIncludeNull={setIncludeNull}
        countryFilter={countryFilter}
        setCountryFilter={setCountryFilter}
        allCountries={allCountries}
      />

      <FamilyFilter
        allFamilies={allFamilies}
        selected={familyFilter}
        onChange={setFamilyFilter}
      />

      {/* v2.2 — Discovery spotlight. Rotates a CR/EN/VU species every
          25s into the top-right corner with a one-paragraph story.
          Hidden when the radius search panel is open so the right edge
          isn't fighting for the same space. */}
      {!radiusPoint && <GlobeSpotlight />}

      {/* v2.3 — Layer control. Chip in the top-right that opens into a
          toggle list for every globe layer (heat / pulse / arcs / pins
          / research). Sits to the LEFT of the Spotlight card when both
          are open, sliding clear of it. */}
      <GlobeLayerPanel layersOn={layersOn} setLayersOn={setLayersOn} />

      {/* v2.6 — Radius search side panel. Slides in from the right
          when Shift+click drops an anchor. */}
      <GlobeRadiusPanel
        anchor={radiusPoint}
        radiusKm={radiusKm}
        setRadiusKm={setRadiusKm}
        species={radiusSpecies}
        onClose={() => setRadiusPoint(null)}
      />

      {/* Discovery timeline strip removed from the globe — was crowding
          the visual rhythm. The decade-highlight feature lives on as
          dormant state (activeDecade) so a future /geocon/timeline
          standalone route can re-mount the component without code
          churn. */}

      {size.w > 0 && size.h > 0 && (
        <Globe
          width={size.w}
          height={size.h}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          showAtmosphere
          // Atmosphere palette aligned with v3.1 brand wells — emerald
          // halo on midnight backdrop reads as "research / conservation"
          // rather than the generic blue Earth glow.
          atmosphereColor="#5BD8B1"
          atmosphereAltitude={0.22}

          /* v2.1 — Hex-bin density heatmap. Each species pin is one
             vote inside its hex; bin colour + altitude scale with the
             vote count, so dense regions (Anatolia, Med basin, Andes,
             Cape, NZ) literally glow. Toggle in the layer panel. */
          hexBinPointsData={layersOn.heat ? heatPoints : []}
          hexBinPointLat="lat"
          hexBinPointLng="lng"
          // v4 perf — was 3 (smaller hexes → more objects, ~3x).
          // Bumped to 4 (larger hexes). Visually a touch coarser but
          // still gives clear density signal, and three.js scene weight
          // drops dramatically.
          hexBinResolution={4}
          hexAltitude={(bin) => Math.min(0.18, 0.012 * Math.log2((bin.points.length || 1) + 1))}
          hexTopColor={(bin) => {
            // 1 species → cool teal · 8 → amber · 32+ → saturated rose
            const n = bin.points.length || 0;
            const t = Math.min(1, Math.log2(n + 1) / 6);
            // Gradient: teal → amber → rose
            if (t < 0.5) {
              // teal → amber
              const k = t * 2;
              return `rgba(${Math.round(91 + (245-91)*k)}, ${Math.round(216 - (216-166)*k)}, ${Math.round(177 - (177-35)*k)}, 0.62)`;
            }
            const k = (t - 0.5) * 2;
            return `rgba(${Math.round(245 + (255-245)*k)}, ${Math.round(166 - (166-72)*k)}, ${Math.round(35 + (90-35)*k)}, 0.78)`;
          }}
          hexSideColor={() => "rgba(255,200,120,0.18)"}
          hexBinMerge={false}
          hexLabel={(bin) => {
            const n = bin.points.length || 0;
            return `<div style="background:rgba(28,12,44,0.95);color:#FFD79B;padding:6px 10px;border-radius:8px;border:1px solid rgba(245,166,35,0.35);font-family:Inter,sans-serif;font-size:11px;font-weight:600">
              ${n} species in this region
            </div>`;
          }}

          /* CR pulse rings + (when set) the v2.6 radius-search ring */
          ringsData={[
            ...(layersOn.pulse ? ringsData : []),
            ...radiusRingData,
          ]}
          ringColor={(d) => (t) => {
            // r is a 0..1 propagation parameter; fade alpha as it spreads
            const a = 0.85 * (1 - t);
            return `rgba(255,23,68,${Math.max(a, 0)})`;
          }}
          ringMaxRadius={(d) => d.maxR}
          ringPropagationSpeed={2.5}
          ringRepeatPeriod={1500}
          ringAltitude={0.005}

          /* Collaboration arcs */
          arcsData={layersOn.arcs ? arcsData : []}
          arcColor="color"
          arcStroke={0.4}
          arcAltitudeAutoScale={0.4}
          arcDashLength={0.4}
          arcDashGap={0.6}
          arcDashAnimateTime={2400}

          /* Per-species pins, deterministically spread inside each country
             via golden-angle spiral. One dot per species, IUCN-colored,
             much smaller than the legacy country clusters. */
          pointsData={layersOn.pins ? points : []}
          pointLat="lat"
          pointLng="lng"
          // v2.4 — research overlay: species with an active program lift
          // higher (0.025 vs 0.008) and read with a +0.06 radius bump so
          // they stand off the surface as a soft glow. layersOn.research
          // toggles the lift back to baseline.
          pointAltitude={(p) => (layersOn.research && p.hasResearch) ? 0.035 : 0.008}
          pointRadius={(p) => {
            let r = p.iucn === "CR" ? 0.18 : p.iucn === "EN" ? 0.16 : 0.13;
            if (layersOn.research && p.hasResearch) r += 0.07;
            return r;
          }}
          // Research-active pins paint with an additive green tint over
          // their IUCN base via the pointColor callback below — gives
          // the halo effect without needing a second pointsData layer.
          // v2.7 — when an activeDecade is set, species OUTSIDE that
          // decade fade to a muted grey so the lens reads.
          pointColor={(p) => {
            if (activeDecade != null) {
              if (p.inDecade) return "#FFD79B";   // hot saffron for the lens
              return "rgba(255,255,255,0.15)";    // muted background
            }
            if (layersOn.research && p.hasResearch) return "#5BD8B1";
            return p.color;
          }}
          pointResolution={6}
          onPointClick={handlePointClick}
          pointLabel={(p) => {
            const tier = p.iucn || "NE";
            const tierTint = IUCN_PANEL_TINT[tier] || "#FFD79B";
            // v2.5 — Trajectory arrow per population_trend. Decreasing is
            // hot red to draw the eye, increasing is teal for "improving".
            const trend = (p.population_trend || "").toLowerCase();
            const trendGlyph = trend === "decreasing" ? "↘"
                             : trend === "increasing" ? "↗"
                             : trend === "stable"     ? "→" : "";
            const trendTint = trend === "decreasing" ? "#FF8B96"
                            : trend === "increasing" ? "#5BD8B1"
                            : trend === "stable"     ? "#A8C9BE" : "transparent";
            const endemicChip = p.endemic
              ? `<span style="font-size:9px;font-weight:700;padding:1px 6px;border-radius:999px;background:rgba(91,216,177,0.20);color:#5BD8B1;margin-left:4px">ENDEMIC</span>`
              : "";
            return `
              <div style="font-family:'Crimson Pro',Georgia,serif;background:linear-gradient(135deg,rgba(28,12,44,0.96),rgba(20,34,40,0.96));color:#f3e8d3;padding:8px 12px;border-radius:10px;border:1px solid rgba(91,216,177,.35);box-shadow:0 6px 22px rgba(0,0,0,0.45);font-size:13px;max-width:280px">
                <div style="font-style:italic;font-weight:700;line-height:1.25">
                  ${p.accepted_name || p.id}
                  ${trendGlyph ? `<span style="color:${trendTint};font-style:normal;font-weight:700;margin-left:6px">${trendGlyph}</span>` : ""}
                </div>
                <div style="font-family:Inter,-apple-system,sans-serif;font-size:10px;color:#A8C9BE;letter-spacing:.5px;text-transform:uppercase;margin-top:4px;font-weight:600">
                  ${p.family || ""} · ${p.country} · <span style="color:${tierTint}">${tier}</span>${endemicChip}
                </div>
                ${trend ? `<div style="font-family:Inter,-apple-system,sans-serif;font-size:10px;color:${trendTint};margin-top:3px">Population ${trend}</div>` : ""}
              </div>
            `;
          }}
          onZoom={({ altitude: a }) => setAltitude(a)}

          // v2.6 — Shift+click anywhere on the globe drops a search
          // radius. Plain click stays unchanged (Globe.gl emits
          // onGlobeClick with {lat, lng, event}).
          onGlobeClick={({ lat, lng }, event) => {
            if (event?.shiftKey) {
              setRadiusPoint({ lat, lng });
            }
          }}
        />
      )}

      {selected?.kind === "country" && (
        <CountryPanel
          cluster={selected}
          speciesLoading={selectedSpeciesLoading}
          onClose={() => setSelected(null)}
        />
      )}

      <Legend tiers={mode.tiers} />
    </div>
  );
}

function FamilyFilter({ allFamilies, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  /* className applied below for mobile media-query override */

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = Array.isArray(allFamilies) ? allFamilies : [];
    if (!q) return rows;
    return rows.filter((r) => (r.family || "").toLowerCase().includes(q));
  }, [allFamilies, query]);

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  function toggle(name) {
    if (selectedSet.has(name)) {
      onChange(selected.filter((f) => f !== name));
    } else {
      onChange([...selected, name]);
    }
  }

  const label = selected.length === 0
    ? "All families"
    : selected.length === 1
    ? selected[0]
    : `${selected.length} families`;

  return (
    <div
      className="geocon-family-filter"
      style={{
        position: "absolute",
        top: 16,
        // FilterToggle (which used to sit at top-right) was removed in
        // the rail refactor; Family chip now lives flush at top-right.
        right: 16,
        zIndex: 3,
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          padding: "6px 12px",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: 0.4,
          color: selected.length > 0 ? "#FFE6BC" : "rgba(255, 215, 155, 0.75)",
          background: selected.length > 0
            ? "rgba(245, 166, 35, 0.22)"
            : "rgba(28, 12, 44, 0.6)",
          border: "1px solid rgba(245, 166, 35, 0.22)",
          borderRadius: 10,
          cursor: "pointer",
          backdropFilter: "blur(6px)",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span style={{ fontSize: 13 }}>🌿</span>
        {label}
        <span style={{ fontSize: 9, opacity: 0.7 }}>▾</span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: 38,
            right: 0,
            width: 260,
            maxHeight: 360,
            background: "rgba(28, 12, 44, 0.95)",
            border: "1px solid rgba(245, 166, 35, 0.35)",
            borderRadius: 10,
            backdropFilter: "blur(10px)",
            boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
            padding: 10,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search families…"
            style={{
              padding: "6px 9px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(245, 166, 35, 0.18)",
              borderRadius: 7,
              color: "#FFE6BC",
              fontSize: 11,
              outline: "none",
            }}
          />
          {selected.length > 0 && (
            <button
              onClick={() => onChange([])}
              style={{
                padding: "4px 8px",
                fontSize: 10,
                color: "#FFD79B",
                background: "transparent",
                border: "1px solid rgba(245, 166, 35, 0.22)",
                borderRadius: 6,
                cursor: "pointer",
                letterSpacing: 0.3,
              }}
            >
              Clear all ({selected.length})
            </button>
          )}
          <div style={{ overflow: "auto", maxHeight: 240, display: "flex", flexDirection: "column", gap: 2 }}>
            {filtered.length === 0 && (
              <div style={{ fontSize: 11, color: "rgba(255, 215, 155, 0.5)", padding: "6px 4px" }}>
                No matches.
              </div>
            )}
            {filtered.map((row) => {
              const active = selectedSet.has(row.family);
              return (
                <button
                  key={row.family}
                  onClick={() => toggle(row.family)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "5px 8px",
                    background: active ? "rgba(245, 166, 35, 0.18)" : "transparent",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    color: active ? "#FFE6BC" : "rgba(243, 232, 211, 0.78)",
                    fontSize: 11,
                    fontWeight: active ? 600 : 400,
                    fontStyle: "italic",
                    fontFamily: "var(--gx-font-serif)",
                    textAlign: "left",
                  }}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {active ? "✓ " : ""}{row.family}
                  </span>
                  <span style={{ fontSize: 9, color: "rgba(255, 215, 155, 0.55)", marginLeft: 8, flexShrink: 0, fontStyle: "normal" }}>
                    {row.species_count ?? row.count ?? ""}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function FilterRail({
  tierState, setTierState,
  includeNull, setIncludeNull,
  countryFilter, setCountryFilter,
  allCountries,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [countryQuery, setCountryQuery] = useState("");

  function toggleTier(t) {
    setTierState((s) => ({ ...s, [t]: !s[t] }));
  }
  function applyPreset(preset) {
    const next = { CR:false, EN:false, VU:false, NT:false, LC:false, DD:false, NE:false };
    preset.tiers.forEach((t) => { next[t] = true; });
    setTierState(next);
    setIncludeNull(!!preset.includeNull);
  }
  function clearCountries() { setCountryFilter([]); setCountryQuery(""); }
  function toggleCountry(code) {
    setCountryFilter((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  }

  const q = countryQuery.trim().toLowerCase();
  const visibleCountries = useMemo(() => {
    const list = Array.isArray(allCountries) ? allCountries : [];
    // Enrich each row with its readable name so search can match
    // either form ("Tur" → Turkey, "TR" → TR). Sort by total desc
    // is preserved (RPC already orders by count).
    const enriched = list
      .filter((c) => c && c.country)
      .map((c) => ({ ...c, name: countryName(c.country) || c.country }));
    if (!q) return enriched.slice(0, 80);
    return enriched
      .filter((c) =>
        c.country.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q)
      )
      .slice(0, 80);
  }, [allCountries, q]);

  return (
    <aside
      style={{
        position: "absolute",
        top: 16,
        left: 16,
        zIndex: 2,
        width: collapsed ? 38 : 240,
        maxHeight: "calc(100% - 32px)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        background: "rgba(28, 12, 44, 0.72)",
        border: "1px solid rgba(245, 166, 35, 0.22)",
        borderRadius: 10,
        backdropFilter: "blur(8px) saturate(140%)",
        WebkitBackdropFilter: "blur(8px) saturate(140%)",
        color: "#f3e8d3",
        transition: "width 0.18s ease",
      }}
    >
      <button
        onClick={() => setCollapsed((c) => !c)}
        title={collapsed ? "Expand filters" : "Collapse filters"}
        style={{
          background: "transparent",
          border: "none",
          padding: "8px 10px",
          color: "#FFD79B",
          cursor: "pointer",
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 10,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          fontWeight: 700,
        }}
      >
        <span>{collapsed ? "▸" : "▾"}</span>
        {!collapsed && <span>Filter</span>}
      </button>

      {!collapsed && (
        <div style={{ padding: "0 12px 12px", overflowY: "auto", overflowX: "hidden" }}>
          {/* Presets */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
            {TIER_PRESETS.map((p) => (
              <button key={p.key} onClick={() => applyPreset(p)}
                style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: 0.4,
                  padding: "3px 7px", borderRadius: 999,
                  background: "rgba(245,166,35,0.10)",
                  color: "#FFD79B",
                  border: "1px solid rgba(245,166,35,0.22)",
                  cursor: "pointer",
                }}>
                {p.label}
              </button>
            ))}
          </div>

          {/* IUCN tier toggles */}
          <div style={{
            fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase",
            color: "#FFD79B", fontWeight: 700, marginBottom: 6,
          }}>
            IUCN status
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 12 }}>
            {TIER_KEYS.map((t) => (
              <TierToggle key={t} tier={t} on={!!tierState[t]} onToggle={() => toggleTier(t)} />
            ))}
            <label style={{
              display: "flex", alignItems: "center", gap: 8,
              fontSize: 11, padding: "4px 6px",
              color: includeNull ? "#f3e8d3" : "rgba(243,232,211,0.55)",
              cursor: "pointer", borderRadius: 6,
              background: includeNull ? "rgba(245,166,35,0.10)" : "transparent",
            }}>
              <input type="checkbox" checked={includeNull}
                onChange={(e) => setIncludeNull(e.target.checked)}
                style={{ accentColor: "#FFD600" }} />
              <span style={{
                width: 22, height: 12, borderRadius: 3,
                background: "#5a4b30", flexShrink: 0,
              }} />
              <span style={{ flex: 1 }}>Unrated</span>
            </label>
          </div>

          {/* Country picker */}
          <div style={{
            fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase",
            color: "#FFD79B", fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 6,
          }}>
            <span>Country</span>
            <span style={{ fontWeight: 400, color: "rgba(255,215,155,0.55)", letterSpacing: 0.3 }}>
              {countryFilter.length > 0 ? `${countryFilter.length} on` : "all"}
            </span>
          </div>
          <input
            value={countryQuery}
            onChange={(e) => setCountryQuery(e.target.value)}
            placeholder="Search countries…"
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "5px 8px", fontSize: 11,
              background: "rgba(0,0,0,0.32)",
              color: "#f3e8d3",
              border: "1px solid rgba(245,166,35,0.22)",
              borderRadius: 6,
              fontFamily: "var(--gx-font-body)",
              marginBottom: 5,
              outline: "none",
            }}
          />
          {countryFilter.length > 0 && (
            <button onClick={clearCountries}
              style={{
                fontSize: 9, fontWeight: 600,
                background: "transparent", color: "#FFD79B",
                border: "1px solid rgba(245,166,35,0.22)",
                borderRadius: 5, padding: "2px 6px",
                cursor: "pointer", marginBottom: 6,
              }}>
              ✕ Clear all
            </button>
          )}
          <div style={{ maxHeight: 220, overflowY: "auto", display: "flex", flexDirection: "column", gap: 1 }}>
            {visibleCountries.length === 0 ? (
              <div style={{ fontSize: 10, color: "rgba(243,232,211,0.45)", fontStyle: "italic", padding: 4 }}>
                No match.
              </div>
            ) : visibleCountries.map((c) => {
              const on = countryFilter.includes(c.country);
              return (
                <label key={c.country} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  fontSize: 10, padding: "3px 4px", borderRadius: 4,
                  background: on ? "rgba(245,166,35,0.12)" : "transparent",
                  color: on ? "#f3e8d3" : "rgba(243,232,211,0.65)",
                  cursor: "pointer",
                }}>
                  <input type="checkbox" checked={on}
                    onChange={() => toggleCountry(c.country)}
                    style={{ accentColor: "#FFD600" }} />
                  <span style={{ flex: 1, display: "flex", alignItems: "center", gap: 5, overflow: "hidden", whiteSpace: "nowrap" }}>
                    <span style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: 0.3,
                      color: "rgba(255,215,155,0.55)",
                      fontFamily: "var(--gx-font-mono)",
                      flexShrink: 0,
                    }}>
                      {c.country}
                    </span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                      {c.name}
                    </span>
                  </span>
                  <span style={{
                    fontSize: 9, color: "rgba(255,215,155,0.55)",
                    fontFamily: "var(--gx-font-mono)",
                  }}>
                    {c.total}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}

function TierToggle({ tier, on, onToggle }) {
  const color = IUCN_COLORS[tier] || "#888";
  return (
    <label style={{
      display: "flex", alignItems: "center", gap: 8,
      fontSize: 11, padding: "4px 6px",
      color: on ? "#f3e8d3" : "rgba(243,232,211,0.55)",
      cursor: "pointer", borderRadius: 6,
      background: on ? "rgba(245,166,35,0.10)" : "transparent",
    }}>
      <input type="checkbox" checked={on} onChange={onToggle}
        style={{ accentColor: color }} />
      <span style={{
        width: 22, height: 12, borderRadius: 3,
        background: color, flexShrink: 0,
        opacity: on ? 1 : 0.4,
      }} />
      <span style={{ flex: 1 }}>{tier}</span>
      <span style={{ fontSize: 9, color: "rgba(255,215,155,0.55)", whiteSpace: "nowrap" }}>
        {IUCN_LABEL[tier]}
      </span>
    </label>
  );
}

function Header({ countryCount, speciesCount, pinsShown, loading, error, zoomedIn, mode }) {
  // Scope label derived from the current preset match (or "Custom · X+Y+Z"
  // when the user has built a non-preset combination).
  const scopeLabel = mode.label === "Custom"
    ? `Custom · ${(mode.tiers || []).join("+") || "—"}${mode.includeNullStatus ? "+unrated" : ""}`
    : mode.label === "All"       ? "ALL geophytes"
    : mode.label === "Evaluated" ? "evaluated geophytes (CR→LC)"
    : mode.label === "Diversity" ? "diversity layer (NT/LC/DD + unrated)"
    : "threatened geophytes (CR + EN + VU)";
  return (
    <div
      style={{
        position: "absolute",
        top: 16,
        // FilterRail occupies the top-left at width 240 + 16 inset, so
        // the header eyebrow + title now starts at left: 272 to avoid
        // overlapping. Reads as a clean "filter | scope" two-column
        // split at the globe's top edge.
        left: 272,
        zIndex: 2,
        color: "#f3e8d3",
        pointerEvents: "none",
        maxWidth: 520,
      }}
    >
      <div style={{ fontSize: 10, letterSpacing: 3.5, textTransform: "uppercase", color: "#FFD79B", fontWeight: 600 }}>
        Explore · {scopeLabel}
      </div>
      <div
        style={{
          fontFamily: "var(--gx-font-serif)",
          fontSize: 22,
          fontWeight: 700,
          marginTop: 4,
          letterSpacing: -0.4,
        }}
      >
        {loading
          ? "Loading the world…"
          : error
          ? "Couldn't load species data"
          : `${speciesCount.toLocaleString()} species across ${countryCount} countries`}
      </div>
      {!loading && !error && (
        <div style={{ fontSize: 10, color: "#FFD79B", marginTop: 2, letterSpacing: 0.5, lineHeight: 1.6 }}>
          {pinsShown.toLocaleString()} pins on the globe
          {pinsShown >= 18000 && " · capped at 18k for performance"}
          {mode.label === "Threat" && (
            <span style={{ display: "block", color: "rgba(255,215,155,0.7)", fontStyle: "italic", marginTop: 2 }}>
              Only ~430 of 47k catalogued species have a published IUCN status —
              switch to <strong style={{ color: "#FFE6BC" }}>All</strong> to see every species with known geography.
            </span>
          )}
          {mode.label === "All" && (
            <span style={{ display: "block", color: "rgba(255,215,155,0.7)", fontStyle: "italic", marginTop: 2 }}>
              Showing every species with a known country (Phase 3 GBIF backfill still in progress).
            </span>
          )}
        </div>
      )}
      <div style={{ fontSize: 11, color: error ? "#FFB8B8" : "#A8C49C", marginTop: 4, fontStyle: "italic", fontFamily: "var(--gx-font-serif)" }}>
        {error
          ? error
          : "Drag to spin · scroll to zoom · click any pin for that country's species list"}
      </div>
    </div>
  );
}

function Legend({ tiers }) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 16,
        left: 20,
        zIndex: 2,
        display: "flex",
        gap: 12,
        alignItems: "center",
        padding: "7px 14px",
        background: "rgba(28, 12, 44, 0.6)",
        border: "1px solid rgba(245, 166, 35, 0.22)",
        borderRadius: 999,
        backdropFilter: "blur(6px)",
        color: "#f3e8d3",
        fontSize: 10.5,
        letterSpacing: 0.3,
        flexWrap: "wrap",
        maxWidth: "calc(100% - 380px)",
      }}
    >
      {tiers.map((t) => (
        <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 5 }} title={IUCN_LABEL[t]}>
          <Dot color={IUCN_COLORS[t]} /> {t}
        </span>
      ))}
    </div>
  );
}

function Dot({ color }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: color,
        marginRight: 4,
        boxShadow: `0 0 8px ${color}`,
      }}
    />
  );
}

function SpeciesPanel({ species, onClose }) {
  const tint = IUCN_PANEL_TINT[species.iucn] || IUCN_PANEL_TINT.CR;
  return (
    <div
      style={{
        position: "absolute",
        top: 16,
        right: 16,
        width: 320,
        maxHeight: "calc(100% - 32px)",
        overflow: "auto",
        zIndex: 3,
        background: "rgba(28, 12, 44, 0.88)",
        border: "1px solid rgba(245, 166, 35, 0.35)",
        borderRadius: 14,
        backdropFilter: "blur(10px)",
        color: "#f3e8d3",
        padding: 18,
        boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 10, letterSpacing: 2.5, textTransform: "uppercase", color: tint, fontWeight: 600 }}>
            {species.iucn} · {species.country}
          </div>
          <div
            style={{
              fontFamily: "var(--gx-font-serif)",
              fontStyle: "italic",
              fontSize: 18,
              marginTop: 4,
              color: "#FFE6BC",
              lineHeight: 1.2,
            }}
          >
            {species.name}
          </div>
          {species.family && (
            <div style={{ fontSize: 11, color: "#A8C49C", marginTop: 2 }}>{species.family}</div>
          )}
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{ background: "transparent", border: "none", color: "#FFD15C", fontSize: 16, cursor: "pointer", padding: 0, lineHeight: 1 }}
        >
          ✕
        </button>
      </div>

      {species.thumbnail ? (
        <img
          src={species.thumbnail}
          alt={species.name}
          style={{ width: "100%", marginTop: 12, borderRadius: 10, border: "1px solid rgba(245, 166, 35, 0.2)" }}
        />
      ) : (
        <div style={{ marginTop: 12, padding: "26px 12px", border: "1px dashed rgba(245, 166, 35, 0.25)", borderRadius: 10, textAlign: "center", fontSize: 10, color: "#8a6f56", letterSpacing: 0.5 }}>
          no image yet
        </div>
      )}

      {typeof species.score === "number" && (
        <div style={{ marginTop: 12, fontSize: 11, color: "#cdbb9c" }}>
          composite score <strong style={{ color: "#FFE6BC" }}>{species.score.toFixed(1)}</strong>
        </div>
      )}

      <Link
        href={species.id ? `/geocon/species/${species.id}` : "/geocon/species"}
        style={{
          display: "block",
          textAlign: "center",
          marginTop: 14,
          padding: "8px 12px",
          fontSize: 11,
          fontWeight: 600,
          color: "#1a0d2e",
          background: "linear-gradient(140deg, #FFD15C 0%, #F5A623 50%, #E5722B 100%)",
          borderRadius: 8,
          textDecoration: "none",
          letterSpacing: 0.4,
        }}
      >
        Open species page →
      </Link>
    </div>
  );
}

function CountryPanel({ cluster, speciesLoading, onClose }) {
  const [query, setQuery] = useState("");
  /* className applied below for mobile bottom-sheet override */
  // species already arrive sorted from the RPC (CR-first then alphabetical)
  const raw = cluster.species || [];
  const sorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return raw;
    return raw.filter((s) =>
      (s.accepted_name || "").toLowerCase().includes(q) ||
      (s.family || "").toLowerCase().includes(q)
    );
  }, [raw, query]);

  return (
    <div
      className="geocon-country-panel"
      style={{
        position: "absolute",
        top: 16,
        right: 16,
        width: 340,
        maxHeight: "calc(100% - 32px)",
        overflow: "auto",
        zIndex: 3,
        background: "rgba(28, 12, 44, 0.88)",
        border: "1px solid rgba(245, 166, 35, 0.35)",
        borderRadius: 14,
        backdropFilter: "blur(10px)",
        color: "#f3e8d3",
        padding: 18,
        boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 10, letterSpacing: 2.5, textTransform: "uppercase", color: "#FFD79B", fontWeight: 600 }}>
            Country
          </div>
          <div
            style={{
              fontFamily: "var(--gx-font-display)",
              fontWeight: 900,
              fontSize: 28,
              marginTop: 2,
              color: "#FFE6BC",
              letterSpacing: -1,
              lineHeight: 1,
            }}
          >
            {cluster.country}
          </div>
          <div style={{ fontSize: 12, color: "#A8C49C", marginTop: 6, fontStyle: "italic", fontFamily: "var(--gx-font-serif)" }}>
            {cluster.count} species
            {IUCN_TIER_ORDER
              .filter((t) => cluster.tierCounts && cluster.tierCounts[t] > 0)
              .map((t) => (
                <span key={t}>
                  {" · "}
                  <span style={{ color: IUCN_PANEL_TINT[t] }}>{cluster.tierCounts[t]} {t}</span>
                </span>
              ))}
          </div>
          {typeof cluster.openCalls === "number" && cluster.openCalls > 0 && (
            <Link
              href={`/geocon/proposals/open?country=${encodeURIComponent(cluster.country)}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                marginTop: 8,
                padding: "3px 9px",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 0.4,
                background: "rgba(245, 166, 35, 0.18)",
                border: "1px solid rgba(245, 166, 35, 0.35)",
                color: "#FFE6BC",
                borderRadius: 999,
                textDecoration: "none",
              }}
            >
              📣 {cluster.openCalls} open call{cluster.openCalls === 1 ? "" : "s"}
            </Link>
          )}
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            background: "transparent",
            border: "none",
            color: "#FFD15C",
            fontSize: 16,
            cursor: "pointer",
            padding: 0,
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={`Filter ${raw.length} species…`}
        style={{
          width: "100%",
          marginTop: 14,
          padding: "7px 10px",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(245, 166, 35, 0.18)",
          borderRadius: 8,
          color: "#FFE6BC",
          fontSize: 11,
          outline: "none",
          boxSizing: "border-box",
        }}
      />

      <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
        {speciesLoading && sorted.length === 0 && (
          <div style={{ fontSize: 11, color: "rgba(255, 215, 155, 0.55)", padding: "10px 0", textAlign: "center" }}>
            Loading species…
          </div>
        )}
        {!speciesLoading && sorted.length === 0 && raw.length > 0 && (
          <div style={{ fontSize: 11, color: "rgba(255, 215, 155, 0.55)", padding: "10px 0", textAlign: "center" }}>
            No matches for “{query}”.
          </div>
        )}
        {sorted.map((s) => (
          <Link
            key={s.id}
            href={`/geocon/species/${s.id}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 10px",
              borderRadius: 8,
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(245, 166, 35, 0.12)",
              textDecoration: "none",
              color: "inherit",
              transition: "background 0.12s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(245, 166, 35, 0.10)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)"; }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: IUCN_COLORS[s.iucn_status] || IUCN_COLORS.NE,
                flexShrink: 0,
                boxShadow: `0 0 6px ${IUCN_COLORS[s.iucn_status] || IUCN_COLORS.NE}80`,
              }}
            />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontFamily: "var(--gx-font-serif)",
                  fontStyle: "italic",
                  fontSize: 13,
                  color: "#FFE6BC",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {s.accepted_name}
              </div>
              {s.family && (
                <div style={{ fontSize: 10, color: "#A8C49C", marginTop: 1 }}>{s.family}</div>
              )}
            </div>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: 0.5,
                color: IUCN_PANEL_TINT[s.iucn_status] || IUCN_PANEL_TINT.NE,
                flexShrink: 0,
              }}
            >
              {s.iucn_status || "NE"}
            </span>
          </Link>
        ))}
      </div>

      <Link
        href={cluster?.country ? `/geocon/countries/${cluster.country}` : "/geocon/species"}
        style={{
          display: "block",
          textAlign: "center",
          marginTop: 14,
          padding: "8px 12px",
          fontSize: 11,
          fontWeight: 600,
          color: "#1a0d2e",
          background: "linear-gradient(140deg, #FFD15C 0%, #F5A623 50%, #E5722B 100%)",
          borderRadius: 8,
          textDecoration: "none",
          letterSpacing: 0.4,
        }}
      >
        Open country dashboard →
      </Link>
    </div>
  );
}
