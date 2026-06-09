"use client";
// Commercialization Recognition panel.
// Shown on species / program / org / researcher detail pages.
//
//   - Lists outcomes the entity is linked to (program, species, contributor).
//   - Signed-in users can declare a new outcome (origin = self/org/admin).
//   - Each outcome shows kind, title, launching org, verification status.
//   - Self-declared outcomes can be peer-endorsed; 3 endorsements promote.
//
// NB: GEOCON never holds funds for these. We're a citation registry —
// the launching org runs the actual commerce off-platform.

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";
import { EmptyState } from "../shared";
import { useToast } from "../ui";

const KIND_META = {
  product:            { icon: "🧴", label: "Product",            tint: "#0F6E56" },
  patent:             { icon: "📜", label: "Patent",             tint: "#534AB7" },
  license:            { icon: "🔑", label: "License",            tint: "#185FA5" },
  clinical_trial:     { icon: "🧪", label: "Clinical trial",     tint: "#A32D2D" },
  service:            { icon: "🔬", label: "Service",            tint: "#85651A" },
  pilot_partnership:  { icon: "🤝", label: "Pilot partnership",  tint: "#BA7517" },
  other:              { icon: "✦",  label: "Other",              tint: "var(--gx-ink-muted)" },
};

const VERIF_META = {
  venn_verified:  { icon: "✓✓", label: "Venn verified",  tint: "#0F6E56" },
  org_declared:   { icon: "✓",  label: "Org declared",   tint: "#185FA5" },
  peer_endorsed:  { icon: "🤝", label: "Peer endorsed",  tint: "#534AB7" },
  self_declared:  { icon: "•",  label: "Self declared",  tint: "var(--gx-ink-muted)" },
};

export default function CommercializedOutcomes({
  speciesId, programId, contributorKind, contributorId, allowDeclare = false, title,
}) {
  const { user } = useAuthContext();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [declaring, setDeclaring] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await supabase.rpc("list_commercialized_outcomes", {
      p_species_id: speciesId || null,
      p_program_id: programId || null,
      p_contributor_kind: contributorKind || null,
      p_contributor_id: contributorId || null,
      p_limit: 50,
    });
    setRows(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [speciesId, programId, contributorKind, contributorId]);

  const hidden = !loading && rows.length === 0 && !allowDeclare;
  if (hidden) return null;

  return (
    <section style={panel}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
        <h2 style={{
          fontFamily: "var(--gx-font-serif)", fontSize: 18, fontWeight: 700,
          color: "var(--gx-ink)", margin: 0,
        }}>
          💎 {title || "Commercialization recognition"}
        </h2>
        {allowDeclare && user && (
          <button onClick={() => setDeclaring((v) => !v)} className="gx-btn"
            style={{
              fontSize: 11, fontWeight: 700, padding: "5px 12px",
              background: declaring ? "var(--gx-surface-3)" : "var(--gx-accent-violet)",
              color: declaring ? "var(--gx-ink-soft)" : "#fff",
              border: "none", borderRadius: 7, cursor: "pointer",
            }}>
            {declaring ? "Cancel" : "+ Declare outcome"}
          </button>
        )}
      </div>

      {declaring && (
        <DeclareForm
          programId={programId}
          speciesId={speciesId}
          onCreated={() => { setDeclaring(false); load(); }}
        />
      )}

      {loading ? (
        <div className="gx-skeleton" style={{ height: 60 }} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon="💎"
          title="No recognized outcomes yet"
          hint="When work from this entity reaches a commercial endpoint — product, patent, license — declare it here. GEOCON only records the citation; actual commerce lives in the launching organization."
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {rows.map((o) => <OutcomeRow key={o.id} outcome={o} onChange={load} />)}
        </div>
      )}

      <div style={{ marginTop: 12, fontSize: 10, color: "var(--gx-ink-muted)", fontStyle: "italic", lineHeight: 1.5 }}>
        GEOCON does not hold funds, file patents, or sell products. This panel is a
        citation registry — actual commerce is operated by the launching organization
        under its own legal structure.
      </div>
    </section>
  );
}

function OutcomeRow({ outcome, onChange }) {
  const { user, profile } = useAuthContext();
  const toast = useToast();
  const kind = KIND_META[outcome.outcome_kind] || KIND_META.other;
  const verif = VERIF_META[outcome.verification] || VERIF_META.self_declared;
  const [expanded, setExpanded] = useState(false);
  const [credits, setCredits] = useState(null);
  const [loadingCredits, setLoadingCredits] = useState(false);
  const [openingDoor, setOpeningDoor] = useState(false);

  // Bahçe Phase 0 — the door. Only admins, only on venn_verified
  // outcomes. Opens (or re-opens) a bridge opportunity and routes to
  // the internal ventures workspace. Invisible to everyone else.
  const isAdmin = profile?.role === "admin";
  const doorEligible = isAdmin && outcome.verification === "venn_verified";

  async function openDoor() {
    setOpeningDoor(true);
    try {
      const { data, error } = await supabase.rpc("open_bridge_opportunity", { p_outcome_id: outcome.id });
      if (error) throw error;
      window.location.href = `/exchange/desk/${data}`;
    } catch (e) {
      toast.error("Kapı açılamadı", { detail: e?.message || String(e) });
      setOpeningDoor(false);
    }
  }

  async function loadCredits() {
    setLoadingCredits(true);
    try {
      const { data, error } = await supabase.rpc("list_outcome_credits", { p_outcome_id: outcome.id });
      if (error) throw error;
      setCredits(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error("Credits yüklenemedi", { detail: e?.message || String(e) });
    } finally {
      setLoadingCredits(false);
    }
  }

  async function endorse(creditId) {
    try {
      const { data, error } = await supabase.rpc("endorse_commercialization_credit", { p_credit_id: creditId });
      if (error) throw error;
      if (data?.already_endorsed) {
        toast.info("Zaten endorse ettin");
      } else if (data?.promoted) {
        toast.success("Bu credit Peer endorsed seviyesine yükseldi!", { detail: `${data.endorsements} endorsement` });
      } else {
        toast.success("Endorsement kaydedildi", { detail: `${data?.endorsements || ""} total` });
      }
      await loadCredits();
      onChange?.();
    } catch (e) {
      toast.error("Endorse başarısız", { detail: e?.message || String(e) });
    }
  }

  function toggleExpand() {
    const next = !expanded;
    setExpanded(next);
    if (next && credits === null) loadCredits();
  }

  return (
    <div style={{
      padding: 12,
      background: "var(--gx-surface-2)",
      border: "1px solid var(--gx-border-soft)",
      borderLeft: `3px solid ${kind.tint}`,
      borderRadius: 10,
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase",
          padding: "2px 7px", borderRadius: 999,
          background: `${kind.tint}1a`, color: kind.tint,
        }}>
          {kind.icon} {kind.label}
        </span>
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase",
          padding: "2px 7px", borderRadius: 999,
          background: `${verif.tint}1a`, color: verif.tint,
        }}>
          {verif.icon} {verif.label}
        </span>
        {outcome.launched_on && (
          <span style={{ fontSize: 10, color: "var(--gx-ink-muted)" }}>
            {new Date(outcome.launched_on).toLocaleDateString()}
          </span>
        )}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gx-ink)", lineHeight: 1.35 }}>
        {outcome.title}
      </div>
      {outcome.description_md && (
        <div style={{
          fontSize: 11, color: "var(--gx-ink-soft)", marginTop: 4, lineHeight: 1.5,
          whiteSpace: "pre-wrap",
          display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {outcome.description_md}
        </div>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
        {outcome.external_url && (
          <a href={outcome.external_url} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 11, color: "var(--gx-accent-azure)", textDecoration: "none", fontWeight: 600 }}>
            🔗 External
          </a>
        )}
        {outcome.launched_by_org && (
          <Link href={`/geocon/organizations/${outcome.launched_by_org}`}
            style={{ fontSize: 11, color: "var(--gx-ink-soft)", textDecoration: "none" }}>
            launching org →
          </Link>
        )}
        <button
          onClick={toggleExpand}
          className="gx-btn"
          style={{
            fontSize: 10, fontWeight: 700,
            background: "transparent", border: "none",
            color: "var(--gx-ink-muted)", cursor: "pointer", padding: 0,
            display: "inline-flex", alignItems: "center", gap: 4,
          }}
          aria-expanded={expanded}
        >
          {expanded ? "▾" : "▸"} {outcome.credits_count || 0} contributor{outcome.credits_count === 1 ? "" : "s"}
        </button>

        {/* Bahçe — the door (admin-only, venn_verified-only) */}
        {doorEligible && (
          <button
            onClick={openDoor}
            disabled={openingDoor}
            title="Internal: open a commercialization-pathway workspace for this verified outcome"
            style={{
              marginLeft: "auto",
              fontSize: 10, fontWeight: 700, letterSpacing: 0.3,
              padding: "5px 11px", borderRadius: 999,
              background: "linear-gradient(135deg, #0F6E56, #1D9E75)",
              color: "#fff", border: "none", cursor: "pointer",
              opacity: openingDoor ? 0.6 : 1,
              display: "inline-flex", alignItems: "center", gap: 5,
            }}
          >
            🌱 {openingDoor ? "Açılıyor…" : "Ticari yol haritası →"}
          </button>
        )}
      </div>

      {expanded && (
        <div style={{
          marginTop: 10, paddingTop: 10,
          borderTop: "1px solid var(--gx-border-soft)",
        }}>
          {loadingCredits ? (
            <div className="gx-skeleton" style={{ height: 48 }} />
          ) : !credits || credits.length === 0 ? (
            <div style={{ fontSize: 11, color: "var(--gx-ink-muted)", fontStyle: "italic", padding: "6px 0" }}>
              No contributor credits recorded yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {credits.map((c) => (
                <CreditRow
                  key={c.id}
                  credit={c}
                  canEndorse={!!user}
                  onEndorse={() => endorse(c.id)}
                />
              ))}
              <div style={{
                fontSize: 10, color: "var(--gx-ink-muted)",
                fontStyle: "italic", marginTop: 4, lineHeight: 1.5,
              }}>
                3 endorsement'a ulaşan self-declared credit'ler otomatik olarak
                <strong style={{ color: "var(--gx-accent-violet)" }}> Peer endorsed</strong> seviyesine yükselir.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CreditRow({ credit, canEndorse, onEndorse }) {
  const isPeer = credit.endorsements >= 3;
  const href = credit.contributor_kind === "organization"
    ? `/geocon/organizations/${credit.contributor_id}`
    : `/geocon/researchers/${credit.contributor_id}`;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "8px 10px",
      background: "var(--gx-surface)",
      border: "1px solid var(--gx-border-soft)",
      borderRadius: 8,
    }}>
      <span style={{ fontSize: 14, flexShrink: 0 }}>
        {credit.contributor_kind === "organization" ? "🏛" : "👤"}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Link href={href} style={{
          fontSize: 12, fontWeight: 700, color: "var(--gx-ink)",
          textDecoration: "none",
        }}>
          {credit.display_name}
        </Link>
        {credit.display_subtitle && (
          <div style={{ fontSize: 10, color: "var(--gx-ink-muted)" }}>
            {credit.display_subtitle}
          </div>
        )}
        {credit.contribution_note && (
          <div style={{ fontSize: 10, color: "var(--gx-ink-soft)", marginTop: 2, fontStyle: "italic" }}>
            “{credit.contribution_note}”
          </div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <span
          title={`${credit.endorsements} of 3 needed to promote to Peer endorsed`}
          style={{
            fontSize: 10, fontWeight: 700,
            padding: "3px 8px", borderRadius: 999,
            background: isPeer ? "var(--gx-success-soft)" : "var(--gx-surface-3)",
            color: isPeer ? "var(--gx-success)" : "var(--gx-ink-muted)",
            fontFamily: "var(--gx-font-mono)",
          }}>
          {credit.endorsements}/3
        </span>
        {canEndorse && (
          <button
            onClick={onEndorse}
            disabled={credit.i_endorsed}
            className="gx-btn"
            title={credit.i_endorsed ? "Already endorsed" : "Endorse this credit"}
            style={{
              fontSize: 10, fontWeight: 700, letterSpacing: 0.4,
              padding: "5px 10px", borderRadius: 6,
              background: credit.i_endorsed ? "var(--gx-success-soft)" : "var(--gx-accent-violet)",
              color: credit.i_endorsed ? "var(--gx-success)" : "#fff",
              border: "none",
              cursor: credit.i_endorsed ? "default" : "pointer",
              opacity: credit.i_endorsed ? 0.7 : 1,
            }}
          >
            {credit.i_endorsed ? "✓ Endorsed" : "Endorse"}
          </button>
        )}
      </div>
    </div>
  );
}

function DeclareForm({ programId, speciesId, onCreated }) {
  const [kind, setKind] = useState("product");
  const [titleField, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [url, setUrl] = useState("");
  const [orgId, setOrgId] = useState("");
  const [launchedOn, setLaunchedOn] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  async function submit() {
    if (!titleField.trim()) return;
    setSaving(true); setErr(null);
    try {
      const { error } = await supabase.rpc("declare_commercialized_outcome", {
        p_program_id: programId || null,
        p_species_id: speciesId || null,
        p_outcome_kind: kind,
        p_title: titleField.trim(),
        p_description: desc || null,
        p_external_url: url || null,
        p_launched_by_org: orgId || null,
        p_launched_on: launchedOn || null,
        p_initial_credits: [],
      });
      if (error) throw error;
      onCreated?.();
    } catch (e) {
      setErr(e?.message || "Could not declare");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{
      padding: 12, marginBottom: 12,
      background: "var(--gx-surface-2)", border: "1px solid var(--gx-border-soft)",
      borderRadius: 10,
    }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <select value={kind} onChange={(e) => setKind(e.target.value)} style={field}>
          {Object.entries(KIND_META).map(([k, m]) => (
            <option key={k} value={k}>{m.icon} {m.label}</option>
          ))}
        </select>
        <input value={titleField} onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (required)" style={field} />
      </div>
      <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2}
        placeholder="Short description"
        style={{ ...field, width: "100%", marginTop: 6, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 8, marginTop: 6 }}>
        <input value={url} onChange={(e) => setUrl(e.target.value)}
          placeholder="External URL (product page, patent, DOI…)" style={{ ...field, fontFamily: "var(--gx-font-mono)", fontSize: 11 }} />
        <input value={orgId} onChange={(e) => setOrgId(e.target.value)}
          placeholder="Launching org UUID" style={{ ...field, fontFamily: "var(--gx-font-mono)", fontSize: 10 }} />
        <input type="date" value={launchedOn} onChange={(e) => setLaunchedOn(e.target.value)}
          style={field} />
      </div>
      {err && <div style={{ marginTop: 6, fontSize: 11, color: "var(--gx-accent-rose)" }}>{err}</div>}
      <div style={{ marginTop: 8 }}>
        <button onClick={submit} disabled={saving || !titleField.trim()} className="gx-btn"
          style={{
            padding: "6px 14px", fontSize: 11, fontWeight: 700,
            background: "var(--gx-accent-violet)", color: "#fff",
            border: "none", borderRadius: 7, cursor: "pointer",
            opacity: (saving || !titleField.trim()) ? 0.55 : 1,
          }}>
          {saving ? "Declaring…" : "Declare"}
        </button>
      </div>
    </div>
  );
}

const panel = {
  marginTop: 18, padding: 16,
  background: "var(--gx-surface)",
  border: "1px solid var(--gx-border)",
  borderRadius: "var(--gx-radius-4)",
};
const field = {
  padding: "7px 10px",
  fontSize: 12,
  background: "var(--gx-surface)",
  color: "var(--gx-ink)",
  border: "1px solid var(--gx-border-soft)",
  borderRadius: 7,
};
