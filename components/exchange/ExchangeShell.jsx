"use client";
// components/exchange/ExchangeShell.jsx
//
// The shared frame for the INTERNAL Venn Exchange layers — a consistent header +
// layer navigation + the light biotech-venture field (see theme.js), so each
// layer is its own dedicated page. NOT used by the outward VC-facing deal room.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthContext } from "../../lib/authContext";
import ExchangeTape from "./ExchangeTape";
import { T } from "./theme";

const NAV = [
  { href: "/exchange", label: "Overview" },
  { href: "/exchange/lifecycle", label: "The Cambium" },
  { href: "/exchange/board", label: "Deal Board" },
  { href: "/exchange/directory", label: "Directory" },
];
const WORD = `linear-gradient(120deg, ${T.venn.sapphire} 0%, ${T.venn.emerald} 52%, ${T.venn.gold} 100%)`;

export default function ExchangeShell({ children, title, tagline, wide = false }) {
  const path = usePathname() || "/exchange";
  const { profile } = useAuthContext();
  const isAdmin = profile?.role === "admin";
  const nav = isAdmin ? [...NAV, { href: "/exchange/desk", label: "Desk" }] : NAV;
  const isActive = (href) => (href === "/exchange" ? path === href : path.startsWith(href));

  return (
    <div style={{ minHeight: "100vh", background: T.bgSoft, color: T.ink, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ position: "sticky", top: 0, zIndex: 20 }}>
        {/* VENN brand line — Science · Commerce · Conservation */}
        <div style={{ display: "flex", height: 3 }}>
          <div style={{ flex: 1, background: T.venn.sapphire }} />
          <div style={{ flex: 1, background: T.venn.gold }} />
          <div style={{ flex: 1, background: T.venn.emerald }} />
        </div>
        <header style={{ backdropFilter: "blur(10px)", background: T.glass, borderBottom: "1px solid " + T.line }}>
          <div style={{ maxWidth: 1180, margin: "0 auto", padding: "12px 24px", display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
            <Link href="/" style={{ fontSize: 10.5, color: T.muted, textDecoration: "none", letterSpacing: 1, textTransform: "uppercase" }}>BEE</Link>
            <Link href="/exchange" style={{ textDecoration: "none" }}>
              <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: -0.4, background: WORD, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", WebkitTextFillColor: "transparent" }}>Venn Exchange</span>
            </Link>
            <nav style={{ display: "flex", gap: 4, marginLeft: "auto", flexWrap: "wrap" }}>
              {nav.map((n) => {
                const a = isActive(n.href);
                return (
                  <Link key={n.href} href={n.href} style={{
                    fontSize: 12.5, fontWeight: a ? 700 : 500, textDecoration: "none",
                    color: a ? "#fff" : T.body,
                    background: a ? T.teal : "transparent",
                    padding: "6px 13px", borderRadius: 8, transition: "all .15s",
                  }}>{n.label}</Link>
                );
              })}
            </nav>
          </div>
        </header>
        <ExchangeTape />
      </div>

      <main style={{ maxWidth: wide ? 1280 : 1080, margin: "0 auto", padding: "30px 24px 72px" }}>
        {(title || tagline) && (
          <div style={{ marginBottom: 26 }}>
            {title && <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0, color: T.ink, letterSpacing: -0.6, lineHeight: 1.1 }}>{title}</h1>}
            {tagline && <p style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: "italic", fontSize: 15, color: T.body, margin: "10px 0 0", maxWidth: 680, lineHeight: 1.55 }}>{tagline}</p>}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
