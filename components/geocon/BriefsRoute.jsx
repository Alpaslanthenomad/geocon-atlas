"use client";
// /geocon/briefs — Open Briefs discovery route.
// Different lens than /geocon/proposals: this view filters proposals
// that carry a brief_kind (research / conservation / capability /
// production / partner / service / idea). Treats them as research
// demand signals, not commercial transactions.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { EmptyState, GlassCard } from "../shared";
import CollabTabs from "./CollabTabs";

const KIND_META = {
  research_brief:     { icon: "🧪", label: "Research",     tint: "#534AB7" },
  conservation_brief: { icon: "🌱", label: "Conservation", tint: "#0F6E56" },
  capability_brief:   { icon: "🛠",  label: "Capability",   tint: "#BA7517" },
  production_brief:   { icon: "📦", label: "Production",   tint: "#D85A30" },
  partner_brief:      { icon: "🤝", label: "Partner",      tint: "#185FA5" },
  service_brief:      { icon: "🔬", label: "Service",      tint: "#85651A" },
  idea_brief:         { icon: "💡", label: "Idea",         tint: "#5F5E5A" },
};

const URGENCY_META = {
  urgent: { label: "Urgent", tint: "#A32D2D" },
  high:   { label: "High",   tint: "#BA7517" },
  normal: { label: "Normal", tint: "#5F5E5A" },
  low:    { label: "Low",    tint: "var(--gx-ink-muted)" },
};

const ALL_KINDS = Object.keys(KIND_META);

export default function BriefsRoute() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeKinds, setActiveKinds] = useState([]);     // empty = all
  const [activeUrgencies, setActiveUrgencies] = useState([]);
  const [capability, setCapability] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data } = await supabase.rpc("list_open_briefs", {
        p_kinds:     activeKinds.length     ? activeKinds     : null,
        p_urgencies: activeUrgencies.length ? activeUrgencies : null,
        p_capability: capability.trim() || null,
        p_limit: 100,
      });
      if (cancelled) return;
      setRows(Array.isArray(data) ? data : []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [activeKinds, activeUrgencies, capability]);

  const toggleKind = (k) => setActiveKinds((arr) =>
    arr.includes(k) ? arr.filter((x) => x !== k) : [...arr, k]
  );
  const toggleUrgency = (u) => setActiveUrgencies((arr) =>
    arr.includes(u) ? arr.filter((x) => x !== u) : [...arr, u]
  );

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", paddingBottom: 60 }}>
      <CollabTabs active="briefs" />
      <div className="gx-rise" style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <div>
          <h1 style={{
            fontFamily: "var(--gx-font-serif)",
            fontSize: 28,
            fontWeight: 700,
            color: "var(--gx-ink)",
            margin: 0,
          }}>
            🗂 Open Briefs
          </h1>
          <div style={{ fontSize: 12, color: "var(--gx-ink-muted)", marginTop: 4, lineHeight: 1.6, maxWidth: 720 }}>
            Research demand signals from across the network — every brief is a
            collaboration prompt, not a commercial transaction. Filter by kind,
            urgency, or required capability.
          </div>
        </div>
        <Link href="/geocon/briefs/new" style={{
          padding: "9px 16px", fontSize: 12, fontWeight: 700,
          color: "#fff", background: "var(--gx-accent-violet)",
          borderRadius: 8, textDecoration: "none",
          letterSpacing: 0.3,
        }}>
          + Compose brief
        </Link>
      </div>

      <GlassCard style={{ padding: 14, marginBottom: 14 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
          {ALL_KINDS.map((k) => {
            const meta = KIND_META[k];
            const active = activeKinds.includes(k);
            return (
              <button key={k} onClick={() => toggleKind(k)} className="gx-btn"
                style={{
                  padding: "5px 10px", fontSize: 11, fontWeight: 600,
                  background: active ? `${meta.tint}22` : "var(--gx-surface)",
                  color: active ? meta.tint : "var(--gx-ink-soft)",
                  border: `1px solid ${active ? meta.tint : "var(--gx-border-soft)"}`,
                  borderRadius: 999, cursor: "pointer",
                }}>
                {meta.icon} {meta.label}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 10, color: "var(--gx-ink-muted)", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", marginRight: 6 }}>
            Urgency:
          </span>
          {Object.entries(URGENCY_META).map(([u, m]) => {
            const active = activeUrgencies.includes(u);
            return (
              <button key={u} onClick={() => toggleUrgency(u)} className="gx-btn"
                style={{
                  padding: "4px 9px", fontSize: 10, fontWeight: 700,
                  background: active ? `${m.tint}22` : "transparent",
                  color: active ? m.tint : "var(--gx-ink-muted)",
                  border: `1px solid ${active ? m.tint : "var(--gx-border-soft)"}`,
                  borderRadius: 999, cursor: "pointer",
                }}>
                {m.label}
              </button>
            );
          })}
          <input
            value={capability}
            onChange={(e) => setCapability(e.target.value)}
            placeholder="Capability (e.g. tissue_culture, hplc, formulation)"
            style={{
              marginLeft: "auto",
              padding: "6px 10px",
              fontSize: 11,
              background: "var(--gx-surface)",
              color: "var(--gx-ink)",
              border: "1px solid var(--gx-border-soft)",
              borderRadius: 7,
              minWidth: 260,
              fontFamily: "var(--gx-font-mono)",
            }}
          />
        </div>
      </GlassCard>

      {loading ? (
        <div className="gx-skeleton" style={{ height: 60, marginBottom: 8 }} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon="🗂"
          title="No open briefs match these filters"
          hint="Adjust filters above, or check back as the network seeds more briefs. As Programs mature, briefs become the public signal of what each team needs next."
          cta={(activeKinds.length || activeUrgencies.length || capability)
            ? { label: "Clear all filters", onClick: () => { setActiveKinds([]); setActiveUrgencies([]); setCapability(""); } }
            : { label: "+ Compose brief", href: "/geocon/briefs/new" }}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.map((r) => <BriefCard key={r.id} brief={r} />)}
        </div>
      )}
    </div>
  );
}

function BriefCard({ brief }) {
  const meta = KIND_META[brief.brief_kind] || { icon: "•", label: brief.brief_kind, tint: "var(--gx-ink-muted)" };
  const urgency = URGENCY_META[brief.urgency];
  return (
    <Link
      href={`/geocon/proposals/${brief.id}`}
      className="gx-card gx-card-hover"
      style={{
        display: "block", padding: 14, textDecoration: "none", color: "inherit",
        borderLeft: `4px solid ${meta.tint}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase",
          padding: "2px 7px", borderRadius: 999,
          background: `${meta.tint}1a`, color: meta.tint,
        }}>
          {meta.icon} {meta.label}
        </span>
        {urgency && (
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase",
            padding: "2px 7px", borderRadius: 999,
            background: `${urgency.tint}1a`, color: urgency.tint,
          }}>
            {urgency.label}
          </span>
        )}
        {brief.proposal_code && (
          <span style={{ fontSize: 10, color: "var(--gx-ink-muted)", fontFamily: "var(--gx-font-mono)" }}>
            {brief.proposal_code}
          </span>
        )}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--gx-ink)", lineHeight: 1.3 }}>
        {brief.title || "(untitled brief)"}
      </div>
      {brief.description && (
        <div style={{
          fontSize: 11.5, color: "var(--gx-ink-soft)", marginTop: 6, lineHeight: 1.5,
          display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {brief.description}
        </div>
      )}
      {Array.isArray(brief.required_capabilities) && brief.required_capabilities.length > 0 && (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 8 }}>
          {brief.required_capabilities.slice(0, 6).map((c) => (
            <span key={c} style={{
              fontSize: 9, fontFamily: "var(--gx-font-mono)",
              padding: "2px 6px", borderRadius: 4,
              background: "var(--gx-surface-3)", color: "var(--gx-ink-soft)",
            }}>
              {c}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
