"use client";
// v4.3-c — IUCN assessment editor.
//
// Workspace for one Red List assessment. Author + admin can edit the
// 5 narrative sections (rationale, habitat, threats, population,
// conservation), the proposed category, and the criteria checklist
// (A1-A4, B1ab(iii), C, D, E patterns kept as free-text chips so we
// match IUCN SIS shorthand). State machine advances forward:
//   draft → peer_review → submitted → published
// Each step is a button; admin can override.
//
// SIS JSON export available once published via /api/v1/iucn/<id>.

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Send, CheckCircle2, FileJson, Download, X } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";
import { useToast } from "../ui";
import Markdown from "./Markdown";

const CATEGORIES = ["CR", "EN", "VU", "NT", "LC", "DD", "NE"];
const CRITERIA_HINTS = [
  "A1", "A2a", "A2b", "A2c", "A2d", "A3", "A4",
  "B1ab(i)", "B1ab(ii)", "B1ab(iii)", "B1ab(iv)", "B1ab(v)",
  "B2ab(i)", "B2ab(ii)", "B2ab(iii)",
  "C1", "C2a(i)", "C2a(ii)", "C2b",
  "D1", "D2",
  "E",
];

const STATUS_META = {
  draft:       { label: "Draft",      tint: "var(--gx-ink-muted)", next: "peer_review", nextLabel: "Send to peer review" },
  peer_review: { label: "Peer review", tint: "var(--gx-accent-azure)", next: "submitted", nextLabel: "Submit to IUCN" },
  submitted:   { label: "Submitted",  tint: "var(--gx-warning)",   next: "published", nextLabel: "Mark as published" },
  published:   { label: "Published",  tint: "var(--gx-success)",   next: null,        nextLabel: null },
};

const SECTIONS = [
  { key: "rationale_md",    label: "Assessment rationale",
    hint: "Why this category? Cite the criteria you ticked above and reference threats / range data." },
  { key: "habitat_md",      label: "Habitat & ecology",
    hint: "Habitat preference, elevational range, life history, dispersal, phenology." },
  { key: "threats_md",      label: "Threats",
    hint: "Drivers: habitat loss, harvest, climate, invasive species, hybridisation, disease. Severity & scope." },
  { key: "population_md",   label: "Population",
    hint: "Estimated population size, structure, trend (increasing/stable/decreasing), generation length." },
  { key: "conservation_md", label: "Conservation actions",
    hint: "In-place + recommended actions (protected areas, ex-situ, research needed, monitoring)." },
];

export default function IucnAssessmentEditor({ assessmentId }) {
  const { user, profile } = useAuthContext();
  const toast = useToast();
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  // Form state mirrors the row, kept separate so we can dirty-check.
  const [form, setForm] = useState({
    proposed_category: "",
    criteria: [],
    rationale_md: "",
    habitat_md: "",
    threats_md: "",
    population_md: "",
    conservation_md: "",
  });

  async function load() {
    setLoading(true);
    setForbidden(false);
    try {
      const { data, error } = await supabase.rpc("get_iucn_assessment_for_edit", { p_id: assessmentId });
      if (error) {
        if (/forbidden/i.test(error.message)) setForbidden(true);
        else toast.error("Yüklenemedi", { detail: error.message });
        setRow(null);
      } else if (!data) {
        setRow(null);
      } else {
        setRow(data);
        setForm({
          proposed_category: data.proposed_category || "",
          criteria: Array.isArray(data.criteria) ? data.criteria : [],
          rationale_md:    data.rationale_md    || "",
          habitat_md:      data.habitat_md      || "",
          threats_md:      data.threats_md      || "",
          population_md:   data.population_md   || "",
          conservation_md: data.conservation_md || "",
        });
      }
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { if (assessmentId) load(); /* eslint-disable-next-line */ }, [assessmentId]);

  const locked = row && ["submitted", "published"].includes(row.status) && !row.is_admin;

  async function save() {
    setSaving(true);
    try {
      const { error } = await supabase.rpc("save_iucn_assessment", {
        p_id: assessmentId,
        p_proposed_category: form.proposed_category || null,
        p_criteria: form.criteria,
        p_rationale_md:    form.rationale_md    || null,
        p_habitat_md:      form.habitat_md      || null,
        p_threats_md:      form.threats_md      || null,
        p_population_md:   form.population_md   || null,
        p_conservation_md: form.conservation_md || null,
      });
      if (error) throw error;
      toast.success("Kaydedildi");
      load();
    } catch (e) {
      toast.error("Kayıt başarısız", { detail: e?.message });
    } finally {
      setSaving(false);
    }
  }

  async function advance(target) {
    setSaving(true);
    try {
      const { error } = await supabase.rpc("advance_iucn_assessment", {
        p_id: assessmentId,
        p_target_status: target,
      });
      if (error) throw error;
      toast.success(`Statü güncellendi → ${target}`);
      load();
    } catch (e) {
      toast.error("Durum güncellenemedi", { detail: e?.message });
    } finally {
      setSaving(false);
    }
  }

  function toggleCriterion(c) {
    setForm((f) => ({
      ...f,
      criteria: f.criteria.includes(c)
        ? f.criteria.filter((x) => x !== c)
        : [...f.criteria, c],
    }));
  }

  if (!user) {
    return (
      <div style={{ maxWidth: 420, margin: "80px auto", padding: 32, textAlign: "center",
                    background: "var(--gx-card-bg)", border: "1px solid var(--gx-card-border)",
                    borderRadius: "var(--gx-card-radius)" }}>
        <h1 style={{ fontFamily: "var(--gx-font-display)", fontSize: 20 }}>Sign in to edit</h1>
        <Link href="/" style={{ display: "inline-block", marginTop: 14, padding: "9px 16px",
                                background: "var(--gx-success)", color: "#fff", fontWeight: 700,
                                borderRadius: 8, textDecoration: "none", fontSize: 12 }}>
          Sign in
        </Link>
      </div>
    );
  }
  if (loading) return <div className="gx-skeleton" style={{ height: 240, maxWidth: 820, margin: "20px auto" }} />;
  if (forbidden) {
    return (
      <div style={{ maxWidth: 480, margin: "60px auto", padding: 24, textAlign: "center",
                    background: "var(--gx-danger-soft)", color: "var(--gx-danger)",
                    border: "1px solid var(--gx-danger)", borderRadius: 10 }}>
        Bu assessment'a erişim yok. Sadece yazar veya admin görebilir.
      </div>
    );
  }
  if (!row) {
    return (
      <div style={{ maxWidth: 480, margin: "60px auto", padding: 24, textAlign: "center" }}>
        Assessment bulunamadı.
        <div style={{ marginTop: 12 }}>
          <Link href="/geocon/iucn" style={{ color: "var(--gx-accent-azure)" }}>Geri dön →</Link>
        </div>
      </div>
    );
  }

  const meta = STATUS_META[row.status] || STATUS_META.draft;

  return (
    <main style={{ maxWidth: 820, margin: "0 auto", padding: "20px 16px 80px" }}>
      <Link href="/geocon/iucn" style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        fontSize: 11, color: "var(--gx-ink-soft)", textDecoration: "none", marginBottom: 14,
      }}>
        <ArrowLeft size={11} strokeWidth={2} /> All assessments
      </Link>

      <header style={{ marginBottom: 18 }}>
        <div className="gx-overline">IUCN Hub</div>
        <h1 style={{
          fontFamily: "var(--gx-font-display)", fontSize: 24, fontWeight: 700,
          margin: "2px 0 0 0", color: "var(--gx-ink)", letterSpacing: "-0.02em",
        }}>
          Red List assessment ·{" "}
          <Link href={`/geocon/species/${encodeURIComponent(row.species_id)}`}
            style={{ fontFamily: "var(--gx-font-serif)", fontStyle: "italic",
                     color: "var(--gx-accent-azure)", textDecoration: "none" }}>
            {row.species_name || row.species_id}
          </Link>
        </h1>
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
            padding: "3px 9px", borderRadius: 999,
            background: `color-mix(in srgb, ${meta.tint} 18%, transparent)`,
            color: meta.tint, fontFamily: "var(--gx-font-mono)",
          }}>
            {meta.label.toUpperCase()}
          </span>
          {row.is_author && <span style={{ fontSize: 10, color: "var(--gx-ink-muted)" }}>You are the author</span>}
          {row.is_admin && <span style={{ fontSize: 10, color: "var(--gx-accent-violet)" }}>Admin override available</span>}
          {locked && <span style={{ fontSize: 10, color: "var(--gx-warning)" }}>Locked at status={row.status}</span>}
          <a href={`/api/v1/iucn/${row.id}`} target="_blank" rel="noopener noreferrer"
            style={{
              marginLeft: "auto",
              fontSize: 10, fontWeight: 700, letterSpacing: 0.4,
              padding: "4px 10px", borderRadius: 999,
              background: "transparent", color: "var(--gx-accent-azure)",
              border: "1px solid color-mix(in srgb, var(--gx-accent-azure) 30%, transparent)",
              textDecoration: "none", fontFamily: "var(--gx-font-mono)",
              display: "inline-flex", alignItems: "center", gap: 4,
            }}>
            <FileJson size={10} strokeWidth={2.2} /> SIS .json
          </a>
        </div>
      </header>

      {/* Category */}
      <section style={card}>
        <div className="gx-overline" style={{ marginBottom: 6 }}>Proposed category</div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {CATEGORIES.map((c) => (
            <button key={c}
              disabled={locked}
              onClick={() => setForm((f) => ({ ...f, proposed_category: c }))}
              style={{
                padding: "8px 14px",
                background: form.proposed_category === c ? "var(--gx-accent-violet)" : "var(--gx-surface-2)",
                color: form.proposed_category === c ? "#fff" : "var(--gx-ink)",
                fontFamily: "var(--gx-font-mono)", fontWeight: 700, fontSize: 12,
                border: "1px solid var(--gx-border-soft)", borderRadius: 7,
                cursor: locked ? "default" : "pointer",
                opacity: locked ? 0.6 : 1,
              }}>
              {c}
            </button>
          ))}
        </div>
      </section>

      {/* Criteria */}
      <section style={card}>
        <div className="gx-overline" style={{ marginBottom: 6 }}>Criteria triggered</div>
        <p style={{ fontSize: 11, color: "var(--gx-ink-muted)", margin: "0 0 8px 0", lineHeight: 1.5 }}>
          Tick all that apply. Standard IUCN Red List Categories and Criteria short codes.
        </p>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {CRITERIA_HINTS.map((c) => {
            const on = form.criteria.includes(c);
            return (
              <button key={c}
                disabled={locked}
                onClick={() => toggleCriterion(c)}
                style={{
                  padding: "5px 10px",
                  background: on ? "var(--gx-accent-violet)" : "transparent",
                  color: on ? "#fff" : "var(--gx-ink-soft)",
                  fontFamily: "var(--gx-font-mono)", fontWeight: 600, fontSize: 11,
                  border: `1px solid ${on ? "var(--gx-accent-violet)" : "var(--gx-border-soft)"}`,
                  borderRadius: 999,
                  cursor: locked ? "default" : "pointer",
                  opacity: locked ? 0.6 : 1,
                }}>
                {c}
              </button>
            );
          })}
        </div>
        {form.criteria.length > 0 && (
          <div style={{
            marginTop: 8, fontSize: 11, fontFamily: "var(--gx-font-mono)",
            color: "var(--gx-ink-soft)",
          }}>
            Selected: <strong style={{ color: "var(--gx-ink)" }}>{form.criteria.join(" · ")}</strong>
          </div>
        )}
      </section>

      {/* Narrative sections */}
      {SECTIONS.map((s) => (
        <section key={s.key} style={card}>
          <div className="gx-overline" style={{ marginBottom: 4 }}>{s.label}</div>
          <p style={{ fontSize: 11, color: "var(--gx-ink-muted)", margin: "0 0 8px 0", lineHeight: 1.5 }}>
            {s.hint}
          </p>
          <textarea
            value={form[s.key]}
            onChange={(e) => setForm((f) => ({ ...f, [s.key]: e.target.value }))}
            disabled={locked}
            rows={6}
            placeholder="Markdown supported…"
            style={{
              width: "100%", boxSizing: "border-box",
              padding: 10, fontSize: 13, fontFamily: "var(--gx-font-mono)",
              color: "var(--gx-ink)", background: "var(--gx-surface)",
              border: "1px solid var(--gx-border-soft)", borderRadius: 7,
              resize: "vertical",
            }} />
          {form[s.key] && form[s.key].trim().length > 0 && (
            <details style={{ marginTop: 8 }}>
              <summary style={{
                fontSize: 10, color: "var(--gx-ink-muted)", cursor: "pointer",
                letterSpacing: 0.4, textTransform: "uppercase", fontWeight: 700,
              }}>
                Preview rendered markdown
              </summary>
              <div style={{
                marginTop: 6, padding: 10,
                background: "var(--gx-surface-2)",
                border: "1px solid var(--gx-border-soft)",
                borderRadius: 7,
              }}>
                <Markdown>{form[s.key]}</Markdown>
              </div>
            </details>
          )}
        </section>
      ))}

      {/* Action bar */}
      <div style={{
        position: "sticky", bottom: 12, marginTop: 16,
        padding: 10,
        background: "var(--gx-card-bg)",
        border: "1px solid var(--gx-card-border)",
        borderRadius: 10,
        display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap",
        boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
      }}>
        <button onClick={save} disabled={saving || locked}
          style={{ ...primaryBtn, opacity: (saving || locked) ? 0.6 : 1 }}>
          <Save size={11} strokeWidth={2.2} /> {saving ? "Saving…" : "Save"}
        </button>
        {meta.next && (
          <button onClick={() => advance(meta.next)} disabled={saving}
            style={{ ...primaryBtn, background: "var(--gx-accent-azure)" }}>
            {meta.next === "published" ? <CheckCircle2 size={11} strokeWidth={2.2} /> : <Send size={11} strokeWidth={2.2} />}
            {meta.nextLabel}
          </button>
        )}
        {row.status !== "draft" && row.is_author && !locked && (
          <button onClick={() => advance("draft")} disabled={saving} style={ghostBtn}>
            <X size={11} strokeWidth={2.2} /> Back to draft
          </button>
        )}
        <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--gx-ink-muted)", fontStyle: "italic" }}>
          Last saved {row.updated_at ? new Date(row.updated_at).toLocaleString() : "—"}
        </span>
      </div>
    </main>
  );
}

const card = {
  padding: 14, marginTop: 10,
  background: "var(--gx-card-bg)",
  border: "1px solid var(--gx-card-border)",
  borderRadius: 10,
};

const primaryBtn = {
  display: "inline-flex", alignItems: "center", gap: 5,
  padding: "8px 14px",
  background: "var(--gx-success)", color: "#fff",
  fontSize: 12, fontWeight: 700, letterSpacing: 0.3,
  border: "none", borderRadius: 7, cursor: "pointer",
};
const ghostBtn = {
  display: "inline-flex", alignItems: "center", gap: 4,
  padding: "7px 12px",
  background: "transparent", color: "var(--gx-ink-soft)",
  fontSize: 11, fontWeight: 600,
  border: "1px solid var(--gx-border-soft)",
  borderRadius: 7, cursor: "pointer",
};
