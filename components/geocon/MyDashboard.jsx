"use client";
// components/geocon/MyDashboard.jsx
//
// Personalized "what should I do today" panel rendered at the top of the
// signed-in user's home page. Backed by get_my_home_dashboard which returns
// inbound proposals awaiting response, outbound proposals you're driving,
// assigned TICs, and a few quick counters.

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";

const TYPE_LABEL = {
  research_collaboration: "Research collab",
  rd_partnership:         "R&D partnership",
  licensing:              "Licensing",
  feedstock_supply:       "Feedstock",
  propagation_service:    "Propagation",
  knowledge_transfer:     "Knowledge",
  joint_venture:          "JV",
  sponsorship:            "Sponsorship",
};

export default function MyDashboard() {
  const { user, researcher, profile } = useAuthContext();
  const [data, setData] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const [dashResp, watchResp] = await Promise.all([
          supabase.rpc("get_my_home_dashboard"),
          supabase.rpc("get_my_watchlist", { p_kind: null, p_limit: 12 }),
        ]);
        if (cancelled) return;
        if (!dashResp.error)  setData(dashResp.data || null);
        if (!watchResp.error) setWatchlist(Array.isArray(watchResp.data) ? watchResp.data : []);
      } catch (e) {
        if (!cancelled) console.warn("[MyDashboard]", e?.message || e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })().catch(() => { /* swallow */ });
    return () => { cancelled = true; };
  }, [user]);

  if (!user) return null;
  if (loading) return <Skeleton />;
  if (!data) return null;

  const inbound = data.inbound_pending || [];
  const outbound = data.outbound_active || [];
  const tics = data.assigned_tics || [];

  const hasAny = inbound.length + outbound.length + tics.length > 0;
  const greeting = researcher?.name || profile?.full_name || user.email?.split("@")[0];

  return (
    <section style={{ marginBottom: 26 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 2 }}>Welcome back,</div>
          <h2 style={{ fontFamily: "var(--gx-font-serif)", fontSize: 22, fontWeight: 700, color: "var(--gx-ink)", margin: 0 }}>
            {greeting}
          </h2>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/geocon/proposals/new" style={cta}>+ New proposal</Link>
          <Link href="/geocon/proposals/open" style={ctaSecondary}>Browse open calls</Link>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10, marginBottom: 14 }}>
        <StatCard label="Inbound · awaiting you" value={inbound.length} tint="#185FA5" href="/geocon/proposals" />
        <StatCard label="Outbound · in flight" value={outbound.length} tint="#0a4a3e" href="/geocon/proposals" />
        <StatCard label="Pending TICs" value={tics.length} tint="#534AB7" />
        <StatCard label="Unread notifications" value={data.unread_notifications || 0} tint="#A32D2D" />
      </div>

      {!hasAny ? (
        <div style={{ padding: 30, border: "1px dashed #ece9e2", borderRadius: 12, textAlign: "center", color: "#888", fontSize: 12, background: "var(--gx-surface-2)" }}>
          Nothing on your plate right now. <Link href="/geocon/proposals/open" style={{ color: "#0a4a3e", fontWeight: 600 }}>Browse open calls</Link> or <Link href="/geocon/organizations/new" style={{ color: "#0a4a3e", fontWeight: 600 }}>register an organization</Link>.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 }}>
          {inbound.length > 0 && (
            <Pile title="📬 Awaiting your response" tint="#185FA5">
              {inbound.slice(0, 5).map((p) => <ProposalRow key={p.id} p={p} side="inbound" />)}
            </Pile>
          )}
          {tics.length > 0 && (
            <Pile title="✓ Your TICs" tint="#534AB7">
              {tics.slice(0, 5).map((t) => <TicRow key={t.id} t={t} />)}
            </Pile>
          )}
          {outbound.length > 0 && (
            <Pile title="📤 Your active proposals" tint="#0a4a3e">
              {outbound.slice(0, 5).map((p) => <ProposalRow key={p.id} p={p} side="outbound" />)}
            </Pile>
          )}
          {watchlist.length > 0 && (
            <Pile title="★ Watching" tint="#85651A">
              {watchlist.slice(0, 6).map((w) => <WatchRow key={`${w.kind}|${w.entity_id}`} w={w} />)}
            </Pile>
          )}
        </div>
      )}
    </section>
  );
}

function WatchRow({ w }) {
  const icon = w.kind === "species" ? "🌿"
            : w.kind === "organization" ? "🏢"
            : w.kind === "researcher"   ? "👤"
            : w.kind === "proposal"     ? "📬"
            : "•";
  return (
    <Link href={w.url || "#"} style={{ display: "block", padding: "8px 10px", background: "var(--gx-surface-2)", borderRadius: 8, textDecoration: "none", color: "inherit", border: "1px solid var(--gx-card-border)" }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--gx-ink)", lineHeight: 1.3, display: "flex", gap: 6, alignItems: "center" }}>
        <span>{icon}</span>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {w.label || `${w.kind} ${String(w.entity_id).slice(0, 8)}`}
        </span>
      </div>
      <div style={{ fontSize: 10, color: "#888", marginTop: 2, textTransform: "uppercase", letterSpacing: 0.5 }}>
        {w.kind}
      </div>
    </Link>
  );
}

function StatCard({ label, value, tint, href }) {
  const body = (
    <div style={{
      background: "var(--gx-card-bg)", border: `1px solid ${tint}33`, borderLeft: `4px solid ${tint}`,
      borderRadius: 10, padding: 14, textDecoration: "none", color: "inherit",
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: tint, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: "var(--gx-font-serif)", fontSize: 26, fontWeight: 700, color: "var(--gx-ink)", lineHeight: 1 }}>{value}</div>
    </div>
  );
  return href ? <Link href={href} style={{ textDecoration: "none" }}>{body}</Link> : body;
}

function Pile({ title, tint, children }) {
  return (
    <div style={{ background: "var(--gx-card-bg)", border: "1px solid var(--gx-card-border)", borderRadius: 10, padding: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: tint, marginBottom: 8 }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{children}</div>
    </div>
  );
}

function ProposalRow({ p, side }) {
  return (
    <Link href={`/geocon/proposals/${p.id}`} style={{ display: "block", padding: "8px 10px", background: "var(--gx-surface-2)", borderRadius: 8, textDecoration: "none", color: "inherit", border: "1px solid var(--gx-card-border)" }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--gx-ink)", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" }}>
        {p.title}
      </div>
      <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>
        {TYPE_LABEL[p.proposal_type] || p.proposal_type}
        {side === "inbound" && p.initiator_actor_name && <> · from {p.initiator_actor_name}</>}
        {side === "outbound" && p.recipient_actor_name && <> · to {p.recipient_actor_name}</>}
        {p.status && <> · <span style={{ fontWeight: 700, color: statusTint(p.status) }}>{p.status}</span></>}
      </div>
    </Link>
  );
}

function TicRow({ t }) {
  const overdue = t.due_date && new Date(t.due_date) < new Date();
  return (
    <Link href={`/geocon/programs/${t.program_id}?tab=foundation`} style={{ display: "block", padding: "8px 10px", background: "var(--gx-surface-2)", borderRadius: 8, textDecoration: "none", color: "inherit", border: "1px solid var(--gx-card-border)" }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--gx-ink)", lineHeight: 1.3 }}>
        {t.tic_label_en || t.tic_label_tr || t.tic_id}
      </div>
      <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>
        {t.program_name}
        {t.due_date && <> · due <span style={{ color: overdue ? "#A32D2D" : "#666", fontWeight: overdue ? 700 : 400 }}>{t.due_date}</span></>}
      </div>
    </Link>
  );
}

function statusTint(s) {
  if (s === "sent")        return "#185FA5";
  if (s === "negotiating") return "#534AB7";
  if (s === "draft")       return "#888";
  return "#888";
}

function Skeleton() {
  return (
    <section style={{ marginBottom: 26 }}>
      <div style={{ height: 60, background: "var(--gx-surface-3)", borderRadius: 10, marginBottom: 14 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
        {[1,2,3,4].map((i) => <div key={i} style={{ height: 80, background: "var(--gx-surface-3)", borderRadius: 10 }} />)}
      </div>
    </section>
  );
}

const cta = {
  padding: "8px 14px", fontSize: 12, fontWeight: 700,
  background: "#0a4a3e", color: "#fff", borderRadius: 7, textDecoration: "none",
};
const ctaSecondary = {
  padding: "8px 14px", fontSize: 12, fontWeight: 600,
  background: "var(--gx-card-bg)", color: "#0a4a3e", border: "1px solid #0a4a3e", borderRadius: 7, textDecoration: "none",
};
