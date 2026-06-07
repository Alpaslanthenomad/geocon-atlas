"use client";
// Globe v2.6 — Radius search side panel.
//
// Shift+click on the globe sets a search anchor (lat/lng). This panel
// slides out, lists every species pin inside the chosen radius, and
// hosts a slider for 50/200/500/1000 km presets. Distance shown per
// row so the user knows how far each one sits.

import Link from "next/link";
import { X, MapPin } from "lucide-react";
import { countryName } from "../../lib/countryNames";
import { IUCN_TINT as TIER_TINT } from "../../lib/iucn";

const RADIUS_PRESETS = [50, 200, 500, 1000];

export default function GlobeRadiusPanel({
  anchor,       // { lat, lng } | null
  radiusKm,
  setRadiusKm,
  species,      // [{ id, accepted_name, family, iucn, country, distKm }]
  onClose,
}) {
  if (!anchor) return null;

  const summary = {
    total: species.length,
    cr: species.filter((s) => s.iucn === "CR").length,
    en: species.filter((s) => s.iucn === "EN").length,
    vu: species.filter((s) => s.iucn === "VU").length,
  };

  return (
    <aside style={{
      position: "absolute",
      top: 16,
      bottom: 16,
      right: 16,
      width: 320,
      zIndex: 6,
      background: "linear-gradient(160deg, rgba(28,12,44,0.94), rgba(20,34,40,0.94))",
      border: "1px solid rgba(245,166,35,0.30)",
      borderRadius: 12,
      backdropFilter: "blur(12px) saturate(140%)",
      WebkitBackdropFilter: "blur(12px) saturate(140%)",
      color: "#f3e8d3",
      boxShadow: "0 14px 40px rgba(0,0,0,0.55)",
      fontFamily: "var(--gx-font-body)",
      display: "flex", flexDirection: "column",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "12px 14px",
        borderBottom: "1px solid rgba(255,215,155,0.18)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <MapPin size={13} strokeWidth={2.2} style={{ color: "#FFD79B" }} />
            <span style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "#FFD79B", fontWeight: 700 }}>
              Radius search
            </span>
          </div>
          <button onClick={onClose} title="Close radius search"
            aria-label="Close" style={iconBtn}>
            <X size={11} strokeWidth={2.2} />
          </button>
        </div>
        <div style={{ fontSize: 10, color: "rgba(243,232,211,0.55)", fontFamily: "var(--gx-font-mono)" }}>
          {anchor.lat.toFixed(2)}°, {anchor.lng.toFixed(2)}°  ·  r = {radiusKm} km
        </div>

        {/* Radius slider */}
        <div style={{ display: "flex", gap: 4, marginTop: 9 }}>
          {RADIUS_PRESETS.map((km) => {
            const on = km === radiusKm;
            return (
              <button key={km} onClick={() => setRadiusKm(km)}
                style={{
                  flex: 1, fontSize: 10, fontWeight: 700, letterSpacing: 0.3,
                  padding: "5px 0", borderRadius: 6,
                  background: on ? "rgba(245,166,35,0.22)" : "rgba(255,215,155,0.06)",
                  color: on ? "#FFE6BC" : "rgba(255,215,155,0.6)",
                  border: `1px solid ${on ? "rgba(245,166,35,0.40)" : "rgba(255,215,155,0.18)"}`,
                  cursor: "pointer",
                  fontFamily: "var(--gx-font-mono)",
                }}>
                {km}
              </button>
            );
          })}
        </div>

        {/* Summary chips */}
        <div style={{ display: "flex", gap: 8, marginTop: 10, fontSize: 10 }}>
          <Chip label="total" n={summary.total} tint="#FFD79B" />
          {summary.cr > 0 && <Chip label="CR" n={summary.cr} tint={TIER_TINT.CR} />}
          {summary.en > 0 && <Chip label="EN" n={summary.en} tint={TIER_TINT.EN} />}
          {summary.vu > 0 && <Chip label="VU" n={summary.vu} tint={TIER_TINT.VU} />}
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>
        {species.length === 0 ? (
          <div style={{
            padding: "20px 8px", textAlign: "center",
            fontSize: 11, color: "rgba(243,232,211,0.5)", fontStyle: "italic",
          }}>
            No species pins inside this radius.
            <br />
            <span style={{ fontSize: 10, opacity: 0.7 }}>
              Try expanding the radius or moving the anchor.
            </span>
          </div>
        ) : (
          species.map((sp) => {
            const tint = TIER_TINT[sp.iucn] || TIER_TINT.NE;
            return (
              <Link key={sp.id} href={`/geocon/species/${encodeURIComponent(sp.id)}`}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "7px 8px",
                  borderBottom: "1px solid rgba(255,215,155,0.08)",
                  textDecoration: "none", color: "inherit",
                }}>
                <span style={{
                  width: 6, height: 6, borderRadius: 999,
                  background: tint, flexShrink: 0,
                }} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{
                    display: "block",
                    fontFamily: "var(--gx-font-serif)", fontStyle: "italic",
                    fontSize: 12, fontWeight: 700, color: "#f3e8d3",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {sp.accepted_name || sp.id}
                  </span>
                  <span style={{
                    display: "block", fontSize: 9,
                    color: "rgba(243,232,211,0.5)", letterSpacing: 0.3,
                    marginTop: 2,
                  }}>
                    {sp.family || "—"} · {countryName(sp.country) || sp.country}
                  </span>
                </span>
                <span style={{
                  fontSize: 9, fontFamily: "var(--gx-font-mono)",
                  color: tint, flexShrink: 0,
                }}>
                  {Math.round(sp.distKm)}km
                </span>
              </Link>
            );
          })
        )}
      </div>

      <div style={{
        padding: "8px 12px", fontSize: 9,
        color: "rgba(243,232,211,0.45)", textAlign: "center",
        borderTop: "1px solid rgba(255,215,155,0.10)",
        fontStyle: "italic",
      }}>
        Shift+click anywhere on the globe to move the anchor
      </div>
    </aside>
  );
}

function Chip({ label, n, tint }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      padding: "2px 7px", borderRadius: 999,
      background: `color-mix(in srgb, ${tint} 14%, transparent)`,
      color: tint,
      fontSize: 9, fontWeight: 700, letterSpacing: 0.3,
      fontFamily: "var(--gx-font-mono)",
    }}>
      <strong>{n}</strong>{label}
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
