// Single source of truth for IUCN Red List status colors + labels.
//
// Before this file the CR color alone was defined 6+ different ways across
// 23 files (#FF1744 / #FF8B96 / #FF6B7A / #E5484D / #ef4444 + a text/bg pair),
// so the SAME status rendered as a different red on different screens. All
// IUCN coloring now keys here. Vivid set === the --gx-iucn-* CSS tokens.

// VIVID — the canonical dot / fill / legend color (matches --gx-iucn-* tokens).
export const IUCN_COLORS = {
  CR: "#FF1744", EN: "#FF9100", VU: "#FFD600",
  NT: "#80CBC4", LC: "#66BB6A", DD: "#B0BEC5", NE: "#78909C",
};

// SOFT — the lighter tint, for panel backgrounds / large surfaces where the
// vivid color would be too strong. One soft set everywhere (was 3 conflicting).
export const IUCN_TINT = {
  CR: "#FF8B96", EN: "#FFB870", VU: "#FFE875",
  NT: "#B2DFDB", LC: "#A5D6A7", DD: "#CFD8DC", NE: "#90A4AE",
};

// TEXT + BACKGROUND pair — readable status text on a light chip (legacy
// helpers.iucnC / iucnBg, kept here so there is ONE module for IUCN color).
export const IUCN_TEXT = {
  CR: "#A32D2D", EN: "#854F0B", VU: "#BA7517", NT: "#3B6D11", LC: "#0F6E56",
};
export const IUCN_BG = {
  CR: "#FCEBEB", EN: "#FAEEDA", VU: "#FFF3CD", NT: "#EAF3DE", LC: "#E1F5EE",
};

export const IUCN_LABEL = {
  CR: "Critically endangered", EN: "Endangered", VU: "Vulnerable",
  NT: "Near threatened", LC: "Least concern", DD: "Data deficient", NE: "Not evaluated",
};

// Threat tiers high→low, then the non-assessed buckets.
export const IUCN_ORDER = ["CR", "EN", "VU", "NT", "LC", "DD", "NE"];

export const iucnColor = (s) => IUCN_COLORS[s] || "#888";
export const iucnTint  = (s) => IUCN_TINT[s] || "#f1efe8";
export const iucnLabel = (s) => IUCN_LABEL[s] || s || "—";
// back-compat aliases for the old lib/helpers names
export const iucnC  = (s) => IUCN_TEXT[s] || "#888";
export const iucnBg = (s) => IUCN_BG[s] || "#f1efe8";
