"use client";
// components/geocon/WritingDesk.jsx
//
// The Thesis Workbench writing surface. Chaptered markdown, persisted section by
// section (the grant-section pattern). Inline citation tokens [@cite-key] resolve
// from the Reference Library to (Author, Year), and the cited works collect into a
// reference list. Export Markdown + LaTeX. No AI auto-assertion; [EKLE:] convention.

import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { supabase } from "../../lib/supabase";

const DEFAULT_CHAPTERS = [
  { key: "introduction", title: "Giriş" },
  { key: "literature", title: "Literatür" },
  { key: "methods", title: "Yöntem" },
  { key: "results", title: "Bulgular" },
  { key: "discussion", title: "Tartışma" },
  { key: "conclusion", title: "Sonuç" },
];

const slug = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32) || "chapter";

/* inline citation: (Family, Year) from a CSL ref */
function inlineCite(csl) {
  const a = Array.isArray(csl?.author) ? csl.author[0] : null;
  const fam = a?.family || (csl?.author_raw || "").split(/[ ,;]/)[0] || "Anon";
  const yr = csl?.issued?.["date-parts"]?.[0]?.[0] || csl?.year || "n.d.";
  return "(" + fam + ", " + yr + ")";
}

export default function WritingDesk({ thesisId }) {
  const [sections, setSections] = useState([]);
  const [refs, setRefs] = useState([]);
  const [activeKey, setActiveKey] = useState(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [preview, setPreview] = useState(false);
  const tRef = useRef(null);

  const loadSections = () => supabase.rpc("list_thesis_sections", { p_thesis_id: thesisId }).then(({ data }) => setSections(Array.isArray(data) ? data : []));
  useEffect(() => {
    loadSections();
    supabase.rpc("list_thesis_references", { p_thesis_id: thesisId }).then(({ data }) => setRefs(Array.isArray(data) ? data : [])).catch(() => {});
  }, [thesisId]);

  // chapters = persisted sections, falling back to the default skeleton
  const chapters = useMemo(() => {
    const have = new Set(sections.map((s) => s.section_key));
    const base = DEFAULT_CHAPTERS.map((c, i) => ({ ...c, ord: i, persisted: have.has(c.key) }));
    const extra = sections.filter((s) => !DEFAULT_CHAPTERS.find((d) => d.key === s.section_key)).map((s) => ({ key: s.section_key, title: s.title || s.section_key, ord: s.ord, persisted: true }));
    return [...base, ...extra].sort((a, b) => a.ord - b.ord);
  }, [sections]);

  useEffect(() => {
    if (!activeKey && chapters.length) selectChapter(chapters[0]);
  }, [chapters, activeKey]);

  function selectChapter(ch) {
    const row = sections.find((s) => s.section_key === ch.key);
    setActiveKey(ch.key);
    setTitle(row?.title || ch.title);
    setBody(row?.body_md || "");
    setDirty(false);
  }

  async function save() {
    if (!activeKey) return;
    setSaving(true);
    const ord = chapters.find((c) => c.key === activeKey)?.ord ?? 0;
    try {
      await supabase.rpc("save_thesis_section", { p_thesis_id: thesisId, p_section_key: activeKey, p_title: title, p_body_md: body, p_ord: ord });
      setDirty(false); setSavedAt(Date.now());
      loadSections();
    } finally { setSaving(false); }
  }
  // debounced autosave
  function onBody(v) {
    setBody(v); setDirty(true);
    clearTimeout(tRef.current);
    tRef.current = setTimeout(() => save(), 1400);
  }

  function addChapter() {
    const name = prompt("Yeni bölüm başlığı:");
    if (!name) return;
    const key = slug(name) + "-" + (sections.length + chapters.length);
    setSections((s) => [...s, { section_key: key, title: name, body_md: "", ord: chapters.length + 1 }]);
    setActiveKey(key); setTitle(name); setBody("");
  }

  // resolve [@key] -> inline cite + collect cited refs
  const { rendered, cited } = useMemo(() => {
    const usedKeys = [];
    const out = (body || "").replace(/\[@([a-zA-Z0-9\-_]+)\]/g, (m, k) => {
      const r = refs.find((x) => x.cite_key === k);
      if (!r) return m;
      if (!usedKeys.includes(k)) usedKeys.push(k);
      return inlineCite(r.csl);
    });
    const citedRefs = usedKeys.map((k) => refs.find((x) => x.cite_key === k)).filter(Boolean);
    return { rendered: out, cited: citedRefs };
  }, [body, refs]);

  function exportThesis(kind) {
    const all = chapters.map((c) => {
      const row = sections.find((s) => s.section_key === c.key);
      return { title: row?.title || c.title, body: row?.body_md || "" };
    });
    let text;
    if (kind === "latex") {
      text = "\\documentclass{article}\n\\begin{document}\n\n" + all.map((s) => "\\section{" + s.title + "}\n" + (s.body || "").replace(/\[@([a-zA-Z0-9\-_]+)\]/g, "\\cite{$1}") + "\n").join("\n") + "\n\\end{document}\n";
    } else {
      text = all.map((s) => "# " + s.title + "\n\n" + (s.body || "")).join("\n\n");
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    a.download = kind === "latex" ? "thesis.tex" : "thesis.md"; a.click(); URL.revokeObjectURL(a.href);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 12.5, color: "var(--gx-ink-soft)", lineHeight: 1.6 }}>
        Bölüm bölüm yaz; otomatik kaydedilir. Inline atıf <code>[@anahtar]</code> Reference Library'den (Yazar, Yıl) olarak çözülür ve kaynakça otomatik toplanır. Belirsizleri <code>[EKLE:]</code> ile işaretle.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 14, alignItems: "start" }}>
        {/* chapter rail */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {chapters.map((c) => (
            <button key={c.key} onClick={() => selectChapter(c)} style={{
              textAlign: "left", fontSize: 12, padding: "7px 10px", borderRadius: 8, cursor: "pointer",
              border: "1px solid " + (activeKey === c.key ? "var(--gx-accent-violet, #5b3df5)" : "transparent"),
              background: activeKey === c.key ? "rgba(91,61,245,0.08)" : "transparent",
              color: activeKey === c.key ? "var(--gx-accent-violet, #5b3df5)" : "var(--gx-ink-soft)",
              fontWeight: activeKey === c.key ? 700 : 500, display: "flex", justifyContent: "space-between", gap: 6,
            }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</span>
              <span style={{ width: 6, height: 6, borderRadius: 99, background: c.persisted ? "var(--gx-success)" : "var(--gx-border)", flexShrink: 0, alignSelf: "center" }} />
            </button>
          ))}
          <button onClick={addChapter} style={{ textAlign: "left", fontSize: 11.5, padding: "6px 10px", color: "var(--gx-ink-muted)", background: "none", border: "1px dashed var(--gx-border-soft)", borderRadius: 8, cursor: "pointer", marginTop: 4 }}>+ Bölüm</button>
        </div>

        {/* editor */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input value={title} onChange={(e) => { setTitle(e.target.value); setDirty(true); }} placeholder="Bölüm başlığı" style={{ flex: 1, fontSize: 14, fontWeight: 600, padding: "7px 10px", borderRadius: 8, border: "1px solid var(--gx-border)", background: "var(--gx-surface)", color: "var(--gx-ink)" }} />
            <button onClick={() => setPreview((p) => !p)} style={miniBtn(preview)}>{preview ? "Yaz" : "Önizle"}</button>
            <button onClick={save} disabled={saving} style={miniBtn(false)}>{saving ? "…" : "Kaydet"}</button>
          </div>

          {preview ? (
            <div style={{ minHeight: 240, padding: "14px 16px", borderRadius: 10, background: "var(--gx-surface)", border: "1px solid var(--gx-border-soft)", fontSize: 13.5, lineHeight: 1.7, color: "var(--gx-ink)" }}>
              <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{rendered || "_boş_"}</ReactMarkdown>
              {cited.length > 0 && (
                <div style={{ marginTop: 18, paddingTop: 12, borderTop: "1px solid var(--gx-border-soft)" }}>
                  <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: 1, color: "var(--gx-ink-muted)", fontWeight: 700, marginBottom: 8 }}>Kaynakça ({cited.length})</div>
                  {cited.map((r) => <div key={r.cite_key} style={{ fontSize: 11.5, color: "var(--gx-ink-soft)", marginBottom: 5, lineHeight: 1.5 }}>{inlineCiteFull(r)}{r.receipt_pid ? "  · GEOCON " + r.receipt_pid : ""}</div>)}
                </div>
              )}
            </div>
          ) : (
            <textarea value={body} onChange={(e) => onBody(e.target.value)} placeholder="Markdown ile yaz. Atıf: [@yazar-yil]. Belirsiz: [EKLE: ...]" spellCheck={false}
              style={{ minHeight: 240, padding: "14px 16px", borderRadius: 10, border: "1px solid var(--gx-border)", background: "var(--gx-surface)", color: "var(--gx-ink)", fontSize: 13.5, lineHeight: 1.7, fontFamily: "ui-monospace, Menlo, Consolas, monospace", resize: "vertical" }} />
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11, color: "var(--gx-ink-muted)" }}>
            <span>{dirty ? "kaydedilmemiş…" : savedAt ? "kaydedildi" : ""}</span>
            <span style={{ flex: 1 }} />
            <button onClick={() => exportThesis("markdown")} style={ghost}>Markdown ↓</button>
            <button onClick={() => exportThesis("latex")} style={ghost}>LaTeX ↓</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function inlineCiteFull(r) {
  const c = r.csl || {};
  const a = Array.isArray(c.author) ? c.author[0] : null;
  const fam = a?.family || (c.author_raw || "").split(/[,;]/)[0] || "Anon";
  const yr = c.issued?.["date-parts"]?.[0]?.[0] || c.year || "n.d.";
  const t = Array.isArray(c.title) ? c.title[0] : c.title || "[EKLE: başlık]";
  const j = Array.isArray(c["container-title"]) ? c["container-title"][0] : c["container-title"];
  return fam + " (" + yr + "). " + t + "." + (j ? " " + j + "." : "");
}

const miniBtn = (on) => ({ fontSize: 11.5, fontWeight: 600, color: on ? "#fff" : "var(--gx-ink-soft)", background: on ? "var(--gx-accent-violet, #5b3df5)" : "var(--gx-surface)", border: "1px solid " + (on ? "var(--gx-accent-violet, #5b3df5)" : "var(--gx-border-soft)"), padding: "7px 12px", borderRadius: 8, cursor: "pointer", whiteSpace: "nowrap" });
const ghost = { fontSize: 11, fontWeight: 600, color: "var(--gx-ink-soft)", background: "transparent", border: "1px solid var(--gx-border-soft)", padding: "5px 10px", borderRadius: 7, cursor: "pointer" };
