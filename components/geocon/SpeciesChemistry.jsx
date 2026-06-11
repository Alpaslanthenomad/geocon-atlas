"use client";
// Chemistry bench v1 — phytochemistry / compound records on the species gearbox.
// A money-blind compound capture onto the shipped metabolites table: compound + class +
// organ + extraction + a reported (literature) activity + a source. The Z-FEEDING gear --
// it produces the molecule-level facts; the value/commercial-potential layer (ip, cosmetic,
// clinical) is deferred + internal and is NOT user-writable here (firewall).

import { useEffect, useState } from "react";
import { FlaskConical, Plus, X } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";
import { useToast } from "../ui";
import { fetchMetabolitesForSpecies } from "../../lib/atlas/queries";

const ORGANS = ["", "bulb", "corm", "tuber", "rhizome", "root", "leaf", "flower", "fruit", "seed", "aerial", "whole plant"];
const EMPTY = { compound_name: "", compound_class: "", plant_organ: "", extraction_method: "", reported_activity: "", source_ref: "" };

export default function SpeciesChemistry({ speciesId }) {
  const { user } = useAuthContext();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);

  function load() {
    if (!speciesId) return;
    fetchMetabolitesForSpecies(speciesId).then((d) => setRows(Array.isArray(d) ? d : [])).catch(() => {});
  }
  useEffect(load, [speciesId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function save() {
    if (!form.compound_name.trim()) { toast.error("Bileşik adı gerekli"); return; }
    setSaving(true);
    try {
      const { error } = await supabase.rpc("save_metabolite", {
        p_species_id: speciesId,
        p_compound_name: form.compound_name,
        p_compound_class: form.compound_class || null,
        p_plant_organ: form.plant_organ || null,
        p_extraction_method: form.extraction_method || null,
        p_reported_activity: form.reported_activity || null,
        p_source_ref: form.source_ref || null,
      });
      if (error) throw error;
      toast.success("Bileşik eklendi");
      setForm(EMPTY); setAdding(false); load();
    } catch (e) { toast.error("Eklenemedi", { detail: e?.message }); } finally { setSaving(false); }
  }

  async function remove(id) {
    try {
      const { error } = await supabase.rpc("delete_metabolite", { p_id: id });
      if (error) throw error;
      load();
    } catch (e) { toast.error("Silinemedi", { detail: e?.message }); }
  }

  const fieldStyle = { padding: "7px 9px", fontSize: 12, background: "var(--gx-surface-1)", border: "1px solid var(--gx-border-soft)", borderRadius: 7, color: "var(--gx-ink)" };

  return (
    <section style={{ background: "var(--gx-card-bg)", border: "1px solid var(--gx-card-border)", borderRadius: 12, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
        <FlaskConical size={15} strokeWidth={2.1} style={{ color: "var(--gx-accent-violet)" }} />
        <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--gx-ink)" }}>Chemistry · {rows.length}</h2>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 280, overflowY: rows.length > 8 ? "auto" : "visible" }}>
        {rows.map((m) => (
          <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px",
                                   background: "var(--gx-surface-2)", border: "1px solid var(--gx-border-soft)", borderRadius: 7 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--gx-ink)" }}>{m.compound_name}</span>
            {m.compound_class && <span style={{ fontSize: 10, color: "var(--gx-ink-soft)" }}>{m.compound_class}</span>}
            {m.plant_organ && <span style={{ fontSize: 10, color: "var(--gx-ink-faint)" }}>{m.plant_organ}</span>}
            {m.reported_activity && <span style={{ fontSize: 10.5, color: "var(--gx-ink-muted)", fontStyle: "italic" }}>{m.reported_activity}</span>}
            {m.source === "user" && user && m.created_by === user.id && (
              <button onClick={() => remove(m.id)} aria-label="Sil"
                style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--gx-ink-faint)", padding: 2 }}>
                <X size={13} strokeWidth={2} />
              </button>
            )}
          </div>
        ))}
        {rows.length === 0 && <div style={{ fontSize: 11, color: "var(--gx-ink-muted)", padding: "4px 2px" }}>Henüz bileşik kaydı yok.</div>}
      </div>

      {user && (
        adding ? (
          <div style={{ marginTop: 10, padding: 12, background: "var(--gx-surface-1)", border: "1px solid var(--gx-border-soft)", borderRadius: 9, display: "flex", flexDirection: "column", gap: 8 }}>
            <input style={fieldStyle} placeholder="Bileşik (örn. galantamine)" value={form.compound_name} onChange={(e) => setForm({ ...form, compound_name: e.target.value })} />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input style={{ ...fieldStyle, flex: 1, minWidth: 140 }} placeholder="Sınıf (örn. alkaloid)" value={form.compound_class} onChange={(e) => setForm({ ...form, compound_class: e.target.value })} />
              <select style={{ ...fieldStyle, minWidth: 120 }} value={form.plant_organ} onChange={(e) => setForm({ ...form, plant_organ: e.target.value })}>
                {ORGANS.map((o) => <option key={o} value={o}>{o || "Organ…"}</option>)}
              </select>
            </div>
            <input style={fieldStyle} placeholder="Ekstraksiyon (örn. MeOH, soxhlet)" value={form.extraction_method} onChange={(e) => setForm({ ...form, extraction_method: e.target.value })} />
            <input style={fieldStyle} placeholder="Bildirilen aktivite (literatür — örn. AChE inhibisyonu)" value={form.reported_activity} onChange={(e) => setForm({ ...form, reported_activity: e.target.value })} />
            <input style={fieldStyle} placeholder="Kaynak (DOI / atıf)" value={form.source_ref} onChange={(e) => setForm({ ...form, source_ref: e.target.value })} />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={save} disabled={saving}
                style={{ padding: "7px 12px", fontSize: 12, fontWeight: 600, background: "var(--gx-accent-violet)", color: "#fff", border: "none", borderRadius: 7, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
                {saving ? "Kaydediliyor…" : "Kaydet"}
              </button>
              <button onClick={() => { setAdding(false); setForm(EMPTY); }} style={{ padding: "7px 12px", fontSize: 12, background: "var(--gx-surface-2)", color: "var(--gx-ink-soft)", border: "1px solid var(--gx-border-soft)", borderRadius: 7, cursor: "pointer" }}>İptal</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAdding(true)}
            style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 11px", fontSize: 12, fontWeight: 600,
                     background: "var(--gx-surface-2)", color: "var(--gx-accent-violet)", border: "1px solid var(--gx-border-soft)", borderRadius: 7, cursor: "pointer" }}>
            <Plus size={13} strokeWidth={2.2} /> Bileşik ekle
          </button>
        )
      )}
    </section>
  );
}
