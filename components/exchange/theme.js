// components/exchange/theme.js
//
// Venn Exchange palette — a light, serious "biotech-venture" identity, distinct
// from BEE. Not dark. Clean clinical surfaces, a precise teal + the conservation
// green (firewall), a restrained venture-gold for commerce signals. One source of
// truth so the vertical's still-forming identity is easy to retune in one place.

export const T = {
  // surfaces
  bg: "linear-gradient(175deg, #F5FBF9 0%, #EAF4F0 55%, #E3F0EB 100%)",
  bgSoft: "radial-gradient(ellipse at 18% 0%, rgba(14,156,138,0.07) 0%, transparent 45%)," +
          "radial-gradient(ellipse at 85% 100%, rgba(29,158,117,0.06) 0%, transparent 50%)," +
          "linear-gradient(175deg, #F5FBF9 0%, #EAF4F0 55%, #E3F0EB 100%)",
  surface: "#FFFFFF",
  surfaceAlt: "#F4FAF7",
  sunken: "#E9F3EF",
  glass: "rgba(255,255,255,0.82)",
  // lines
  line: "#D8E9E3",
  line2: "#C3DED4",
  // text
  ink: "#12302A",
  body: "#3E5852",
  muted: "#75918A",
  faint: "#A4BBB3",
  // accents
  teal: "#0E9C8A",
  tealDeep: "#0B6E60",
  emerald: "#1D9E75",
  gold: "#B5852F",
  goldSoft: "#D9A441",
  // VENN brand triad (from the brand guide / app/venn) — used as light accents,
  // never as heavy fills: Science=Sapphire, Commerce=Antique Gold, Conservation=Emerald.
  venn: { sapphire: "#1A237E", gold: "#B8860B", emerald: "#1B5E20" },
  // heat ramp (fund density on light surface — pale mint -> deep teal)
  heat: ["#CDEAE0", "#94D6C1", "#57BC9E", "#239F7E", "#108A6E", "#0B6E60"],
};

export function heatColor(d) {
  if (!d) return null;
  return T.heat[Math.round(Math.max(0, Math.min(1, d)) * (T.heat.length - 1))];
}
