"use client";
// components/exchange/VennExchangeRoute.jsx
//
// Venn Exchange OVERVIEW — the entry layer, inside the shared ExchangeShell. A
// hero + the real money-free state + the participant types + clear entry cards
// into each dedicated layer (each layer is its own detailed page). Auth-aware
// (admin sees the Desk in the shell nav). Firewall: money-free counts only.

import { useEffect, useState } from "react";
import Link from "next/link";
import ExchangeShell from "./ExchangeShell";
import { supabase } from "../../lib/supabase";

const PARTICIPANTS = [
  { name: "Investors", detail: "Funds, angels, impact and corporate venture looking for verified, conservation-grounded value to back." },
  { name: "VENN Bioventures ventures", detail: "Projects and companies VENN founds or leads, shown alongside the evidence they are built on." },
  { name: "Industry organizations", detail: "Cosmetics, clinical-study (CRO), and medical & support-product firms sourcing verified outputs." },
];

const LAYERS = [
  { href: "/exchange/lifecycle", name: "The Cambium", detail: "Every venture as a living cross-section — funding rings from idea to exit.", accent: "#1D9E75" },
  { href: "/exchange/board", name: "The Deal Board", detail: "Verified value outputs, evidence-first, across every vertical.", accent: "#F5A623" },
  { href: "/exchange/directory", name: "Directory", detail: "28 curated, real funds whose public thesis fits the work.", accent: "#7BE3BE" },
];

function Stat({ n, label }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 9 }}>
      <span style={{ fontFamily: "ui-monospace, Menlo, Consolas, monospace", fontSize: 32, fontWeight: 700, color: n == null ? "rgba(255,255,255,0.3)" : "#FFE6BC" }}>{n == null ? "—" : n}</span>
      <span style={{ fontSize: 12.5, color: "#C8B89E" }}>{label}</span>
    </div>
  );
}

export default function VennExchangeRoute() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    let on = true;
    supabase.rpc("get_exchange_public_stats").then(({ data }) => { if (on) setStats(data || null); }).catch(() => {});
    return () => { on = false; };
  }, []);
  const opp = stats?.opportunities ?? null;
  const verts = stats?.verticals ?? null;

  return (
    <ExchangeShell
      title="Where verified value meets the people who carry it forward"
      tagline="The cross-vertical commerce home for VENN Bioventures — evidence-first, money-free on the surface, and curated by hand. The conservation atlases stay pure."
    >
      <section style={{ display: "flex", gap: 36, flexWrap: "wrap", marginBottom: 30 }}>
        <Stat n={opp} label={opp === 1 ? "verified output listed" : "verified outputs listed"} />
        <Stat n={verts} label={verts === 1 ? "active vertical" : "active verticals"} />
      </section>

      {/* layer entry cards */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14, marginBottom: 34 }}>
        {LAYERS.map((l) => (
          <Link key={l.href} href={l.href} style={{ textDecoration: "none" }}>
            <div style={{ height: "100%", padding: "20px 22px", borderRadius: 16, background: "rgba(28,12,44,0.55)", border: "1px solid rgba(245,166,35,0.18)", display: "flex", flexDirection: "column", gap: 8, transition: "border-color .15s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <span style={{ width: 9, height: 9, borderRadius: 99, background: l.accent }} />
                <span style={{ fontSize: 16, fontWeight: 700, color: "#FFE6BC" }}>{l.name}</span>
              </div>
              <div style={{ fontSize: 12.5, color: "#C8B89E", lineHeight: 1.55 }}>{l.detail}</div>
              <span style={{ fontSize: 12, color: l.accent, fontWeight: 600, marginTop: "auto" }}>Open →</span>
            </div>
          </Link>
        ))}
      </section>

      {/* participants */}
      <h2 style={{ fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", color: "#FFD79B", fontWeight: 700, marginBottom: 12 }}>Who meets here</h2>
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, marginBottom: 30 }}>
        {PARTICIPANTS.map((p) => (
          <div key={p.name} style={{ padding: "16px 18px", borderRadius: 14, background: "rgba(28,12,44,0.4)", border: "1px solid rgba(245,166,35,0.14)" }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: "#FFE6BC", marginBottom: 7 }}>{p.name}</div>
            <div style={{ fontSize: 12.5, color: "#E7D3B3", lineHeight: 1.6 }}>{p.detail}</div>
          </div>
        ))}
      </section>

      {/* firewall */}
      <section style={{ padding: "16px 22px", borderRadius: 14, background: "rgba(86,142,80,0.10)", border: "1px solid rgba(125,168,111,0.3)" }}>
        <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: "#A8C49C", fontWeight: 700, marginBottom: 8 }}>The firewall holds · curated, by invitation</div>
        <div style={{ fontSize: 13, color: "#E7D3B3", lineHeight: 1.7 }}>
          The Exchange only references that verified outputs <em>exist</em> — read-only, one-directional.
          No prices or market data ever cross back into conservation. For now VENN curates every match by hand;
          self-serve participation opens as the network grows.
        </div>
      </section>
    </ExchangeShell>
  );
}
