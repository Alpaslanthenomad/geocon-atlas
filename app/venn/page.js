// vennbioventures.com — the COMPANY face (v2: light, brand-aligned).
// Lives at /venn during design; later host-routed to the apex domain.
// Design language from the Venn BioVentures brand guide:
//   - Light ground: Ivory White #FFFFF0 ; text: Charcoal #1C1C1C
//   - Brand triad: Science = Sapphire #1A237E, Commerce = Antique Gold #B8860B,
//     Conservation = Emerald #1B5E20
//   - Typeface: Montserrat. Motif: the Venn union of three forces.
// Inspired loosely (not copied) by the clean/light feel of vaultbio.com.
// Serious tone, no emojis. [EKLE:] marks real values still missing.

export const metadata = {
  title: "Venn BioVentures — Where bioscience becomes venture",
  description:
    "Venn BioVentures transforms scientific insight into structured platforms, intellectual property, and scalable ventures — at the intersection of nature, science and commerce.",
};

const IVORY = "#FFFFF0";
const WHITE = "#ffffff";
const WARM = "#faf9f1";
const INK = "#1c1c1c";
const INK_SOFT = "#4b4b47";
const INK_MUTED = "#8a8a80";
const LINE = "#e8e6d9";
const GREEN = "#1B5E20"; // Conservation
const BLUE = "#1A237E"; // Science
const GOLD = "#B8860B"; // Commerce
const MONT = '"Montserrat", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

function Eyebrow({ children, color = GOLD }) {
  return (
    <div style={{ fontSize: 12, letterSpacing: 3, textTransform: "uppercase", color, fontWeight: 700, marginBottom: 16 }}>
      {children}
    </div>
  );
}

function Section({ id, bg = IVORY, children, style }) {
  return (
    <section id={id} style={{ background: bg }}>
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "104px 32px", ...style }}>{children}</div>
    </section>
  );
}

function H2({ children }) {
  return (
    <h2 style={{ fontFamily: MONT, fontWeight: 800, fontSize: "clamp(30px,4.2vw,46px)", lineHeight: 1.08, letterSpacing: -0.8, margin: 0, color: INK }}>
      {children}
    </h2>
  );
}

// The Venn mark — three interlocking rings + central V (logo echo).
function VennMark({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" style={{ display: "block" }}>
      <g style={{ isolation: "isolate" }}>
        <circle cx="50" cy="34" r="26" fill={BLUE} fillOpacity="0.85" style={{ mixBlendMode: "multiply" }} />
        <circle cx="34" cy="62" r="26" fill={GREEN} fillOpacity="0.85" style={{ mixBlendMode: "multiply" }} />
        <circle cx="66" cy="62" r="26" fill={GOLD} fillOpacity="0.85" style={{ mixBlendMode: "multiply" }} />
      </g>
    </svg>
  );
}

// Large hero Venn diagram with labels.
function VennDiagram() {
  const labelStyle = { fontFamily: MONT, fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" };
  return (
    <svg viewBox="0 0 420 380" width="100%" style={{ maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="The Venn of science, commerce and conservation">
      <g style={{ isolation: "isolate" }}>
        <circle cx="210" cy="150" r="110" fill={BLUE} fillOpacity="0.42" style={{ mixBlendMode: "multiply" }} />
        <circle cx="150" cy="248" r="110" fill={GREEN} fillOpacity="0.42" style={{ mixBlendMode: "multiply" }} />
        <circle cx="270" cy="248" r="110" fill={GOLD} fillOpacity="0.42" style={{ mixBlendMode: "multiply" }} />
      </g>
      <circle cx="210" cy="150" r="110" fill="none" stroke={BLUE} strokeWidth="1.5" strokeOpacity="0.5" />
      <circle cx="150" cy="248" r="110" fill="none" stroke={GREEN} strokeWidth="1.5" strokeOpacity="0.5" />
      <circle cx="270" cy="248" r="110" fill="none" stroke={GOLD} strokeWidth="1.5" strokeOpacity="0.5" />
      <text x="210" y="60" textAnchor="middle" fill={BLUE} style={labelStyle}>Science</text>
      <text x="70" y="330" textAnchor="middle" fill={GREEN} style={labelStyle}>Conservation</text>
      <text x="350" y="330" textAnchor="middle" fill={GOLD} style={labelStyle}>Commerce</text>
      <text x="210" y="212" textAnchor="middle" fill={WHITE} style={{ fontFamily: MONT, fontSize: 16, fontWeight: 800, letterSpacing: 1 }}>VENN</text>
      <text x="210" y="232" textAnchor="middle" fill={WHITE} style={{ fontFamily: MONT, fontSize: 9.5, fontWeight: 600, letterSpacing: 1.5, opacity: 0.92 }}>INTEGRATED CORE</text>
    </svg>
  );
}

function Wordmark({ size = 22, dark = false }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <VennMark size={size + 6} />
      <span style={{ fontFamily: MONT, fontSize: size, letterSpacing: 0.3, color: dark ? IVORY : INK }}>
        <span style={{ fontWeight: 800 }}>VENN</span>
        <span style={{ fontWeight: 300 }}> BioVentures</span>
      </span>
    </span>
  );
}

const FORMULA = [
  ["01", "Select", "Survey the field and choose the targets worth pursuing."],
  ["02", "Validate", "Prove them in the lab — genomics, tissue culture, secondary metabolites."],
  ["03", "Scale", "Move from bench to pilot production through the partner network."],
  ["04", "Market", "Turn validated assets into B2B revenue and partnerships."],
  ["05", "Legitimize", "Anchor it in science and policy — publications, EU funding, conservation."],
];

const VERTICALS = [
  ["GEOCON", "NGO · Conservation", "An open conservation atlas of ~47,000 threatened geophytes. Conserve first — then create value, without letting commerce contaminate conservation.", GREEN],
  ["Vitalcore", "R&D Lab", "Pilot-scale R&D and production — the laboratory layer that turns validated biology into real material.", BLUE],
  ["Venn Exchange", "Capital", "Where projects and ideas meet venture capital. Early biotech work, routed to the right investors through BEE.", GOLD],
  ["Portfolio", "Ventures", "Companies built on the Venn formula, carried from selection all the way to market.", INK],
];

const AUDIENCES = [
  ["Investors", "Curated, evidence-backed deal flow across biotech verticals — sourced and de-risked on one engine.", BLUE],
  ["Researchers & founders", "Bring early-stage biology. Use BEE to validate it and reach the capital to scale it.", GREEN],
  ["Partners", "Labs and institutions can join as new verticals on the shared operating system.", GOLD],
];

const STATS = [
  ["$113.7B", "Addressable market — cosmetics, pharma, ornamentals (2024)", BLUE],
  ["6–20%", "Market CAGR across target segments", GREEN],
  ["3", "Countries — Estonia, Turkey, Chile", GOLD],
  ["7+", "Verticals planned on the engine", INK],
];

export default function VennCompany() {
  const btnPrimary = {
    fontFamily: MONT, fontSize: 15, fontWeight: 600, color: IVORY, background: BLUE,
    padding: "13px 26px", borderRadius: 8, textDecoration: "none", display: "inline-block",
  };
  const btnGhost = {
    fontFamily: MONT, fontSize: 15, fontWeight: 600, color: INK, background: "transparent",
    padding: "12px 25px", borderRadius: 8, textDecoration: "none", display: "inline-block", border: `1px solid ${INK}`,
  };

  return (
    <div style={{ background: IVORY, color: INK, fontFamily: MONT, overflowX: "hidden" }}>
      {/* ---- NAV ---- */}
      <nav
        style={{
          position: "sticky", top: 0, zIndex: 10,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 32px", background: "rgba(255,255,240,0.88)",
          backdropFilter: "blur(8px)", borderBottom: `1px solid ${LINE}`,
        }}
      >
        <a href="#top" style={{ textDecoration: "none" }}><Wordmark size={20} /></a>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          {[["The Formula", "#formula"], ["BEE", "#bee"], ["Verticals", "#verticals"], ["Company", "#company"]].map(([label, href]) => (
            <a key={href} href={href} style={{ color: INK_SOFT, textDecoration: "none", fontSize: 14, fontWeight: 500 }}>{label}</a>
          ))}
          <a href="/" style={{ ...btnPrimary, padding: "9px 18px", fontSize: 14 }}>Enter BEE →</a>
        </div>
      </nav>

      {/* ---- HERO ---- */}
      <header id="top" style={{ background: `linear-gradient(180deg, ${WHITE} 0%, ${IVORY} 100%)`, borderBottom: `1px solid ${LINE}` }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "84px 32px 96px", display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 56, alignItems: "center" }}>
          <div>
            <Eyebrow>Venn BioVentures OÜ · Estonia</Eyebrow>
            <h1 style={{ fontFamily: MONT, fontWeight: 800, fontSize: "clamp(40px,5.4vw,68px)", lineHeight: 1.04, letterSpacing: -1.5, margin: 0, color: INK }}>
              Where bioscience becomes <span style={{ color: BLUE }}>venture</span>.
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.6, color: INK_SOFT, maxWidth: 520, marginTop: 22, fontWeight: 400 }}>
              Venn BioVentures transforms scientific insight into structured platforms,
              intellectual property, and scalable ventures — at the intersection of
              nature, science and commerce.
            </p>
            <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap", marginTop: 24, fontSize: 15, fontWeight: 700 }}>
              <span style={{ color: BLUE }}>Science</span>
              <span style={{ color: INK_MUTED }}>·</span>
              <span style={{ color: GOLD }}>Commerce</span>
              <span style={{ color: INK_MUTED }}>·</span>
              <span style={{ color: GREEN }}>Conservation</span>
            </div>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 36 }}>
              <a href="/" style={btnPrimary}>Enter BEE →</a>
              <a href="#company" style={btnGhost}>For investors</a>
            </div>
          </div>
          <div><VennDiagram /></div>
        </div>
      </header>

      {/* ---- THE FORMULA ---- */}
      <Section id="formula" bg={IVORY}>
        <Eyebrow>The operating system</Eyebrow>
        <H2>Five modules. <span style={{ color: GOLD }}>One formula.</span></H2>
        <p style={{ fontSize: 18, lineHeight: 1.6, color: INK_SOFT, maxWidth: 640, marginTop: 16 }}>
          Every Venn vertical — from GEOCON to the verticals still to come — runs on the same structured method.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginTop: 44 }}>
          {FORMULA.map(([n, title, desc]) => (
            <div key={n} style={{ background: WHITE, border: `1px solid ${LINE}`, borderRadius: 12, padding: "24px 22px" }}>
              <div style={{ fontFamily: MONT, fontSize: 26, fontWeight: 800, color: GOLD }}>{n}</div>
              <div style={{ fontSize: 17, fontWeight: 700, marginTop: 8, color: INK }}>{title}</div>
              <div style={{ fontSize: 13.5, lineHeight: 1.55, color: INK_SOFT, marginTop: 8 }}>{desc}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ---- BEE — THE PORTAL ---- */}
      <Section id="bee" bg={WARM} style={{ borderTop: `1px solid ${LINE}` }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}>
          <div>
            <Eyebrow color={BLUE}>The portal</Eyebrow>
            <H2>One door into <span style={{ color: BLUE }}>every vertical.</span></H2>
            <p style={{ fontSize: 18, lineHeight: 1.62, color: INK_SOFT, marginTop: 18 }}>
              BEE is the portal between Venn BioVentures and all of its verticals —
              where a researcher with an early idea and an investor looking for the next
              opportunity meet on the same engine.
            </p>
            <a href="/" style={{ ...btnPrimary, marginTop: 28 }}>Enter BEE →</a>
          </div>
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ background: WHITE, border: `1px solid ${LINE}`, borderLeft: `3px solid ${GREEN}`, borderRadius: 10, padding: 22 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: GREEN }}>For the work</div>
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK_SOFT, marginTop: 8 }}>
                Run structured biological programs — from foundation to application — with evidence at every step.
              </div>
            </div>
            <div style={{ background: WHITE, border: `1px solid ${LINE}`, borderLeft: `3px solid ${GOLD}`, borderRadius: 10, padding: 22 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: GOLD }}>For the capital</div>
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK_SOFT, marginTop: 8 }}>
                Reach curated, evidence-backed early biotech — sourced and de-risked on one engine.
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ---- VERTICALS ---- */}
      <Section id="verticals" bg={IVORY} style={{ borderTop: `1px solid ${LINE}` }}>
        <Eyebrow>What runs on Venn</Eyebrow>
        <H2>The <span style={{ color: GREEN }}>verticals.</span></H2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 18, marginTop: 44 }}>
          {VERTICALS.map(([name, tag, desc, color]) => (
            <div key={name} style={{ background: WHITE, border: `1px solid ${LINE}`, borderTop: `3px solid ${color}`, borderRadius: 12, padding: 26 }}>
              <div style={{ fontFamily: MONT, fontSize: 23, fontWeight: 800, color: INK }}>{name}</div>
              <div style={{ display: "inline-block", marginTop: 6, fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color, fontWeight: 700 }}>{tag}</div>
              <div style={{ fontSize: 14, lineHeight: 1.6, color: INK_SOFT, marginTop: 14 }}>{desc}</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 13.5, color: INK_MUTED, marginTop: 24 }}>
          More verticals in planning: Plant ARK · BioUrban Shield · Rural BioLab · BioData Commons.
        </p>
      </Section>

      {/* ---- AUDIENCES ---- */}
      <Section id="audiences" bg={WARM} style={{ borderTop: `1px solid ${LINE}` }}>
        <Eyebrow color={BLUE}>Who it is for</Eyebrow>
        <H2>Built for <span style={{ color: BLUE }}>three.</span></H2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18, marginTop: 44 }}>
          {AUDIENCES.map(([title, desc, color]) => (
            <div key={title} style={{ background: WHITE, border: `1px solid ${LINE}`, borderRadius: 12, padding: 26 }}>
              <div style={{ width: 34, height: 4, borderRadius: 2, background: color }} />
              <div style={{ fontSize: 18, fontWeight: 700, marginTop: 16, color: INK }}>{title}</div>
              <div style={{ fontSize: 14, lineHeight: 1.6, color: INK_SOFT, marginTop: 12 }}>{desc}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ---- COMPANY ---- */}
      <Section id="company" bg={IVORY} style={{ borderTop: `1px solid ${LINE}` }}>
        <Eyebrow>The company</Eyebrow>
        <H2><span style={{ color: BLUE }}>Venn BioVentures</span> OÜ</H2>
        <p style={{ fontSize: 18, lineHeight: 1.6, color: INK_SOFT, maxWidth: 640, marginTop: 16 }}>
          Building at the intersection of nature, science and commerce — across Estonia, Turkey and Chile.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginTop: 40 }}>
          {STATS.map(([value, label, color]) => (
            <div key={label} style={{ background: WHITE, border: `1px solid ${LINE}`, borderRadius: 12, padding: "26px 22px" }}>
              <div style={{ fontFamily: MONT, fontSize: 34, fontWeight: 800, color }}>{value}</div>
              <div style={{ fontSize: 13, lineHeight: 1.5, color: INK_SOFT, marginTop: 8 }}>{label}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ---- CTA BAND (sapphire) ---- */}
      <div style={{ background: BLUE }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "76px 32px", textAlign: "center" }}>
          <h2 style={{ fontFamily: MONT, fontWeight: 800, fontSize: "clamp(28px,4vw,44px)", letterSpacing: -0.5, margin: 0, color: IVORY }}>
            Ready to turn science into <span style={{ color: "#F2C94C" }}>venture?</span>
          </h2>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginTop: 30 }}>
            <a href="mailto:[EKLE: iletişim e-postası]" style={{ fontFamily: MONT, fontSize: 15, fontWeight: 700, color: BLUE, background: IVORY, padding: "13px 26px", borderRadius: 8, textDecoration: "none" }}>Schedule a call</a>
            <a href="mailto:[EKLE: iletişim e-postası]" style={{ fontFamily: MONT, fontSize: 15, fontWeight: 600, color: IVORY, padding: "12px 25px", borderRadius: 8, textDecoration: "none", border: `1px solid rgba(255,255,240,0.5)` }}>Explore partnerships</a>
            <a href="/" style={{ fontFamily: MONT, fontSize: 15, fontWeight: 600, color: IVORY, padding: "12px 25px", borderRadius: 8, textDecoration: "none", border: `1px solid rgba(255,255,240,0.5)` }}>Enter BEE →</a>
          </div>
        </div>
      </div>

      {/* ---- FOOTER ---- */}
      <footer style={{ background: IVORY, borderTop: `1px solid ${LINE}` }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "36px 32px 52px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, fontSize: 13, color: INK_MUTED }}>
          <Wordmark size={16} />
          <div>Contact: [EKLE: iletişim e-postası]</div>
          <div>Estonia · Turkey · Chile · © 2026</div>
        </div>
      </footer>
    </div>
  );
}
