"use client";
// v5.1-c — Loading skeleton primitives.
//
// Replaces ad-hoc "Loading…" strings + bare .gx-skeleton divs with a
// composable component family. Three variants cover ~95% of cases:
//   - line    → text placeholder (1-line headline, label, chip)
//   - card    → rectangular block (list row, hero, summary card)
//   - circle  → avatar / icon placeholder
//
// Shimmer animation lives in app/globals.css via the existing
// gx-skeleton-shimmer keyframe. If the consumer needs a non-pulsing
// static placeholder, pass `static`.

const BASE = {
  background: "linear-gradient(90deg, var(--gx-surface-3) 0%, var(--gx-surface-2) 50%, var(--gx-surface-3) 100%)",
  backgroundSize: "800px 100%",
  borderRadius: 6,
};

const ANIMATED = {
  animation: "gx-shimmer 1.4s linear infinite",
};

export default function Skeleton({
  variant = "card",
  width,
  height,
  count = 1,
  gap = 6,
  rounded,
  static: isStatic = false,
  style,
}) {
  if (count > 1) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap }}>
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={i} variant={variant} width={width} height={height}
            rounded={rounded} static={isStatic} style={style} />
        ))}
      </div>
    );
  }

  const dims = sizing(variant, { width, height, rounded });
  return (
    <span aria-hidden style={{
      display: "inline-block",
      ...BASE,
      ...(isStatic ? {} : ANIMATED),
      ...dims,
      ...style,
    }} />
  );
}

function sizing(variant, { width, height, rounded }) {
  switch (variant) {
    case "line":
      return {
        display: "block",
        width: width || "100%",
        height: height || 14,
        borderRadius: rounded ?? 4,
      };
    case "circle":
      return {
        width: width || 28,
        height: height || width || 28,
        borderRadius: "50%",
      };
    case "card":
    default:
      return {
        display: "block",
        width: width || "100%",
        height: height || 80,
        borderRadius: rounded ?? 8,
      };
  }
}

// Convenience: 3-line text block for paragraphs / summaries.
export function SkeletonParagraph({ lines = 3, width = "100%" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} variant="line"
          width={i === lines - 1 ? "60%" : width}
          height={12} />
      ))}
    </div>
  );
}

// Convenience: list of card rows (e.g. species results list).
export function SkeletonList({ rows = 4, rowHeight = 72 }) {
  return <Skeleton variant="card" count={rows} height={rowHeight} gap={8} />;
}
