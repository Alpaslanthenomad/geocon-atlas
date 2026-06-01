"use client";
// Global error boundary for the App Router. Catches errors that
// escape page-level handling (route segment errors, render-phase
// throws not wrapped by our ErrorBoundary widgets, etc.).
//
// The companion not-found.js handles 404s; this one handles 500-ish
// runtime errors. Sentry receives the error via the layout's
// GlobalErrorHandler; the user sees a calm recovery screen.

import { useEffect } from "react";
import Link from "next/link";

const BIO_BG =
  "radial-gradient(ellipse at 18% 12%, rgba(229, 114, 43, 0.16) 0%, transparent 50%)," +
  "radial-gradient(ellipse at 82% 88%, rgba(86, 142, 80, 0.14) 0%, transparent 50%)," +
  "radial-gradient(ellipse at 50% 50%, #2a1240 0%, #150821 100%)";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    if (typeof window !== "undefined" && window.Sentry?.captureException) {
      try {
        window.Sentry.captureException(error, { tags: { boundary: "app/error.js" } });
      } catch { /* ignore */ }
    }
    // eslint-disable-next-line no-console
    console.error("[app/error]", error?.message || error);
  }, [error]);

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
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div style={{
        fontSize: 10, letterSpacing: 5, textTransform: "uppercase",
        color: "#FFD79B", fontWeight: 700,
      }}>
        Atlas hit a snag
      </div>
      <h1 style={{
        fontFamily: "Crimson Pro, Georgia, serif",
        fontSize: "clamp(80px, 14vw, 200px)",
        fontWeight: 700,
        letterSpacing: -5,
        lineHeight: 0.9,
        margin: "12px 0 16px",
        background: "linear-gradient(135deg, #FFD15C 0%, #F5A623 50%, #C2611A 100%)",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        WebkitTextFillColor: "transparent",
        color: "transparent",
      }}>
        500
      </h1>
      <p style={{
        fontFamily: "Crimson Pro, Georgia, serif",
        fontStyle: "italic",
        fontSize: 16,
        color: "#F0D9B6",
        maxWidth: 480,
        margin: "0 auto 12px",
        lineHeight: 1.55,
      }}>
        Bir şey ters gitti — büyük ihtimalle geçici bir veri sorunu. Yeniden
        deneyebilir veya ana sayfaya dönebilirsin. Hata bizim tarafımıza
        bildirildi.
      </p>
      {error?.digest && (
        <code style={{
          fontFamily: "JetBrains Mono, ui-monospace, monospace",
          fontSize: 10,
          color: "#8a6f56",
          background: "rgba(255,255,255,0.04)",
          padding: "3px 8px",
          borderRadius: 4,
          marginBottom: 20,
        }}>
          ref: {error.digest}
        </code>
      )}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginTop: 14 }}>
        <button
          onClick={() => reset()}
          style={{
            padding: "11px 22px", fontWeight: 700, fontSize: 13,
            color: "#1a0d2e",
            background: "linear-gradient(135deg, #FFD15C 0%, #F5A623 100%)",
            borderRadius: 10, border: "none", cursor: "pointer",
            letterSpacing: 0.4,
            fontFamily: "Inter, sans-serif",
          }}
        >
          ⟲ Tekrar dene
        </button>
        <Link
          href="/geocon"
          style={{
            padding: "11px 22px", fontWeight: 600, fontSize: 13,
            color: "#FFE6BC",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(245,166,35,0.35)",
            borderRadius: 10, textDecoration: "none",
            letterSpacing: 0.4,
            fontFamily: "Inter, sans-serif",
          }}
        >
          🏠 GEOCON home
        </Link>
      </div>

      <div style={{ fontSize: 10, color: "#8a6f56", marginTop: 32, letterSpacing: 0.6 }}>
        Powered by Venn BioVentures OÜ
      </div>
    </div>
  );
}
