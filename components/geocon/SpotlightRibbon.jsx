"use client";
// SpotlightRibbon — three rotating cards (featured threatened species,
// fresh open call, active program with a next-action) deterministically
// chosen per day by the get_today_spotlight RPC.

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

const IUCN_TINT = {
  CR: "#FF8B96", EN: "#FFB870", VU: "#FFE875",
  NT: "#B2DFDB", LC: "#A5D6A7", DD: "#CFD8DC", NE: "#90A4AE",
};

export default function SpotlightRibbon() {
  const [data, setData] = useState(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.rpc("get_today_spotlight");
        if (cancelled) return;
        setData(data || null);
      } catch (e) {
        if (!cancelled) console.warn("[SpotlightRibbon]", e?.message || e);
      }
    })().catch(() => { /* swallow */ });
    return () => { cancelled = true; };
  }, []);

  if (hidden || !data) return null;
  const { species, call, program } = data;
  if (!species && !call && !program) return null;

  return (
    <section
      style={{
        marginBottom: 18,
        padding: 16,
        background: "linear-gradient(135deg, #1a0d2e 0%, #2a1240 100%)",
        borderRadius: 14,
        color: "#FFE6BC",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: 10, letterSpacing: 3.5, textTransform: "uppercase", color: "#FFD79B", fontWeight: 600 }}>
          ✨ Today on GEOCON
        </div>
        <button
          onClick={() => setHidden(true)}
          style={{
            background: "transparent",
            border: "none",
            color: "rgba(255,215,155,0.55)",
            fontSize: 11,
            cursor: "pointer",
            letterSpacing: 0.4,
          }}
        >
          Hide for now ✕
        </button>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 12,
      }}>
        {species && <SpeciesCard sp={species} />}
        {call && <CallCard call={call} />}
        {program && <ProgramCard prog={program} />}
      </div>
    </section>
  );
}

function SpeciesCard({ sp }) {
  return (
    <Link
      href={`/geocon/species/${sp.id}`}
      style={{
        display: "block",
        padding: 14,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(245,166,35,0.25)",
        borderRadius: 12,
        textDecoration: "none",
        color: "inherit",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {sp.thumbnail_url && (
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `linear-gradient(180deg, rgba(26,13,46,0.55) 0%, rgba(26,13,46,0.95) 90%), url(${sp.thumbnail_url})`,
          backgroundSize: "cover", backgroundPosition: "center",
        }} />
      )}
      <div style={{ position: "relative" }}>
        <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "#FFD79B", fontWeight: 700 }}>
          🌿 Featured species
        </div>
        <div style={{
          fontFamily: "Georgia, serif",
          fontStyle: "italic",
          fontSize: 18,
          marginTop: 6,
          color: "#FFE6BC",
          lineHeight: 1.25,
        }}>
          {sp.accepted_name}
        </div>
        {sp.common_name && (
          <div style={{ fontSize: 11, color: "rgba(255,215,155,0.7)", marginTop: 2 }}>
            {sp.common_name}
          </div>
        )}
        <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
          {sp.iucn_status && (
            <span style={{
              fontSize: 9,
              fontWeight: 700,
              padding: "2px 7px",
              borderRadius: 999,
              background: IUCN_TINT[sp.iucn_status] || "#999",
              color: "#1a0d2e",
            }}>
              {sp.iucn_status}
            </span>
          )}
          {sp.family && (
            <span style={{
              fontSize: 9,
              fontWeight: 600,
              padding: "2px 7px",
              borderRadius: 999,
              background: "rgba(245,166,35,0.18)",
              color: "#FFE6BC",
            }}>
              {sp.family}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function CallCard({ call }) {
  return (
    <Link
      href={`/geocon/proposals/${call.id}`}
      style={{
        display: "block",
        padding: 14,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(245,166,35,0.25)",
        borderRadius: 12,
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "#FFD79B", fontWeight: 700 }}>
        📣 Open call
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, marginTop: 6, lineHeight: 1.3, color: "#FFE6BC" }}>
        {call.title || "(untitled)"}
      </div>
      {call.description && (
        <div style={{
          fontSize: 11,
          color: "rgba(255,215,155,0.7)",
          marginTop: 6,
          lineHeight: 1.5,
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {call.description}
        </div>
      )}
      {call.proposal_type && (
        <div style={{ marginTop: 10 }}>
          <span style={{
            fontSize: 9,
            fontWeight: 600,
            padding: "2px 7px",
            borderRadius: 999,
            background: "rgba(83,74,183,0.25)",
            color: "#D4CFFA",
          }}>
            {call.proposal_type}
          </span>
        </div>
      )}
    </Link>
  );
}

function ProgramCard({ prog }) {
  return (
    <Link
      href={`/geocon/programs/${prog.id}`}
      style={{
        display: "block",
        padding: 14,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(245,166,35,0.25)",
        borderRadius: 12,
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "#FFD79B", fontWeight: 700 }}>
        📋 Active program
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, marginTop: 6, lineHeight: 1.3, color: "#FFE6BC" }}>
        {prog.program_name || "Untitled program"}
      </div>
      {prog.species_name && (
        <div style={{
          fontFamily: "Georgia, serif",
          fontStyle: "italic",
          fontSize: 11,
          color: "rgba(255,215,155,0.75)",
          marginTop: 3,
        }}>
          🌱 {prog.species_name}
        </div>
      )}
      {prog.next_action && (
        <div style={{
          marginTop: 8,
          padding: "6px 8px",
          background: "rgba(252,222,90,0.12)",
          borderLeft: "2px solid #FCDE5A",
          borderRadius: 4,
          fontSize: 11,
          color: "#FFE6BC",
          lineHeight: 1.45,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          <strong style={{ color: "#FCDE5A" }}>Next:</strong> {prog.next_action}
        </div>
      )}
    </Link>
  );
}
