"use client";
// Taxonomy bench v1 — Names & Synonymy. The curated, provenance-stamped naming layer
// on the species gearbox: the accepted name + synonyms, each act-typed and sourced.
// Reads list_taxon_names; signed-in researchers add/remove curated names.

import { useEffect, useState } from "react";
import { Tag, Plus, X } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";
import { useToast } from "../ui";

const STATUS = [
  ["accepted", "Accepted"],
  ["basionym", "Basionym"],
  ["homotypic_synonym", "Homotypic synonym"],
  ["heterotypic_synonym", "Heterotypic synonym"],
  ["orthographic_variant", "Orthographic variant"],
  ["misapplied", "Misapplied"],
  ["unplaced", "Unplaced"],
];
const STATUS_LABEL = Object.fromEntries(STATUS);
const SOURCE_KINDS = ["curator", "powo", "wfo", "ipni", "tropicos", "gbif", "literature"];

export default function SpeciesTaxonomy({ speciesId, acceptedName }) {
  const { user } = useAuthContext();
  const toast = useToast();
  const [names, setNames] = useState([]);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    scientific_name: "", authorship: "", nomenclatural_status: "heterotypic_synonym",
    source_kind: "curator", source_ref: "",
  });

  function load() {
    if (!speciesId) return;
    supabase.rpc("list_taxon_names", { p_species_id: speciesId })
      .then(({ data }) => setNames(Array.isArray(data) ? data : []))
      .catch(() => {});
  }
  useEffect(load, [speciesId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function save() {
    if (!form.scientific_name.trim()) { toast.error("Bilimsel ad gerekli"); return; }
    setSaving(true);
    try {
      const { error } = await supabase.rpc("save_taxon_name", {
        p_species_id: speciesId,
        p_scientific_name: form.scientific_name,
        p_authorship: form.authorship || null,
        p_taxon_rank: "species",
        p_nomenclatural_status: form.nomenclatural_status,
        p_registry_kind: null, p_registry_ref: null,
        p_source_kind: form.source_kind,
        p_source_ref: form.source_ref || null,
        p_confidence: "probable",
      });
      if (error) throw error;
      toast.success("Ad eklendi");
      setForm({ scientific_name: "", authorship: "", nomenclatural_status: "heterotypic_synonym", source_kind: "curator", source_ref: "" });
      setAdding(false);
      load();
    } catch (e) {
      toast.error("Eklenemedi", { detail: e?.message });
    } finally { setSaving(false); }
  }

  async function remove(id) {
    try {
      const { error } = await supabase.rpc("delete_taxon_name", { p_id: id });
      if (error) throw error;
      load();
    } catch (e) { toast.error("Silinemedi", { detail: e?.message }); }
  }

  const fieldStyle = { padding: "7px 9px", fontSize: 12, background: "var(--gx-surface-1)", border: "1px solid var(--gx-border-soft)", borderRadius: 7, color: "var(--gx-ink)" };

  return (
    <section style={{ background: "var(--gx-card-bg)", border: "1px solid var(--gx-card-border)", borderRadius: 12, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
        <Tag size={15} strokeWidth={2.1} style={{ color: "var(--gx-accent-azure)" }} />
        <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--gx-ink)" }}>Names &amp; synonymy</h2>
      </div>

      {/* the accepted name (canonical, from the atlas) */}
      {acceptedName && (
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, padding: "8px 12px", marginBottom: 8,
                      background: "var(--gx-success-soft)", border: "1px solid var(--gx-success)", borderRadius: 8 }}>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, color: "var(--gx-success)", textTransform: "uppercase" }}>Accepted</span>
          <span style={{ fontSize: 13, fontStyle: "italic", color: "var(--gx-ink)" }}>{acceptedName}</span>
        </div>
      )}

      {/* curated names / synonyms */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {names.filter((n) => n.nomenclatural_status !== "accepted").map((n) => (
          <div key={n.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px",
                                   background: "var(--gx-surface-2)", border: "1px solid var(--gx-border-soft)", borderRadius: 7 }}>
            <span style={{ fontSize: 12.5, fontStyle: "italic", color: "var(--gx-ink)" }}>
              {n.scientific_name}{n.authorship ? <span style={{ fontStyle: "normal", color: "var(--gx-ink-muted)" }}> {n.authorship}</span> : null}
            </span>
            <span style={{ fontSize: 9, fontWeight: 600, padding: "1px 6px", borderRadius: 999,
                           background: "var(--gx-surface-3)", color: "var(--gx-ink-soft)" }}>{STATUS_LABEL[n.nomenclatural_status] || n.nomenclatural_status}</span>
            {n.source_kind && <span style={{ fontSize: 10, color: "var(--gx-ink-faint)", fontFamily: "var(--gx-font-mono)" }}>{n.source_kind}</span>}
            {user && n.created_by === user.id && (
              <button onClick={() => remove(n.id)} aria-label="Sil"
                style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--gx-ink-faint)", padding: 2 }}>
                <X size={13} strokeWidth={2} />
              </button>
            )}
          </div>
        ))}
        {names.filter((n) => n.nomenclatural_status !== "accepted").length === 0 && (
          <div style={{ fontSize: 11, color: "var(--gx-ink-muted)", padding: "4px 2px" }}>Henüz küratörlü sinonim yok.</div>
        )}
      </div>

      {/* add form (signed-in) */}
      {user && (
        adding ? (
          <div style={{ marginTop: 10, padding: 12, background: "var(--gx-surface-1)", border: "1px solid var(--gx-border-soft)", borderRadius: 9, display: "flex", flexDirection: "column", gap: 8 }}>
            <input style={fieldStyle} placeholder="Bilimsel ad (örn. Colchicum kotschyi)" value={form.scientific_name}
              onChange={(e) => setForm({ ...form, scientific_name: e.target.value })} />
            <input style={fieldStyle} placeholder="Yazar (örn. Boiss.)" value={form.authorship}
              onChange={(e) => setForm({ ...form, authorship: e.target.value })} />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <select style={{ ...fieldStyle, flex: 1, minWidth: 150 }} value={form.nomenclatural_status}
                onChange={(e) => setForm({ ...form, nomenclatural_status: e.target.value })}>
                {STATUS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <select style={{ ...fieldStyle, minWidth: 110 }} value={form.source_kind}
                onChange={(e) => setForm({ ...form, source_kind: e.target.value })}>
                {SOURCE_KINDS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <input style={fieldStyle} placeholder="Kaynak (DOI / IPNI id / atıf)" value={form.source_ref}
              onChange={(e) => setForm({ ...form, source_ref: e.target.value })} />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={save} disabled={saving}
                style={{ padding: "7px 12px", fontSize: 12, fontWeight: 600, background: "var(--gx-accent-azure)", color: "#fff", border: "none", borderRadius: 7, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
                {saving ? "Kaydediliyor…" : "Kaydet"}
              </button>
              <button onClick={() => setAdding(false)} style={{ padding: "7px 12px", fontSize: 12, background: "var(--gx-surface-2)", color: "var(--gx-ink-soft)", border: "1px solid var(--gx-border-soft)", borderRadius: 7, cursor: "pointer" }}>İptal</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAdding(true)}
            style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 11px", fontSize: 12, fontWeight: 600,
                     background: "var(--gx-surface-2)", color: "var(--gx-accent-azure)", border: "1px solid var(--gx-border-soft)", borderRadius: 7, cursor: "pointer" }}>
            <Plus size={13} strokeWidth={2.2} /> Sinonim / ad ekle
          </button>
        )
      )}
    </section>
  );
}
