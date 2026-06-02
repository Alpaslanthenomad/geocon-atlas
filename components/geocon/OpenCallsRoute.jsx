"use client";
// components/geocon/OpenCallsRoute.jsx
//
// /geocon/proposals/open — public list of "open call" proposals (no named
// recipient, awaiting response). Open to anyone (signed in or not); the
// "Respond" CTA on each card lives on the proposal detail page, gated by
// fn_can_act_for_actor at the RPC layer.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { countryName } from "../../lib/countryNames";
import { flag } from "../../lib/atlas/format";
import { EmptyState as SharedEmptyState } from "../shared";

const TYPE_LABEL = {
  research_collaboration: "Research collaboration",
  rd_partnership:         "R&D partnership",
  licensing:              "Licensing",
  feedstock_supply:       "Feedstock supply",
  propagation_service:    "Propagation service",
  knowledge_transfer:     "Knowledge transfer",
  joint_venture:          "Joint venture",
  sponsorship:            "Sponsorship",
};

const SUBJECT_LABEL = {
  species:          "Species",
  metabolite:       "Metabolite",
  application_area: "Application area",
  method:           "Method",
  mixed:            "Mixed",
  unspecified:      "Unspecified",
};

const STATUS_TINT = { sent: "#185FA5", negotiating: "#534AB7" };

export default function OpenCallsRoute() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // filters
  const [type, setType] = useState("all");
  const [subjectKind, setSubjectKind] = useState("all");
  const [initiatorKind, setInitiatorKind] = useState("all");
  const [search, setSearch] = useState("");

  async function refetch() {
    const { data, error: e } = await supabase.rpc("list_open_proposals", {
      p_type: type === "all" ? null : type,
      p_subject_kind: subjectKind === "all" ? null : subjectKind,
      p_initiator_kind: initiatorKind === "all" ? null : initiatorKind,
      p_limit: 100,
    });
    if (e) setError(e.message);
    setRows(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      await refetch();
      if (cancelled) return;
      setLoading(false);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, subjectKind, initiatorKind]);

  // Realtime: any change to a proposal might flip its open-call eligibility.
  // Debounced refetch.
  useEffect(() => {
    let tail = null;
    const schedule = () => { if (tail) clearTimeout(tail); tail = setTimeout(refetch, 500); };
    const channel = supabase
      .channel("open_calls_feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "collaboration_proposals" },
        schedule
      )
      .subscribe();
    return () => {
      if (tail) clearTimeout(tail);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, subjectKind, initiatorKind]);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) =>
      (r.title || "").toLowerCase().includes(q) ||
      (r.description || "").toLowerCase().includes(q) ||
      (r.initiator_actor_name || "").toLowerCase().includes(q)
    );
  }, [rows, search]);

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>
            <Link href="/geocon/proposals" style={{ color: "#888", textDecoration: "none" }}>← Proposals</Link>
          </div>
          <h1 className="gx-h1">Open calls</h1>
          <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
            Proposals that any qualifying actor can respond to.
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title, description, initiator…"
          style={{ padding: "7px 10px", fontSize: 12, border: "1px solid var(--gx-card-border)", borderRadius: 7, minWidth: 240, flex: 1, background: "var(--gx-card-bg)" }}
        />
        <select value={type} onChange={(e) => setType(e.target.value)} style={selectStyle}>
          <option value="all">All types</option>
          {Object.entries(TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={subjectKind} onChange={(e) => setSubjectKind(e.target.value)} style={selectStyle}>
          <option value="all">Any subject</option>
          {Object.entries(SUBJECT_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={initiatorKind} onChange={(e) => setInitiatorKind(e.target.value)} style={selectStyle}>
          <option value="all">Any initiator</option>
          <option value="researcher">Researchers</option>
          <option value="organization">Organizations</option>
        </select>
      </div>

      {error && (
        <div style={{ padding: 10, background: "#fdecec", border: "1px solid #fcc", borderRadius: 6, fontSize: 11, color: "#A32D2D", marginBottom: 12 }}>
          {error}
        </div>
      )}

      {loading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
          {filtered.map((r) => <OpenCallCard key={r.id} row={r} />)}
        </div>
      )}
    </div>
  );
}

function OpenCallCard({ row }) {
  const tint = STATUS_TINT[row.status] || "var(--gx-ink-muted)";
  return (
    <Link
      href={`/geocon/proposals/${row.id}`}
      style={{
        display: "flex",
        flexDirection: "column",
        background: "var(--gx-card-bg)",
        border: "1px solid var(--gx-card-border)",
        borderLeft: `4px solid ${tint}`,
        borderRadius: 10,
        padding: 14,
        textDecoration: "none",
        color: "inherit",
        minHeight: 160,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6, gap: 8 }}>
        <span style={{ fontSize: 9, fontFamily: "monospace", color: "#aaa", letterSpacing: 1 }}>{row.proposal_code}</span>
        <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 999, background: tint + "22", color: tint, fontWeight: 700, textTransform: "uppercase" }}>
          {row.status}
        </span>
      </div>

      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--gx-ink)", marginBottom: 4, lineHeight: 1.3 }}>
        {row.title}
      </div>

      <div style={{ fontSize: 10, color: "#888", marginBottom: 8 }}>
        {TYPE_LABEL[row.proposal_type] || row.proposal_type}
        {row.subject_kind && row.subject_kind !== "unspecified" && (
          <> · {SUBJECT_LABEL[row.subject_kind] || row.subject_kind}</>
        )}
      </div>

      {row.description && (
        <div style={{
          fontSize: 11, color: "#555", lineHeight: 1.5, marginBottom: 10,
          display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {row.description}
        </div>
      )}

      <div style={{ marginTop: "auto", paddingTop: 8, borderTop: "1px solid #f5f3ec", fontSize: 10, color: "#666", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {row.initiator_actor_kind === "organization" ? "🏢" : "👤"} {row.initiator_actor_name || `${row.initiator_actor_kind}`}
          {row.initiator_country && <> · {flag(row.initiator_country)}</>}
        </span>
        {row.sent_at && (
          <span style={{ fontSize: 9, color: "#aaa", flexShrink: 0 }}>
            {formatAgo(row.sent_at)}
          </span>
        )}
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <SharedEmptyState
      icon="📭"
      title="No open calls match these filters"
      hint="When an actor sends a proposal without a named recipient, it shows up here for the whole network to see."
    />
  );
}

function Loading() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
      {[1, 2, 3, 4].map((i) => <div key={i} style={{ height: 160, background: "var(--gx-surface-3)", borderRadius: 10 }} />)}
    </div>
  );
}

function formatAgo(at) {
  if (!at) return "";
  const d = new Date(at);
  const ms = Date.now() - d.getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

const selectStyle = {
  padding: "7px 10px",
  fontSize: 12,
  border: "1px solid var(--gx-card-border)",
  borderRadius: 7,
  background: "var(--gx-card-bg)",
  cursor: "pointer",
};
