"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { getCentroid } from "../../lib/countryCentroids";

// react-globe.gl pulls in three.js which only runs in the browser.
const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

const IUCN_THREAT = new Set(["CR", "EN"]);
const IUCN_COLORS = {
  CR: "#FF1744",   // vivid red — alarm
  EN: "#FF9100",   // vibrant orange — clearly visible on blue/green earth
  VU: "#FFD24D",   // amber (reserved)
};
const IUCN_RING_RGB = {
  CR: "255, 23, 68",
  EN: "255, 145, 0",
};

// Marker size grows sub-linearly with cluster count so dense countries stay
// readable rather than swallowing the globe.
function clusterRadius(count) {
  return 0.3 + 0.15 * Math.sqrt(count);
}
function clusterRingMax(count) {
  return 1.6 + 0.35 * Math.sqrt(count);
}

export default function ExploreRoute() {
  // Note: next/dynamic does not forward refs, so we can't grab the Globe
  // instance directly. Auto-rotate is wired via the polar coordinates props
  // below instead of mutating controls() through a ref.
  const containerRef = useRef(null);

  const [species, setSpecies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

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

  // Fetch threatened species. The country_focus null filter is done in JS for
  // resilience (avoids a Postgrest IS NULL syntax edge case).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("species")
        .select("id, accepted_name, family, iucn_status, country_focus, thumbnail_url, composite_score")
        .in("iucn_status", ["CR", "EN"]);
      if (cancelled) return;
      if (error) {
        console.warn("[explore] species fetch error", error.message);
        setLoading(false);
        return;
      }
      const withCountry = (data || []).filter((s) => s.country_focus);
      console.log(`[explore] loaded ${withCountry.length} CR/EN species with country_focus`);
      setSpecies(withCountry);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // Cluster species by country. One marker per country at its centroid; size
  // grows with the threatened count. Dominant IUCN class (CR if any present)
  // sets the marker colour and rhythm.
  const points = useMemo(() => {
    const byCountry = new Map();
    for (const s of species) {
      const c = getCentroid(s.country_focus);
      if (!c) continue;
      let entry = byCountry.get(s.country_focus);
      if (!entry) {
        entry = {
          country: s.country_focus,
          lat: c[0],
          lng: c[1],
          species: [],
          crCount: 0,
          enCount: 0,
        };
        byCountry.set(s.country_focus, entry);
      }
      entry.species.push(s);
      if (s.iucn_status === "CR") entry.crCount += 1;
      else if (s.iucn_status === "EN") entry.enCount += 1;
    }
    return [...byCountry.values()].map((e) => {
      const dominant = e.crCount > 0 ? "CR" : "EN";
      return {
        ...e,
        iucn: dominant,
        color: IUCN_COLORS[dominant],
        count: e.species.length,
      };
    });
  }, [species]);

  const totalSpeciesCount = useMemo(
    () => points.reduce((sum, p) => sum + p.count, 0),
    [points]
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
      <Header countryCount={points.length} speciesCount={totalSpeciesCount} loading={loading} />

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

          /* One marker per country, size scales with the count */
          pointsData={points}
          pointLat="lat"
          pointLng="lng"
          pointColor="color"
          pointAltitude={0.028}
          pointRadius={(p) => clusterRadius(p.count)}
          pointResolution={14}
          onPointClick={(p) => setSelected(p)}
          pointLabel={(p) =>
            `<div style="font-family:Georgia,serif;background:rgba(28,12,44,0.95);color:#f3e8d3;padding:6px 10px;border-radius:8px;border:1px solid rgba(255,180,80,.45);font-size:12px"><b>${p.country}</b> — ${p.count} threatened<div style="font-size:10px;color:#FFD79B;letter-spacing:.4px">${p.crCount} CR · ${p.enCount} EN</div></div>`
          }

          /* Heartbeat rings — CR-dominated faster + tighter, EN-only slower + wider */
          ringsData={points}
          ringLat="lat"
          ringLng="lng"
          ringColor={(p) => (t) => `rgba(${IUCN_RING_RGB[p.iucn] || "255, 180, 80"}, ${0.9 * (1 - t)})`}
          ringMaxRadius={(p) => clusterRingMax(p.count)}
          ringPropagationSpeed={(p) => (p.iucn === "CR" ? 1.9 : 1.4)}
          ringRepeatPeriod={(p) => (p.iucn === "CR" ? 1500 : 2400)}
          ringAltitude={0.029}
        />
      )}

      {selected && (
        <CountryPanel cluster={selected} onClose={() => setSelected(null)} />
      )}

      <Legend />
    </div>
  );
}

function Header({ countryCount, speciesCount, loading }) {
  return (
    <div
      style={{
        position: "absolute",
        top: 16,
        left: 20,
        zIndex: 2,
        color: "#f3e8d3",
        pointerEvents: "none",
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
        {loading ? "Loading the world…" : `${speciesCount} species across ${countryCount} countries`}
      </div>
      <div style={{ fontSize: 11, color: "#A8C49C", marginTop: 4, fontStyle: "italic", fontFamily: "Georgia, serif" }}>
        Drag to spin · scroll to zoom · click a country to see its list
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
        padding: "8px 12px",
        background: "rgba(28, 12, 44, 0.6)",
        border: "1px solid rgba(245, 166, 35, 0.22)",
        borderRadius: 999,
        backdropFilter: "blur(6px)",
        color: "#f3e8d3",
        fontSize: 11,
        letterSpacing: 0.3,
      }}
    >
      <Dot color="#E53935" /> CR (critically endangered)
      <Dot color="#F4511E" /> EN (endangered)
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

function CountryPanel({ cluster, onClose }) {
  const sorted = [...cluster.species].sort((a, b) => {
    if (a.iucn_status !== b.iucn_status) return a.iucn_status === "CR" ? -1 : 1;
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
                <span style={{ color: "#FF8B96" }}>{cluster.crCount} CR</span>
              </>
            )}
            {cluster.enCount > 0 && (
              <>
                {" · "}
                <span style={{ color: "#FFB870" }}>{cluster.enCount} EN</span>
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
                background: s.iucn_status === "CR" ? "#FF1744" : "#FF9100",
                flexShrink: 0,
                boxShadow: `0 0 6px ${s.iucn_status === "CR" ? "rgba(255,23,68,0.6)" : "rgba(255,145,0,0.5)"}`,
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
                color: s.iucn_status === "CR" ? "#FF8B96" : "#FFB870",
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
