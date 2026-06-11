"use client";
// Bioactivity bench v1 — the VALUE gear (Z). A money-blind, tier-labelled commercial
// POTENTIAL (never a product, no price). INTERNAL: visible only to its author (+ admins),
// never public, until the Exchange is a real path. Manual + literature-cited; no auto-fan.

import { useEffect, useState } from "react";
import { Lightbulb, Plus, X, Lock } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";
import { useToast } from "../ui";

const DOMAINS = [
  ["pharma", "İlaç adayı"], ["cosmetic", "Kozmetik"], ["ornamental", "Süs bitkisi"],
  ["fragrance", "Esans / aroma"], ["agrochemical", "Agrokimya"], ["food", "Gıda / nutrasötik"],
  ["material", "Materyal / lif"], ["other", "Diğer"],
];
const DOMAIN_LABEL = Object.fromEntries(DOMAINS);
const TIERS = [
  ["literature_molecule", "Molekül literatürde · bu tür test edilmemiş"],
  ["species_extract", "Bu türün ekstraktı tarandı"],
  ["accession_assay", "Bu aksesyon assay'lendi"],
];
const TIER_LABEL = Object.fromEntries(TIERS);
const EMPTY = { value_domain: "pharma", activity_label: "", compound: "", evidence_tier: "literature_molecule", source_ref: "" };

export default function SpeciesBioactivity({ speciesId }) {
  const { user } = useAuthContext();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);

  function load() {
    if (!speciesId || !user) return;
    supabase.rpc("list_bioactivity_potentials_for_species", { p_species_id: speciesId })
      .then(({ data }) => setRows(Array.isArray(data) ? data : []))
      .catch(() => {});
  }
  useEffect(load, [speciesId, user]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) return null; // internal — nothing for the public

  async function save() {
    if (!form.activity_label.trim()) { toast.error("Aktivite gerekli"); return; }
    setSaving(true);
    try {
      const { error } = await supabase.rpc("save_bioactivity_potential", {
        p_species_id: speciesId,
        p_value_domain: form.value_domain,
        p_activity_label: form.activity_label,
        p_compound: form.compound || null,
        p_evidence_tier: form.evidence_tier,
        p_source_ref: form.source_ref || null,
        p_notes: null,
      });
      if (error) throw error;
      toast.success("Potansiyel eklendi (içeride)");
      setForm(EMPTY); setAdding(false); load();
    } catch (e) { toast.error("Eklenemedi", { detail: e?.message }); } finally { setSaving(false); }
  }

  async function remove(id) {
    try {
      const { error } = await supabase.rpc("delete_bioactivity_potential", { p_id: id });
      if (error) throw error;
      load();
    } catch (e) { toast.error("Silinemedi", { detail: e?.message }); }
  }

  const fieldStyle = { padding: "7px 9px", fontSize: 12, background: "var(--gx-surface-1)", border: "1px solid var(--gx-border-soft)", borderRadius: 7, color: "var(--gx-ink)" };

  return (
    <section style={{ background: "var(--gx-card-bg)", border: "1px solid var(--gx-card-border)", borderRadius: 12, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
        <Lightbulb size={15} strokeWidth={2.1} style={{ color: "var(--gx-coral, #D85A30)" }} />
        <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--gx-ink)" }}>Değer potansiyelleri (Z)</h2>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 3, marginLeft: "auto", fontSize: 9, fontWeight: 700,
                       letterSpacing: 0.3, padding: "2px 7px", borderRadius: 999, background: "var(--gx-surface-3)", color: "var(--gx-ink-soft)" }}>
          <Lock size={9} strokeWidth={2.3} /> İÇERİDE
        </span>
      </div>
      <p style={{ margin: "0 0 10px", fontSize: 10.5, color: "var(--gx-ink-faint)", lineHeight: 1.6 }}>
        Money-blind potansiyel — ürün değil, fiyat yok. Yalnız sana görünür; kamuya kapalı.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {rows.map((b) => (
          <div key={b.id} style={{ display: "flex", flexDirection: "column", gap: 3, padding: "8px 10px",
                                   background: "var(--gx-surface-2)", border: "1px solid var(--gx-border-soft)", borderRadius: 7 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 999, background: "#FAECE7", color: "#993C1D" }}>{DOMAIN_LABEL[b.value_domain] || b.value_domain}</span>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--gx-ink)" }}>{b.activity_label}</span>
              {b.compound && <span style={{ fontSize: 11, color: "var(--gx-ink-muted)", fontStyle: "italic" }}>{b.compound}</span>}
              <button onClick={() => remove(b.id)} aria-label="Sil"
                style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--gx-ink-faint)", padding: 2 }}>
                <X size={13} strokeWidth={2} />
              </button>
            </div>
            <span style={{ fontSize: 10, color: "var(--gx-ink-faint)" }}>{TIER_LABEL[b.evidence_tier] || b.evidence_tier}</span>
          </div>
        ))}
        {rows.length === 0 && <div style={{ fontSize: 11, color: "var(--gx-ink-muted)", padding: "4px 2px" }}>Henüz değer-potansiyeli kaydın yok.</div>}
      </div>

      {adding ? (
        <div style={{ marginTop: 10, padding: 12, background: "var(--gx-surface-1)", border: "1px solid var(--gx-border-soft)", borderRadius: 9, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <select style={{ ...fieldStyle, minWidth: 130 }} value={form.value_domain} onChange={(e) => setForm({ ...form, value_domain: e.target.value })}>
              {DOMAINS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select style={{ ...fieldStyle, flex: 1, minWidth: 180 }} value={form.evidence_tier} onChange={(e) => setForm({ ...form, evidence_tier: e.target.value })}>
              {TIERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <input style={fieldStyle} placeholder="Aktivite (örn. AChE inhibisyonu)" value={form.activity_label} onChange={(e) => setForm({ ...form, activity_label: e.target.value })} />
          <input style={fieldStyle} placeholder="Molekül (örn. galantamine) — opsiyonel" value={form.compound} onChange={(e) => setForm({ ...form, compound: e.target.value })} />
          <input style={fieldStyle} placeholder="Kaynak (DOI / atıf)" value={form.source_ref} onChange={(e) => setForm({ ...form, source_ref: e.target.value })} />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={save} disabled={saving}
              style={{ padding: "7px 12px", fontSize: 12, fontWeight: 600, background: "#D85A30", color: "#fff", border: "none", borderRadius: 7, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
              {saving ? "Kaydediliyor…" : "Kaydet (içeride)"}
            </button>
            <button onClick={() => { setAdding(false); setForm(EMPTY); }} style={{ padding: "7px 12px", fontSize: 12, background: "var(--gx-surface-2)", color: "var(--gx-ink-soft)", border: "1px solid var(--gx-border-soft)", borderRadius: 7, cursor: "pointer" }}>İptal</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 11px", fontSize: 12, fontWeight: 600,
                   background: "var(--gx-surface-2)", color: "#993C1D", border: "1px solid var(--gx-border-soft)", borderRadius: 7, cursor: "pointer" }}>
          <Plus size={13} strokeWidth={2.2} /> Değer-potansiyeli ekle
        </button>
      )}
    </section>
  );
}
