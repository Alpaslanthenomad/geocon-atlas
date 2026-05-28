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
  CR: "#E53935",   // red
  EN: "#F4511E",   // deep orange
  VU: "#F9A825",   // amber (not currently rendered but reserved)
};

/**
 * Deterministic small offset around a country centroid so multiple species in
 * the same country don't pile on a single point.
 */
function jitter(lat, lng, idx) {
  // ~50–150 km offsets per index step; seeded from idx for stability.
  const a = (idx * 137.508) * (Math.PI / 180);
  const r = 0.6 + (idx % 5) * 0.25;
  return [lat + Math.cos(a) * r, lng + Math.sin(a) * r];
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

  // Fetch threatened species with a country focus.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("species")
        .select("id, accepted_name, family, iucn_status, country_focus, thumbnail_url, composite_score")
        .in("iucn_status", ["CR", "EN"])
        .not("country_focus", "is", null);
      if (cancelled) return;
      if (error) console.warn("[explore] species fetch error", error.message);
      setSpecies(data || []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // Build globe points: one marker per species, jittered around its country centroid.
  const points = useMemo(() => {
    const byCountry = {};
    return species
      .map((s) => {
        const c = getCentroid(s.country_focus);
        if (!c) return null;
        const idx = byCountry[s.country_focus] || 0;
        byCountry[s.country_focus] = idx + 1;
        const [lat, lng] = jitter(c[0], c[1], idx);
        return {
          id: s.id,
          name: s.accepted_name,
          family: s.family,
          iucn: s.iucn_status,
          country: s.country_focus,
          score: s.composite_score,
          thumbnail: s.thumbnail_url,
          lat,
          lng,
          color: IUCN_COLORS[s.iucn_status] || "#E53935",
          radius: s.iucn_status === "CR" ? 0.55 : 0.42,
        };
      })
      .filter(Boolean);
  }, [species]);


  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        height: "calc(100vh - 80px)",
        width: "100%",
        background: "radial-gradient(ellipse at center, #1a1023 0%, #06030c 100%)",
        borderRadius: 14,
        overflow: "hidden",
        marginTop: -6,
      }}
    >
      <Header count={points.length} loading={loading} />

      {size.w > 0 && size.h > 0 && (
        <Globe
          width={size.w}
          height={size.h}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          showAtmosphere
          atmosphereColor="#F5A623"
          atmosphereAltitude={0.18}

          pointsData={points}
          pointLat="lat"
          pointLng="lng"
          pointColor="color"
          pointAltitude={0.04}
          pointRadius={(p) => (p.iucn === "CR" ? 1.6 : 1.2)}
          pointResolution={10}
          onPointClick={(p) => setSelected(p)}
          pointLabel={(p) =>
            `<div style="font-family:Georgia,serif;background:#1a0d2e;color:#f3e8d3;padding:6px 10px;border-radius:8px;border:1px solid rgba(245,166,35,.4);font-size:12px"><b>${p.name}</b><div style="font-size:10px;color:#FFD79B">${p.iucn} · ${p.country}</div></div>`
          }

          ringsData={points.filter(p => p.iucn === "CR")}
          ringLat="lat"
          ringLng="lng"
          ringColor={() => (t) => `rgba(229, 57, 53, ${1 - t})`}
          ringMaxRadius={3.5}
          ringPropagationSpeed={3}
          ringRepeatPeriod={1600}
          ringAltitude={0.041}
        />
      )}

      {selected && (
        <SpeciesPanel species={selected} onClose={() => setSelected(null)} />
      )}

      <Legend />
    </div>
  );
}

function Header({ count, loading }) {
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
        {loading ? "Loading the world…" : `${count} CR/EN markers`}
      </div>
      <div style={{ fontSize: 11, color: "#A8C49C", marginTop: 4, fontStyle: "italic", fontFamily: "Georgia, serif" }}>
        Drag to spin · scroll to zoom · click a point
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

function SpeciesPanel({ species, onClose }) {
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
        background: "rgba(28, 12, 44, 0.85)",
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
            {species.iucn} · {species.country}
          </div>
          <div
            style={{
              fontFamily: "Georgia, serif",
              fontStyle: "italic",
              fontSize: 17,
              marginTop: 4,
              color: "#FFE6BC",
              lineHeight: 1.2,
            }}
          >
            {species.name}
          </div>
          {species.family && (
            <div style={{ fontSize: 11, color: "#A8C49C", marginTop: 2 }}>
              {species.family}
            </div>
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

      {species.thumbnail ? (
        <img
          src={species.thumbnail}
          alt={species.name}
          style={{ width: "100%", marginTop: 12, borderRadius: 10, border: "1px solid rgba(245, 166, 35, 0.2)" }}
        />
      ) : (
        <div
          style={{
            marginTop: 12,
            padding: "30px 12px",
            border: "1px dashed rgba(245, 166, 35, 0.25)",
            borderRadius: 10,
            textAlign: "center",
            fontSize: 10,
            color: "#8a6f56",
            letterSpacing: 0.5,
          }}
        >
          no image yet
        </div>
      )}

      {typeof species.score === "number" && (
        <div style={{ marginTop: 12, fontSize: 11, color: "#cdbb9c" }}>
          composite score{" "}
          <strong style={{ color: "#FFE6BC" }}>{species.score.toFixed(1)}</strong>
        </div>
      )}

      <Link
        href={`/geocon/species`}
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
