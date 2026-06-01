"use client";
// K8 — top-of-page banner that nudges signed-in users to connect their
// ORCID. Auto-hides once profile.orcid is set OR profile.welcomed_at is
// non-null (user can also dismiss for a session via localStorage).

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthContext } from "../../lib/authContext";

const DISMISS_KEY = "orcid-banner-dismissed-at";
const DISMISS_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export default function OrcidConnectBanner() {
  const { user, profile, loading } = useAuthContext();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return;
    const at = Number(raw);
    if (!Number.isFinite(at)) return;
    if (Date.now() - at < DISMISS_TTL_MS) setHidden(true);
  }, []);

  if (loading || hidden) return null;
  if (!user) return null;
  // Defensive: if we have a user but the profile row hasn't loaded yet,
  // don't flash the "Connect ORCID" banner — wait one tick. Otherwise
  // a slow profile fetch makes the banner appear on every navigation
  // and disappear seconds later, which feels like a bug.
  if (user && !profile) return null;
  if (profile?.orcid) return null;          // already connected
  if (profile?.welcomed_at) return null;    // completed the welcome funnel
  if (profile?.mission_set_at) return null; // also done if mission set
  // Per the v3.1 audit funnel fix: welcomed_at is now only stamped by
  // Step 4 (mission save). A user who started Welcome but didn't reach
  // Step 4 will see this banner again on their next visit.

  function dismiss() {
    setHidden(true);
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
  }

  return (
    <section style={{
      background: "linear-gradient(135deg, #2A1F6E 0%, #534AB7 60%, #B0A4F5 130%)",
      borderRadius: 14,
      padding: "16px 20px",
      marginBottom: 16,
      color: "#fff",
      display: "flex",
      alignItems: "center",
      gap: 16,
      flexWrap: "wrap",
      boxShadow: "0 6px 18px rgba(83, 74, 183, 0.18)",
    }}>
      <div style={{ fontSize: 28, lineHeight: 1 }}>✦</div>
      <div style={{ flex: 1, minWidth: 240 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
          Welcome — özelleştir
        </div>
        <div style={{ fontFamily: "var(--gx-font-serif)", fontSize: 18, fontWeight: 700, lineHeight: 1.25 }}>
          ORCID'inle bağlan, atlas geçmişini canlandır.
        </div>
        <div style={{ fontSize: 11, opacity: 0.85, marginTop: 4, lineHeight: 1.5 }}>
          Yayınlarını içeri alalım, başlangıç K1 impact'ini hesaplayalım, ve
          sana uygun açık çağrıları üst sıraya çıkaralım.
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Link href="/geocon/welcome" style={{
          padding: "9px 16px", fontSize: 12, fontWeight: 700,
          background: "#fff", color: "var(--gx-accent-violet)",
          borderRadius: 8, textDecoration: "none",
        }}>
          ORCID bağla →
        </Link>
        <button onClick={dismiss} style={{
          padding: "9px 12px", fontSize: 11,
          background: "rgba(255,255,255,0.15)",
          color: "#fff", border: "1px solid rgba(255,255,255,0.3)",
          borderRadius: 8, cursor: "pointer", fontWeight: 600,
        }}>
          Bir hafta sonra
        </button>
      </div>
    </section>
  );
}
