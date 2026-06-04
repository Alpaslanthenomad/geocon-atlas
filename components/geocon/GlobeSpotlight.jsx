"use client";
// Globe v2.2 — Discovery spotlight.
//
// Sits in the top-right of the globe viewport. Every ROTATION_MS the
// component pulls a fresh random CR/EN/VU species via get_spotlight_
// species, tells the parent (via onZoomTo) to fly the globe over it,
// and renders a one-paragraph story card with the species' identity +
// IUCN + endemism + active research stats. User can Pause/Play.
//
// Story prose is built locally from the fields — no LLM round-trip,
// keeps the loop crisp. Each rotation reads like:
//   "Allium karataviense · Amaryllidaceae · Kazakhstan
//    Critically Endangered, endemic, declining
//    2 active programs · 14 publications · last verified 2018-04"
//
// Audit IX.3-friendly — no marketplace framing, conservation-first.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Play, Pause, SkipForward, ArrowUpRight } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { countryName } from "../../lib/countryNames";

// v4 perf — was 25s; doubled to 60s to lighten globe rotation +
// RPC throttle. User feedback: too many concurrent updates was
// making the globe feel sluggish.
const ROTATION_MS = 60_000;

const IUCN_LABEL = {
  CR: "Critically endangered",
  EN: "Endangered",
  VU: "Vulnerable",
  NT: "Near threatened",
  LC: "Least concern",
  DD: "Data deficient",
  NE: "Not evaluated",
};

const TIER_TINT = {
  CR: "#FF6B7A", EN: "#FFB259", VU: "#FFE34D",
  NT: "#A8DDD4", LC: "#8FD18F", DD: "#C5CDD3", NE: "#9AA5AD",
};

const TREND_GLYPH = {
  decreasing: "↘",
  increasing: "↗",
  stable:     "→",
};

export default function GlobeSpotlight({ onZoomTo, onClose }) {
  const [row, setRow] = useState(null);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  async function pickNext() {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_spotlight_species");
      if (error) throw error;
      const first = Array.isArray(data) ? data[0] : data;
      if (first) {
        setRow(first);
        if (onZoomTo) {
          // Resolve centroid client-side — RPC doesn't ship lat/lng.
          // Will pass null to caller if centroid unknown; caller is
          // tolerant.
          onZoomTo(first.country);
        }
      }
    } catch {
      /* silent — spotlight is non-critical */
    } finally {
      setLoading(false);
    }
  }

  // Initial pick on mount
  useEffect(() => {
    pickNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rotation timer
  useEffect(() => {
    if (paused) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }
    timerRef.current = setTimeout(() => {
      pickNext();
    }, ROTATION_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [row, paused]);

  if (!row) return null;

  const tier = row.iucn || "NE";
  const tint = TIER_TINT[tier] || TIER_TINT.NE;
  const countryLabel = countryName(row.country) || row.country;
  const trend = (row.population_trend || "").toLowerCase();
  const trendGlyph = TREND_GLYPH[trend] || "";

  return (
    <aside className="gx-globe-spotlight" style={{
      position: "absolute",
      top: 16,
      right: 16,
      zIndex: 4,
      width: 280,
      padding: 14,
      background: "linear-gradient(155deg, rgba(28,12,44,0.92) 0%, rgba(20,34,40,0.92) 100%)",
      border: `1px solid ${tint}33`,
      borderRadius: 12,
      backdropFilter: "blur(10px) saturate(140%)",
      WebkitBackdropFilter: "blur(10px) saturate(140%)",
      color: "#f3e8d3",
      boxShadow: "0 12px 36px rgba(0,0,0,0.45)",
      fontFamily: "var(--gx-font-body)",
    }}>
      {/* Overline */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 8,
      }}>
        <div style={{
          fontSize: 8, letterSpacing: 2.5, textTransform: "uppercase",
          color: tint, fontWeight: 700,
        }}>
          ● Spotlight {loading && "· loading"}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={() => setPaused((p) => !p)}
            title={paused ? "Resume rotation" : "Pause rotation"}
            style={iconBtn}>
            {paused ? <Play size={11} strokeWidth={2.2} /> : <Pause size={11} strokeWidth={2.2} />}
          </button>
          <button onClick={pickNext}
            title="Skip to next species" style={iconBtn}>
            <SkipForward size={11} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {/* Name + authority */}
      <Link href={`/geocon/species/${encodeURIComponent(row.id)}`}
        style={{
          textDecoration: "none",
          display: "block",
        }}>
        <h3 style={{
          fontFamily: "var(--gx-font-serif)",
          fontStyle: "italic",
          fontWeight: 700, fontSize: 17,
          color: "#fff",
          margin: 0, lineHeight: 1.2,
          letterSpacing: -0.2,
        }}>
          {row.accepted_name}
        </h3>
        <div style={{ fontSize: 10, color: "#FFD79B", marginTop: 3, letterSpacing: 0.4 }}>
          {row.family}{row.genus ? ` · ${row.genus}` : ""}
        </div>
      </Link>

      {/* IUCN + endemism + trend chips */}
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 9 }}>
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
          padding: "2px 7px", borderRadius: 999,
          background: tint, color: "#1c0c2c",
          fontFamily: "var(--gx-font-mono)",
        }}>
          {tier}
        </span>
        <span style={{ fontSize: 9, color: tint, fontWeight: 600, alignSelf: "center" }}>
          {IUCN_LABEL[tier]}
        </span>
        {row.endemic && (
          <span style={{
            fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 999,
            background: "rgba(91,216,177,0.18)", color: "#5BD8B1",
          }}>
            ENDEMIC
          </span>
        )}
        {trendGlyph && (
          <span style={{
            fontSize: 11, fontWeight: 700,
            color: trend === "decreasing" ? "#FF8B96"
                 : trend === "increasing" ? "#5BD8B1"
                 : "#FFD79B",
          }} title={`Population ${trend}`}>
            {trendGlyph}
          </span>
        )}
      </div>

      {/* Country */}
      <div style={{
        marginTop: 8, fontSize: 11, color: "#A8C9BE",
        fontStyle: "italic",
      }}>
        {countryLabel}
      </div>

      {/* Stats line */}
      <div style={{
        marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap",
        fontSize: 10, color: "rgba(243,232,211,0.65)",
        borderTop: "1px solid rgba(255,215,155,0.15)",
        paddingTop: 9,
      }}>
        <Stat label="programs" value={row.active_programs || 0} accent={(row.active_programs || 0) > 0 ? "#5BD8B1" : null} />
        <Stat label="publications" value={row.publications || 0} />
        {row.discovery_year && <Stat label="described" value={row.discovery_year} />}
        {row.last_verified && (
          <Stat label="verified" value={row.last_verified.slice(0, 4)} />
        )}
      </div>

      {/* Footer link */}
      <Link href={`/geocon/species/${encodeURIComponent(row.id)}`}
        style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          marginTop: 10, fontSize: 10, fontWeight: 700,
          color: tint, textDecoration: "none", letterSpacing: 0.5,
        }}>
          Open species page <ArrowUpRight size={10} strokeWidth={2.4} />
      </Link>
    </aside>
  );
}

function Stat({ label, value, accent }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
      <strong style={{ color: accent || "#FFE6BC", fontFamily: "var(--gx-font-mono)", fontWeight: 700 }}>
        {value}
      </strong>
      <span style={{ color: "rgba(243,232,211,0.5)" }}>{label}</span>
    </span>
  );
}

const iconBtn = {
  background: "rgba(255,215,155,0.10)",
  border: "1px solid rgba(255,215,155,0.20)",
  color: "#FFD79B",
  borderRadius: 6,
  width: 22, height: 22,
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  cursor: "pointer",
};
