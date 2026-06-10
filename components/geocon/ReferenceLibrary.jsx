"use client";
// components/geocon/ReferenceLibrary.jsx
//
// The Thesis Workbench Reference Library. Import by DOI (server-resolved CSL-JSON),
// add a manual entry, or cite a GEOCON Provenance Receipt -- a money-blind, citable
// source no external reference manager can resolve. Render APA / Vancouver, export
// BibTeX + CSL-JSON, copy an inline cite-key for the writing surface.

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

/* ---------- CSL helpers ---------- */
const authorList = (csl) => (Array.isArray(csl?.author) ? csl.author : []);
const yearOf = (csl) => {
  const dp = csl?.issued?.["date-parts"]?.[0]?.[0];
  return dp || csl?.year || "";
};
const famGiven = (a) => (a.literal ? { f: a.literal, i: "" } : { f: a.family || "", i: (a.given || "").split(/\s+/).map((g) => (g ? g[0] + "." : "")).join("") });
function authorsAPA(csl) {
  const A = authorList(csl).map(famGiven);
  if (!A.length) return csl?.author_raw || "[EKLE: yazar]";
  const parts = A.map((a) => a.f + (a.i ? ", " + a.i : ""));
  if (parts.length === 1) return parts[0];
  return parts.slice(0, -1).join(", ") + ", & " + parts[parts.length - 1];
}
function authorsVan(csl) {
  const A = authorList(csl).map(famGiven);
  if (!A.length) return csl?.author_raw || "[EKLE: yazar]";
  return A.map((a) => a.f + (a.i ? " " + a.i.replace(/\./g, "") : "")).join(", ");
}
const container = (csl) => (Array.isArray(csl?.["container-title"]) ? csl["container-title"][0] : csl?.["container-title"]) || "";
const titleOf = (csl) => (Array.isArray(csl?.title) ? csl.title[0] : csl?.title) || "[EKLE: başlık]";

function citeKey(csl) {
  const a = authorList(csl).map(famGiven)[0];
  const fam = (a?.f || "ref").toLowerCase().replace(/[^a-z]/g, "").slice(0, 14) || "ref";
  return fam + "-" + (yearOf(csl) || "n d");
}
function formatAPA(csl) {
  const y = yearOf(csl), c = container(csl), vol = csl.volume, iss = csl.issue, pg = csl.page, doi = csl.DOI || csl.doi;
  let s = authorsAPA(csl) + " (" + (y || "n.d.") + "). " + titleOf(csl) + ". ";
  if (c) s += c + (vol ? ", " + vol : "") + (iss ? "(" + iss + ")" : "") + (pg ? ", " + pg : "") + ". ";
  if (doi) s += "https://doi.org/" + doi;
  return s.trim();
}
function formatVancouver(csl) {
  const y = yearOf(csl), c = container(csl), vol = csl.volume, iss = csl.issue, pg = csl.page;
  let s = authorsVan(csl) + ". " + titleOf(csl) + ". ";
  if (c) s += c + ". ";
  s += (y || "n.d.") + (vol ? ";" + vol : "") + (iss ? "(" + iss + ")" : "") + (pg ? ":" + pg : "") + ".";
  return s.trim();
}
function toBibTeX(csl, key) {
  const A = authorList(csl).map(famGiven).map((a) => a.f + (a.i ? ", " + a.i : "")).join(" and ");
  const f = [
    A && "  author = {" + A + "}",
    "  title = {" + titleOf(csl) + "}",
    container(csl) && "  journal = {" + container(csl) + "}",
    yearOf(csl) && "  year = {" + yearOf(csl) + "}",
    csl.volume && "  volume = {" + csl.volume + "}",
    csl.page && "  pages = {" + csl.page + "}",
    (csl.DOI || csl.doi) && "  doi = {" + (csl.DOI || csl.doi) + "}",
  ].filter(Boolean).join(",\n");
  return "@article{" + (key || "ref") + ",\n" + f + "\n}";
}
function download(name, text) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
  a.download = name; a.click(); URL.revokeObjectURL(a.href);
}

const SRC_BADGE = { doi: { l: "DOI", c: "#1A237E", b: "rgba(26,35,126,0.10)" }, receipt: { l: "GEOCON RECEIPT", c: "#1B5E20", b: "rgba(27,94,32,0.10)" }, manual: { l: "MANUAL", c: "var(--gx-ink-muted)", b: "rgba(0,0,0,0.04)" } };

export default function ReferenceLibrary({ thesisId }) {
  const [refs, setRefs] = useState([]);
  const [doi, setDoi] = useState("");
  const [pid, setPid] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [style, setStyle] = useState("apa");
  const [showManual, setShowManual] = useState(false);
  const [copied, setCopied] = useState(null);

  const load = () => supabase.rpc("list_thesis_references", { p_thesis_id: thesisId }).then(({ data }) => setRefs(Array.isArray(data) ? data : [])).catch(() => {});
  useEffect(() => { load(); }, [thesisId]);

  async function save(csl, kind, extra = {}) {
    const key = citeKey(csl);
    await supabase.rpc("save_thesis_reference", { p_thesis_id: thesisId, p_csl: csl, p_doi: extra.doi || csl.DOI || csl.doi || null, p_receipt_pid: extra.receipt_pid || null, p_source_kind: kind, p_cite_key: key });
    load();
  }

  async function addByDoi() {
    setErr(null); setBusy(true);
    try {
      const r = await fetch("/api/geocon/resolve-doi?doi=" + encodeURIComponent(doi.trim()));
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "çözümlenemedi");
      await save(j.csl, "doi", { doi: doi.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, "") });
      setDoi("");
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  async function addReceipt() {
    setErr(null); setBusy(true);
    try {
      const { data, error } = await supabase.rpc("get_chain_receipt", { p_pid: pid.trim() });
      if (error || !data) throw new Error("Receipt bulunamadı");
      const ev = data.evidence || {}, cit = ev.citation || {}, fact = data.fact || {};
      // store the underlying paper metadata as CSL, tagged with the receipt id
      const csl = {
        type: "article-journal",
        title: cit.title || (fact.compound ? fact.compound + " — " + (data.species?.accepted_name || "") : "GEOCON Receipt " + data.pid),
        author_raw: cit.authors || "",
        year: cit.year || "", issued: cit.year ? { "date-parts": [[Number(cit.year)]] } : undefined,
        "container-title": cit.journal || "", volume: cit.volume, page: cit.page, DOI: ev.doi || undefined,
        note: "GEOCON Provenance Receipt " + data.pid,
      };
      await save(csl, "receipt", { receipt_pid: data.pid, doi: ev.doi || null });
      setPid("");
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  async function del(id) { await supabase.rpc("delete_thesis_reference", { p_id: id }); load(); }

  const fmt = style === "apa" ? formatAPA : formatVancouver;
  const exportAll = (kind) => {
    if (kind === "bibtex") download("references.bib", refs.map((r) => toBibTeX(r.csl, r.cite_key)).join("\n\n"));
    else download("references.json", JSON.stringify(refs.map((r) => r.csl), null, 2));
  };
  function copyKey(k) { navigator.clipboard?.writeText("[@" + k + "]"); setCopied(k); setTimeout(() => setCopied(null), 1200); }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ fontSize: 12.5, color: "var(--gx-ink-soft)", lineHeight: 1.6 }}>
        DOI ile içe aktar, manuel ekle, ya da bir <strong>GEOCON receipt'i</strong> referans olarak göster — hiçbir dış kaynak yöneticisinin çözemediği, money-blind, atıflanabilir bir kaynak. Inline anahtarı (<code>[@key]</code>) kopyala, yazım yüzeyinde kullan.
      </div>

      {/* add row */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <input value={doi} onChange={(e) => setDoi(e.target.value)} placeholder="DOI (10.xxxx/...)" style={inp} onKeyDown={(e) => e.key === "Enter" && doi.trim() && addByDoi()} />
        <button onClick={addByDoi} disabled={busy || !doi.trim()} style={btn(!!doi.trim() && !busy)}>{busy ? "…" : "DOI ekle"}</button>
        <span style={{ width: 1, height: 22, background: "var(--gx-border-soft)" }} />
        <input value={pid} onChange={(e) => setPid(e.target.value)} placeholder="GEOCON-XXXXXXXX" style={{ ...inp, width: 170 }} onKeyDown={(e) => e.key === "Enter" && pid.trim() && addReceipt()} />
        <button onClick={addReceipt} disabled={busy || !pid.trim()} style={btn(!!pid.trim() && !busy, "#1B5E20")}>Receipt ekle</button>
        <button onClick={() => setShowManual((s) => !s)} style={ghostBtn}>{showManual ? "Kapat" : "Manuel +"}</button>
      </div>

      {showManual && <ManualForm onAdd={async (csl) => { await save(csl, "manual"); setShowManual(false); }} />}
      {err && <div style={{ fontSize: 12, color: "var(--gx-danger, #c0392b)" }}>{err}</div>}

      {/* style + export toolbar */}
      {refs.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 10.5, color: "var(--gx-ink-muted)", textTransform: "uppercase", letterSpacing: 1 }}>{refs.length} kaynak · stil</span>
          {[["apa", "APA"], ["vancouver", "Vancouver"]].map(([k, l]) => (
            <button key={k} onClick={() => setStyle(k)} style={pill(style === k)}>{l}</button>
          ))}
          <span style={{ flex: 1 }} />
          <button onClick={() => exportAll("bibtex")} style={ghostBtn}>BibTeX ↓</button>
          <button onClick={() => exportAll("csl")} style={ghostBtn}>CSL-JSON ↓</button>
        </div>
      )}

      {/* list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {refs.map((r) => {
          const sb = SRC_BADGE[r.source_kind] || SRC_BADGE.manual;
          return (
            <div key={r.id} style={{ padding: "11px 13px", borderRadius: 10, background: "var(--gx-surface)", border: "1px solid var(--gx-border-soft)", display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, color: "var(--gx-ink)", lineHeight: 1.55 }}>{fmt(r.csl)}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: 0.5, padding: "2px 6px", borderRadius: 99, color: sb.c, background: sb.b }}>{sb.l}</span>
                  {r.receipt_pid && <a href={"/receipt/" + r.receipt_pid} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10.5, color: "#1B5E20", textDecoration: "none", fontFamily: "ui-monospace, monospace" }}>{r.receipt_pid} →</a>}
                  <button onClick={() => copyKey(r.cite_key)} style={{ fontSize: 10.5, fontFamily: "ui-monospace, monospace", color: "var(--gx-ink-muted)", background: "var(--gx-surface-sunken, rgba(0,0,0,0.03))", border: "1px solid var(--gx-border-soft)", borderRadius: 6, padding: "2px 7px", cursor: "pointer" }}>{copied === r.cite_key ? "kopyalandı" : "[@" + r.cite_key + "]"}</button>
                </div>
              </div>
              <button onClick={() => del(r.id)} title="Sil" style={{ fontSize: 14, color: "var(--gx-ink-muted)", background: "none", border: "none", cursor: "pointer", lineHeight: 1 }}>×</button>
            </div>
          );
        })}
        {refs.length === 0 && <div style={{ fontSize: 12, color: "var(--gx-ink-muted)", fontStyle: "italic", padding: "8px 0" }}>Henüz kaynak yok. Bir DOI ya da GEOCON receipt'i ekleyerek başla.</div>}
      </div>
    </div>
  );
}

function ManualForm({ onAdd }) {
  const [authors, setAuthors] = useState(""); const [year, setYear] = useState(""); const [title, setTitle] = useState(""); const [journal, setJournal] = useState("");
  function submit() {
    const author = authors.split(/;|,(?=\s*[A-Z])/).map((s) => s.trim()).filter(Boolean).map((nm) => { const p = nm.split(/\s+/); return { family: p[0], given: p.slice(1).join(" ") }; });
    onAdd({ type: "article-journal", title: title || "[EKLE: başlık]", author: author.length ? author : undefined, author_raw: authors, issued: year ? { "date-parts": [[Number(year)]] } : undefined, "container-title": journal });
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "12px 14px", borderRadius: 10, background: "var(--gx-surface-sunken, rgba(0,0,0,0.02))", border: "1px solid var(--gx-border-soft)" }}>
      <input value={authors} onChange={(e) => setAuthors(e.target.value)} placeholder="Yazarlar (Soyad Ad; Soyad Ad)" style={inp} />
      <input value={year} onChange={(e) => setYear(e.target.value)} placeholder="Yıl" style={inp} />
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Başlık" style={{ ...inp, gridColumn: "1 / 3" }} />
      <input value={journal} onChange={(e) => setJournal(e.target.value)} placeholder="Dergi / kaynak" style={inp} />
      <button onClick={submit} style={btn(true)}>Ekle</button>
    </div>
  );
}

const inp = { fontSize: 12.5, padding: "7px 10px", borderRadius: 8, border: "1px solid var(--gx-border)", background: "var(--gx-surface)", color: "var(--gx-ink)", minWidth: 200, flex: "0 1 240px" };
const btn = (on, color) => ({ fontSize: 12, fontWeight: 700, color: on ? "#fff" : "var(--gx-ink-muted)", background: on ? (color || "var(--gx-accent-violet, #5b3df5)") : "var(--gx-surface-sunken, rgba(0,0,0,0.05))", border: "none", padding: "8px 13px", borderRadius: 8, cursor: on ? "pointer" : "not-allowed" });
const ghostBtn = { fontSize: 11.5, fontWeight: 600, color: "var(--gx-ink-soft)", background: "transparent", border: "1px solid var(--gx-border-soft)", padding: "6px 11px", borderRadius: 8, cursor: "pointer" };
const pill = (on) => ({ fontSize: 11, padding: "3px 10px", borderRadius: 99, cursor: "pointer", border: "1px solid " + (on ? "var(--gx-accent-violet, #5b3df5)" : "var(--gx-border-soft)"), background: on ? "rgba(91,61,245,0.10)" : "transparent", color: on ? "var(--gx-accent-violet, #5b3df5)" : "var(--gx-ink-soft)" });
