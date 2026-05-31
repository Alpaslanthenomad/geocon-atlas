"use client";
// /geocon/briefs/new — Open Brief composer.
//
// Why "compose" not "post"? Because briefs are research-coded, not
// commerce-coded. The verb sets the tone.

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";
import { GlassCard, EmptyState } from "../shared";

const BRIEF_KINDS = [
  { key: "research_brief",     icon: "🧪", label: "Research",      hint: "Question or characterization needed" },
  { key: "conservation_brief", icon: "🌱", label: "Conservation",  hint: "Conservation data / field action" },
  { key: "capability_brief",   icon: "🛠",  label: "Capability",    hint: "Specific lab capability sought" },
  { key: "production_brief",   icon: "📦", label: "Production",    hint: "Pilot / scale-up production" },
  { key: "partner_brief",      icon: "🤝", label: "Partner",       hint: "Strategic R&D partner" },
  { key: "service_brief",      icon: "🔬", label: "Service",       hint: "One-off analytical service" },
  { key: "idea_brief",         icon: "💡", label: "Idea",          hint: "Synergy / opportunity proposal" },
];

const URGENCY = [
  { key: "low",    label: "Low",    tint: "#888780" },
  { key: "normal", label: "Normal", tint: "#5F5E5A" },
  { key: "high",   label: "High",   tint: "#BA7517" },
  { key: "urgent", label: "Urgent", tint: "#A32D2D" },
];

const SUBJECT_KINDS = ["unspecified","species","metabolite","application_area","method","mixed"];

const CAPABILITY_VOCAB = [
  "tissue_culture","cell_culture","supercritical_extraction","solvent_extraction",
  "hplc","gc_ms","nmr","pilot_production","clinical_research","formulation",
  "propagation","field_survey","taxonomy_revision","herbarium_archival",
  "iucn_assessment","seed_storage","cryopreservation","patent_drafting","translation_botanical",
];

export default function BriefComposerRoute() {
  const router = useRouter();
  const { user } = useAuthContext();

  const [briefKind, setBriefKind] = useState("research_brief");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState("normal");
  const [subjectKind, setSubjectKind] = useState("unspecified");
  const [subjectRefsText, setSubjectRefsText] = useState(""); // freeform "species:GEO-..., family:Iridaceae"
  const [requiredCaps, setRequiredCaps] = useState([]);
  const [issuedOnBehalfOfOrg, setIssuedOnBehalfOfOrg] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const [myOrgs, setMyOrgs] = useState([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  // Load the orgs the user can issue on behalf of (admin/rep + active)
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("org_memberships")
        .select("organization_id, role, status, organizations(id, name, short_name)")
        .eq("user_id", user.id)
        .in("role", ["admin", "rep"])
        .eq("status", "active");
      if (cancelled) return;
      setMyOrgs(Array.isArray(data)
        ? data.map((m) => m.organizations).filter(Boolean)
        : []);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const subjectRefs = useMemo(() => parseRefs(subjectRefsText), [subjectRefsText]);

  function toggleCap(key) {
    setRequiredCaps((arr) => arr.includes(key) ? arr.filter((x) => x !== key) : [...arr, key]);
  }

  async function submit() {
    if (!title.trim()) { setErr("Title required."); return; }
    if (!description.trim()) { setErr("Description required."); return; }
    setSaving(true); setErr(null);
    try {
      const { data: id, error } = await supabase.rpc("create_open_brief", {
        p_brief_kind: briefKind,
        p_title: title.trim(),
        p_description: description.trim(),
        p_urgency: urgency,
        p_required_capabilities: requiredCaps,
        p_subject_kind: subjectKind,
        p_subject_refs: subjectRefs,
        p_issued_on_behalf_of_org: issuedOnBehalfOfOrg || null,
        p_expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      });
      if (error) throw error;
      router.push(`/geocon/proposals/${id}`);
    } catch (e) {
      setErr(e?.message || "Could not create brief");
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return (
      <div style={{ maxWidth: 540, margin: "60px auto" }}>
        <EmptyState
          icon="🗂"
          title="Sign in to issue a brief"
          hint="Open Briefs are research demand signals from across the network. Sign in via BEE to issue one."
          cta={{ label: "Sign in via BEE", href: "/" }}
        />
      </div>
    );
  }

  const kindMeta = BRIEF_KINDS.find((k) => k.key === briefKind);

  return (
    <div style={{ maxWidth: 880, margin: "0 auto", paddingBottom: 60 }}>
      <div style={{ marginBottom: 14 }}>
        <Link href="/geocon/briefs" style={{ fontSize: 11, color: "var(--gx-ink-muted)", textDecoration: "none" }}>
          ← Open Briefs
        </Link>
      </div>

      <div className="gx-rise" style={{ marginBottom: 16 }}>
        <h1 style={{ fontFamily: "var(--gx-font-serif)", fontSize: 28, fontWeight: 700, color: "var(--gx-ink)", margin: 0 }}>
          🗂 Compose an Open Brief
        </h1>
        <div style={{ fontSize: 12, color: "var(--gx-ink-muted)", marginTop: 4, lineHeight: 1.6 }}>
          A research demand signal. Not a commercial transaction. Be specific
          about what you need and what success looks like — that's how the right
          people find you.
        </div>
      </div>

      <GlassCard style={{ padding: 18, marginBottom: 14 }}>
        {/* Kind */}
        <Section label="Kind">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {BRIEF_KINDS.map((k) => {
              const active = briefKind === k.key;
              return (
                <button key={k.key} onClick={() => setBriefKind(k.key)} className="gx-btn" style={{
                  padding: "6px 12px", fontSize: 11, fontWeight: 600,
                  background: active ? "var(--gx-accent-violet)" : "var(--gx-surface)",
                  color: active ? "#fff" : "var(--gx-ink-soft)",
                  border: `1px solid ${active ? "var(--gx-accent-violet)" : "var(--gx-border-soft)"}`,
                  borderRadius: 999, cursor: "pointer",
                }}>
                  {k.icon} {k.label}
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 10, color: "var(--gx-ink-muted)", marginTop: 6 }}>
            {kindMeta?.hint}
          </div>
        </Section>

        {/* Urgency */}
        <Section label="Urgency">
          <div style={{ display: "flex", gap: 6 }}>
            {URGENCY.map((u) => {
              const active = urgency === u.key;
              return (
                <button key={u.key} onClick={() => setUrgency(u.key)} className="gx-btn" style={{
                  padding: "5px 10px", fontSize: 10, fontWeight: 700,
                  background: active ? `${u.tint}22` : "transparent",
                  color: active ? u.tint : "var(--gx-ink-muted)",
                  border: `1px solid ${active ? u.tint : "var(--gx-border-soft)"}`,
                  borderRadius: 999, cursor: "pointer",
                }}>{u.label}</button>
              );
            })}
          </div>
        </Section>

        {/* Title + description */}
        <Section label="Title">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Characterize the saffron pigment profile of Crocus mathewii"
            style={input}
            maxLength={200}
          />
        </Section>
        <Section label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            placeholder="What needs doing, what success looks like, what evidence is required, what timeframe."
            style={{ ...input, fontFamily: "inherit", resize: "vertical" }}
          />
        </Section>

        {/* Subject */}
        <Section label="Subject scope">
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
            {SUBJECT_KINDS.map((s) => {
              const active = subjectKind === s;
              return (
                <button key={s} onClick={() => setSubjectKind(s)} className="gx-btn" style={{
                  padding: "4px 9px", fontSize: 10, fontWeight: 700,
                  background: active ? "var(--gx-surface-3)" : "transparent",
                  color: active ? "var(--gx-ink)" : "var(--gx-ink-muted)",
                  border: `1px solid ${active ? "var(--gx-border)" : "var(--gx-border-soft)"}`,
                  borderRadius: 6, cursor: "pointer",
                }}>{s}</button>
              );
            })}
          </div>
          <input
            value={subjectRefsText}
            onChange={(e) => setSubjectRefsText(e.target.value)}
            placeholder='Refs: species:GEO-TR-Crocus-mathewii, family:Iridaceae'
            style={{ ...input, fontFamily: "var(--gx-font-mono)", fontSize: 11 }}
          />
          <div style={{ fontSize: 10, color: "var(--gx-ink-muted)", marginTop: 4 }}>
            Comma-separated <code>kind:value</code> pairs. Optional but helps discovery.
          </div>
        </Section>

        {/* Capabilities */}
        <Section label="Required capabilities">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {CAPABILITY_VOCAB.map((c) => {
              const active = requiredCaps.includes(c);
              return (
                <button key={c} onClick={() => toggleCap(c)} className="gx-btn" style={{
                  padding: "3px 8px", fontSize: 10, fontFamily: "var(--gx-font-mono)",
                  background: active ? "var(--gx-accent-bio-green)" : "var(--gx-surface)",
                  color: active ? "#fff" : "var(--gx-ink-soft)",
                  border: `1px solid ${active ? "var(--gx-accent-bio-green)" : "var(--gx-border-soft)"}`,
                  borderRadius: 4, cursor: "pointer",
                }}>{c}</button>
              );
            })}
          </div>
        </Section>

        {/* On behalf of org */}
        {myOrgs.length > 0 && (
          <Section label="Issue on behalf of">
            <select value={issuedOnBehalfOfOrg} onChange={(e) => setIssuedOnBehalfOfOrg(e.target.value)} style={input}>
              <option value="">Personal (no org)</option>
              {myOrgs.map((o) => (
                <option key={o.id} value={o.id}>{o.short_name || o.name}</option>
              ))}
            </select>
            <div style={{ fontSize: 10, color: "var(--gx-ink-muted)", marginTop: 4 }}>
              Only orgs where you have an active admin/rep role.
            </div>
          </Section>
        )}

        {/* Expires */}
        <Section label="Expires (optional)">
          <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)}
            style={{ ...input, maxWidth: 200 }} />
        </Section>

        {err && <div style={{ marginTop: 8, fontSize: 11, color: "var(--gx-accent-rose)" }}>{err}</div>}

        <div style={{ marginTop: 14, display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={submit} disabled={saving} className="gx-btn" style={{
            padding: "10px 18px", fontSize: 13, fontWeight: 700,
            background: "var(--gx-accent-violet)", color: "#fff",
            border: "none", borderRadius: 8, cursor: "pointer",
            opacity: saving ? 0.6 : 1,
          }}>
            {saving ? "Issuing…" : "Issue brief →"}
          </button>
          <div style={{ fontSize: 10, color: "var(--gx-ink-muted)" }}>
            Status will be set to <strong>sent</strong> and discoverable on /geocon/briefs immediately.
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

function Section({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--gx-ink-muted)", marginBottom: 6 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

const input = {
  width: "100%",
  padding: "8px 11px",
  fontSize: 12,
  background: "var(--gx-surface-2)",
  color: "var(--gx-ink)",
  border: "1px solid var(--gx-border-soft)",
  borderRadius: 7,
  boxSizing: "border-box",
};

// Parse "species:GEO-..., family:Iridaceae, country:TR" into [{kind, value}].
function parseRefs(text) {
  if (!text || !text.trim()) return [];
  return text.split(",").map((p) => p.trim()).filter(Boolean).map((token) => {
    const colon = token.indexOf(":");
    if (colon < 0) return { kind: "freetext", value: token };
    return { kind: token.slice(0, colon).trim(), value: token.slice(colon + 1).trim() };
  });
}
