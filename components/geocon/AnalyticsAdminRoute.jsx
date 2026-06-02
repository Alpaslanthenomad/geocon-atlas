"use client";
// /geocon/admin/analytics — admin-only dashboard for self-hosted
// telemetry. Reads analytics_snapshot(p_days). No third-party tracker,
// no IP, no fingerprint — just the events we explicitly emit.
//
// Two windows in the toolbar (7d / 30d). Four panels:
//   1. Headline counters (total events, unique sessions, unique users)
//   2. Top routes by pageviews
//   3. Top events
//   4. Pageviews by day (sparkline-style bar)

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";

const WINDOWS = [
  { key: 7,  label: "Last 7 days" },
  { key: 30, label: "Last 30 days" },
];

export default function AnalyticsAdminRoute() {
  const { profile, loading: authLoading } = useAuthContext();
  const isAdmin = profile?.role === "admin";
  const [days, setDays] = useState(7);
  const [snap, setSnap] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data } = await supabase.rpc("analytics_snapshot", { p_days: days });
      if (!cancelled) {
        setSnap(data || null);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [authLoading, isAdmin, days]);

  if (authLoading || loading) {
    return <div style={{ padding: 30, textAlign: "center", color: "var(--gx-ink-muted)", fontSize: 12 }}>Loading…</div>;
  }
  if (!isAdmin) {
    return (
      <div style={{ maxWidth: 540, margin: "60px auto", padding: 40, background: "var(--gx-card-bg)", border: "1px solid var(--gx-card-border)", borderRadius: "var(--gx-card-radius)", textAlign: "center" }}>
        <BarChart3 size={28} strokeWidth={1.5} style={{ color: "var(--gx-ink-muted)", marginBottom: 8 }} />
        <h1 style={{ fontFamily: "var(--gx-font-display)", fontSize: 22, margin: 0, color: "var(--gx-ink)" }}>Venn admin only</h1>
      </div>
    );
  }
  if (!snap) {
    return <div style={{ padding: 30, textAlign: "center", color: "var(--gx-ink-muted)", fontSize: 12 }}>No data.</div>;
  }

  const byDay = Array.isArray(snap.pageviews_by_day) ? snap.pageviews_by_day : [];
  const maxDay = Math.max(1, ...byDay.map((d) => d.n || 0));

  return (
    <div style={{ maxWidth: 980, margin: "0 auto" }}>
      <header style={{ marginBottom: 14 }}>
        <div className="gx-overline" style={{ marginBottom: 4 }}>Admin</div>
        <h1 className="gx-h1" style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          Analytics
          <span style={{ fontSize: 13, color: "var(--gx-ink-muted)", fontWeight: 400, fontFamily: "var(--gx-font-mono)" }}>
            self-hosted · no third-party tracker
          </span>
        </h1>
        <p style={{ fontSize: 12, color: "var(--gx-ink-muted)", marginTop: 4, lineHeight: 1.5, maxWidth: 720 }}>
          Yalnızca açıkça emit ettiğimiz event'leri ingest ediyoruz. IP yok,
          fingerprint yok, third-party yok. Session id sadece sessionStorage'da,
          tab kapanınca gider. Audit IX.2 takip işi.
        </p>
        <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
          {WINDOWS.map((w) => (
            <button key={w.key} onClick={() => setDays(w.key)}
              style={{
                fontSize: 11, fontWeight: days === w.key ? 700 : 600,
                padding: "5px 11px", borderRadius: 7,
                background: days === w.key ? "var(--gx-accent-violet)" : "transparent",
                color: days === w.key ? "#fff" : "var(--gx-ink-soft)",
                border: `1px solid ${days === w.key ? "var(--gx-accent-violet)" : "var(--gx-border-soft)"}`,
                cursor: "pointer",
              }}>
              {w.label}
            </button>
          ))}
        </div>
      </header>

      {/* Headline counters */}
      <section style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 10, marginBottom: 14,
      }}>
        <Tile label="Total events"    value={snap.total_events} />
        <Tile label="Unique sessions" value={snap.unique_sessions} />
        <Tile label="Signed-in users" value={snap.unique_users} />
      </section>

      {/* By-day */}
      {byDay.length > 0 && (
        <section style={panel}>
          <div className="gx-overline" style={{ marginBottom: 8 }}>Pageviews by day</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 80 }}>
            {byDay.map((d) => (
              <div key={d.day} title={`${d.day}: ${d.n}`}
                style={{
                  flex: 1, minWidth: 8,
                  height: `${Math.max(2, (d.n / maxDay) * 76)}px`,
                  background: "var(--gx-accent-violet)",
                  opacity: 0.55 + 0.45 * (d.n / maxDay),
                  borderRadius: 3,
                }} />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 9, color: "var(--gx-ink-faint)", fontFamily: "var(--gx-font-mono)" }}>
            <span>{byDay[0]?.day?.slice(0, 10)}</span>
            <span>{byDay[byDay.length - 1]?.day?.slice(0, 10)}</span>
          </div>
        </section>
      )}

      {/* Top routes + top events side-by-side */}
      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
        <RankList title="Top routes (pageviews)" items={(snap.top_routes || []).map((r) => ({ label: r.route, n: r.n, href: r.route?.startsWith("/") ? r.route : null }))} />
        <RankList title="Top events" items={(snap.top_events || []).map((e) => ({ label: e.event, n: e.n }))} />
      </section>
    </div>
  );
}

function Tile({ label, value }) {
  return (
    <div style={{
      padding: "var(--gx-card-pad-sm)",
      background: "var(--gx-card-bg)",
      border: "1px solid var(--gx-card-border)",
      borderRadius: "var(--gx-card-radius)",
    }}>
      <div className="gx-overline">{label}</div>
      <div style={{
        fontFamily: "var(--gx-font-display)",
        fontSize: 26, fontWeight: 700, color: "var(--gx-ink)",
        letterSpacing: "-0.02em", lineHeight: 1, marginTop: 6,
      }}>
        {(value || 0).toLocaleString()}
      </div>
    </div>
  );
}

function RankList({ title, items }) {
  const total = items.reduce((s, i) => s + (i.n || 0), 0) || 1;
  return (
    <div style={panel}>
      <div className="gx-overline" style={{ marginBottom: 8 }}>{title}</div>
      {items.length === 0 ? (
        <div style={{ fontSize: 11, color: "var(--gx-ink-muted)", fontStyle: "italic", padding: 4 }}>No data in this window.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {items.map((it, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {it.href ? (
                <Link href={it.href} style={{ flex: 1, minWidth: 0, fontSize: 11, color: "var(--gx-ink-soft)", textDecoration: "none", fontFamily: "var(--gx-font-mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {it.label}
                </Link>
              ) : (
                <span style={{ flex: 1, minWidth: 0, fontSize: 11, color: "var(--gx-ink-soft)", fontFamily: "var(--gx-font-mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {it.label}
                </span>
              )}
              <div style={{ width: 80, height: 6, background: "var(--gx-surface-2)", borderRadius: 3, overflow: "hidden", flexShrink: 0 }}>
                <div style={{ height: "100%", width: `${(it.n / total) * 100}%`, background: "var(--gx-accent-violet)" }} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: "var(--gx-ink)", fontFamily: "var(--gx-font-mono)", minWidth: 32, textAlign: "right" }}>
                {it.n}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const panel = {
  padding: "var(--gx-card-pad)",
  background: "var(--gx-card-bg)",
  border: "1px solid var(--gx-card-border)",
  borderRadius: "var(--gx-card-radius)",
};
