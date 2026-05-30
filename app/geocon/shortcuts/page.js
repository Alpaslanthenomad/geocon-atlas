export const metadata = {
  title: "Keyboard shortcuts — GEOCON",
  description: "Every keyboard shortcut and accessibility detail in one place.",
};

const ROWS = [
  { combo: "⌘ / Ctrl + K",  desc: "Open universal search (Spotlight)" },
  { combo: "Esc",           desc: "Close Spotlight, drawers, modals" },
  { combo: "↑ / ↓",         desc: "Move selection inside Spotlight" },
  { combo: "Enter",         desc: "Open the highlighted result" },
  { combo: "Tab / Shift+Tab", desc: "Move keyboard focus" },
  { combo: "Skip link",     desc: "First Tab on any page jumps to main content" },
  { combo: "Voice (mic)",   desc: "Ask GEOCON · uses Web Speech API in TR/EN" },
];

const A11Y = [
  "Honors prefers-reduced-motion: animations + transitions collapse to ~0ms.",
  "Honors prefers-contrast: more — borders darken and muted text lifts.",
  "IUCN swatches pair color with a unique hatching pattern (gx-iucn-* classes) so users with color-vision differences can still read tier mix at a glance.",
  "Light + dark theme toggle persists in localStorage and respects prefers-color-scheme on first visit.",
];

export default function ShortcutsPage() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", paddingBottom: 40 }}>
      <h1 style={{ fontFamily: "var(--gx-font-serif)", fontSize: 28, fontWeight: 700, color: "var(--gx-ink)", margin: 0 }}>
        Keyboard & accessibility
      </h1>
      <div style={{ fontSize: 12, color: "var(--gx-ink-muted)", marginTop: 4 }}>
        How GEOCON behaves when you don&apos;t want to (or can&apos;t) reach for the mouse.
      </div>

      <section style={card}>
        <h2 style={h2}>Shortcuts</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.combo} style={{ borderTop: "1px solid var(--gx-border-soft)" }}>
                <td style={{ padding: "8px 12px", width: 180, color: "var(--gx-ink-soft)" }}>
                  <kbd style={kbd}>{r.combo}</kbd>
                </td>
                <td style={{ padding: "8px 12px", color: "var(--gx-ink)" }}>{r.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={card}>
        <h2 style={h2}>Accessibility details</h2>
        <ul style={{ margin: 0, paddingLeft: 18, color: "var(--gx-ink)", fontSize: 13, lineHeight: 1.7 }}>
          {A11Y.map((line) => <li key={line}>{line}</li>)}
        </ul>
      </section>

      <section style={card}>
        <h2 style={h2}>IUCN palette · color-blind safe</h2>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 6 }}>
          {["CR","EN","VU","NT","LC","DD","NE"].map((t) => (
            <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span className={`gx-iucn-swatch gx-iucn-${t}`} aria-label={`IUCN ${t}`} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--gx-ink)" }}>{t}</span>
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

const card = {
  marginTop: 16,
  padding: 16,
  background: "var(--gx-surface)",
  border: "1px solid var(--gx-border)",
  borderRadius: "var(--gx-radius-4)",
};
const h2 = {
  fontFamily: "var(--gx-font-serif)",
  fontSize: 18,
  fontWeight: 700,
  color: "var(--gx-ink)",
  margin: "0 0 8px",
};
const kbd = {
  fontFamily: "var(--gx-font-mono)",
  fontSize: 11,
  padding: "3px 7px",
  background: "var(--gx-surface-3)",
  border: "1px solid var(--gx-border)",
  borderRadius: 6,
  color: "var(--gx-ink)",
};
