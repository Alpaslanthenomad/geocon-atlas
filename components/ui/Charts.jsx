"use client";
// GEOCON data visualization suite — 4 chart primitives built on
// Recharts that share the design-token palette and stay calm /
// editorial rather than "dashboard".
//
//   <FamilyDonut data={[{ name: "Iridaceae", value: 312 }, ...]} />
//   <PublicationTimeline data={[{ year: 2020, count: 14 }, ...]} />
//   <StatusBreakdown data={[{ status: "VU", count: 96 }, ...]} />
//   <ImpactRadial data={[{ currency: "research", value: 47 }, ...]} />
//
// All charts are responsive (parent-width + fixed height), no animations
// over 300ms, and tooltips use the same surface tokens as our cards.

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  RadialBarChart, RadialBar, Legend,
  LineChart, Line,
} from "recharts";
import { IUCN_COLORS as IUCN_TINT } from "../../lib/iucn";

// Palette pulled from the same wells we use for IUCN swatches +
// brand accents. Anything that doesn't map gets the neutral fallback.
const PALETTE = [
  "#0F6E56", "#534AB7", "#185FA5", "#BA7517", "#A32D2D",
  "#1D9E75", "#85651A", "#D85A30", "#5F4FB6", "#1B6FB5",
];

// IUCN_TINT now aliases the canonical IUCN_COLORS (lib/iucn).
const CURRENCY_TINT = {
  discovery:    "#534AB7",
  conservation: "#0F6E56",
  research:     "#185FA5",
  stewardship:  "#BA7517",
  network:      "#85651A",
};

const CURRENCY_ICON = {
  discovery: "🔭", conservation: "🌱", research: "📚",
  stewardship: "🛡", network: "🌐",
};

const tooltipStyle = {
  background: "var(--gx-surface)",
  border: "1px solid var(--gx-border-soft)",
  borderRadius: 8,
  padding: "8px 10px",
  fontSize: 12,
  color: "var(--gx-ink)",
  boxShadow: "var(--gx-shadow-2)",
};

function colorFor(name, index) {
  return PALETTE[index % PALETTE.length];
}

/* ─────────────────────────── FamilyDonut ───────────────────────────
   Top-N families as a doughnut. `data` is [{ name, value }] sorted
   descending; rows past `maxSlices` collapse into an "Other" wedge. */

export function FamilyDonut({ data = [], maxSlices = 8, height = 220, title }) {
  const sorted = [...data].sort((a, b) => (b.value || 0) - (a.value || 0));
  const head = sorted.slice(0, maxSlices);
  const tail = sorted.slice(maxSlices);
  const otherTotal = tail.reduce((s, r) => s + (r.value || 0), 0);
  const sliced = otherTotal > 0
    ? [...head, { name: "Other", value: otherTotal, _isOther: true }]
    : head;
  const total = sliced.reduce((s, r) => s + (r.value || 0), 0);

  if (sliced.length === 0) {
    return <div className="gx-caption" style={{ padding: 20, textAlign: "center" }}>No data.</div>;
  }

  return (
    <div style={{ position: "relative" }}>
      {title && <div className="gx-overline" style={{ marginBottom: 8 }}>{title}</div>}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={sliced}
            dataKey="value"
            nameKey="name"
            innerRadius="58%"
            outerRadius="86%"
            paddingAngle={1.5}
            stroke="var(--gx-surface)"
            strokeWidth={2}
            isAnimationActive={false}
          >
            {sliced.map((entry, i) => (
              <Cell
                key={i}
                fill={entry._isOther ? "var(--gx-surface-3)" : colorFor(entry.name, i)}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value, name) => [`${value} (${total ? ((value / total) * 100).toFixed(1) : 0}%)`, name]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div style={{
        position: "absolute", inset: 0, display: "flex",
        alignItems: "center", justifyContent: "center",
        pointerEvents: "none", flexDirection: "column",
        paddingTop: title ? 16 : 0,
      }}>
        <div style={{
          fontFamily: "var(--gx-font-display)",
          fontSize: 22, fontWeight: 700, color: "var(--gx-ink)",
          lineHeight: 1, letterSpacing: -0.02,
        }}>{total}</div>
        <div className="gx-overline" style={{ marginTop: 4 }}>Total</div>
      </div>
    </div>
  );
}

/* ─────────────────────────── PublicationTimeline ──────────────────
   Bar chart of yearly publication count. `data` is [{ year, count }]
   sorted ascending; gaps are filled with 0 between min/max year. */

export function PublicationTimeline({ data = [], height = 200, title, tint = "var(--gx-accent-azure)" }) {
  if (!Array.isArray(data) || data.length === 0) {
    return <div className="gx-caption" style={{ padding: 20, textAlign: "center" }}>No timeline data.</div>;
  }
  const years = data.map((r) => Number(r.year)).filter(Number.isFinite);
  const minY = Math.min(...years);
  const maxY = Math.max(...years);
  const lookup = new Map(data.map((r) => [Number(r.year), Number(r.count) || 0]));
  const filled = [];
  for (let y = minY; y <= maxY; y++) {
    filled.push({ year: y, count: lookup.get(y) || 0 });
  }

  return (
    <div>
      {title && <div className="gx-overline" style={{ marginBottom: 8 }}>{title}</div>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={filled} margin={{ top: 8, right: 4, bottom: 4, left: -16 }}>
          <CartesianGrid strokeDasharray="2 3" stroke="var(--gx-border-soft)" vertical={false} />
          <XAxis
            dataKey="year" tickLine={false} axisLine={false}
            tick={{ fontSize: 10, fill: "var(--gx-ink-muted)" }}
            interval="preserveStartEnd"
          />
          <YAxis
            tickLine={false} axisLine={false} allowDecimals={false}
            tick={{ fontSize: 10, fill: "var(--gx-ink-muted)" }} width={36}
          />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--gx-surface-3)" }} />
          <Bar dataKey="count" fill={tint} radius={[3, 3, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─────────────────────────── StatusBreakdown ──────────────────────
   Horizontal bar list with IUCN tints. `data` is [{ status, count }]
   in any order; rows are auto-sorted by IUCN severity. */

const IUCN_ORDER = ["CR", "EN", "VU", "NT", "LC", "DD", "NE"];

export function StatusBreakdown({ data = [], title, total }) {
  if (!Array.isArray(data) || data.length === 0) {
    return <div className="gx-caption" style={{ padding: 20, textAlign: "center" }}>No status data.</div>;
  }
  const sorted = [...data].sort(
    (a, b) => IUCN_ORDER.indexOf(a.status) - IUCN_ORDER.indexOf(b.status)
  );
  const sum = total || sorted.reduce((s, r) => s + (Number(r.count) || 0), 0) || 1;

  return (
    <div>
      {title && <div className="gx-overline" style={{ marginBottom: 10 }}>{title}</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {sorted.map((r) => {
          const v = Number(r.count) || 0;
          const pct = (v / sum) * 100;
          return (
            <div key={r.status} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{
                width: 32, fontSize: 10, fontWeight: 700,
                color: IUCN_TINT[r.status] || "var(--gx-ink-muted)",
                fontFamily: "var(--gx-font-mono)", letterSpacing: 0.4,
              }}>
                {r.status}
              </span>
              <div style={{
                flex: 1, height: 12,
                background: "var(--gx-surface-3)",
                borderRadius: 6, overflow: "hidden",
              }}>
                <div style={{
                  width: `${pct}%`, height: "100%",
                  background: IUCN_TINT[r.status] || "var(--gx-ink-muted)",
                  transition: "width 0.3s ease",
                }} />
              </div>
              <span style={{
                width: 50, textAlign: "right",
                fontSize: 11, fontWeight: 700,
                color: "var(--gx-ink)",
                fontFamily: "var(--gx-font-mono)",
              }}>
                {v}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────── ImpactRadial ─────────────────────────
   5-currency radial bars. `data` is [{ currency, value }]. */

export function ImpactRadial({ data = [], height = 220, title }) {
  if (!Array.isArray(data) || data.length === 0) {
    return <div className="gx-caption" style={{ padding: 20, textAlign: "center" }}>No impact data.</div>;
  }
  const enriched = data.map((r) => ({
    name: `${CURRENCY_ICON[r.currency] || "✦"} ${r.currency}`,
    value: Number(r.value) || 0,
    fill: CURRENCY_TINT[r.currency] || "var(--gx-ink-muted)",
  }));

  return (
    <div>
      {title && <div className="gx-overline" style={{ marginBottom: 8 }}>{title}</div>}
      <ResponsiveContainer width="100%" height={height}>
        <RadialBarChart
          innerRadius="22%" outerRadius="90%"
          data={enriched} startAngle={90} endAngle={-270}
          barSize={12}
        >
          <RadialBar
            dataKey="value" cornerRadius={6}
            background={{ fill: "var(--gx-surface-3)" }}
            isAnimationActive={false}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend
            iconSize={8} iconType="circle"
            wrapperStyle={{ fontSize: 11, color: "var(--gx-ink-soft)" }}
            verticalAlign="bottom"
          />
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─────────────────────────── SparkLine ───────────────────────────
   Small inline trend line, used inside cards. `data` is an array of
   numbers (no x-axis required). */

export function SparkLine({ data = [], height = 36, tint = "var(--gx-accent-violet)" }) {
  if (!Array.isArray(data) || data.length === 0) return null;
  const points = data.map((v, i) => ({ i, v: Number(v) || 0 }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={points} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <Line
          type="monotone" dataKey="v" stroke={tint}
          strokeWidth={1.5} dot={false} isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
