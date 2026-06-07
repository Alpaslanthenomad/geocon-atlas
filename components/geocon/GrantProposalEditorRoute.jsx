"use client";
// /geocon/grant-studio/[id] — grant proposal editor (Phase 0, manual).
//
// Section-by-section editor driven by the template structure. Each section
// has guidance + a word target. Private to the owner. Export and AI-assisted
// drafting are later phases.

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Landmark, Workflow, ExternalLink, Trash2, CheckCircle2, Circle,
  Save, Info,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";
import { useToast } from "../ui";
import { EmptyState } from "../shared";

const STATUSES = [
  ["draft", "Taslak"], ["in_review", "İncelemede"], ["submitted", "Gönderildi"],
  ["awarded", "Kabul"], ["rejected", "Reddedildi"],
];

const wordCount = (s) => (s || "").trim() ? (s || "").trim().split(/\s+/).length : 0;

export default function GrantProposalEditorRoute({ proposalId }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState({});     // section_key -> content
  const [activeKey, setActiveKey] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data: d, error } = await supabase.rpc("get_grant_proposal", { p_id: proposalId });
      if (error) throw error;
      setData(d || null);
      if (d) {
        setDraft(d.sections || {});
        const first = (d.template?.sections || [])[0]?.key || null;
        setActiveKey((k) => k || first);
      }
    } catch { setData(null); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, proposalId]);

  const saveSection = useCallback(async (key, content) => {
    setSaving(true);
    try {
      const { error } = await supabase.rpc("save_grant_section", { p_proposal_id: proposalId, p_section_key: key, p_content: content || "" });
      if (error) throw error;
      setDirty(false);
    } catch (e) { toast.error("Kaydedilemedi", { detail: e?.message || String(e) }); }
    finally { setSaving(false); }
  }, [proposalId, toast]);

  async function switchSection(key) {
    if (dirty && activeKey) await saveSection(activeKey, draft[activeKey]);
    setActiveKey(key);
  }

  async function setStatus(s) {
    setData((d) => ({ ...d, status: s }));
    await supabase.rpc("set_grant_proposal_status", { p_proposal_id: proposalId, p_status: s });
  }
  async function saveTitle(t) {
    if (!t.trim() || t === data.title) return;
    setData((d) => ({ ...d, title: t }));
    await supabase.rpc("rename_grant_proposal", { p_proposal_id: proposalId, p_title: t });
  }
  async function remove() {
    if (!window.confirm("Bu başvuru kalıcı olarak silinsin mi?")) return;
    await supabase.rpc("delete_grant_proposal", { p_id: proposalId });
    toast.info("Başvuru silindi");
    router.push("/geocon/grant-studio");
  }

  if (authLoading || loading) return <div style={{ padding: 30, textAlign: "center", color: "var(--gx-ink-muted)", fontSize: 12 }}>Loading…</div>;
  if (!user || !data) {
    return (
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <BackLink />
        <EmptyState icon="○" title="Başvuru bulunamadı" hint="Silinmiş ya da senin değil. Başvurular özeldir; yalnızca sahibi görür." />
      </div>
    );
  }

  const sections = data.template?.sections || [];
  const filledCount = sections.filter((s) => (draft[s.key] || "").trim().length > 0).length;
  const active = sections.find((s) => s.key === activeKey) || sections[0];
  const activeContent = active ? (draft[active.key] || "") : "";
  const wc = wordCount(activeContent);
  const limit = active?.word_limit || 0;

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", paddingBottom: 60 }}>
      <BackLink />

      {/* Header */}
      <header style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 8 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
            background: "color-mix(in srgb, var(--gx-info) 12%, var(--gx-surface-2))", color: "var(--gx-info)", fontFamily: "var(--gx-font-mono)" }}>
            <Landmark size={10} strokeWidth={2} /> {data.funder} · {data.program_code}
          </span>
          {data.program_id && (
            <Link href={`/geocon/programs/${data.program_id}`} style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 9, color: "var(--gx-accent-violet)", fontFamily: "var(--gx-font-mono)", textDecoration: "none" }}>
              <Workflow size={10} strokeWidth={1.9} /> {data.program_name} →
            </Link>
          )}
          {data.template?.source_url && (
            <a href={data.template.source_url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 9, color: "var(--gx-ink-faint)", fontFamily: "var(--gx-font-mono)", textDecoration: "none" }}>
              <ExternalLink size={10} strokeWidth={1.9} /> program kılavuzu
            </a>
          )}
        </div>
        <input defaultValue={data.title} onBlur={(e) => saveTitle(e.target.value)}
          style={{ width: "100%", fontFamily: "var(--gx-font-display)", fontSize: 24, fontWeight: 700, color: "var(--gx-ink)",
            background: "transparent", border: "none", borderBottom: "1px solid transparent", padding: "2px 0", outline: "none" }}
          onFocus={(e) => e.target.style.borderBottomColor = "var(--gx-border-soft)"} />
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
          <select value={data.status} onChange={(e) => setStatus(e.target.value)} style={{
            fontSize: 11, fontWeight: 600, padding: "5px 9px", borderRadius: 7,
            background: "var(--gx-surface-2)", color: "var(--gx-ink)", border: "1px solid var(--gx-border-soft)", cursor: "pointer" }}>
            {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <span style={{ fontSize: 10, color: "var(--gx-ink-muted)", fontFamily: "var(--gx-font-mono)" }}>{filledCount}/{sections.length} bölüm dolu</span>
          <button onClick={remove} style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, color: "var(--gx-accent-rose)", background: "transparent", border: "none", cursor: "pointer" }}>
            <Trash2 size={12} strokeWidth={1.9} /> Sil
          </button>
        </div>
      </header>

      {/* Editor grid */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(180px, 240px) 1fr", gap: 18, alignItems: "start" }}>
        {/* Section nav */}
        <nav style={{ display: "flex", flexDirection: "column", gap: 3, position: "sticky", top: 12 }}>
          {sections.map((s, i) => {
            const filled = (draft[s.key] || "").trim().length > 0;
            const on = active?.key === s.key;
            return (
              <button key={s.key} onClick={() => switchSection(s.key)} style={{
                display: "flex", alignItems: "center", gap: 8, textAlign: "left", padding: "8px 10px", borderRadius: 8, cursor: "pointer",
                background: on ? "color-mix(in srgb, var(--gx-success) 10%, var(--gx-surface-2))" : "transparent",
                border: `1px solid ${on ? "color-mix(in srgb, var(--gx-success) 30%, transparent)" : "transparent"}` }}>
                {filled ? <CheckCircle2 size={14} strokeWidth={2} style={{ color: "var(--gx-success)", flexShrink: 0 }} />
                        : <Circle size={14} strokeWidth={1.6} style={{ color: "var(--gx-ink-faint)", flexShrink: 0 }} />}
                <span style={{ fontSize: 11.5, fontWeight: on ? 700 : 500, color: on ? "var(--gx-ink)" : "var(--gx-ink-soft)", lineHeight: 1.25 }}>
                  <span style={{ color: "var(--gx-ink-faint)", fontFamily: "var(--gx-font-mono)", fontSize: 9 }}>{i + 1}. </span>{s.title}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Active section */}
        {active && (
          <section>
            <h2 style={{ fontFamily: "var(--gx-font-display)", fontSize: 18, fontWeight: 700, color: "var(--gx-ink)", margin: "0 0 6px" }}>{active.title}</h2>
            {active.guidance && (
              <div style={{ display: "flex", gap: 7, padding: "9px 11px", marginBottom: 10, borderRadius: 8,
                background: "color-mix(in srgb, var(--gx-info) 7%, var(--gx-surface-2))", border: "1px solid color-mix(in srgb, var(--gx-info) 18%, transparent)" }}>
                <Info size={13} strokeWidth={1.9} style={{ color: "var(--gx-info)", flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 11.5, color: "var(--gx-ink-soft)", lineHeight: 1.45 }}>{active.guidance}</span>
              </div>
            )}
            <textarea
              value={activeContent}
              onChange={(e) => { setDraft((d) => ({ ...d, [active.key]: e.target.value })); setDirty(true); }}
              placeholder="Bu bölümü buraya yaz… (Markdown destekli)"
              rows={18}
              style={{ width: "100%", padding: "12px 14px", fontSize: 13.5, lineHeight: 1.6, fontFamily: "inherit",
                background: "var(--gx-card-bg)", color: "var(--gx-ink)", border: "1px solid var(--gx-card-border)", borderRadius: 10, resize: "vertical", boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8, flexWrap: "wrap", gap: 8 }}>
              <span style={{ fontSize: 10, color: limit > 0 && wc > limit ? "var(--gx-accent-rose)" : "var(--gx-ink-muted)", fontFamily: "var(--gx-font-mono)" }}>
                {wc} kelime{limit > 0 ? ` · hedef ~${limit}` : ""}
              </span>
              <button onClick={() => saveSection(active.key, draft[active.key])} disabled={saving || !dirty} style={{
                display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 13px", fontSize: 11, fontWeight: 700,
                background: dirty ? "var(--gx-success)" : "var(--gx-surface-2)", color: dirty ? "#fff" : "var(--gx-ink-muted)",
                border: dirty ? "none" : "1px solid var(--gx-border-soft)", borderRadius: 7, cursor: dirty ? "pointer" : "default" }}>
                <Save size={12} strokeWidth={2} /> {saving ? "Kaydediliyor…" : dirty ? "Kaydet" : "Kaydedildi"}
              </button>
            </div>

            <div style={{ marginTop: 22, padding: "10px 12px", borderRadius: 8, background: "var(--gx-surface-2)", border: "1px dashed var(--gx-border-soft)" }}>
              <div style={{ fontSize: 10, color: "var(--gx-ink-faint)", lineHeight: 1.5 }}>
                Sonraki fazda: <strong>AI destekli taslak</strong> (programının tür/outcome/yayın verisinden bölüm taslağı) ve <strong>docx/PDF dışa aktarım</strong>.
                İçerik senin taslağındır; GEOCON yalnızca hazırlığa yardımcı olur ve fon kurumlarına bağlı değildir.
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <div style={{ marginBottom: 14 }}>
      <Link href="/geocon/grant-studio" style={{ fontSize: 11, color: "var(--gx-ink-muted)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
        <ArrowLeft size={11} strokeWidth={1.85} /> Proje Yazım Stüdyosu
      </Link>
    </div>
  );
}
