"use client";
// /geocon/programs/analytics — fleet view across all programs.

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import AgreementPill from "./AgreementPill";
import LeaderboardPanel from "./LeaderboardPanel";

const STATUS_TINT = {
  designing:  "var(--gx-ink-muted)",
  Draft:      "var(--gx-ink-muted)",
  draft:      "var(--gx-ink-muted)",
  active:     "#0F6E56",
  Active:     "#0F6E56",
  gate_ready: "#BA7517",
  producing:  "#185FA5",
  realized:   "#534AB7",
  Completed:  "#534AB7",
  paused:     "var(--gx-ink-muted)",
  abandoned:  "#A32D2D",
  Blocked:    "#A32D2D",
  "On Hold":  "#BA7517",
  unknown:    "var(--gx-ink-faint)",
};

const RISK_TINT = {
  low: "#0F6E56", medium: "#BA7517", high: "#A32D2D", unknown: "var(--gx-ink-muted)",
};

const MODULE_TINT = {
  Origin:   "#1D9E75",
  Forge:    "#BA7517",
  Mesh:     "#185FA5",
  Exchange: "#D85A30",
  Accord:   "#5F5E5A",
  unknown:  "var(--gx-ink-faint)",
};

export default function ProgramsAnalyticsRoute() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.rpc("get_programs_fleet_summary", { p_window_days: 90 });
        if (cancelled) return;
        if (error) throw error;
        setData(data || null);
      } catch (e) {
        if (!cancelled) setError(e?.message || "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <Centered>Loading fleet…</Centered>;
  if (error) return <Centered tone="error">{error}</Centered>;
  if (!data) return <Centered>No data.</Centered>;

  const totals = data.totals || {};

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", paddingBottom: 40 }}>
      <Link href="/geocon/programs" style={{ fontSize: 11, color: "#888", textDecoration: "none", letterSpacing: 0.5 }}>
        ← Programs
      </Link>

      <header style={{ marginTop: 8, marginBottom: 18 }}>
        <h1 className="gx-h1">
          Programs analytics
        </h1>
        <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
          Fleet view of every program currently in the GEOCON pipeline.
        </div>
      </header>

      <section style={kpiGrid}>
        <KPI label="Total programs"        value={totals.total} />
        <KPI label="Active or designing"   value={totals.active}           tint="#0F6E56" />
        <KPI label="With primary blocker"  value={totals.blocked}          tint="#A32D2D" />
        <KPI label="With next action"      value={totals.with_next_action} tint="#534AB7" />
      </section>

      <section style={cols2}>
        <BarPanel title="By status" rows={data.by_status} tintMap={STATUS_TINT} />
        <BarPanel title="By module" rows={data.by_module} tintMap={MODULE_TINT} />
      </section>

      <section style={cols2}>
        <BarPanel title="By risk level" rows={data.by_risk} tintMap={RISK_TINT} />
        <BlockerPanel rows={data.blockers} />
      </section>

      <section style={{ marginTop: 18 }}>
        <h2 style={sectionTitle}>Stalest next actions</h2>
        <StaleList rows={data.stalest} />
      </section>

      <section style={{ marginTop: 18 }}>
        <h2 style={sectionTitle}>Coming due (next 14 days)</h2>
        <DueList rows={data.due_soon} />
      </section>

      <section style={{ marginTop: 18 }}>
        <h2 style={sectionTitle}>Recently created (last 90 days)</h2>
        <RecentList rows={data.recent} />
      </section>

      <section style={{ marginTop: 18 }}>
        <LeaderboardPanel defaultLimit={20} />
      </section>
    </div>
  );
}

function KPI({ label, value, tint }) {
  return (
    <div style={{ padding: 18, background: "var(--gx-card-bg)", border: "1px solid var(--gx-card-border)", borderRadius: 12 }}>
      <div style={{
        fontFamily: "var(--gx-font-display)",
        fontSize: 30,
        fontWeight: 900,
        color: tint || "var(--gx-ink)",
        letterSpacing: -1,
        lineHeight: 1,
      }}>
        {value == null ? "—" : value}
      </div>
      <div style={{ fontSize: 10, color: "#888", marginTop: 6, letterSpacing: 0.3, textTransform: "uppercase", fontWeight: 600 }}>
        {label}
      </div>
    </div>
  );
}

function BarPanel({ title, rows, tintMap }) {
  const list = Array.isArray(rows) ? rows : [];
  const max = list.reduce((m, r) => Math.max(m, r.count || 0), 0) || 1;
  return (
    <div style={panel}>
      <h3 style={panelTitle}>{title}</h3>
      {list.length === 0 ? (
        <Empty />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
          {list.map((r) => {
            const tint = tintMap?.[r.bucket] || "#9CA3AF";
            const pct = Math.round(((r.count || 0) / max) * 100);
            return (
              <div key={r.bucket} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 120, fontSize: 11, color: "var(--gx-ink)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {r.bucket}
                </div>
                <div style={{ flex: 1, height: 14, background: "var(--gx-surface-3)", borderRadius: 7, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: tint, transition: "width 0.3s" }} />
                </div>
                <div style={{ width: 36, textAlign: "right", fontSize: 11, color: "#666", fontWeight: 700 }}>
                  {r.count}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BlockerPanel({ rows }) {
  const list = Array.isArray(rows) ? rows : [];
  return (
    <div style={panel}>
      <h3 style={panelTitle}>Most common blockers</h3>
      {list.length === 0 ? (
        <Empty />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
          {list.map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px", borderRadius: 8, background: "#FFF8F7" }}>
              <div style={{ flex: 1, fontSize: 12, color: "#4a4a4a" }}>{r.blocker}</div>
              <div style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 999, background: "#ED827E", color: "#fff" }}>
                ×{r.count}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StaleList({ rows }) {
  const list = Array.isArray(rows) ? rows : [];
  if (list.length === 0) return <Empty />;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {list.map((p) => (
        <Link key={p.id} href={`/geocon/programs/${p.id}`}
          style={{
            display: "block", padding: 12, background: "var(--gx-card-bg)",
            border: "1px solid var(--gx-card-border)", borderLeft: "3px solid #BA7517",
            borderRadius: 10, textDecoration: "none", color: "inherit",
          }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gx-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {p.program_name || "Untitled program"} <AgreementPill programId={p.id} />
            </div>
            <div style={{ fontSize: 10, color: "#888", flexShrink: 0 }}>
              {p.updated_at ? `last update ${timeAgo(p.updated_at)}` : "—"}
            </div>
          </div>
          <div style={{ fontSize: 11, color: "#666", lineHeight: 1.45 }}>
            <strong style={{ color: "#BA7517" }}>Next:</strong> {p.next_action}
          </div>
          <div style={{ fontSize: 10, color: "#888", marginTop: 4 }}>
            {p.species_name && <span style={{ fontStyle: "italic" }}>{p.species_name}</span>}
            {p.current_module && <> · {p.current_module}</>}
            {p.status && <> · {p.status}</>}
          </div>
        </Link>
      ))}
    </div>
  );
}

function DueList({ rows }) {
  const list = Array.isArray(rows) ? rows : [];
  if (list.length === 0) return <Empty />;
  const today = new Date(); today.setHours(0,0,0,0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {list.map((p) => {
        const due = p.next_action_due ? new Date(p.next_action_due) : null;
        const daysOut = due ? Math.round((due - today) / 86400000) : 0;
        const overdue = daysOut < 0;
        const tint = overdue ? "#A32D2D" : daysOut <= 3 ? "#BA7517" : "#0F6E56";
        return (
          <Link key={p.id} href={`/geocon/programs/${p.id}`}
            style={{
              display: "block", padding: 12, background: "var(--gx-card-bg)",
              border: "1px solid var(--gx-card-border)", borderLeft: `3px solid ${tint}`,
              borderRadius: 10, textDecoration: "none", color: "inherit",
            }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gx-ink)" }}>
                {p.program_name || "Untitled program"} <AgreementPill programId={p.id} />
              </div>
              <div style={{
                fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 999,
                background: tint, color: "#fff",
              }}>
                {overdue ? `${Math.abs(daysOut)}d overdue` : daysOut === 0 ? "due today" : `in ${daysOut}d`}
              </div>
            </div>
            <div style={{ fontSize: 11, color: "#666" }}>
              {p.next_action}
            </div>
            <div style={{ fontSize: 10, color: "#888", marginTop: 4 }}>
              {p.species_name && <span style={{ fontStyle: "italic" }}>{p.species_name}</span>}
              {p.status && <> · {p.status}</>}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function RecentList({ rows }) {
  const list = Array.isArray(rows) ? rows : [];
  if (list.length === 0) return <Empty />;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
      {list.map((p) => (
        <Link key={p.id} href={`/geocon/programs/${p.id}`}
          style={{
            display: "block", padding: 12, background: "var(--gx-card-bg)",
            border: "1px solid var(--gx-card-border)", borderRadius: 10,
            textDecoration: "none", color: "inherit",
          }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gx-ink)" }}>
            {p.program_name || "Untitled program"} <AgreementPill programId={p.id} />
          </div>
          <div style={{ fontSize: 10, color: "#888", marginTop: 4 }}>
            {p.species_name && <span style={{ fontStyle: "italic" }}>{p.species_name}</span>}
            {p.status && <> · {p.status}</>}
            <span> · {timeAgo(p.created_at)}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

function timeAgo(iso) {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  const ms = Date.now() - t;
  const d = Math.floor(ms / 86400000);
  if (d <= 0) return "today";
  if (d === 1) return "yesterday";
  if (d < 30) return `${d}d ago`;
  const m = Math.floor(d / 30);
  if (m < 12) return `${m}mo ago`;
  return `${Math.floor(m / 12)}y ago`;
}

function Centered({ children, tone }) {
  return (
    <div style={{
      padding: 60, textAlign: "center",
      color: tone === "error" ? "#A32D2D" : "#888",
      fontSize: 13,
    }}>{children}</div>
  );
}

function Empty() {
  return (
    <div style={{ padding: 20, fontSize: 11, color: "#888", textAlign: "center", border: "1px dashed #ece9e2", borderRadius: 8, marginTop: 8 }}>
      No data in this window.
    </div>
  );
}

const kpiGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
  marginBottom: 18,
};

const cols2 = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
  gap: 12,
  marginBottom: 18,
};

const panel = {
  padding: 16,
  background: "var(--gx-card-bg)",
  border: "1px solid var(--gx-card-border)",
  borderRadius: 12,
};

const panelTitle = {
  fontFamily: "var(--gx-font-serif)",
  fontSize: 14,
  fontWeight: 700,
  color: "var(--gx-ink)",
  margin: 0,
};

const sectionTitle = {
  fontFamily: "var(--gx-font-serif)",
  fontSize: 18,
  fontWeight: 700,
  color: "var(--gx-ink)",
  margin: "0 0 10px",
};
