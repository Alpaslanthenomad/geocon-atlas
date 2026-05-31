"use client";
// R&D capability editor for accredited / aspiring R&D-lab organizations.
// Org admins + reps can edit lab_country + rd_specializations.
// Public viewers see the same data as a read-only badge strip.

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";

// Shared capability vocabulary — should stay in sync with
// docs/architecture/04-open-briefs.md + 07-accredited-labs.md.
const CAPABILITY_VOCAB = [
  { key: "tissue_culture",         label: "Tissue culture",         tint: "#0F6E56" },
  { key: "cell_culture",           label: "Cell culture",           tint: "#1D9E75" },
  { key: "supercritical_extraction", label: "Supercritical extraction", tint: "#534AB7" },
  { key: "solvent_extraction",     label: "Solvent extraction",     tint: "#5F4FB6" },
  { key: "hplc",                   label: "HPLC",                   tint: "#185FA5" },
  { key: "gc_ms",                  label: "GC-MS",                  tint: "#1B6FB5" },
  { key: "nmr",                    label: "NMR",                    tint: "#0E5C9E" },
  { key: "pilot_production",       label: "Pilot production",       tint: "#BA7517" },
  { key: "clinical_research",      label: "Clinical research",      tint: "#A32D2D" },
  { key: "formulation",            label: "Formulation",            tint: "#D85A30" },
  { key: "propagation",            label: "Propagation",            tint: "#1D9E75" },
  { key: "field_survey",           label: "Field survey",           tint: "#85651A" },
  { key: "taxonomy_revision",      label: "Taxonomy revision",      tint: "#5F5E5A" },
  { key: "herbarium_archival",     label: "Herbarium archival",     tint: "#7A5C20" },
  { key: "iucn_assessment",        label: "IUCN assessment",        tint: "#A32D2D" },
  { key: "seed_storage",           label: "Seed storage",           tint: "#0F6E56" },
  { key: "cryopreservation",       label: "Cryopreservation",       tint: "#185FA5" },
  { key: "patent_drafting",        label: "Patent drafting",        tint: "#5F5E5A" },
  { key: "translation_botanical",  label: "Translation (botanical)",tint: "#534AB7" },
];

const VOCAB_LOOKUP = Object.fromEntries(CAPABILITY_VOCAB.map((c) => [c.key, c]));

export default function OrgCapabilitiesPanel({ org, onSaved }) {
  const { user, profile } = useAuthContext();
  const [editing, setEditing] = useState(false);
  const [canEdit, setCanEdit] = useState(false);

  const [country, setCountry] = useState(org?.lab_country || "");
  const [specs, setSpecs] = useState(
    Array.isArray(org?.rd_specializations) ? org.rd_specializations : []
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  // Determine edit permission once we have user context.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user || !org?.id) { setCanEdit(false); return; }
      if (profile?.role === "admin") { setCanEdit(true); return; }
      const { data } = await supabase
        .from("org_memberships")
        .select("role, status")
        .eq("organization_id", org.id)
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();
      if (cancelled) return;
      setCanEdit(!!data && (data.role === "admin" || data.role === "rep"));
    })();
    return () => { cancelled = true; };
  }, [user, profile, org?.id]);

  // Reset local state when the org row changes from the parent.
  useEffect(() => {
    setCountry(org?.lab_country || "");
    setSpecs(Array.isArray(org?.rd_specializations) ? org.rd_specializations : []);
  }, [org?.lab_country, org?.rd_specializations]);

  const sorted = useMemo(() => {
    return [...CAPABILITY_VOCAB].sort((a, b) => {
      const aActive = specs.includes(a.key) ? 1 : 0;
      const bActive = specs.includes(b.key) ? 1 : 0;
      if (aActive !== bActive) return bActive - aActive;
      return a.label.localeCompare(b.label);
    });
  }, [specs]);

  function toggle(key) {
    setSpecs((arr) => arr.includes(key) ? arr.filter((x) => x !== key) : [...arr, key]);
  }

  async function save() {
    setSaving(true); setErr(null);
    try {
      const { error } = await supabase.rpc("update_org_capabilities", {
        p_org_id: org.id,
        p_lab_country: country || null,
        p_rd_specializations: specs,
      });
      if (error) throw error;
      setEditing(false);
      onSaved?.();
    } catch (e) {
      setErr(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  // Read-only mode: nothing declared and user can't edit → hide panel.
  const hasContent = !!org?.lab_country || (Array.isArray(org?.rd_specializations) && org.rd_specializations.length > 0);
  if (!hasContent && !canEdit) return null;

  return (
    <section style={panel}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
        <h2 style={{ fontFamily: "var(--gx-font-serif)", fontSize: 18, fontWeight: 700, color: "var(--gx-ink)", margin: 0 }}>
          🛠 R&D capabilities
        </h2>
        {canEdit && !editing && (
          <button onClick={() => setEditing(true)} className="gx-btn" style={editBtn}>
            {hasContent ? "Edit" : "Declare capabilities"}
          </button>
        )}
        {editing && (
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => { setEditing(false); setCountry(org?.lab_country || ""); setSpecs(Array.isArray(org?.rd_specializations) ? org.rd_specializations : []); }} className="gx-btn" style={cancelBtn}>
              Cancel
            </button>
            <button onClick={save} disabled={saving} className="gx-btn" style={saveBtn}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        )}
      </div>

      {/* Country */}
      {editing ? (
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Operating country (ISO-2)</label>
          <input
            value={country}
            onChange={(e) => setCountry(e.target.value.toUpperCase().slice(0, 2))}
            placeholder="TR, IR, ZA, DE, US, …"
            maxLength={2}
            style={{
              ...inputStyle,
              fontFamily: "var(--gx-font-mono)", letterSpacing: 1.5,
              width: 80, textAlign: "center",
            }}
          />
        </div>
      ) : org?.lab_country ? (
        <div style={{ marginBottom: 10, fontSize: 12, color: "var(--gx-ink-muted)" }}>
          Operating country: <strong style={{ color: "var(--gx-ink)", fontFamily: "var(--gx-font-mono)", letterSpacing: 1 }}>{org.lab_country}</strong>
        </div>
      ) : null}

      {/* Capabilities */}
      <div>
        <label style={labelStyle}>Capabilities {editing ? "(toggle)" : ""}</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 4 }}>
          {(editing ? sorted : sorted.filter((c) => specs.includes(c.key))).map((c) => {
            const active = specs.includes(c.key);
            return editing ? (
              <button
                key={c.key}
                onClick={() => toggle(c.key)}
                className="gx-btn"
                style={{
                  padding: "4px 9px", fontSize: 10, fontWeight: 700,
                  background: active ? `${c.tint}20` : "var(--gx-surface)",
                  color: active ? c.tint : "var(--gx-ink-soft)",
                  border: `1px solid ${active ? c.tint : "var(--gx-border-soft)"}`,
                  borderRadius: 999, cursor: "pointer",
                }}
              >
                {active ? "✓ " : ""}{c.label}
              </button>
            ) : (
              <span key={c.key} style={{
                padding: "3px 9px", fontSize: 10, fontWeight: 700,
                background: `${c.tint}1a`, color: c.tint,
                border: `1px solid ${c.tint}45`,
                borderRadius: 999,
              }}>
                {c.label}
              </span>
            );
          })}
          {!editing && specs.length === 0 && (
            <span style={{ fontSize: 11, color: "var(--gx-ink-muted)", fontStyle: "italic" }}>
              No capabilities declared yet.
            </span>
          )}
        </div>
      </div>

      {err && <div style={{ marginTop: 8, fontSize: 11, color: "var(--gx-accent-rose)" }}>{err}</div>}

      <div style={{ marginTop: 12, fontSize: 10, color: "var(--gx-ink-muted)", fontStyle: "italic", lineHeight: 1.5 }}>
        These capabilities surface this organization in capability-brief discovery
        and are matched against required_capabilities on Open Briefs.
      </div>
    </section>
  );
}

const panel = {
  marginTop: 14, padding: 16,
  background: "var(--gx-surface)",
  border: "1px solid var(--gx-border)",
  borderRadius: "var(--gx-radius-4)",
};
const labelStyle = {
  fontSize: 9, fontWeight: 700, letterSpacing: 1.5,
  textTransform: "uppercase", color: "var(--gx-ink-muted)",
  display: "block", marginBottom: 4,
};
const inputStyle = {
  padding: "6px 10px", fontSize: 12,
  background: "var(--gx-surface-2)", color: "var(--gx-ink)",
  border: "1px solid var(--gx-border-soft)", borderRadius: 7,
};
const editBtn = {
  padding: "5px 11px", fontSize: 11, fontWeight: 700,
  background: "var(--gx-surface)", color: "var(--gx-ink-soft)",
  border: "1px solid var(--gx-border-soft)", borderRadius: 7, cursor: "pointer",
};
const cancelBtn = {
  padding: "5px 11px", fontSize: 11, fontWeight: 700,
  background: "transparent", color: "var(--gx-ink-muted)",
  border: "1px solid var(--gx-border-soft)", borderRadius: 7, cursor: "pointer",
};
const saveBtn = {
  padding: "5px 12px", fontSize: 11, fontWeight: 700,
  background: "var(--gx-accent-bio-green)", color: "#fff",
  border: "none", borderRadius: 7, cursor: "pointer",
};
