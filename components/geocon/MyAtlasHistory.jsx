"use client";
// K11 — Personalized "your atlas" panel.
//
// Shown on the home page for signed-in users whose profile is linked
// to a researchers row (i.e., they've connected ORCID or claimed an
// identity). Auto-hides for visitors and unclaimed accounts.
//
// Reads get_my_atlas_history() in one round trip.

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";

const CURRENCY_META = {
  discovery:    { icon: "🔭", label: "Discovery",    tint: "#534AB7" },
  conservation: { icon: "🌱", label: "Conservation", tint: "#0F6E56" },
  research:     { icon: "📚", label: "Research",     tint: "#185FA5" },
  stewardship:  { icon: "🛡",  label: "Stewardship",  tint: "#BA7517" },
  network:      { icon: "🌐", label: "Network",      tint: "#85651A" },
};

export default function MyAtlasHistory() {
  const { user, loading } = useAuthContext();
  const [data, setData] = useState(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user) { setFetching(false); return; }
    let cancelled = false;
    (async () => {
      const { data: row } = await supabase.rpc("get_my_atlas_history");
      if (cancelled) return;
      setData(row || null);
      setFetching(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (loading || fetching) return null;
  if (!user) return null;
  if (!data?.signed_in || !data?.has_researcher) return null;

  const impact = Array.isArray(data.impact) ? data.impact : [];
  const topSpecies = Array.isArray(data.top_species) ? data.top_species : [];
  const recentPubs = Array.isArray(data.recent_publications) ? data.recent_publications : [];

  const totalImpact = impact.reduce((s, r) => s + Number(r.effective || 0), 0);

  // Nothing meaningful to show? Stay hidden.
  if (totalImpact === 0 && topSpecies.length === 0 && recentPubs.length === 0) return null;

  return (
    <section style={panel}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--gx-ink-muted)", marginBottom: 2 }}>
            Senin atlasın
          </div>
          <h2 style={{ fontFamily: "var(--gx-font-serif)", fontSize: 22, fontWeight: 700, color: "var(--gx-ink)", margin: 0 }}>
            ✦ Atlas geçmişin
          </h2>
        </div>
        <Link href={`/geocon/researchers/${data.researcher_id}`} style={ctaLink}>
          Profilime git →
        </Link>
      </div>

      <div style={mainGrid}>
        {/* Impact summary */}
        <div style={cell}>
          <div style={cellTitle}>Impact</div>
          <div style={{
            fontFamily: "var(--gx-font-serif)", fontSize: 32, fontWeight: 700,
            color: "var(--gx-ink)", lineHeight: 1,
          }}>
            {totalImpact.toFixed(1)}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 10 }}>
            {impact.filter((r) => Number(r.effective) > 0).map((r) => {
              const m = CURRENCY_META[r.currency] || { icon: "✦", label: r.currency, tint: "var(--gx-ink)" };
              return (
                <span key={r.currency} style={{
                  fontSize: 10, fontWeight: 700,
                  padding: "3px 8px", borderRadius: 999,
                  background: `${m.tint}15`, color: m.tint,
                  border: `1px solid ${m.tint}35`,
                }}>
                  {m.icon} {Number(r.effective).toFixed(0)}
                </span>
              );
            })}
          </div>
        </div>

        {/* Top species */}
        <div style={{ ...cell, gridColumn: "span 2" }}>
          <div style={cellTitle}>En aktif olduğun türler</div>
          {topSpecies.length === 0 ? (
            <div style={emptyHint}>Henüz tür eşleşmesi yok.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
              {topSpecies.map((s) => (
                <Link key={s.id} href={`/geocon/species/${s.id}`} style={speciesRow} className="gx-card-hover">
                  {s.thumbnail_url ? (
                    <img src={s.thumbnail_url} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 32, height: 32, borderRadius: 6, background: "var(--gx-surface-3)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🌱</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--gx-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontStyle: "italic" }}>
                      {s.accepted_name || s.id}
                    </div>
                    {s.family && (
                      <div style={{ fontSize: 10, color: "var(--gx-ink-muted)" }}>
                        {s.family}
                      </div>
                    )}
                  </div>
                  <div style={{
                    fontSize: 10, fontWeight: 700,
                    padding: "3px 8px", borderRadius: 999,
                    background: "var(--gx-surface-3)", color: "var(--gx-ink-soft)",
                    fontFamily: "var(--gx-font-mono)",
                  }}>
                    {s.event_count} event{s.event_count == 1 ? "" : "s"}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent publications */}
      {recentPubs.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={cellTitle}>Son içeri alınan yayınlar</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 6 }}>
            {recentPubs.map((p) => (
              <Link key={p.id} href={`/geocon/publications/${p.id}`} style={pubRow} className="gx-card-hover">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--gx-ink)", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {p.title || "(başlıksız)"}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--gx-ink-muted)", marginTop: 2 }}>
                    {p.year ? `${p.year}` : "—"}{p.journal ? ` · ${p.journal}` : ""}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

const panel = {
  padding: 20, marginBottom: 22,
  background: "linear-gradient(180deg, var(--gx-surface) 0%, rgba(83, 74, 183, 0.02) 100%)",
  border: "1px solid var(--gx-border)",
  borderRadius: 14,
};
const mainGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 12,
};
const cell = {
  padding: 14,
  background: "var(--gx-surface-2)",
  border: "1px solid var(--gx-border-soft)",
  borderRadius: 10,
};
const cellTitle = {
  fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase",
  color: "var(--gx-ink-muted)", marginBottom: 6,
};
const speciesRow = {
  display: "flex", alignItems: "center", gap: 10,
  padding: 6, borderRadius: 6,
  background: "transparent",
  textDecoration: "none", color: "inherit",
};
const pubRow = {
  display: "flex", alignItems: "center", gap: 10,
  padding: "8px 10px",
  background: "var(--gx-surface-2)",
  border: "1px solid var(--gx-border-soft)",
  borderRadius: 8,
  textDecoration: "none", color: "inherit",
};
const ctaLink = {
  fontSize: 12, fontWeight: 700,
  color: "var(--gx-accent-violet)",
  textDecoration: "none",
};
const emptyHint = {
  fontSize: 11, color: "var(--gx-ink-muted)", fontStyle: "italic", padding: 8,
};
