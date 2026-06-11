"use client";
// THE CHAIN — the radial rings surface. The inclusive value chain of a geophyte,
// drawn as six coloured rings around a single living centre: identity → conservation
// → propagation → cultivation → chemistry → value. Each ring carries its own colour
// and the count of registry nodes that hang beneath it. Click a ring to open its
// domains (the real ltree roots + how many descendants each carries). Money-blind:
// the registry counts knowledge structure, never product or price. Public, open-read.
// Data: get_chain_rings() (SECURITY DEFINER, granted anon+authenticated).
//
// Visual language reuses SpeciesGearbox.jsx: the #0F6E56 brand hero, the --gx-*
// tokens, the progress-ring (strokeDasharray) signature, serif for latin-ish names.

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

// geometry — six rings evenly placed on a circle around the centre
const VB = 420;                 // square viewBox
const C = VB / 2;               // centre
const ORBIT = 150;              // radius of the ring centres from the centre
const R = 34;                   // each ring's radius
const CIRC = 2 * Math.PI * R;

// place ring i of n on the orbit, starting at the top (12 o'clock) clockwise
function ringPos(i, n) {
  const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
  return { cx: C + ORBIT * Math.cos(a), cy: C + ORBIT * Math.sin(a) };
}

export default function ChainRingsRoute() {
  const [rings, setRings] = useState(null);   // null = loading, [] = empty
  const [sel, setSel] = useState(null);       // selected ring key

  useEffect(() => {
    let cancelled = false;
    supabase
      .rpc("get_chain_rings")
      .then(({ data }) => {
        if (cancelled) return;
        const r = data && Array.isArray(data.rings) ? data.rings : Array.isArray(data) ? data : [];
        setRings(r);
      })
      .catch(() => { if (!cancelled) setRings([]); });
    return () => { cancelled = true; };
  }, []);

  // the largest ring fills its arc completely; the rest fill proportionally —
  // a purely visual sense of relative weight, never a score or a value claim.
  const maxCount = useMemo(
    () => (rings && rings.length ? Math.max(...rings.map((r) => r.node_count || 0)) : 0),
    [rings]
  );

  const selected = rings && rings.find((r) => r.key === sel);
  const total = rings ? rings.reduce((s, r) => s + (r.node_count || 0), 0) : 0;

  return (
    <section style={{ borderRadius: 14, overflow: "hidden", border: "1px solid var(--gx-card-border)", marginBottom: 18 }}>
      {/* brand hero */}
      <div style={{ background: "#0F6E56", padding: "22px 24px" }}>
        <div style={{ fontSize: 11, letterSpacing: 0.7, textTransform: "uppercase", color: "#9FE1CB", marginBottom: 8 }}>
          The Chain · Değer zinciri
        </div>
        <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic", fontSize: 28, lineHeight: 1.05, color: "#fff", marginBottom: 10 }}>
          The Chain
        </div>
        <p style={{ fontSize: 13.5, lineHeight: 1.5, color: "#D6F3E8", margin: 0, maxWidth: 620 }}>
          The inclusive value chain — from identity through conservation to value, money-blind.
        </p>
      </div>

      {/* radial body */}
      <div style={{ background: "var(--gx-card-bg)", padding: "14px 16px 18px" }}>
        {rings === null && (
          <div style={{ display: "grid", placeItems: "center", height: 280, color: "var(--gx-ink-muted)", fontSize: 13 }}>
            Loading the chain…
          </div>
        )}

        {rings !== null && rings.length === 0 && (
          <div style={{ display: "grid", placeItems: "center", height: 280, color: "var(--gx-ink-muted)", fontSize: 13 }}>
            The chain registry is not available right now.
          </div>
        )}

        {rings !== null && rings.length > 0 && (
          <>
            <svg
              viewBox={`0 0 ${VB} ${VB}`}
              style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }}
              role="img"
              aria-label="The six rings of the geophyte value chain"
            >
              {/* spokes from centre to each ring */}
              {rings.map((ring, i) => {
                const p = ringPos(i, rings.length);
                const active = ring.key === sel;
                return (
                  <line
                    key={`spoke-${ring.key}`}
                    x1={C}
                    y1={C}
                    x2={p.cx}
                    y2={p.cy}
                    stroke={active ? ring.color : "var(--gx-border-soft)"}
                    strokeWidth={active ? 2 : 1.5}
                  />
                );
              })}

              {/* centre — the living core */}
              <circle cx={C} cy={C} r={26} fill="var(--gx-surface-2)" stroke="var(--gx-border-soft)" strokeWidth="0.5" />
              <text x={C} y={C + 7} textAnchor="middle" fontSize="20" fill="#0F6E56">✿</text>

              {/* the six rings */}
              {rings.map((ring, i) => {
                const p = ringPos(i, rings.length);
                const frac = maxCount ? Math.max(0.06, (ring.node_count || 0) / maxCount) : 0;
                const vis = frac * CIRC;
                const active = ring.key === sel;
                return (
                  <g
                    key={ring.key}
                    style={{ cursor: "pointer" }}
                    onClick={() => setSel(active ? null : ring.key)}
                    role="button"
                    aria-pressed={active}
                    aria-label={`${ring.label}: ${ring.node_count} nodes`}
                  >
                    {/* generous transparent hit target */}
                    <circle cx={p.cx} cy={p.cy} r={R + 16} fill="transparent" />
                    {/* track */}
                    <circle cx={p.cx} cy={p.cy} r={R} fill="none" stroke="var(--gx-border-soft)" strokeWidth="7" />
                    {/* coloured arc, weighted by node count */}
                    <circle
                      cx={p.cx}
                      cy={p.cy}
                      r={R}
                      fill="none"
                      stroke={ring.color}
                      strokeWidth="7"
                      strokeLinecap="round"
                      strokeDasharray={`${vis.toFixed(1)} ${CIRC.toFixed(1)}`}
                      transform={`rotate(-90 ${p.cx} ${p.cy})`}
                      opacity={active || !sel ? 1 : 0.4}
                    />
                    {/* selection halo */}
                    {active && (
                      <circle cx={p.cx} cy={p.cy} r={R + 7} fill="none" stroke={ring.color} strokeWidth="1.5" opacity="0.5" />
                    )}
                    {/* node count */}
                    <text x={p.cx} y={p.cy + 5} textAnchor="middle" fontSize="17" fontWeight="700" fill="var(--gx-ink)">
                      {ring.node_count}
                    </text>
                    {/* label below the ring */}
                    <text x={p.cx} y={p.cy + R + 18} textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--gx-ink-soft)">
                      {ring.label}
                    </text>
                  </g>
                );
              })}
            </svg>

            <div style={{ textAlign: "center", fontSize: 11.5, color: "var(--gx-ink-muted)", marginTop: 2 }}>
              Six rings · <strong style={{ fontWeight: 700, color: "var(--gx-ink-soft)" }}>{total}</strong> registry nodes ·
              {" "}select a ring to open its domains
            </div>

            {/* selected ring's domains */}
            {selected && (
              <div
                style={{
                  marginTop: 14,
                  border: `1px solid ${selected.color}33`,
                  borderRadius: 10,
                  overflow: "hidden",
                  background: "var(--gx-surface-2)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 14px",
                    borderBottom: "1px solid var(--gx-border-soft)",
                  }}
                >
                  <span style={{ width: 11, height: 11, borderRadius: 999, background: selected.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--gx-ink)" }}>{selected.label}</span>
                  <span style={{ fontSize: 11.5, color: "var(--gx-ink-muted)" }}>
                    {selected.node_count} nodes · {(selected.domains || []).length} domain
                    {(selected.domains || []).length === 1 ? "" : "s"}
                  </span>
                  <button
                    onClick={() => setSel(null)}
                    aria-label="Close"
                    style={{
                      marginLeft: "auto",
                      background: "none",
                      border: "none",
                      color: "var(--gx-ink-muted)",
                      cursor: "pointer",
                      fontSize: 18,
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </div>
                <ul style={{ listStyle: "none", margin: 0, padding: "4px 0" }}>
                  {(selected.domains || []).map((d) => (
                    <li
                      key={d.root_label}
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        justifyContent: "space-between",
                        gap: 12,
                        padding: "7px 14px",
                      }}
                    >
                      <span style={{ fontFamily: "var(--gx-font-serif)", fontSize: 14, color: "var(--gx-ink)" }}>
                        {d.root_label}
                      </span>
                      <span style={{ fontSize: 12, color: "var(--gx-ink-muted)", fontFamily: "var(--gx-font-mono)" }}>
                        {d.descendants} descendant{d.descendants === 1 ? "" : "s"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p style={{ fontSize: 10.5, color: "var(--gx-ink-faint)", marginTop: 14, lineHeight: 1.55, textAlign: "center" }}>
              The chain is money-blind: it maps knowledge structure, never product or price.
              Ring size reflects how many registry nodes hang beneath it.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
