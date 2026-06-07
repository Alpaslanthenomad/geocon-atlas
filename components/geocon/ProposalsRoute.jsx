"use client";
// components/geocon/ProposalsRoute.jsx
//
// /geocon/proposals — "my proposals" inbox. Splits inbound (sent to me as
// myself or one of my orgs) from outbound (sent by me on behalf of myself
// or one of my orgs). Drafts (always outbound) get a separate row.

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";
import { EmptyState as SharedEmptyState } from "../shared";
import CollabTabs from "./CollabTabs";

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

const STATUS_META = {
  draft:       { tint: "var(--gx-ink-muted)", label: "Draft" },
  sent:        { tint: "#185FA5", label: "Sent" },
  negotiating: { tint: "#534AB7", label: "Negotiating" },
  accepted:    { tint: "#0F6E56", label: "Accepted" },
  declined:    { tint: "#A32D2D", label: "Declined" },
  withdrawn:   { tint: "var(--gx-ink-muted)", label: "Withdrawn" },
  expired:     { tint: "#BA7517", label: "Expired" },
};

export default function ProposalsRoute() {
  const { user, loading: authLoading } = useAuthContext();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all' | 'inbound' | 'outbound' | 'draft'

  const refetch = async () => {
    const { data, error } = await supabase.rpc("list_proposals_for_me", { p_limit: 100 });
    if (error) { console.warn("[proposals] load error:", error.message); return; }
    setRows(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    if (authLoading || !user) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc("list_proposals_for_me", { p_limit: 100 });
      if (cancelled) return;
      if (error) console.warn("[proposals] load error:", error.message);
      setRows(Array.isArray(data) ? data : []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [authLoading, user]);

  // Realtime: a new proposal where you (or one of your orgs) are addressed,
  // or a state change on one of your existing proposals, refreshes the inbox.
  useEffect(() => {
    if (!user) return;
    let tail = null;
    const schedule = () => { if (tail) clearTimeout(tail); tail = setTimeout(refetch, 500); };
    const channel = supabase
      .channel(`proposals_inbox:${user.id}`)
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
  }, [user]);

  if (authLoading) return <Loading />;

  if (!user) {
    return (
      <div style={{ maxWidth: 540, margin: "60px auto", padding: 40, background: "var(--gx-card-bg)", border: "1px solid var(--gx-card-border)", borderRadius: 12, textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>📬</div>
        <h1 style={{ fontFamily: "var(--gx-font-serif)", fontSize: 22, margin: 0, color: "var(--gx-ink)" }}>Proposals</h1>
        <p style={{ fontSize: 12, color: "var(--gx-ink-muted)", marginTop: 8 }}>Sign in via BEE to see proposals you've sent or received.</p>
        <Link href="/" style={{ display: "inline-block", marginTop: 16, padding: "8px 14px", fontSize: 12, fontWeight: 600, background: "#0a4a3e", color: "#fff", borderRadius: 7, textDecoration: "none" }}>
          Sign in via BEE
        </Link>
      </div>
    );
  }

  const counts = rows.reduce((acc, r) => {
    if (r.status === "draft") acc.draft++;
    else if (r.side === "inbound") acc.inbound++;
    else acc.outbound++;
    return acc;
  }, { draft: 0, inbound: 0, outbound: 0 });

  const filtered = rows.filter((r) => {
    if (filter === "all") return true;
    if (filter === "draft") return r.status === "draft";
    if (filter === "inbound") return r.status !== "draft" && r.side === "inbound";
    if (filter === "outbound") return r.status !== "draft" && r.side === "outbound";
    return true;
  });

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto" }}>
      <CollabTabs active="proposals" />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="gx-h1">Proposals</h1>
          <div style={{ fontSize: 12, color: "var(--gx-ink-muted)", marginTop: 2 }}>
            Collaboration proposals you've sent or received as yourself or any organization you represent.
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/geocon/proposals/new" style={{ padding: "8px 14px", fontSize: 12, fontWeight: 700, background: "#0a4a3e", color: "#fff", borderRadius: 7, textDecoration: "none" }}>
            + New proposal
          </Link>
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
        <TabBtn label={`All (${rows.length})`} active={filter === "all"} onClick={() => setFilter("all")} />
        <TabBtn label={`Inbound (${counts.inbound})`} active={filter === "inbound"} onClick={() => setFilter("inbound")} />
        <TabBtn label={`Outbound (${counts.outbound})`} active={filter === "outbound"} onClick={() => setFilter("outbound")} />
        <TabBtn label={`Drafts (${counts.draft})`} active={filter === "draft"} onClick={() => setFilter("draft")} />
      </div>

      {loading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((r) => <ProposalRow key={r.id} row={r} />)}
        </div>
      )}
    </div>
  );
}

function TabBtn({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 12px",
        fontSize: 11,
        fontWeight: 600,
        background: active ? "#0a4a3e" : "#fff",
        color: active ? "#fff" : "#666",
        border: "1px solid",
        borderColor: active ? "#0a4a3e" : "#e8e6e1",
        borderRadius: 7,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

function ProposalRow({ row }) {
  const meta = STATUS_META[row.status] || STATUS_META.draft;
  return (
    <Link
      href={`/geocon/proposals/${row.id}`}
      style={{
        display: "block",
        background: "var(--gx-card-bg)",
        border: "1px solid var(--gx-card-border)",
        borderRadius: 10,
        padding: "12px 16px",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 9, fontFamily: "monospace", color: "#aaa" }}>{row.proposal_code}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--gx-ink)" }}>{row.title}</span>
          </div>
          <div style={{ fontSize: 11, color: "#666", marginTop: 3 }}>
            {TYPE_LABEL[row.proposal_type] || row.proposal_type} ·
            {" "}<ActorLabel kind={row.initiator_actor_kind} id={row.initiator_actor_id} />
            {" "}→{" "}
            <ActorLabel kind={row.recipient_actor_kind} id={row.recipient_actor_id} />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          <span style={{ fontSize: 10, padding: "3px 9px", borderRadius: 999, background: meta.tint + "22", color: meta.tint, fontWeight: 700 }}>
            {meta.label}
          </span>
          {row.status !== "draft" && (
            <span style={{ fontSize: 9, color: "#aaa" }}>
              {row.side === "inbound" ? "inbound" : "outbound"}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function ActorLabel({ kind, id }) {
  if (!kind) return <em style={{ color: "#aaa" }}>open call</em>;
  if (kind === "researcher") return <span>researcher {id?.slice(0, 12)}…</span>;
  if (kind === "organization") return <span>org {id?.slice(0, 8)}…</span>;
  return <span>{kind}</span>;
}

function EmptyState() {
  return (
    <SharedEmptyState
      icon="📬"
      title="No proposals yet"
      hint="Start one with + New proposal, or wait for another actor to send one your way."
      cta={{ label: "+ New proposal", href: "/geocon/proposals/new" }}
    />
  );
}

function Loading() {
  return <div style={{ padding: 20, color: "var(--gx-ink-muted)", fontSize: 12, textAlign: "center" }}>Loading…</div>;
}
