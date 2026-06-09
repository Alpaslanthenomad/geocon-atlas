"use client";
// components/exchange/Cambium.jsx
//
// THE CAMBIUM — a venture rendered as a living stem cross-section (dendrochronology).
// Pith (green) = frozen conservation evidence. Each growth ring = a completed
// funding stage, deposited OUTWARD and immutable (the append-only event log made
// physical). The cambium = the live in-progress ring (a slow breathing pulse;
// freezes grey when stalled). Vascular rays = investors. Bark = the off-ramp.
//
// Radius = stage, angle = time-in-stage. The firewall is visible in the geometry:
// value grows OUTWARD from a green evidence seed and can never grow back inward.
// Pure render layer — takes a venture payload, no DB, no PII, no money figures.

const C = 360; // centre of the 720 viewBox
const GREEN = "#1D9E75";
const STAGES = [
  { key: "idea", label: "Idea", r0: 58, r1: 88 },
  { key: "pre_seed", label: "Pre-seed", r0: 88, r1: 126 },
  { key: "seed", label: "Seed", r0: 126, r1: 172 },
  { key: "series_a", label: "Series A", r0: 172, r1: 216 },
  { key: "series_b_plus", label: "Series B+", r0: 216, r1: 256 },
  { key: "growth", label: "Growth", r0: 256, r1: 300 },
  { key: "exit", label: "Exit", r0: 300, r1: 338 },
];
const STAGE_IDX = Object.fromEntries(STAGES.map((s, i) => [s.key, i]));

function pol(r, deg) {
  const a = ((deg - 90) * Math.PI) / 180;
  return [C + r * Math.cos(a), C + r * Math.sin(a)];
}
// an annular arc (donut slice) swept clockwise from 12 o'clock by `sweep` degrees
function annular(rIn, rOut, sweep) {
  const s = Math.max(8, Math.min(358, sweep));
  const [ox0, oy0] = pol(rOut, 0), [ox1, oy1] = pol(rOut, s);
  const [ix1, iy1] = pol(rIn, s), [ix0, iy0] = pol(rIn, 0);
  const large = s > 180 ? 1 : 0;
  return `M ${ox0} ${oy0} A ${rOut} ${rOut} 0 ${large} 1 ${ox1} ${oy1} L ${ix1} ${iy1} A ${rIn} ${rIn} 0 ${large} 0 ${ix0} ${iy0} Z`;
}
// amber ramp: older rings deeper, newer brighter (growth toward light)
function amber(brightness) {
  const b = Math.max(0, Math.min(1, brightness ?? 0.5));
  const stops = ["#7a3d12", "#9e561d", "#C24E17", "#E5722B", "#F5A623", "#FFD15C"];
  return stops[Math.round(b * (stops.length - 1))];
}

export default function Cambium({ venture, size = 360 }) {
  const v = venture || {};
  const rings = v.rings || [];
  const live = v.live || null;
  const investors = v.investors || [];
  const status = v.status || "active";
  const empty = !rings.length && !live;

  return (
    <svg viewBox="0 0 720 720" width={size} height={size} role="img"
      aria-label="venture lifecycle cross-section" style={{ display: "block", maxWidth: "100%" }}>
      <defs>
        <radialGradient id="cmb-bg" cx="50%" cy="50%" r="62%">
          <stop offset="0%" stopColor="#2a1240" />
          <stop offset="100%" stopColor="#150821" />
        </radialGradient>
        <style>{`@keyframes cmb-breathe{0%,100%{opacity:.55}50%{opacity:1}}`}</style>
      </defs>
      <circle cx={C} cy={C} r={352} fill="url(#cmb-bg)" />

      {/* faint stage guide bands (the un-grown potential) */}
      {STAGES.map((s) => (
        <circle key={s.key} cx={C} cy={C} r={s.r1} fill="none"
          stroke="rgba(245,166,35,0.07)" strokeWidth="1" />
      ))}

      {/* completed heartwood rings */}
      {rings.map((rg, i) => {
        const band = STAGES[STAGE_IDX[rg.key] ?? i] || STAGES[i];
        if (!band) return null;
        const sweep = 40 + (rg.dwellRatio ?? 0.4) * 300;
        const w = 3 + (rg.magnitude ?? 0.4) * 13;
        const mid = (band.r0 + band.r1) / 2;
        return (
          <path key={rg.key + i} d={annular(mid - w / 2, mid + w / 2, sweep)}
            fill={amber(rg.brightness ?? 0.3 + i * 0.12)} opacity={0.92}
            stroke="rgba(0,0,0,0.18)" strokeWidth="0.5" />
        );
      })}

      {/* the live cambium — the breathing edge */}
      {live && (() => {
        const band = STAGES[STAGE_IDX[live.stage] ?? rings.length] || STAGES[rings.length] || STAGES[STAGES.length - 2];
        const mid = (band.r0 + band.r1) / 2;
        const w = 8;
        const sweep = 30 + (live.timeRatio ?? 0.3) * 300;
        const node = pol(mid, sweep);
        const col = live.stalled ? "#9b8c74" : "#FFE08A";
        return (
          <g>
            <path d={annular(mid - w / 2, mid + w / 2, sweep)} fill={col}
              style={live.stalled ? undefined : { animation: "cmb-breathe 3s ease-in-out infinite" }} />
            <circle cx={node[0]} cy={node[1]} r={live.stalled ? 4 : 6} fill={live.stalled ? "#9b8c74" : "#fff"} />
          </g>
        );
      })()}

      {/* vascular rays — investors */}
      {investors.map((iv, i) => {
        const band = STAGES[STAGE_IDX[iv.stage] ?? 2] || STAGES[2];
        const ang = (i / Math.max(1, investors.length)) * 300 + 20;
        const [x, y] = pol(band.r1, ang);
        const [x0, y0] = pol(60, ang);
        return (
          <g key={i}>
            <line x1={x0} y1={y0} x2={x} y2={y} stroke="rgba(255,224,138,0.35)" strokeWidth="1.4" />
            <circle cx={x} cy={y} r="3.2" fill="#FFD79B" />
          </g>
        );
      })}

      {/* bark / off-ramp skin */}
      {status === "paused" && <circle cx={C} cy={C} r={322} fill="none" stroke="#9b8c74" strokeWidth="3" strokeDasharray="6 7" />}
      {status === "passed" && <path d={annular(58, 322, 26)} fill="#150821" opacity="0.85" transform={`rotate(150 ${C} ${C})`} />}
      {status === "exited" && <circle cx={C} cy={C} r={324} fill="none" stroke="#FFF1C2" strokeWidth="3" />}

      {/* pith — the frozen evidence core */}
      <circle cx={C} cy={C} r={58} fill={empty ? "rgba(29,158,117,0.35)" : GREEN} opacity={empty ? 0.6 : 0.95} />
      <circle cx={C} cy={C} r={58} fill="none" stroke="#7BE3BE" strokeWidth="1.5" opacity="0.6" />
      {/* tiny three-lobe Venn glyph */}
      <g opacity={empty ? 0.4 : 0.9}>
        <circle cx={C - 11} cy={C - 6} r="13" fill="none" stroke="#1D9E75" strokeWidth="1.4" />
        <circle cx={C + 11} cy={C - 6} r="13" fill="none" stroke="#185FA5" strokeWidth="1.4" />
        <circle cx={C} cy={C + 12} r="13" fill="none" stroke="#BA7517" strokeWidth="1.4" />
      </g>
      {!empty && v.pith?.evidenceCount != null && (
        <text x={C} y={C + 42} textAnchor="middle" fontSize="13" fontWeight="700" fill="#E1F5EE">
          {v.pith.evidenceCount} evidence
        </text>
      )}
    </svg>
  );
}
