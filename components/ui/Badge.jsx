// Shared visual primitives. The audit found borderRadius:999 pills hand-built
// 187× across 86 files with 7 inconsistent paddings, and uppercase overlines
// rebuilt 151× with drifting font sizes. These three primitives collapse that
// repetition. Pixels match the most common existing pattern, so migrating a
// hand-rolled pill to <Badge> is a no-visual-change dedup.

const SIZES = {
  sm: { fontSize: 9,  padding: "2px 8px" },
  md: { fontSize: 11, padding: "3px 9px" },
};

// A pill. Pass `color` (foreground) and it derives a 14% tint background, or
// pass an explicit `tint`. `mono` uses the mono font (codes/counts).
export function Badge({ children, color, tint, size = "sm", mono = false, uppercase = false, title, style }) {
  const sz = SIZES[size] || SIZES.sm;
  return (
    <span title={title} style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: sz.fontSize, padding: sz.padding, borderRadius: 999,
      fontWeight: 700, letterSpacing: 0.4, lineHeight: 1.4, whiteSpace: "nowrap",
      textTransform: uppercase ? "uppercase" : "none",
      background: tint || (color ? `color-mix(in srgb, ${color} 14%, transparent)` : "var(--gx-surface-2)"),
      color: color || "var(--gx-ink-soft)",
      fontFamily: mono ? "var(--gx-font-mono)" : "inherit",
      ...style,
    }}>
      {children}
    </span>
  );
}

// The uppercase eyebrow label. Backed by the .gx-overline token class.
export function Overline({ children, style }) {
  return <div className="gx-overline" style={style}>{children}</div>;
}

// overline + title (+ optional sub + right-aligned slot) in one block.
export function SectionHeader({ overline, title, sub, right, style }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10, ...style }}>
      <div style={{ minWidth: 0 }}>
        {overline && <Overline style={{ marginBottom: 2 }}>{overline}</Overline>}
        {title && (
          <h2 style={{ fontFamily: "var(--gx-font-display)", fontSize: 15, fontWeight: 700, color: "var(--gx-ink)", margin: 0, lineHeight: 1.25 }}>
            {title}
          </h2>
        )}
        {sub && <div style={{ fontSize: 11, color: "var(--gx-ink-muted)", marginTop: 2 }}>{sub}</div>}
      </div>
      {right && <div style={{ flexShrink: 0 }}>{right}</div>}
    </div>
  );
}
