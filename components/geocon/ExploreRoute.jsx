"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { getCentroid } from "../../lib/countryCentroids";

// react-globe.gl pulls in three.js which only runs in the browser.
const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

const IUCN_THREAT = ["CR", "EN", "VU"]; // ordered: most → least urgent
const IUCN_COLORS = {
  CR: "#FF1744",   // vivid red — critically endangered, alarm
  EN: "#FF9100",   // saturated orange — endangered, elevated concern
  VU: "#FFD600",   // bright yellow — vulnerable, watchful
};
const IUCN_PANEL_TINT = {
  CR: "#FF8B96",
  EN: "#FFB870",
  VU: "#FFE875",
};
const IUCN_LABEL = {
  CR: "Critically endangered",
  EN: "Endangered",
  VU: "Vulnerable",
};

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
  const angle = (idx * 137.508) * (Math.PI / 180);
  // Step out gently — first pin near centroid, later pins farther out
  const r = 0.7 + (idx % 6) * 0.35 + Math.floor(idx / 6) * 0.25;
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

  const [species, setSpecies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [selected, setSelected] = useState(null);   // {kind:'country', cluster} | {kind:'species', species}
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [altitude, setAltitude] = useState(2.5);

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

  // Fetch threatened species (CR/EN/VU). Timeout guard prevents a silent stall.
  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => {
      if (cancelled || !loading) return;
      setLoadError("Timed out waiting for species data — check console / network.");
      setLoading(false);
    }, 12000);

    (async () => {
      try {
        const { data, error } = await supabase
          .from("species")
          .select("id, accepted_name, family, iucn_status, country_focus, thumbnail_url, composite_score")
          .in("iucn_status", IUCN_THREAT);
        clearTimeout(timeout);
        if (cancelled) return;
        if (error) {
          console.warn("[explore] species fetch error", error.message);
          setLoadError(error.message || "Species fetch failed.");
          setLoading(false);
          return;
        }
        const withCountry = (data || []).filter((s) => s.country_focus);
        console.log(`[explore] loaded ${withCountry.length} threatened species (CR/EN/VU) with country_focus`);
        setSpecies(withCountry);
        setLoading(false);
      } catch (e) {
        clearTimeout(timeout);
        if (cancelled) return;
        setLoadError(e?.message || "Unexpected error.");
        setLoading(false);
      }
    })();

    return () => { cancelled = true; clearTimeout(timeout); };
  }, []);

  // Two parallel views of the same data:
  //   • clusterPoints — one marker per country (used when zoomed out)
  //   • speciesPoints — one marker per species, spread around centroid (used when zoomed in)
  const { clusterPoints, speciesPoints } = useMemo(() => {
    const byCountry = new Map();
    for (const s of species) {
      const c = getCentroid(s.country_focus);
      if (!c) continue;
      let entry = byCountry.get(s.country_focus);
      if (!entry) {
        entry = {
          kind: "country",
          country: s.country_focus,
          lat: c[0],
          lng: c[1],
          species: [],
          crCount: 0,
          enCount: 0,
          vuCount: 0,
        };
        byCountry.set(s.country_focus, entry);
      }
      entry.species.push(s);
      if (s.iucn_status === "CR") entry.crCount += 1;
      else if (s.iucn_status === "EN") entry.enCount += 1;
      else if (s.iucn_status === "VU") entry.vuCount += 1;
    }

    const clusterPoints = [...byCountry.values()].map((e) => {
      // Worst-case wins: CR > EN > VU
      const dominant = e.crCount > 0 ? "CR" : e.enCount > 0 ? "EN" : "VU";
      return {
        ...e,
        iucn: dominant,
        color: IUCN_COLORS[dominant],
        count: e.species.length,
      };
    });

    const speciesPoints = [];
    for (const cluster of byCountry.values()) {
      cluster.species.forEach((s, idx) => {
        const [lat, lng] = spreadPoint(cluster.lat, cluster.lng, idx);
        speciesPoints.push({
          kind: "species",
          id: s.id,
          name: s.accepted_name,
          family: s.family,
          iucn: s.iucn_status,
          country: s.country_focus,
          thumbnail: s.thumbnail_url,
          score: s.composite_score,
          lat,
          lng,
          color: IUCN_COLORS[s.iucn_status] || IUCN_COLORS.CR,
        });
      });
    }

    return { clusterPoints, speciesPoints };
  }, [species]);

  const points = altitude > LOD_ALTITUDE ? clusterPoints : speciesPoints;
  const totalSpeciesCount = useMemo(
    () => clusterPoints.reduce((sum, p) => sum + p.count, 0),
    [clusterPoints]
  );


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
      <Header
        countryCount={clusterPoints.length}
        speciesCount={totalSpeciesCount}
        loading={loading}
        error={loadError}
        zoomedIn={altitude <= LOD_ALTITUDE}
      />

      {size.w > 0 && size.h > 0 && (
        <Globe
          width={size.w}
          height={size.h}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          showAtmosphere
          atmosphereColor="#9FC8FF"
          atmosphereAltitude={0.16}

          /* LOD: country clusters when zoomed out, species pins when zoomed in */
          pointsData={points}
          pointLat="lat"
          pointLng="lng"
          pointColor="color"
          pointAltitude={0.025}
          pointRadius={(p) => (p.kind === "country" ? clusterRadius(p.count) : 0.22)}
          pointResolution={14}
          onPointClick={(p) => setSelected(p)}
          pointLabel={(p) => {
            if (p.kind === "country") {
              const parts = [];
              if (p.crCount) parts.push(`${p.crCount} CR`);
              if (p.enCount) parts.push(`${p.enCount} EN`);
              if (p.vuCount) parts.push(`${p.vuCount} VU`);
              return `<div style="font-family:Georgia,serif;background:rgba(28,12,44,0.95);color:#f3e8d3;padding:6px 10px;border-radius:8px;border:1px solid rgba(255,180,80,.45);font-size:12px"><b>${p.country}</b> — ${p.count} threatened<div style="font-size:10px;color:#FFD79B;letter-spacing:.4px">${parts.join(" · ")} · zoom in to split</div></div>`;
            }
            return `<div style="font-family:Georgia,serif;background:rgba(28,12,44,0.95);color:#f3e8d3;padding:6px 10px;border-radius:8px;border:1px solid rgba(255,180,80,.45);font-size:12px"><b><i>${p.name}</i></b><div style="font-size:10px;color:#FFD79B;letter-spacing:.4px">${p.iucn} · ${p.country}</div></div>`;
          }}
          onZoom={({ altitude: a }) => setAltitude(a)}
        />
      )}

      {selected?.kind === "country" && (
        <CountryPanel cluster={selected} onClose={() => setSelected(null)} />
      )}
      {selected?.kind === "species" && (
        <SpeciesPanel species={selected} onClose={() => setSelected(null)} />
      )}

      <Legend />
    </div>
  );
}

function Header({ countryCount, speciesCount, loading, error, zoomedIn }) {
  return (
    <div
      style={{
        position: "absolute",
        top: 16,
        left: 20,
        zIndex: 2,
        color: "#f3e8d3",
        pointerEvents: "none",
        maxWidth: 480,
      }}
    >
      <div style={{ fontSize: 10, letterSpacing: 3.5, textTransform: "uppercase", color: "#FFD79B", fontWeight: 600 }}>
        Explore · threatened geophytes
      </div>
      <div
        style={{
          fontFamily: "Georgia, serif",
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
          : `${speciesCount} species across ${countryCount} countries`}
      </div>
      <div style={{ fontSize: 11, color: error ? "#FFB8B8" : "#A8C49C", marginTop: 4, fontStyle: "italic", fontFamily: "Georgia, serif" }}>
        {error
          ? error
          : zoomedIn
          ? "Each pin is one species · click for details · zoom out to cluster"
          : "Drag to spin · scroll to zoom in · click a country for its list"}
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 16,
        left: 20,
        zIndex: 2,
        display: "flex",
        gap: 14,
        alignItems: "center",
        padding: "8px 14px",
        background: "rgba(28, 12, 44, 0.6)",
        border: "1px solid rgba(245, 166, 35, 0.22)",
        borderRadius: 999,
        backdropFilter: "blur(6px)",
        color: "#f3e8d3",
        fontSize: 11,
        letterSpacing: 0.3,
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <Dot color={IUCN_COLORS.CR} /> CR · critically endangered
      </span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <Dot color={IUCN_COLORS.EN} /> EN · endangered
      </span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <Dot color={IUCN_COLORS.VU} /> VU · vulnerable
      </span>
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
              fontFamily: "Georgia, serif",
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
        href="/geocon/species"
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

function CountryPanel({ cluster, onClose }) {
  const tierRank = { CR: 0, EN: 1, VU: 2 };
  const sorted = [...cluster.species].sort((a, b) => {
    const ra = tierRank[a.iucn_status] ?? 99;
    const rb = tierRank[b.iucn_status] ?? 99;
    if (ra !== rb) return ra - rb;
    return (a.accepted_name || "").localeCompare(b.accepted_name || "");
  });

  return (
    <div
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
              fontFamily: '"Arial Black", system-ui, sans-serif',
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
          <div style={{ fontSize: 12, color: "#A8C49C", marginTop: 6, fontStyle: "italic", fontFamily: "Georgia, serif" }}>
            {cluster.count} threatened
            {cluster.crCount > 0 && (
              <>
                {" · "}
                <span style={{ color: IUCN_PANEL_TINT.CR }}>{cluster.crCount} CR</span>
              </>
            )}
            {cluster.enCount > 0 && (
              <>
                {" · "}
                <span style={{ color: IUCN_PANEL_TINT.EN }}>{cluster.enCount} EN</span>
              </>
            )}
            {cluster.vuCount > 0 && (
              <>
                {" · "}
                <span style={{ color: IUCN_PANEL_TINT.VU }}>{cluster.vuCount} VU</span>
              </>
            )}
          </div>
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

      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
        {sorted.map((s) => (
          <div
            key={s.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 10px",
              borderRadius: 8,
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(245, 166, 35, 0.12)",
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: IUCN_COLORS[s.iucn_status] || IUCN_COLORS.CR,
                flexShrink: 0,
                boxShadow: `0 0 6px ${IUCN_COLORS[s.iucn_status] || IUCN_COLORS.CR}80`,
              }}
            />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontFamily: "Georgia, serif",
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
                color: IUCN_PANEL_TINT[s.iucn_status] || IUCN_PANEL_TINT.CR,
                flexShrink: 0,
              }}
            >
              {s.iucn_status}
            </span>
          </div>
        ))}
      </div>

      <Link
        href="/geocon/species"
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
        Open full atlas →
      </Link>
    </div>
  );
}
