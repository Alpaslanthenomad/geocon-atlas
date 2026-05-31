"use client";
// Stat — big number + label cluster. Optional accent tint.
//
//   <Stat value={42} label="Active programs" />
//   <Stat value="12.4k" label="Publications" tint="#185FA5" />
//   <Stat value={3.0} label="Starting impact" tint="#185FA5" trend="up" trendNote="+0.6 since last week" />

export default function Stat({
  value,
  label,
  tint,
  trend,        // "up" | "down" | "flat"
  trendNote,
  className = "",
  style,
}) {
  const trendCls =
    trend === "up"   ? "gx-stat-trend-up"
    : trend === "down" ? "gx-stat-trend-down"
    : trend         ? "gx-stat-trend-flat"
    : "";

  return (
    <div className={`gx-stat ${className}`} style={style}>
      <div className="gx-stat-value" style={tint ? { color: tint } : undefined}>
        {value ?? "—"}
      </div>
      <div className="gx-stat-label">{label}</div>
      {trend && trendNote && (
        <div className={trendCls} style={{ fontSize: 11, marginTop: 6, fontWeight: 600 }}>
          {trend === "up" ? "↑" : trend === "down" ? "↓" : "·"} {trendNote}
        </div>
      )}
    </div>
  );
}

// A grid wrapper for laying out 2-6 Stats side by side.
export function StatGrid({ children, minColumn = 140, gap = 10, style }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: `repeat(auto-fit, minmax(${minColumn}px, 1fr))`,
      gap,
      ...style,
    }}>
      {children}
    </div>
  );
}
