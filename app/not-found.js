// Global 404 page for any route that doesn't match.
// Lives at the root so it covers both /geocon/* and BEE-level URLs.

import Link from "next/link";

const BIO_BG =
  "radial-gradient(ellipse at 12% 18%, rgba(229, 114, 43, 0.18) 0%, transparent 45%)," +
  "radial-gradient(ellipse at 88% 82%, rgba(86, 142, 80, 0.16) 0%, transparent 50%)," +
  "radial-gradient(ellipse at 50% 50%, #2a1240 0%, #150821 100%)";

const STRONG_DISPLAY =
  '"Arial Black", "Helvetica Neue", Helvetica, "Segoe UI Black", system-ui, sans-serif';

export const metadata = {
  title: "404 — GEOCON Atlas",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: BIO_BG,
        color: "#f3e8d3",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "40px 24px",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div
        style={{
          fontSize: 10,
          letterSpacing: 5,
          textTransform: "uppercase",
          color: "#FFD79B",
          fontWeight: 600,
        }}
      >
        Route not found
      </div>
      <h1
        style={{
          fontFamily: STRONG_DISPLAY,
          fontSize: "clamp(80px, 14vw, 200px)",
          fontWeight: 900,
          letterSpacing: -5,
          lineHeight: 0.9,
          margin: "12px 0 16px",
          background: "linear-gradient(135deg, #FFD15C 0%, #F5A623 50%, #C2611A 100%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
          color: "transparent",
        }}
      >
        404
      </h1>
      <p
        style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontStyle: "italic",
          fontSize: 16,
          color: "#F0D9B6",
          maxWidth: 460,
          margin: "0 auto 24px",
          lineHeight: 1.5,
        }}
      >
        This corner of the atlas doesn&apos;t exist — or hasn&apos;t bloomed yet.
        Try the explore globe, the species index, or head home.
      </p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        <Link
          href="/geocon"
          style={{
            padding: "11px 22px",
            fontWeight: 700,
            fontSize: 13,
            color: "#1a0d2e",
            background: "linear-gradient(135deg, #FFD15C 0%, #F5A623 100%)",
            borderRadius: 10,
            textDecoration: "none",
            letterSpacing: 0.4,
          }}
        >
          🏠 GEOCON home
        </Link>
        <Link
          href="/geocon/explore"
          style={{
            padding: "11px 22px",
            fontWeight: 600,
            fontSize: 13,
            color: "#FFE6BC",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(245,166,35,0.35)",
            borderRadius: 10,
            textDecoration: "none",
            letterSpacing: 0.4,
          }}
        >
          🌍 Explore the globe
        </Link>
        <Link
          href="/geocon/ask"
          style={{
            padding: "11px 22px",
            fontWeight: 600,
            fontSize: 13,
            color: "#FFE6BC",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(245,166,35,0.35)",
            borderRadius: 10,
            textDecoration: "none",
            letterSpacing: 0.4,
          }}
        >
          ✨ Ask GEOCON
        </Link>
      </div>

      <div style={{ fontSize: 10, color: "#8a6f56", marginTop: 32, letterSpacing: 0.6 }}>
        Powered by Venn BioVentures OÜ
      </div>
    </div>
  );
}
