"use client";
// components/geocon/ProposalDetailRoute.jsx
//
// /geocon/proposals/[id] — one proposal in full.
// Shows: identity header, both actors, type, subject, description, term sheet,
// timeline of events, and the right action set for the current viewer:
//   * Initiator + draft → Send / Withdraw / Edit (edit not yet wired)
//   * Recipient + sent/negotiating → Negotiate / Accept / Decline
//   * Initiator + sent/negotiating → Withdraw

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";

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
  draft:       { tint: "#888780", bg: "#f4f3ef", label: "Draft" },
  sent:        { tint: "#185FA5", bg: "#E6F1FB", label: "Sent" },
  negotiating: { tint: "#534AB7", bg: "#EEEDFE", label: "Negotiating" },
  accepted:    { tint: "#0F6E56", bg: "#E1F5EE", label: "Accepted" },
  declined:    { tint: "#A32D2D", bg: "#FCEBEB", label: "Declined" },
  withdrawn:   { tint: "#888780", bg: "#f4f3ef", label: "Withdrawn" },
  expired:     { tint: "#BA7517", bg: "#FAEEDA", label: "Expired" },
};

const EVENT_LABEL = {
  created: "created the draft",
  sent: "sent the proposal",
  negotiating: "marked it as negotiating",
  accepted: "accepted",
  declined: "declined",
  withdrawn: "withdrew",
  edited: "edited terms",
  comment: "commented",
};

export default function ProposalDetailRoute({ proposalId }) {
  const router = useRouter();
  const { user, profile, researcher } = useAuthContext();
  const [payload, setPayload] = useState(null);
  const [myOrgIds, setMyOrgIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    const { data, error: e } = await supabase.rpc("get_proposal", { p_id: proposalId });
    if (e) setError(e.message);
    setPayload(data || null);
    setLoading(false);
  }

  useEffect(() => { if (proposalId) load(); /* eslint-disable-next-line */ }, [proposalId]);

  useEffect(() => {
    if (!user) { setMyOrgIds(new Set()); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("org_memberships")
        .select("organization_id")
        .eq("user_id", user.id)
        .in("role", ["admin", "rep"])
        .eq("status", "active");
      if (cancelled) return;
      setMyOrgIds(new Set((data || []).map((m) => m.organization_id)));
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (loading) return <Loading />;
  if (error)   return <ErrorBox message={error} />;
  if (!payload?.proposal) return <NotFound />;

  const { proposal, initiator_actor, recipient_actor, events } = payload;
  const meta = STATUS_META[proposal.status] || STATUS_META.draft;

  const canActAs = (kind, id) => {
    if (!user) return false;
    if (kind === "researcher") return researcher?.id === id;
    if (kind === "organization") return myOrgIds.has(id);
    return false;
  };
  const isInitiator = user && (proposal.initiator_user_id === user.id || canActAs(proposal.initiator_actor_kind, proposal.initiator_actor_id));
  const isRecipient = user && proposal.recipient_actor_kind && canActAs(proposal.recipient_actor_kind, proposal.recipient_actor_id);

  async function callRpc(fn, args, confirmMsg) {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setBusy(true); setError(null);
    const { error: e } = await supabase.rpc(fn, args);
    setBusy(false);
    if (e) { setError(e.message); return; }
    load();
  }

  return (
    <div style={{ maxWidth: 980, margin: "0 auto" }}>
      <div style={{ marginBottom: 12 }}>
        <Link href="/geocon/proposals" style={{ fontSize: 11, color: "#888", textDecoration: "none" }}>← Proposals</Link>
      </div>

      <div style={{ background: meta.bg, border: `1px solid ${meta.tint}33`, borderLeft: `4px solid ${meta.tint}`, borderRadius: 10, padding: "14px 18px", marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ fontSize: 10, fontFamily: "monospace", color: meta.tint, fontWeight: 700, letterSpacing: 1 }}>
              {proposal.proposal_code} · {meta.label}
            </div>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: 22, color: "#2c2c2a", margin: "4px 0 0" }}>
              {proposal.title}
            </h1>
            <div style={{ fontSize: 12, color: "#444", marginTop: 4 }}>
              <strong>{TYPE_LABEL[proposal.proposal_type] || proposal.proposal_type}</strong>
              {proposal.subject_kind && proposal.subject_kind !== "unspecified" && (
                <> · subject: <em>{proposal.subject_kind}</em></>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 14, alignItems: "stretch", marginBottom: 14 }}>
        <ActorCard label="From" actor={initiator_actor} kind={proposal.initiator_actor_kind} fallbackId={proposal.initiator_actor_id} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: "#888" }}>→</div>
        <ActorCard label="To" actor={recipient_actor} kind={proposal.recipient_actor_kind} fallbackId={proposal.recipient_actor_id} openCall={!proposal.recipient_actor_kind} />
      </div>

      {proposal.description && (
        <Section title="Description">
          <p style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: 13, color: "#333", lineHeight: 1.6 }}>{proposal.description}</p>
        </Section>
      )}

      {proposal.term_sheet && Object.keys(proposal.term_sheet || {}).length > 0 && (
        <Section title="Term sheet">
          <TermSheet terms={proposal.term_sheet} />
        </Section>
      )}

      {Array.isArray(proposal.subject_refs) && proposal.subject_refs.length > 0 && (
        <Section title="Subject references">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {proposal.subject_refs.map((s, i) => (
              <span key={i} style={{ fontSize: 11, padding: "4px 9px", borderRadius: 999, background: "#f4f3ef", color: "#555" }}>
                {s.kind || "subject"}: {s.id}
              </span>
            ))}
          </div>
        </Section>
      )}

      <Section title="Timeline">
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {(events || []).map((ev) => (
            <div key={ev.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 12, color: "#444", padding: "8px 10px", background: "#fafaf7", borderRadius: 8 }}>
              <span style={{ fontSize: 10, color: "#888", flexShrink: 0, fontFamily: "monospace", marginTop: 2 }}>
                {new Date(ev.at).toLocaleString()}
              </span>
              <div style={{ flex: 1 }}>
                <strong>{ev.by_actor_kind || "system"}</strong> {EVENT_LABEL[ev.event_type] || ev.event_type}
                {ev.note && <div style={{ marginTop: 2, fontSize: 11, color: "#666", fontStyle: "italic" }}>"{ev.note}"</div>}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {error && (
        <div style={{ padding: 10, background: "#fdecec", border: "1px solid #fcc", borderRadius: 6, fontSize: 11, color: "#A32D2D", marginBottom: 12 }}>
          {error}
        </div>
      )}

      {/* Action bar */}
      <div style={{ position: "sticky", bottom: 0, background: "#fff", borderTop: "1px solid #ece9e2", padding: "12px 0", display: "flex", gap: 8, justifyContent: "flex-end" }}>
        {isInitiator && proposal.status === "draft" && (
          <>
            <button onClick={() => callRpc("withdraw_proposal", { p_id: proposalId, p_reason: null }, "Discard this draft?")} disabled={busy} style={btnSecondary}>Discard draft</button>
            <button onClick={() => callRpc("send_proposal", { p_id: proposalId })} disabled={busy} style={btnPrimary}>Send proposal</button>
          </>
        )}
        {isInitiator && (proposal.status === "sent" || proposal.status === "negotiating") && (
          <button onClick={() => callRpc("withdraw_proposal", { p_id: proposalId, p_reason: window.prompt("Reason (optional):") }, "Withdraw this proposal?")} disabled={busy} style={btnSecondary}>Withdraw</button>
        )}
        {isRecipient && (proposal.status === "sent" || proposal.status === "negotiating") && (
          <>
            {proposal.status === "sent" && (
              <button
                onClick={() => callRpc("respond_to_proposal", { p_id: proposalId, p_decision: "negotiating", p_note: window.prompt("Negotiation note (optional):") })}
                disabled={busy}
                style={btnSecondary}
              >
                Mark as negotiating
              </button>
            )}
            <button
              onClick={() => callRpc("respond_to_proposal", { p_id: proposalId, p_decision: "decline", p_note: window.prompt("Decline reason (optional):") }, "Decline this proposal?")}
              disabled={busy}
              style={btnDanger}
            >
              Decline
            </button>
            <button
              onClick={() => callRpc("respond_to_proposal", { p_id: proposalId, p_decision: "accept", p_note: window.prompt("Acceptance note (optional):") }, "Accept this proposal?")}
              disabled={busy}
              style={btnPrimary}
            >
              Accept
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function ActorCard({ label, actor, kind, fallbackId, openCall }) {
  if (openCall) {
    return (
      <div style={{ background: "#fff", border: "1px dashed #ece9e2", borderRadius: 10, padding: 14 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
        <div style={{ marginTop: 6, fontSize: 14, fontWeight: 600, color: "#888", fontStyle: "italic" }}>
          Open call — anyone qualifying can respond
        </div>
      </div>
    );
  }
  const name = actor?.name || (fallbackId ? `${kind} ${fallbackId.slice(0, 12)}…` : "Unknown");
  const href = kind === "organization"
    ? `/geocon/organizations/${fallbackId}`
    : kind === "researcher"
    ? `/geocon/researchers/${encodeURIComponent(fallbackId)}`
    : null;
  const body = (
    <div style={{ background: "#fff", border: "1px solid #ece9e2", borderRadius: 10, padding: 14 }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
      <div style={{ marginTop: 6, fontSize: 14, fontWeight: 700, color: "#2c2c2a" }}>{name}</div>
      <div style={{ fontSize: 10, color: "#888", marginTop: 3 }}>
        {kind === "organization" ? "Organization" : "Researcher"}
        {actor?.kind && ` · ${actor.kind}`}
        {actor?.country && ` · ${actor.country}`}
      </div>
    </div>
  );
  return href ? <Link href={href} style={{ textDecoration: "none", color: "inherit" }}>{body}</Link> : body;
}

function TermSheet({ terms }) {
  const labelMap = {
    initiator_contributes: "Initiator contributes",
    recipient_contributes: "Recipient contributes",
    expected_outputs:      "Expected outputs",
    ip_arrangement:        "IP arrangement",
    exclusivity:           "Exclusivity",
    duration_months:       "Duration (months)",
    budget:                "Budget",
    notes:                 "Notes",
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {Object.entries(terms).map(([k, v]) => {
        if (v == null || v === "" || (Array.isArray(v) && v.length === 0)) return null;
        return (
          <div key={k}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3 }}>
              {labelMap[k] || k}
            </div>
            <div style={{ fontSize: 12, color: "#333" }}>
              {Array.isArray(v) ? (
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {v.map((it, i) => <li key={i}>{typeof it === "string" ? it : JSON.stringify(it)}</li>)}
                </ul>
              ) : typeof v === "object" ? (
                <code style={{ fontSize: 11, color: "#444" }}>{JSON.stringify(v)}</code>
              ) : (
                String(v)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section style={{ background: "#fff", border: "1px solid #ece9e2", borderRadius: 10, padding: 16, marginBottom: 14 }}>
      <h2 style={{ fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 700, color: "#2c2c2a", margin: "0 0 10px" }}>{title}</h2>
      {children}
    </section>
  );
}

const btnPrimary = {
  padding: "9px 18px", fontSize: 12, fontWeight: 700, background: "#0a4a3e",
  color: "#fff", border: "none", borderRadius: 7, cursor: "pointer",
};
const btnSecondary = {
  padding: "9px 14px", fontSize: 12, fontWeight: 600, background: "#fff",
  color: "#666", border: "1px solid #e8e6e1", borderRadius: 7, cursor: "pointer",
};
const btnDanger = {
  padding: "9px 14px", fontSize: 12, fontWeight: 600, background: "#fff",
  color: "#A32D2D", border: "1px solid #fcc", borderRadius: 7, cursor: "pointer",
};

function Loading() { return <div style={{ padding: 20, color: "#888", fontSize: 12, textAlign: "center" }}>Loading…</div>; }
function ErrorBox({ message }) { return <div style={{ padding: 16, background: "#fdecec", border: "1px solid #fcc", borderRadius: 8, fontSize: 12, color: "#A32D2D" }}>Error: {message}</div>; }
function NotFound() { return <div style={{ padding: 60, textAlign: "center", color: "#888", fontSize: 13 }}>Proposal not found.</div>; }
