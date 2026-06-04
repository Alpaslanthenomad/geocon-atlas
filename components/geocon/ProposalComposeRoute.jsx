"use client";
// components/geocon/ProposalComposeRoute.jsx
//
// /geocon/proposals/new — compose a draft proposal.
// Steps in one form:
//   1) From — which of my actor identities (myself as researcher OR one of
//      my admin/rep orgs) is this proposal coming from?
//   2) To — actor picker (researcher | org | open call) backed by search_actors.
//   3) Type + subject + title + description + term sheet.
// Save as Draft; the detail page handles Send.

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";
import ActorPicker from "./ActorPicker";

const PROPOSAL_TYPES = [
  { v: "research_collaboration", label: "Research collaboration" },
  { v: "rd_partnership",         label: "R&D partnership" },
  { v: "licensing",              label: "Licensing" },
  { v: "feedstock_supply",       label: "Feedstock supply" },
  { v: "propagation_service",    label: "Propagation service" },
  { v: "knowledge_transfer",     label: "Knowledge transfer" },
  { v: "joint_venture",          label: "Joint venture" },
  { v: "sponsorship",            label: "Sponsorship" },
];

const SUBJECT_KINDS = [
  { v: "species",          label: "A species" },
  { v: "metabolite",       label: "A metabolite / compound" },
  { v: "application_area", label: "An application area" },
  { v: "method",           label: "A method / technology" },
  { v: "mixed",            label: "Multiple subjects" },
  { v: "unspecified",      label: "Unspecified — open" },
];

export default function ProposalComposeRoute() {
  return (
    <Suspense fallback={<Loading />}>
      <ComposeInner />
    </Suspense>
  );
}

function ComposeInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const { user, profile, researcher, loading: authLoading } = useAuthContext();

  const [myOrgs, setMyOrgs] = useState([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);

  // form state
  const [initiator, setInitiator] = useState(null); // { kind, id, label }
  const [recipient, setRecipient] = useState(null); // null = open call
  const [openCall, setOpenCall] = useState(false);
  const [type, setType] = useState("research_collaboration");
  const [subjectKind, setSubjectKind] = useState("unspecified");
  const [subjectRefs, setSubjectRefs] = useState("");      // newline-separated for v1
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [termSheet, setTermSheet] = useState(defaultTermSheet());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) { setLoadingOrgs(false); return; }
    let cancelled = false;
    (async () => {
      const { data, error: e } = await supabase
        .from("org_memberships")
        .select("organization_id, role, organizations(id, name, short_name, kind, accreditation_status)")
        .eq("user_id", user.id)
        .in("role", ["admin", "rep"])
        .eq("status", "active");
      if (cancelled) return;
      if (e) console.warn("[compose] orgs error:", e.message);
      setMyOrgs((data || []).map((m) => m.organizations).filter(Boolean));
      setLoadingOrgs(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  // Preselect from query params:
  //   to_kind / to_id / to_name    → recipient (org or researcher CTAs)
  //   subject_kind / subject_id    → subject prefill (species CTA)
  //   subject_name                 → used to seed the title
  useEffect(() => {
    const rk = sp?.get("to_kind");
    const rid = sp?.get("to_id");
    const rname = sp?.get("to_name");
    if (rk && rid && !recipient) {
      setRecipient({ actor_kind: rk, actor_id: rid, actor_name: rname || `${rk} ${rid.slice(0, 8)}` });
    }

    const sk = sp?.get("subject_kind");
    const sid = sp?.get("subject_id");
    const sname = sp?.get("subject_name");
    if (sk) setSubjectKind(sk);
    if (sid) setSubjectRefs(sid);
    if (sname && !title) {
      setTitle(sk === "species" ? `Program around ${sname}` : sname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Default initiator: my researcher identity if present, else first org
  useEffect(() => {
    if (initiator) return;
    if (researcher?.id) {
      setInitiator({ kind: "researcher", id: researcher.id, label: researcher.name || "you" });
    } else if (myOrgs.length > 0) {
      const o = myOrgs[0];
      setInitiator({ kind: "organization", id: o.id, label: o.short_name || o.name });
    }
  }, [researcher, myOrgs, initiator]);

  if (authLoading || loadingOrgs) return <Loading />;

  if (!user) {
    return (
      <div style={{ maxWidth: 540, margin: "60px auto", padding: 40, background: "var(--gx-card-bg)", border: "1px solid var(--gx-card-border)", borderRadius: 12, textAlign: "center" }}>
        <h1 style={{ fontFamily: "var(--gx-font-serif)", fontSize: 22, margin: 0, color: "var(--gx-ink)" }}>Compose proposal</h1>
        <p style={{ fontSize: 12, color: "var(--gx-ink-muted)", marginTop: 8 }}>You need to be signed in.</p>
        <Link href="/" style={{ display: "inline-block", marginTop: 16, padding: "8px 14px", fontSize: 12, fontWeight: 600, background: "#0a4a3e", color: "#fff", borderRadius: 7, textDecoration: "none" }}>
          Sign in via BEE
        </Link>
      </div>
    );
  }

  // The user has no actor identity they can act for: no researcher_id and no admin/rep org
  const hasInitiator = !!researcher?.id || myOrgs.length > 0;
  if (!hasInitiator) {
    return (
      <div style={{ maxWidth: 620, margin: "60px auto", padding: 30, background: "var(--gx-card-bg)", border: "1px solid var(--gx-card-border)", borderRadius: 12, textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>🚫</div>
        <h1 style={{ fontFamily: "var(--gx-font-serif)", fontSize: 20, color: "var(--gx-ink)", margin: 0 }}>You can't send a proposal yet</h1>
        <p style={{ fontSize: 12, color: "#666", marginTop: 10, lineHeight: 1.6 }}>
          Proposals are sent on behalf of an actor — a researcher identity or an organization you administer.
          Either claim your researcher profile (via your account approval flow) or
          <Link href="/geocon/organizations/new" style={{ color: "#0a4a3e", fontWeight: 600, marginLeft: 4 }}>register an organization</Link>.
        </p>
      </div>
    );
  }

  async function submit(asDraft = true) {
    if (busy) return;
    setError(null);
    if (!initiator) { setError("Pick an initiator."); return; }
    if (!openCall && !recipient) { setError("Pick a recipient or mark as open call."); return; }
    if (title.trim().length < 3) { setError("Title is required."); return; }

    let parsedTerms = {};
    try { parsedTerms = termSheet.trim() ? JSON.parse(termSheet) : {}; }
    catch (e) { setError("Term sheet must be valid JSON."); return; }

    const refs = subjectRefs
      .split(/\n|,|;/).map((s) => s.trim()).filter(Boolean)
      .map((s) => ({ kind: subjectKind === "mixed" ? "unspecified" : subjectKind, id: s }));

    setBusy(true);
    try {
      const { data: id, error: rpcErr } = await supabase.rpc("create_proposal_draft", {
        p_title: title.trim(),
        p_proposal_type: type,
        p_initiator_actor_kind: initiator.kind,
        p_initiator_actor_id:   initiator.id,
        p_description: description.trim() || null,
        p_subject_kind: subjectKind,
        p_subject_refs: refs,
        p_term_sheet: parsedTerms,
        p_recipient_actor_kind: openCall ? null : recipient.actor_kind,
        p_recipient_actor_id:   openCall ? null : recipient.actor_id,
        p_proposed_program_id: null,
        p_expires_at: null,
      });
      if (rpcErr) throw rpcErr;
      if (!asDraft) {
        const { error: sErr } = await supabase.rpc("send_proposal", { p_id: id });
        if (sErr) throw sErr;
      }
      router.push(`/geocon/proposals/${id}`);
    } catch (e) {
      setError(e.message || "Failed to create proposal.");
    } finally {
      setBusy(false);
    }
  }

  const initiatorOptions = [
    ...(researcher?.id ? [{ kind: "researcher", id: researcher.id, label: `${researcher.name || "you"} (researcher)` }] : []),
    ...myOrgs.map((o) => ({ kind: "organization", id: o.id, label: `${o.short_name || o.name} (org · ${o.kind})`, disabled: o.accreditation_status !== "accredited" })),
  ];

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <div style={{ marginBottom: 14 }}>
        <Link href="/geocon/proposals" style={{ fontSize: 11, color: "var(--gx-ink-muted)", textDecoration: "none" }}>← Proposals</Link>
        <h1 style={{ fontFamily: "var(--gx-font-serif)", fontSize: 26, fontWeight: 700, color: "var(--gx-ink)", margin: "4px 0 4px" }}>
          New proposal
        </h1>
        <div style={{ fontSize: 12, color: "var(--gx-ink-muted)" }}>
          Save as draft now; you can review and send from the proposal page.
        </div>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); submit(true); }}
        style={{ background: "var(--gx-card-bg)", border: "1px solid var(--gx-card-border)", borderRadius: 12, padding: 22 }}
      >
        <Field label="From *" hint="Which actor are you proposing on behalf of?">
          <select
            value={initiator ? `${initiator.kind}|${initiator.id}` : ""}
            onChange={(e) => {
              const [k, id] = e.target.value.split("|");
              const opt = initiatorOptions.find((o) => o.kind === k && o.id === id);
              setInitiator(opt ? { kind: opt.kind, id: opt.id, label: opt.label } : null);
            }}
            style={inputStyle}
          >
            {initiatorOptions.map((o) => (
              <option key={`${o.kind}|${o.id}`} value={`${o.kind}|${o.id}`} disabled={o.disabled}>
                {o.label}{o.disabled ? " — not accredited" : ""}
              </option>
            ))}
          </select>
        </Field>

        <Field label="To *" hint="Pick the actor you're proposing to, or mark as an open call.">
          <div style={{ marginBottom: 6 }}>
            <label style={{ fontSize: 11, color: "#666", display: "inline-flex", alignItems: "center", gap: 6 }}>
              <input
                type="checkbox"
                checked={openCall}
                onChange={(e) => { setOpenCall(e.target.checked); if (e.target.checked) setRecipient(null); }}
              />
              Open call (any qualifying actor can respond)
            </label>
          </div>
          {!openCall && (
            <>
              <ActorPicker
                value={recipient}
                onChange={setRecipient}
                placeholder="Search researchers or organizations…"
              />
              {!recipient && (
                <SuggestedOrgs
                  type={type}
                  subjectHints={subjectRefs.split(/\n|,|;/).map((s) => s.trim()).filter(Boolean)}
                  onPick={(org) => setRecipient({
                    actor_kind: "organization",
                    actor_id: org.id,
                    actor_name: org.name,
                    actor_subkind: org.kind,
                    country: org.country,
                    verified: "verified",
                  })}
                />
              )}
            </>
          )}
        </Field>

        <Row>
          <Field label="Proposal type *">
            <select value={type} onChange={(e) => setType(e.target.value)} style={inputStyle}>
              {PROPOSAL_TYPES.map((p) => <option key={p.v} value={p.v}>{p.label}</option>)}
            </select>
          </Field>
          <Field label="Subject kind">
            <select value={subjectKind} onChange={(e) => setSubjectKind(e.target.value)} style={inputStyle}>
              {SUBJECT_KINDS.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}
            </select>
          </Field>
        </Row>

        {subjectKind !== "unspecified" && (
          <Field label="Subject IDs" hint="One per line — species IDs, metabolite IDs, application slugs, etc.">
            <textarea
              value={subjectRefs}
              onChange={(e) => setSubjectRefs(e.target.value)}
              rows={3}
              placeholder={subjectKind === "species" ? "wcvp-xxxxx\nwcvp-yyyyy" : "compound-name\nor application slug"}
              style={inputStyle}
            />
          </Field>
        )}

        <Field label="Title *">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Joint propagation pilot for Crocus mathewii" style={inputStyle} />
        </Field>

        <Field label="Description" hint="What you're proposing and why.">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="Background, goals, what each party brings, how success looks…"
            style={inputStyle}
          />
        </Field>

        <Field label="Term sheet (JSON)" hint="Structured terms — contributions, expected outputs, IP, duration. JSON for v1; structured editor will replace this later.">
          <textarea
            value={termSheet}
            onChange={(e) => setTermSheet(e.target.value)}
            rows={8}
            spellCheck={false}
            style={{ ...inputStyle, fontFamily: "monospace", fontSize: 11 }}
          />
        </Field>

        {error && (
          <div style={{ marginTop: 10, padding: 10, background: "#fdecec", border: "1px solid #fcc", borderRadius: 6, fontSize: 11, color: "#A32D2D" }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Link href="/geocon/proposals" style={{ padding: "9px 14px", fontSize: 12, color: "#666", textDecoration: "none", borderRadius: 7 }}>
            Cancel
          </Link>
          <button type="submit" disabled={busy} style={btnSecondary}>
            {busy ? "…" : "Save as draft"}
          </button>
          <button type="button" onClick={() => submit(false)} disabled={busy} style={btnPrimary}>
            {busy ? "…" : "Save & send"}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  fontSize: 12,
  border: "1px solid var(--gx-card-border)",
  borderRadius: 7,
  background: "var(--gx-card-bg)",
  fontFamily: "inherit",
  resize: "vertical",
};

const btnPrimary = {
  padding: "9px 16px", fontSize: 12, fontWeight: 700, background: "#0a4a3e",
  color: "#fff", border: "none", borderRadius: 7, cursor: "pointer",
};
const btnSecondary = {
  padding: "9px 14px", fontSize: 12, fontWeight: 600, background: "var(--gx-card-bg)",
  color: "#0a4a3e", border: "1px solid #0a4a3e", borderRadius: 7, cursor: "pointer",
};

function Row({ children }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{children}</div>;
}

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#444", marginBottom: 4 }}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: 10, color: "#999", marginTop: 4, lineHeight: 1.5 }}>{hint}</div>}
    </div>
  );
}

function SuggestedOrgs({ type, subjectHints, onPick }) {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data } = await supabase.rpc("suggest_orgs_for_proposal", {
        p_proposal_type: type,
        p_subject_hints: subjectHints,
        p_limit: 6,
      });
      if (cancelled) return;
      setOrgs(Array.isArray(data) ? data : []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, subjectHints.join("|")]);

  if (loading || orgs.length === 0) return null;
  return (
    <div style={{ marginTop: 10, padding: 10, background: "var(--gx-surface-2)", border: "1px dashed var(--gx-border-soft)", borderRadius: 8 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--gx-ink-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
        💡 Suggested for this proposal type
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {orgs.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onPick(o)}
            title={(o.capabilities || []).join(", ")}
            style={{
              padding: "5px 10px",
              fontSize: 11,
              fontWeight: 600,
              background: "var(--gx-card-bg)",
              border: "1px solid #0a4a3e",
              color: "#0a4a3e",
              borderRadius: 999,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            🏢 {o.short_name || o.name}
            {typeof o.score === "number" && <span style={{ fontSize: 9, color: "var(--gx-ink-muted)" }}>· {o.score}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

function defaultTermSheet() {
  return JSON.stringify({
    initiator_contributes: [],
    recipient_contributes: [],
    expected_outputs: [],
    ip_arrangement: "",
    exclusivity: false,
    duration_months: null,
    budget: { amount: null, currency: "USD" },
    notes: "",
  }, null, 2);
}

function Loading() {
  return <div style={{ padding: 20, color: "var(--gx-ink-muted)", fontSize: 12, textAlign: "center" }}>Loading…</div>;
}
