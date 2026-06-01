"use client";
// L1 Commons — "Suggest correction" inline panel for species detail.
//
// Mounts inside SpeciesDetailRoute. Signed-in users can flag a field
// they think is wrong (IUCN status, authority, family, country list,
// etc.) and propose a replacement value plus a rationale + source URL.
// Submissions land in species_edit_proposals; admins review.
//
// Anonymous viewers see a one-line "Sign in to suggest" hint instead
// of the form, so the affordance is visible but the friction stays
// behind the auth gate.

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";
import { useToast } from "../ui";

const EDITABLE_FIELDS = [
  { key: "iucn_status",             label: "IUCN status"           },
  { key: "accepted_name_authority", label: "Authority"             },
  { key: "family",                  label: "Family"                },
  { key: "genus",                   label: "Genus"                 },
  { key: "geophyte_type",           label: "Geophyte type"         },
  { key: "endemic",                 label: "Endemic flag"          },
  { key: "discovery_year",          label: "Discovery year"        },
  { key: "population_trend",        label: "Population trend"      },
  { key: "native_countries",        label: "Native countries"      },
  { key: "introduced_countries",    label: "Introduced countries"  },
  { key: "other",                   label: "Other (specify in note)" },
];

export default function SpeciesEditProposal({ species }) {
  const { user } = useAuthContext();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [field, setField] = useState(EDITABLE_FIELDS[0].key);
  const [proposedValue, setProposedValue] = useState("");
  const [rationale, setRationale] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [saving, setSaving] = useState(false);

  // Pending-count badge — visible to everyone (commons-transparency).
  useEffect(() => {
    if (!species?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.rpc("count_species_pending_proposals", { p_species_id: species.id });
        if (!cancelled && typeof data === "number") setPendingCount(data);
      } catch { /* silent */ }
    })().catch(() => {});
    return () => { cancelled = true; };
  }, [species?.id]);

  const currentValue = species?.[field];
  const fieldLabel = EDITABLE_FIELDS.find((f) => f.key === field)?.label || field;

  async function submit() {
    if (!proposedValue.trim()) {
      toast.warning("Önerilen değer gerekli");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.rpc("submit_species_edit_proposal", {
        p_species_id: species.id,
        p_field: field,
        p_proposed_value: proposedValue.trim(),
        p_current_value: currentValue == null ? null : String(currentValue),
        p_rationale: rationale || null,
        p_source_url: sourceUrl || null,
      });
      if (error) throw error;
      toast.success("Öneri kaydedildi", { detail: `${fieldLabel} alanı için inceleme bekliyor` });
      setOpen(false);
      setProposedValue("");
      setRationale("");
      setSourceUrl("");
      setPendingCount((n) => n + 1);
    } catch (e) {
      toast.error("Gönderilemedi", { detail: e?.message || String(e) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section style={{
      marginTop: 14, padding: 14,
      background: "var(--gx-surface)",
      border: "1px dashed var(--gx-border)",
      borderRadius: 10,
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
        gap: 8, flexWrap: "wrap",
      }}>
        <div>
          <div className="gx-overline" style={{ marginBottom: 2 }}>Commons</div>
          <h3 style={{
            fontFamily: "var(--gx-font-serif)", fontSize: 14, fontWeight: 700,
            color: "var(--gx-ink)", margin: 0,
          }}>
            ✎ Suggest a correction
            {pendingCount > 0 && (
              <span style={{
                marginLeft: 8,
                fontSize: 10, fontWeight: 700, letterSpacing: 0.4,
                padding: "2px 7px", borderRadius: 999,
                background: "var(--gx-warning-soft)", color: "var(--gx-warning)",
                fontFamily: "var(--gx-font-mono)",
              }}>
                {pendingCount} pending
              </span>
            )}
          </h3>
        </div>
        {!open && (
          user ? (
            <button onClick={() => setOpen(true)} className="gx-btn"
              style={{
                fontSize: 11, fontWeight: 700, padding: "6px 12px",
                background: "var(--gx-accent-violet)", color: "#fff",
                border: "none", borderRadius: 7, cursor: "pointer",
              }}>
              + New suggestion
            </button>
          ) : (
            <span style={{ fontSize: 11, color: "var(--gx-ink-muted)" }}>
              Sign in to suggest →
            </span>
          )
        )}
      </div>

      {open && user && (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          <div>
            <label className="gx-label">Field</label>
            <select
              value={field}
              onChange={(e) => setField(e.target.value)}
              className="gx-select"
            >
              {EDITABLE_FIELDS.map((f) => (
                <option key={f.key} value={f.key}>{f.label}</option>
              ))}
            </select>
            {currentValue != null && (
              <div style={{ fontSize: 10, color: "var(--gx-ink-muted)", marginTop: 4 }}>
                Current: <code style={{
                  fontFamily: "var(--gx-font-mono)", fontSize: 11,
                  color: "var(--gx-ink-soft)",
                  background: "var(--gx-surface-3)", padding: "1px 5px", borderRadius: 4,
                }}>
                  {typeof currentValue === "object" ? JSON.stringify(currentValue) : String(currentValue)}
                </code>
              </div>
            )}
          </div>

          <div>
            <label className="gx-label">Proposed value</label>
            <input
              value={proposedValue}
              onChange={(e) => setProposedValue(e.target.value)}
              placeholder={field === "iucn_status" ? "e.g. VU" : "what it should be"}
              className="gx-input"
            />
          </div>

          <div>
            <label className="gx-label">Rationale (optional)</label>
            <textarea
              rows={2}
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="Why this change — context for the reviewer"
              className="gx-textarea"
            />
          </div>

          <div>
            <label className="gx-label">Source URL (optional)</label>
            <input
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="Paper DOI / IUCN page / POWO link"
              className="gx-input"
              style={{ fontFamily: "var(--gx-font-mono)", fontSize: 11 }}
            />
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button
              onClick={submit}
              disabled={saving || !proposedValue.trim()}
              className="gx-btn"
              style={{
                fontSize: 11, fontWeight: 700, padding: "7px 14px",
                background: "var(--gx-accent-violet)", color: "#fff",
                border: "none", borderRadius: 7, cursor: "pointer",
                opacity: (saving || !proposedValue.trim()) ? 0.55 : 1,
              }}
            >
              {saving ? "Sending…" : "Submit"}
            </button>
            <button
              onClick={() => { setOpen(false); setProposedValue(""); setRationale(""); setSourceUrl(""); }}
              className="gx-btn"
              style={{
                fontSize: 11, fontWeight: 600, padding: "7px 14px",
                background: "transparent", color: "var(--gx-ink-muted)",
                border: "1px solid var(--gx-border-soft)", borderRadius: 7, cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
          <div style={{ fontSize: 10, color: "var(--gx-ink-muted)", fontStyle: "italic", lineHeight: 1.5, marginTop: 4 }}>
            Önerilerin admin tarafından incelenir. Onaylanırsa species kaydına geçer ve değişiklik log'u tutulur.
            GEOCON commons şeffaftır: tüm öneriler ve durumları herkese açıktır.
          </div>
        </div>
      )}
    </section>
  );
}
