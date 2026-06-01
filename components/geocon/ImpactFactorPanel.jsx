"use client";
// K5 — 5-currency Impact Factor panel.
//
// Reads `impact_factor_breakdown(p_contributor_kind, p_contributor_id)`
// and renders:
//   - 5 currency tiles with effective totals
//   - per-currency bucket breakdown (K1 historic 0.6× / K2 studies 1.0× / K3 programs 1.5×)
//   - a combined header total
//
// Mounted on /geocon/researchers/[id] and /geocon/organizations/[id].
// Auto-hides for outside viewers when there is nothing to show.

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { ImpactRadial } from "../ui";

const CURRENCY_META = {
  discovery:    { icon: "🔭", label: "Discovery",    tint: "#534AB7" },
  conservation: { icon: "🌱", label: "Conservation", tint: "#0F6E56" },
  research:     { icon: "📚", label: "Research",     tint: "#185FA5" },
  stewardship:  { icon: "🛡",  label: "Stewardship",  tint: "#BA7517" },
  network:      { icon: "🌐", label: "Network",      tint: "#85651A" },
};

const BUCKET_META = {
  k1_historic: { label: "Historic",   short: "K1", mult: 0.6, tint: "#888780" },
  k2_studies:  { label: "Studies",    short: "K2", mult: 1.0, tint: "#185FA5" },
  k3_programs: { label: "Programs",   short: "K3", mult: 1.5, tint: "#534AB7" },
};

const CURRENCIES = ["discovery", "conservation", "research", "stewardship", "network"];
const BUCKETS = ["k1_historic", "k2_studies", "k3_programs"];

export default function ImpactFactorPanel({ contributorKind, contributorId, allowHideWhenEmpty = true }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!contributorKind || !contributorId) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const { data } = await supabase.rpc("impact_factor_breakdown", {
          p_contributor_kind: contributorKind,
          p_contributor_id: contributorId,
        });
        if (cancelled) return;
        setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) console.warn("[ImpactFactorPanel]", e?.message || e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })().catch(() => { /* swallow */ });
    return () => { cancelled = true; };
  }, [contributorKind, contributorId]);

  // Build (currency × bucket) map
  const byCurrency = {};
  for (const c of CURRENCIES) byCurrency[c] = { total: 0, buckets: {}, events: 0 };
  for (const r of rows) {
    const c = r.currency;
    if (!byCurrency[c]) continue;
    const eff = Number(r.effective_total || 0);
    byCurrency[c].total += eff;
    byCurrency[c].buckets[r.bucket] = (byCurrency[c].buckets[r.bucket] || 0) + eff;
    byCurrency[c].events += Number(r.events_count || 0);
  }
  const grandTotal = CURRENCIES.reduce((s, c) => s + byCurrency[c].total, 0);
  const totalEvents = CURRENCIES.reduce((s, c) => s + byCurrency[c].events, 0);

  if (!loading && totalEvents === 0 && allowHideWhenEmpty) return null;

  return (
    <section style={panel}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <h2 style={{
          fontFamily: "var(--gx-font-serif)", fontSize: 18, fontWeight: 700,
          color: "var(--gx-ink)", margin: 0,
        }}>
          ✦ Impact Factor
        </h2>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--gx-ink-muted)" }}>
            Total
          </span>
          <span style={{
            fontFamily: "var(--gx-font-serif)", fontSize: 22, fontWeight: 700,
            color: "var(--gx-ink)",
          }}>
            {loading ? "…" : grandTotal.toFixed(1)}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="gx-skeleton" style={{ height: 70 }} />
      ) : (
        <>
          {/* Radial overview — only render if there's data to plot */}
          {grandTotal > 0 && (
            <div style={{ marginBottom: 16 }}>
              <ImpactRadial
                data={CURRENCIES
                  .map((c) => ({ currency: c, value: byCurrency[c].total }))
                  .filter((r) => r.value > 0)}
                height={200}
              />
            </div>
          )}
          {/* 5 currency tiles */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8, marginBottom: 12 }}>
            {CURRENCIES.map((c) => {
              const meta = CURRENCY_META[c];
              const data = byCurrency[c];
              const isEmpty = data.total === 0;
              return (
                <div key={c} style={{
                  padding: 10,
                  background: isEmpty ? "var(--gx-surface-2)" : `${meta.tint}0a`,
                  border: `1px solid ${isEmpty ? "var(--gx-border-soft)" : `${meta.tint}40`}`,
                  borderRadius: 8,
                  opacity: isEmpty ? 0.55 : 1,
                }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 14 }}>{meta.icon}</span>
                    <span style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: 1,
                      textTransform: "uppercase", color: meta.tint,
                    }}>
                      {meta.label}
                    </span>
                  </div>
                  <div style={{
                    fontFamily: "var(--gx-font-serif)", fontSize: 20, fontWeight: 700,
                    color: "var(--gx-ink)", lineHeight: 1,
                  }}>
                    {data.total.toFixed(1)}
                  </div>
                  {/* Bucket sparkline */}
                  {!isEmpty && (
                    <div style={{ display: "flex", height: 4, marginTop: 8, borderRadius: 2, overflow: "hidden", background: "var(--gx-surface-3)" }}>
                      {BUCKETS.map((b) => {
                        const val = data.buckets[b] || 0;
                        if (val === 0) return null;
                        const pct = (val / data.total) * 100;
                        return (
                          <div key={b} style={{
                            width: `${pct}%`,
                            background: BUCKET_META[b].tint,
                          }} title={`${BUCKET_META[b].label} (${BUCKET_META[b].short} ×${BUCKET_META[b].mult}): ${val.toFixed(1)}`} />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bucket legend */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
            {BUCKETS.map((b) => {
              const meta = BUCKET_META[b];
              const total = CURRENCIES.reduce((s, c) => s + (byCurrency[c].buckets[b] || 0), 0);
              if (total === 0) return null;
              return (
                <span key={b} style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  fontSize: 10, fontWeight: 600,
                  padding: "3px 8px", borderRadius: 999,
                  background: `${meta.tint}15`, color: meta.tint,
                  border: `1px solid ${meta.tint}35`,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: meta.tint }} />
                  {meta.short} {meta.label} <span style={{ opacity: 0.65 }}>×{meta.mult} →</span> <strong style={{ fontFamily: "var(--gx-font-serif)" }}>{total.toFixed(1)}</strong>
                </span>
              );
            })}
          </div>
        </>
      )}

      <div style={{ fontSize: 10, color: "var(--gx-ink-muted)", fontStyle: "italic", lineHeight: 1.5, marginTop: 8 }}>
        Impact accumulates as 5 currencies × 3 buckets. Pre-platform work counts at K1 (×0.6),
        studies attached to programs at K2 (×1.0), and active program contributions at K3 (×1.5).
        Updates fire as publications, program memberships, and outcome credits are recorded.
      </div>
    </section>
  );
}

const panel = {
  marginTop: 18, padding: 16,
  background: "var(--gx-surface)",
  border: "1px solid var(--gx-border)",
  borderRadius: "var(--gx-radius-4)",
};
