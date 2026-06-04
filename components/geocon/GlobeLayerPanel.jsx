"use client";
// Globe v2.3 — Layer control panel.
//
// Floating chip on the right edge that expands into a toggle list for
// every globe layer (heat / pulse / arcs / pins / research). Lets a
// power user dial down to "just pins" or crank up to "every signal at
// once" without leaving the page. Default state matches the most
// engaging first-load impression.

import { useState } from "react";
import { Layers as LayersIcon, X } from "lucide-react";

const LAYER_META = {
  heat:     { label: "Density heatmap",   tint: "#FF9100", description: "Hex-bin colour by species count" },
  pulse:    { label: "CR pulse rings",    tint: "#FF1744", description: "Red beat on Critically Endangered hotspots" },
  arcs:     { label: "Collaboration arcs", tint: "#F5A623", description: "Country-to-country research links" },
  pins:     { label: "Species pins",      tint: "#5BD8B1", description: "One dot per species, IUCN-coloured" },
  research: { label: "Active research",   tint: "#5BD8B1", description: "Green halo on species with running programs" },
};

const ORDER = ["pins", "heat", "pulse", "arcs", "research"];

export default function GlobeLayerPanel({ layersOn, setLayersOn }) {
  const [open, setOpen] = useState(false);

  function toggle(key) {
    setLayersOn((s) => ({ ...s, [key]: !s[key] }));
  }

  const onCount = ORDER.filter((k) => layersOn[k]).length;

  return (
    <div style={{
      position: "absolute",
      top: 16,
      right: open ? 308 : 16,  // shift left when Spotlight (280w + 12 margin) is showing
      zIndex: 5,
      transition: "right 0.2s ease",
    }}>
      {!open ? (
        <button onClick={() => setOpen(true)}
          title="Layer controls"
          aria-label="Open layer controls"
          style={chipBtn}>
          <LayersIcon size={13} strokeWidth={2} />
          <span style={{ fontSize: 10, fontFamily: "var(--gx-font-mono)", color: "rgba(255,215,155,0.65)" }}>
            {onCount}/{ORDER.length}
          </span>
        </button>
      ) : (
        <aside style={{
          width: 230,
          padding: "12px 14px",
          background: "rgba(28,12,44,0.92)",
          border: "1px solid rgba(245,166,35,0.28)",
          borderRadius: 10,
          backdropFilter: "blur(8px)",
          color: "#f3e8d3",
          boxShadow: "0 12px 36px rgba(0,0,0,0.45)",
          fontFamily: "var(--gx-font-body)",
        }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 10,
          }}>
            <div style={{
              fontSize: 9, letterSpacing: 2, textTransform: "uppercase",
              color: "#FFD79B", fontWeight: 700,
            }}>
              Layers · {onCount}/{ORDER.length}
            </div>
            <button onClick={() => setOpen(false)}
              title="Close" style={iconBtn}>
              <X size={11} strokeWidth={2.2} />
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {ORDER.map((key) => {
              const m = LAYER_META[key];
              const on = !!layersOn[key];
              return (
                <label key={key} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "6px 8px", borderRadius: 7,
                  background: on ? "rgba(245,166,35,0.10)" : "transparent",
                  border: `1px solid ${on ? "rgba(245,166,35,0.20)" : "transparent"}`,
                  cursor: "pointer",
                  transition: "background 120ms ease",
                }}>
                  <span style={{
                    width: 14, height: 14, borderRadius: 4,
                    background: m.tint,
                    opacity: on ? 1 : 0.3,
                    flexShrink: 0,
                  }} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{
                      display: "block",
                      fontSize: 11, fontWeight: 600,
                      color: on ? "#f3e8d3" : "rgba(243,232,211,0.55)",
                    }}>
                      {m.label}
                    </span>
                    <span style={{
                      display: "block",
                      fontSize: 9, color: "rgba(243,232,211,0.45)",
                      lineHeight: 1.4,
                    }}>
                      {m.description}
                    </span>
                  </span>
                  <input type="checkbox" checked={on}
                    onChange={() => toggle(key)}
                    style={{ accentColor: m.tint, cursor: "pointer" }} />
                </label>
              );
            })}
          </div>

          <div style={{
            marginTop: 10, paddingTop: 8,
            borderTop: "1px solid rgba(255,215,155,0.15)",
            fontSize: 9, color: "rgba(243,232,211,0.45)", lineHeight: 1.5,
          }}>
            Layer changes only render — DB calls are filter-driven.
          </div>
        </aside>
      )}
    </div>
  );
}

const chipBtn = {
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "7px 11px",
  background: "rgba(28,12,44,0.6)",
  border: "1px solid rgba(245,166,35,0.22)",
  borderRadius: 10,
  color: "#FFD79B",
  cursor: "pointer",
  backdropFilter: "blur(6px)",
  fontFamily: "var(--gx-font-body)",
  fontSize: 11, fontWeight: 600,
};

const iconBtn = {
  background: "rgba(255,215,155,0.10)",
  border: "1px solid rgba(255,215,155,0.20)",
  color: "#FFD79B",
  borderRadius: 6,
  width: 22, height: 22,
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  cursor: "pointer",
};
