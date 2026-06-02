"use client";
// /geocon/admin/verticals — list active verticals + species counts +
// maintainer list. New-vertical creation is intentionally NOT wired
// here yet — partner conversation (IUCN, orchid group, etc.) gates
// the second vertical's onboarding. This page is admin-read for
// now: "what's the current state of the abstraction?"

import { useEffect, useState } from "react";
import Link from "next/link";
import { Layers, AlertCircle } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";

export default function VerticalsAdminRoute() {
  const { profile, loading: authLoading } = useAuthContext();
  const isAdmin = profile?.role === "admin";
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase.rpc("list_verticals", { p_include_beta: true });
      if (!cancelled) {
        setList(Array.isArray(data) ? data : []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [authLoading, isAdmin]);

  if (authLoading || loading) {
    return <div style={{ padding: 30, textAlign: "center", color: "var(--gx-ink-muted)", fontSize: 12 }}>Loading…</div>;
  }
  if (!isAdmin) {
    return (
      <div style={{ maxWidth: 540, margin: "60px auto", padding: 40, background: "var(--gx-card-bg)", border: "1px solid var(--gx-card-border)", borderRadius: "var(--gx-card-radius)", textAlign: "center" }}>
        <Layers size={28} strokeWidth={1.5} style={{ color: "var(--gx-ink-muted)", marginBottom: 8 }} />
        <h1 style={{ fontFamily: "var(--gx-font-display)", fontSize: 22, margin: 0, color: "var(--gx-ink)" }}>Venn admin only</h1>
        <p style={{ fontSize: 12, color: "var(--gx-ink-muted)", marginTop: 8, lineHeight: 1.6 }}>
          Vertical configuration is reserved for Venn BioVentures admins.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 880, margin: "0 auto" }}>
      <header style={{ marginBottom: 18 }}>
        <div className="gx-overline" style={{ marginBottom: 4 }}>Admin</div>
        <h1 className="gx-h1" style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          Verticals
          <span style={{ fontSize: 13, color: "var(--gx-ink-muted)", fontWeight: 400, fontFamily: "var(--gx-font-mono)" }}>
            {list.length}
          </span>
        </h1>
        <p style={{ fontSize: 12, color: "var(--gx-ink-muted)", marginTop: 4, lineHeight: 1.5, maxWidth: 720 }}>
          GEOCON Atlas çoklu-takson genişlemeye hazır olarak yapılandırıldı.
          species_id artık her zaman bir vertical'a bağlı. Şu an aktif tek
          vertical: <strong>geophytes</strong>. İkinci vertical için partner
          (örn. IUCN orkide grubu) onboarding'i sonra.
        </p>
      </header>

      <div style={{
        marginBottom: 14, padding: 12,
        background: "var(--gx-info-soft)",
        border: "1px solid color-mix(in srgb, var(--gx-info) 25%, transparent)",
        borderRadius: "var(--gx-card-radius)",
        display: "flex", alignItems: "flex-start", gap: 10,
      }}>
        <AlertCircle size={14} strokeWidth={1.85} style={{ color: "var(--gx-info)", marginTop: 2, flexShrink: 0 }} />
        <div style={{ fontSize: 11, color: "var(--gx-ink-soft)", lineHeight: 1.6 }}>
          <strong>Yeni vertical önerisi</strong> şu an raw SQL ile insert
          ediliyor. UI form'u IUCN re-application sonrasına ertelendi —
          başvuru anında "geophyte commons" pitch'i tek vertical olarak
          daha temiz. Detay: <Link href="/AUDIT-2026-06-02.md" style={{ color: "var(--gx-info)" }}>AUDIT-2026-06-02 §IX.3</Link>.
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {list.map((v) => (
          <div key={v.id} style={{
            padding: "var(--gx-card-pad-sm)",
            background: "var(--gx-card-bg)",
            border: "1px solid var(--gx-card-border)",
            borderRadius: "var(--gx-card-radius)",
            borderLeft: `3px solid ${v.brand_color || "var(--gx-accent-violet)"}`,
          }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 18 }} aria-hidden>{v.emoji}</span>
              <h3 style={{
                fontFamily: "var(--gx-font-display)",
                fontSize: 16, fontWeight: 700, color: "var(--gx-ink)",
                margin: 0,
              }}>
                {v.display_name}
              </h3>
              {v.is_beta && (
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
                  padding: "2px 7px", borderRadius: 999,
                  background: "var(--gx-warning-soft)", color: "var(--gx-warning)",
                  fontFamily: "var(--gx-font-mono)",
                }}>BETA</span>
              )}
              <span style={{
                marginLeft: "auto", fontSize: 11,
                color: "var(--gx-ink-muted)", fontFamily: "var(--gx-font-mono)",
              }}>
                {v.species_count.toLocaleString()} species
              </span>
            </div>
            {v.description && (
              <p style={{
                marginTop: 6, marginBottom: 0,
                fontSize: 12, color: "var(--gx-ink-soft)", lineHeight: 1.5,
              }}>
                {v.description}
              </p>
            )}
            <div style={{ marginTop: 8, fontSize: 10, color: "var(--gx-ink-faint)", fontFamily: "var(--gx-font-mono)" }}>
              ID: <code>{v.id}</code> · slug: <code>{v.slug}</code>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
