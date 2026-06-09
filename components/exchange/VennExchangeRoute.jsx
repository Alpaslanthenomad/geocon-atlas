"use client";
// components/exchange/VennExchangeRoute.jsx
//
// Venn Exchange — the BEE platform-level, cross-vertical commerce home. Auth-aware:
// admins get a working entry to the back-office desk; everyone sees the money-free
// public face (real counts, the participant types, the firewall promise).
//
// FIREWALL: no money figures, no conservation interior. Counts come from a
// money-free SECURITY DEFINER stats RPC (cardinality only). All operational data
// (opportunities, investors, pipeline, PII) stays admin-gated on /exchange/desk.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthContext } from "../../lib/authContext";
import { supabase } from "../../lib/supabase";

const AMBER = "linear-gradient(140deg, #FFD15C 0%, #F5A623 45%, #E5722B 100%)";
const BG =
  "radial-gradient(ellipse at 12% 18%, rgba(229,114,43,0.16) 0%, transparent 45%)," +
  "radial-gradient(ellipse at 88% 82%, rgba(86,142,80,0.14) 0%, transparent 50%)," +
  "radial-gradient(ellipse at 50% 50%, #2a1240 0%, #150821 100%)";

const PARTICIPANTS = [
  { name: "Investors", detail: "Funds, angels, impact and corporate venture — looking for verified, conservation-grounded value to back." },
  { name: "VENN Bioventures ventures", detail: "Projects and companies VENN founds or leads, presented alongside the evidence they are built on." },
  { name: "Industry organizations", detail: "Cosmetics, clinical-study (CRO), and medical & support-product firms sourcing verified outputs for real applications." },
];

export default function VennExchangeRoute() {
  const { user, profile } = useAuthContext();
  const isAdmin = profile?.role === "admin";
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let on = true;
    supabase.rpc("get_exchange_public_stats")
      .then(({ data }) => { if (on) setStats(data || null); })
      .catch(() => {});
    return () => { on = false; };
  }, []);

  const opp = stats?.opportunities ?? null;
  const verts = stats?.verticals ?? null;

  return (
    <div style={{ minHeight: "100vh", background: BG, color: "#f3e8d3", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', padding: "32px 24px 64px", boxSizing: "border-box" }}>
      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/" style={{ fontSize: 11, color: "#FFD79B", textDecoration: "none", letterSpacing: 0.5 }}>← BEE</Link>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Link href="/exchange/board" style={{ fontSize: 12, fontWeight: 600, color: "#FFD79B", textDecoration: "none" }}>The deal board →</Link>
            {isAdmin && (
              <Link href="/exchange/desk" style={{ fontSize: 12, fontWeight: 700, color: "#1a0d2e", background: AMBER, padding: "9px 18px", borderRadius: 9, textDecoration: "none", boxShadow: "0 2px 12px rgba(245,166,35,0.25)" }}>
                Enter the Desk →
              </Link>
            )}
          </div>
        </div>

        <header style={{ marginTop: 24, marginBottom: 8 }}>
          <div style={{ fontSize: 10, letterSpacing: 4, textTransform: "uppercase", color: "#FFD79B", fontWeight: 600, marginBottom: 10 }}>
            BEE · cross-vertical platform service
          </div>
          <h1 style={{ fontFamily: '"Arial Black", "Helvetica Neue", Helvetica, system-ui, sans-serif', fontWeight: 900, fontSize: "clamp(44px, 8vw, 86px)", lineHeight: 0.95, letterSpacing: -2, margin: 0, background: AMBER, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", WebkitTextFillColor: "transparent" }}>
            Venn Exchange
          </h1>
          <p style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: "italic", fontSize: 16, color: "#F0D9B6", margin: "14px 0 0", maxWidth: 640, lineHeight: 1.5 }}>
            Where the verified value outputs of conservation work meet the people
            who can carry them forward — across every vertical, in one place.
          </p>
        </header>

        {/* Real, money-free state of the Exchange */}
        <section style={{ marginTop: 24, display: "flex", gap: 28, flexWrap: "wrap", alignItems: "baseline" }}>
          <Stat n={opp} label={opp === 1 ? "verified output listed" : "verified outputs listed"} />
          <Stat n={verts} label={verts === 1 ? "active vertical" : "active verticals"} />
          {opp === 0 && (
            <span style={{ fontSize: 12, color: "#C8B89E", fontStyle: "italic" }}>
              The first listings are being prepared — verified outputs reach the Exchange one curated door at a time.
            </span>
          )}
        </section>

        <section style={{ marginTop: 30, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
          {PARTICIPANTS.map((p) => (
            <div key={p.name} style={{ padding: "18px 20px", borderRadius: 14, background: "rgba(28,12,44,0.55)", border: "1px solid rgba(245,166,35,0.22)" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#FFE6BC", marginBottom: 8 }}>{p.name}</div>
              <div style={{ fontSize: 12.5, color: "#E7D3B3", lineHeight: 1.6 }}>{p.detail}</div>
            </div>
          ))}
        </section>

        <section style={{ marginTop: 26, padding: "18px 22px", borderRadius: 14, background: "rgba(86,142,80,0.10)", border: "1px solid rgba(125,168,111,0.3)" }}>
          <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: "#A8C49C", fontWeight: 700, marginBottom: 8 }}>The firewall holds</div>
          <div style={{ fontSize: 13, color: "#E7D3B3", lineHeight: 1.7 }}>
            The conservation atlases stay pure. The Exchange only references that
            verified, published outputs <em>exist</em> — read-only and one-directional.
            No prices, no market figures, no investor data ever cross back into
            conservation. Commerce lives here; evidence lives there.
          </div>
        </section>

        <section style={{ marginTop: 26, padding: "16px 22px", borderRadius: 14, background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.18)" }}>
          <div style={{ fontSize: 13, color: "#FFD79B", fontWeight: 600, marginBottom: 4 }}>Curated, by invitation</div>
          <div style={{ fontSize: 12.5, color: "#E7D3B3", lineHeight: 1.6 }}>
            The Exchange is opening. For now VENN curates every match directly —
            connecting verified outputs to the right investor or industry partner by
            hand. Self-serve participation opens as the network grows.
            {!user && <> <Link href="/" style={{ color: "#FFD15C" }}>Sign in at BEE</Link> to take part.</>}
          </div>
        </section>

        <footer style={{ marginTop: 40, fontSize: 10, color: "#8a6f56", letterSpacing: 0.6, textAlign: "right" }}>
          Powered by Venn BioVentures OÜ
        </footer>
      </div>
    </div>
  );
}

function Stat({ n, label }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
      <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', fontSize: 34, fontWeight: 700, color: n == null ? "rgba(255,255,255,0.3)" : "#FFE6BC", lineHeight: 1 }}>
        {n == null ? "—" : n}
      </span>
      <span style={{ fontSize: 12, color: "#C8B89E" }}>{label}</span>
    </div>
  );
}
