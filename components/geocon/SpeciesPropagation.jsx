"use client";
// Propagation bench v1 — germination / in-vitro / storage-behaviour trials on the
// species gearbox. A trial records method + treatment + a success rate (n_succeeded /
// n_started) + seed-storage behaviour. The raw material for the X-axis propagation gear.

import { useEffect, useState } from "react";
import { Sprout, Plus, X } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";
import { useToast } from "../ui";

const METHODS = [
  ["seed_germination", "Tohum çimlenmesi"],
  ["in_vitro", "In-vitro"],
  ["cutting", "Çelik"],
  ["division", "Bölme"],
  ["storage_behaviour", "Tohum saklama davranışı"],
  ["other", "Diğer"],
];
const METHOD_LABEL = Object.fromEntries(METHODS);
const STORAGE = [["", "—"], ["orthodox", "Ortodoks"], ["recalcitrant", "Rekalsitrant"], ["intermediate", "Ara"]];
const STORAGE_LABEL = Object.fromEntries(STORAGE);

const EMPTY = { method: "seed_germination", treatment: "", n_started: "", n_succeeded: "", seed_storage_behaviour: "", started_on: "", source_ref: "" };

export default function SpeciesPropagation({ speciesId }) {
  const { user } = useAuthContext();
  const toast = useToast();
  const [trials, setTrials] = useState([]);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);

  function load() {
    if (!speciesId) return;
    supabase.rpc("list_propagation_trials", { p_species_id: speciesId })
      .then(({ data }) => setTrials(Array.isArray(data) ? data : []))
      .catch(() => {});
  }
  useEffect(load, [speciesId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function save() {
    setSaving(true);
    try {
      const { error } = await supabase.rpc("save_propagation_trial", {
        p_species_id: speciesId,
        p_method: form.method,
        p_treatment: form.treatment || null,
        p_n_started: form.n_started === "" ? null : parseInt(form.n_started, 10),
        p_n_succeeded: form.n_succeeded === "" ? null : parseInt(form.n_succeeded, 10),
        p_seed_storage_behaviour: form.seed_storage_behaviour || null,
        p_started_on: form.started_on || null,
        p_ended_on: null,
        p_notes: null,
        p_source_ref: form.source_ref || null,
      });
      if (error) throw error;
      toast.success("Deneme eklendi");
      setForm(EMPTY); setAdding(false); load();
    } catch (e) {
      toast.error("Eklenemedi", { detail: e?.message });
    } finally { setSaving(false); }
  }

  async function remove(id) {
    try {
      const { error } = await supabase.rpc("delete_propagation_trial", { p_id: id });
      if (error) throw error;
      load();
    } catch (e) { toast.error("Silinemedi", { detail: e?.message }); }
  }

  const fieldStyle = { padding: "7px 9px", fontSize: 12, background: "var(--gx-surface-1)", border: "1px solid var(--gx-border-soft)", borderRadius: 7, color: "var(--gx-ink)" };

  return (
    <section style={{ background: "var(--gx-card-bg)", border: "1px solid var(--gx-card-border)", borderRadius: 12, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
        <Sprout size={15} strokeWidth={2.1} style={{ color: "var(--gx-success)" }} />
        <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--gx-ink)" }}>Propagation trials</h2>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {trials.map((t) => (
          <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px",
                                   background: "var(--gx-surface-2)", border: "1px solid var(--gx-border-soft)", borderRadius: 7 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--gx-ink)" }}>{METHOD_LABEL[t.method] || t.method}</span>
            {t.treatment && <span style={{ fontSize: 11, color: "var(--gx-ink-muted)" }}>{t.treatment}</span>}
            {t.success_rate != null && (
              <span style={{ fontSize: 11, fontWeight: 600, padding: "1px 7px", borderRadius: 999,
                             background: "var(--gx-success-soft)", color: "var(--gx-success)" }}>%{t.success_rate} ({t.n_succeeded}/{t.n_started})</span>
            )}
            {t.seed_storage_behaviour && (
              <span style={{ fontSize: 10, color: "var(--gx-ink-faint)", fontFamily: "var(--gx-font-mono)" }}>{STORAGE_LABEL[t.seed_storage_behaviour] || t.seed_storage_behaviour}</span>
            )}
            {t.started_on && <span style={{ fontSize: 10, color: "var(--gx-ink-faint)" }}>{t.started_on}</span>}
            {user && t.created_by === user.id && (
              <button onClick={() => remove(t.id)} aria-label="Sil"
                style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--gx-ink-faint)", padding: 2 }}>
                <X size={13} strokeWidth={2} />
              </button>
            )}
          </div>
        ))}
        {trials.length === 0 && <div style={{ fontSize: 11, color: "var(--gx-ink-muted)", padding: "4px 2px" }}>Henüz çoğaltım denemesi yok.</div>}
      </div>

      {user && (
        adding ? (
          <div style={{ marginTop: 10, padding: 12, background: "var(--gx-surface-1)", border: "1px solid var(--gx-border-soft)", borderRadius: 9, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <select style={{ ...fieldStyle, flex: 1, minWidth: 150 }} value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
                {METHODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              {form.method === "storage_behaviour" && (
                <select style={{ ...fieldStyle, minWidth: 130 }} value={form.seed_storage_behaviour} onChange={(e) => setForm({ ...form, seed_storage_behaviour: e.target.value })}>
                  {STORAGE.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              )}
            </div>
            <input style={fieldStyle} placeholder="Treatment (örn. GA3 500 ppm, 20°C)" value={form.treatment} onChange={(e) => setForm({ ...form, treatment: e.target.value })} />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input type="number" min="0" style={{ ...fieldStyle, flex: 1, minWidth: 110 }} placeholder="Başlatılan (n)" value={form.n_started} onChange={(e) => setForm({ ...form, n_started: e.target.value })} />
              <input type="number" min="0" style={{ ...fieldStyle, flex: 1, minWidth: 110 }} placeholder="Başarılı (n)" value={form.n_succeeded} onChange={(e) => setForm({ ...form, n_succeeded: e.target.value })} />
              <input type="date" style={{ ...fieldStyle, minWidth: 130 }} value={form.started_on} onChange={(e) => setForm({ ...form, started_on: e.target.value })} />
            </div>
            <input style={fieldStyle} placeholder="Kaynak (DOI / atıf)" value={form.source_ref} onChange={(e) => setForm({ ...form, source_ref: e.target.value })} />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={save} disabled={saving}
                style={{ padding: "7px 12px", fontSize: 12, fontWeight: 600, background: "var(--gx-success)", color: "#fff", border: "none", borderRadius: 7, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
                {saving ? "Kaydediliyor…" : "Kaydet"}
              </button>
              <button onClick={() => { setAdding(false); setForm(EMPTY); }} style={{ padding: "7px 12px", fontSize: 12, background: "var(--gx-surface-2)", color: "var(--gx-ink-soft)", border: "1px solid var(--gx-border-soft)", borderRadius: 7, cursor: "pointer" }}>İptal</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAdding(true)}
            style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 11px", fontSize: 12, fontWeight: 600,
                     background: "var(--gx-surface-2)", color: "var(--gx-success)", border: "1px solid var(--gx-border-soft)", borderRadius: 7, cursor: "pointer" }}>
            <Plus size={13} strokeWidth={2.2} /> Çoğaltım denemesi ekle
          </button>
        )
      )}
    </section>
  );
}
