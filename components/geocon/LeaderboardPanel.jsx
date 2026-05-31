"use client";
// K6 — Impact Factor leaderboard panel.
//
// Surfaces impact_factor_leaderboard(currency, limit) as a tabbed
// top-N view of contributors across the 5 currencies.
//
//   compact=true  → top-5, currency tabs hidden by default (shows All)
//   compact=false → top-20, all 6 tabs visible (All + 5 currencies)
//
// Mounted on /geocon (compact) and /geocon/programs/analytics (full).

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

const CURRENCY_META = {
  discovery:    { icon: "🔭", label: "Discovery",    tint: "#534AB7" },
  conservation: { icon: "🌱", label: "Conservation", tint: "#0F6E56" },
  research:     { icon: "📚", label: "Research",     tint: "#185FA5" },
  stewardship:  { icon: "🛡",  label: "Stewardship",  tint: "#BA7517" },
  network:      { icon: "🌐", label: "Network",      tint: "#85651A" },
};

const ALL_TAB = { key: null, icon: "✦", label: "All currencies", tint: "var(--gx-ink)" };
const TABS = [ALL_TAB, ...Object.entries(CURRENCY_META).map(([k, m]) => ({ key: k, ...m }))];

export default function LeaderboardPanel({ compact = false, defaultLimit }) {
  const [currency, setCurrency] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const limit = defaultLimit || (compact ? 5 : 20);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const { data } = await supabase.rpc("impact_factor_leaderboard", {
          p_currency: currency,
          p_limit: limit,
        });
        if (cancelled) return;
        setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) {
          console.warn("[LeaderboardPanel]", e?.message || e);
          setRows([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })().catch(() => { /* swallow unhandled rejections */ });
    return () => { cancelled = true; };
  }, [currency, limit]);

  const activeMeta = currency ? CURRENCY_META[currency] : ALL_TAB;

  return (
    <section style={panel}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <h2 style={{
          fontFamily: "var(--gx-font-serif)", fontSize: compact ? 16 : 20, fontWeight: 700,
          color: "var(--gx-ink)", margin: 0,
        }}>
          ✦ Impact Factor leaderboard
        </h2>
        <span style={{ fontSize: 10, color: "var(--gx-ink-muted)", fontStyle: "italic" }}>
          Top {limit} {currency ? `· ${activeMeta.label}` : "across all 5 currencies"}
        </span>
      </div>

      {/* Currency tabs */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12,
        paddingBottom: 8, borderBottom: "1px solid var(--gx-border-soft)",
      }}>
        {TABS.map((t) => {
          const active = currency === t.key;
          const tint = t.tint;
          return (
            <button
              key={t.key || "all"}
              onClick={() => setCurrency(t.key)}
              className="gx-btn"
              style={{
                padding: "5px 10px",
                fontSize: 10, fontWeight: 700, letterSpacing: 0.3,
                background: active ? `${tint}15` : "transparent",
                color: active ? tint : "var(--gx-ink-muted)",
                border: `1px solid ${active ? `${tint}55` : "transparent"}`,
                borderRadius: 999, cursor: "pointer",
              }}
            >
              {t.icon} {t.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="gx-skeleton" style={{ height: 200 }} />
      ) : rows.length === 0 ? (
        <div style={{ padding: 20, fontSize: 12, color: "var(--gx-ink-muted)", textAlign: "center", fontStyle: "italic" }}>
          No contributors recorded for this currency yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {rows.map((r, idx) => (
            <LeaderboardRow key={`${r.contributor_kind}:${r.contributor_id}`}
              row={r} rank={idx + 1} activeTint={activeMeta.tint} />
          ))}
        </div>
      )}

      <div style={{ marginTop: 10, fontSize: 10, color: "var(--gx-ink-muted)", fontStyle: "italic", lineHeight: 1.5 }}>
        Effective points: base × bucket multiplier (K1×0.6 historic, K2×1.0 studies, K3×1.5 programs).
        Updates as publications, program memberships, and outcome credits accumulate.
      </div>
    </section>
  );
}

function LeaderboardRow({ row, rank, activeTint }) {
  const href = row.contributor_kind === "organization"
    ? `/geocon/organizations/${row.contributor_id}`
    : `/geocon/researchers/${row.contributor_id}`;

  return (
    <Link href={href} style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "8px 10px",
      background: rank <= 3 ? `${activeTint}08` : "transparent",
      border: `1px solid ${rank <= 3 ? `${activeTint}25` : "var(--gx-border-soft)"}`,
      borderRadius: 8,
      textDecoration: "none", color: "inherit",
      transition: "background 0.15s",
    }}
    className="gx-leaderboard-row">
      <div style={{
        flexShrink: 0,
        width: 24, height: 24,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: rank <= 3 ? activeTint : "var(--gx-surface-3)",
        color: rank <= 3 ? "#fff" : "var(--gx-ink-muted)",
        borderRadius: "50%",
        fontFamily: "var(--gx-font-serif)", fontSize: 11, fontWeight: 700,
      }}>
        {rank}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 12, fontWeight: 700, color: "var(--gx-ink)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <span style={{ fontSize: 10, opacity: 0.7 }}>
            {row.contributor_kind === "organization" ? "🏛" : "👤"}
          </span>
          {row.display_name}
        </div>
        {row.display_subtitle && (
          <div style={{
            fontSize: 10, color: "var(--gx-ink-muted)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {row.display_subtitle}
          </div>
        )}
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{
          fontFamily: "var(--gx-font-serif)", fontSize: 14, fontWeight: 700,
          color: activeTint, lineHeight: 1,
        }}>
          {Number(row.total_points || 0).toFixed(1)}
        </div>
        <div style={{ fontSize: 9, color: "var(--gx-ink-muted)", marginTop: 2 }}>
          {row.events_count} event{row.events_count === 1 ? "" : "s"}
        </div>
      </div>
    </Link>
  );
}

const panel = {
  padding: 16,
  background: "var(--gx-surface)",
  border: "1px solid var(--gx-border)",
  borderRadius: "var(--gx-radius-4)",
  marginBottom: 16,
};
