// GEOCON design system v2 — primitive re-exports.
// Import from "components/ui" instead of individual files.
//
// Only exports things actually imported by routes today. The v3.1
// audit found 7 primitive dosyaları + 5 unused Chart re-export'u dead;
// removed in the P2 cleanup pass. If you need Modal / Wizard /
// FloatingField / Hero / Pill / Button / Section / Typography back,
// `git log -- components/ui` will show their last shipped form.

export { default as Stat, StatGrid } from "./Stat";
export { default as TrustStrip } from "./TrustStrip";
export { ToastProvider, useToast } from "./Toast";
export { Badge, Overline, SectionHeader } from "./Badge";
// NOTE: Charts (recharts, ~342KB) are intentionally NOT re-exported here.
// Re-exporting them dragged recharts onto ~24 routes that never chart.
// Import directly from "./Charts" in the (2) routes that actually chart.
