"use client";
// components/exchange/ExchangeShell.jsx
//
// The shared frame for the INTERNAL Venn Exchange layers — a consistent header +
// layer navigation + cosmos field, so each layer is its own dedicated, detailed
// page (no cramming) and you move between them. NOT used by the outward,
// VC-facing artifacts (the tokenized deal room stays clean / unbranded).

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthContext } from "../../lib/authContext";

const NAV = [
  { href: "/exchange", label: "Overview" },
  { href: "/exchange/lifecycle", label: "The Cambium" },
  { href: "/exchange/board", label: "Deal Board" },
  { href: "/exchange/directory", label: "Directory" },
];
const AMBER = "linear-gradient(135deg, #FFD15C 0%, #F5A623 50%, #E5722B 100%)";
const BG =
  "radial-gradient(ellipse at 16% 0%, rgba(229,114,43,0.13) 0%, transparent 42%)," +
  "radial-gradient(ellipse at 84% 100%, rgba(86,142,80,0.11) 0%, transparent 48%)," +
  "linear-gradient(180deg, #150821 0%, #1b0c2c 100%)";

export default function ExchangeShell({ children, title, tagline, wide = false }) {
  const path = usePathname() || "/exchange";
  const { profile } = useAuthContext();
  const isAdmin = profile?.role === "admin";
  const nav = isAdmin ? [...NAV, { href: "/exchange/desk", label: "Desk" }] : NAV;
  const isActive = (href) => (href === "/exchange" ? path === href : path.startsWith(href));

  return (
    <div style={{ minHeight: "100vh", background: BG, color: "#f3e8d3", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <header style={{ position: "sticky", top: 0, zIndex: 20, backdropFilter: "blur(10px)", background: "rgba(21,8,33,0.72)", borderBottom: "1px solid rgba(245,166,35,0.16)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "12px 24px", display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
          <Link href="/" style={{ fontSize: 10.5, color: "#9b86c9", textDecoration: "none", letterSpacing: 1, textTransform: "uppercase" }}>BEE</Link>
          <Link href="/exchange" style={{ textDecoration: "none" }}>
            <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: -0.4, background: AMBER, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", WebkitTextFillColor: "transparent" }}>Venn Exchange</span>
          </Link>
          <nav style={{ display: "flex", gap: 4, marginLeft: "auto", flexWrap: "wrap" }}>
            {nav.map((n) => {
              const a = isActive(n.href);
              return (
                <Link key={n.href} href={n.href} style={{
                  fontSize: 12.5, fontWeight: a ? 700 : 500, textDecoration: "none",
                  color: a ? "#1a0d2e" : "rgba(255,222,170,0.78)",
                  background: a ? AMBER : "transparent",
                  padding: "6px 13px", borderRadius: 8, transition: "all .15s",
                }}>{n.label}</Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: wide ? 1280 : 1080, margin: "0 auto", padding: "30px 24px 72px" }}>
        {(title || tagline) && (
          <div style={{ marginBottom: 26 }}>
            {title && <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0, color: "#FFE6BC", letterSpacing: -0.6, lineHeight: 1.1 }}>{title}</h1>}
            {tagline && <p style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: "italic", fontSize: 15, color: "#E7D3B3", margin: "10px 0 0", maxWidth: 680, lineHeight: 1.55 }}>{tagline}</p>}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
