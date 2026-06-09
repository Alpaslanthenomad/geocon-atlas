"use client";
// components/exchange/VennExchangeRoute.jsx
//
// Venn Exchange OVERVIEW — the living trading floor inside the shell. Light
// biotech-venture skin (see theme.js). The dynamic floor leads; then the layer
// entry cards, participant types, and the firewall promise.

import Link from "next/link";
import ExchangeShell from "./ExchangeShell";
import ExchangeFloor from "./ExchangeFloor";
import { T } from "./theme";

const PARTICIPANTS = [
  { name: "Investors", detail: "Funds, angels, impact and corporate venture looking for verified, conservation-grounded value to back." },
  { name: "VENN Bioventures ventures", detail: "Projects and companies VENN founds or leads, shown alongside the evidence they are built on." },
  { name: "Industry organizations", detail: "Cosmetics, clinical-study (CRO), and medical & support-product firms sourcing verified outputs." },
];

const LAYERS = [
  { href: "/exchange/lifecycle", name: "The Cambium", detail: "Every venture as a living cross-section — funding rings from idea to exit.", accent: T.venn.emerald },
  { href: "/exchange/board", name: "The Deal Board", detail: "Verified value outputs, evidence-first, across every vertical.", accent: T.venn.gold },
  { href: "/exchange/directory", name: "Directory", detail: "28 curated, real funds whose public thesis fits the work.", accent: T.venn.sapphire },
];

export default function VennExchangeRoute() {
  return (
    <ExchangeShell
      title="Where verified value meets the people who carry it forward"
      tagline="The cross-vertical commerce home for VENN Bioventures — evidence-first, money-free on the surface, and curated by hand. The conservation atlases stay pure."
      wide
    >
      <ExchangeFloor />

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14, marginBottom: 34 }}>
        {LAYERS.map((l) => (
          <Link key={l.href} href={l.href} style={{ textDecoration: "none" }}>
            <div style={{ height: "100%", padding: "20px 22px", borderRadius: 16, background: T.surface, border: "1px solid " + T.line, boxShadow: "0 4px 16px rgba(16,90,78,0.05)", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <span style={{ width: 9, height: 9, borderRadius: 99, background: l.accent }} />
                <span style={{ fontSize: 16, fontWeight: 700, color: T.ink }}>{l.name}</span>
              </div>
              <div style={{ fontSize: 12.5, color: T.body, lineHeight: 1.55 }}>{l.detail}</div>
              <span style={{ fontSize: 12, color: l.accent, fontWeight: 600, marginTop: "auto" }}>Open →</span>
            </div>
          </Link>
        ))}
      </section>

      <h2 style={{ fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", color: T.tealDeep, fontWeight: 700, marginBottom: 12 }}>Who meets here</h2>
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, marginBottom: 30 }}>
        {PARTICIPANTS.map((p) => (
          <div key={p.name} style={{ padding: "16px 18px", borderRadius: 14, background: T.surfaceAlt, border: "1px solid " + T.line }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: T.ink, marginBottom: 7 }}>{p.name}</div>
            <div style={{ fontSize: 12.5, color: T.body, lineHeight: 1.6 }}>{p.detail}</div>
          </div>
        ))}
      </section>

      <section style={{ padding: "16px 22px", borderRadius: 14, background: "rgba(29,158,117,0.08)", border: "1px solid rgba(29,158,117,0.28)" }}>
        <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: T.emerald, fontWeight: 700, marginBottom: 8 }}>The firewall holds · curated, by invitation</div>
        <div style={{ fontSize: 13, color: T.body, lineHeight: 1.7 }}>
          The Exchange only references that verified outputs <em>exist</em> — read-only, one-directional.
          No prices or market data ever cross back into conservation. For now VENN curates every match by hand;
          self-serve participation opens as the network grows.
        </div>
      </section>
    </ExchangeShell>
  );
}
