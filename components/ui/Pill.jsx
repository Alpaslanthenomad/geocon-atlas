"use client";
// Pill — semantic chip.
//
//   <Pill tone="success">Active</Pill>
//   <Pill tone="warning" icon="🛡">VU</Pill>
//   <Pill tone="accent" overline>SCOPE</Pill>
//
// Tones: success, warning, danger, info, neutral, accent.

const TONE_CLASS = {
  success: "gx-pill-success",
  warning: "gx-pill-warning",
  danger:  "gx-pill-danger",
  info:    "gx-pill-info",
  neutral: "gx-pill-neutral",
  accent:  "gx-pill-accent",
};

export default function Pill({ tone = "neutral", icon, children, overline = false, title, style }) {
  const cls = `gx-pill ${TONE_CLASS[tone] || TONE_CLASS.neutral}${overline ? " gx-pill-overline" : ""}`;
  return (
    <span className={cls} title={title} style={style}>
      {icon && <span aria-hidden>{icon}</span>}
      {children}
    </span>
  );
}

// IUCN status → tone mapping helper for use across species/program cards.
const IUCN_TONE = {
  CR: "danger", EN: "danger", VU: "warning", NT: "neutral",
  LC: "success", DD: "neutral", NE: "neutral",
};

export function IucnPill({ status, label }) {
  if (!status) return null;
  const s = String(status).toUpperCase();
  return (
    <Pill tone={IUCN_TONE[s] || "neutral"} icon="🛡">
      {label || s}
    </Pill>
  );
}
