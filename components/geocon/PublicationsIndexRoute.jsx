"use client";
// /geocon/publications — modern searchable publication index.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";
import { EmptyState } from "../shared";

// Editorial palette for category chips — same family/genus thinking as
// the IUCN swatches. Categories that share intent share a tint.
const CATEGORY_META = {
  Pharmacology:   { icon: "💊", tint: "#534AB7" },
  Phytochemistry: { icon: "🧪", tint: "#0F6E56" },
  Biotechnology:  { icon: "🧬", tint: "#185FA5" },
  Ecology:        { icon: "🌍", tint: "#1D9E75" },
  Taxonomy:       { icon: "🔬", tint: "#85651A" },
  Agronomy:       { icon: "🌾", tint: "#BA7517" },
  Conservation:   { icon: "🛡",  tint: "#A32D2D" },
  Other:          { icon: "✦",  tint: "var(--gx-ink-muted)" },
};

const DECADES = [
  { key: "pre2000", label: "Pre-2000", min: null,   max: 1999 },
  { key: "2000s",   label: "2000s",    min: 2000,   max: 2009 },
  { key: "2010s",   label: "2010s",    min: 2010,   max: 2019 },
  { key: "2020s",   label: "2020s",    min: 2020,   max: 2099 },
];

export default function PublicationsIndexRoute() {
  const { profile } = useAuthContext();
  const isAdmin = profile?.role === "admin";
  const [rows, setRows] = useState([]);
  const [facets, setFacets] = useState({ journals: [], categories: [], year_min: null, year_max: null });
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [journal, setJournal] = useState("all");
  const [category, setCategory] = useState("all");
  const [decade, setDecade] = useState("all");
  const [openOnly, setOpenOnly] = useState(false);

  const selectedDecade = useMemo(
    () => DECADES.find((d) => d.key === decade),
    [decade]
  );

  useEffect(() => {
    supabase.rpc("get_publication_filter_facets").then(({ data }) => setFacets(data || {}));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const { data } = await supabase.rpc("list_publications_filtered", {
          p_search: search.trim() || null,
          p_year_min: selectedDecade?.min ?? null,
          p_year_max: selectedDecade?.max ?? null,
          p_journal: journal === "all" ? null : journal,
          p_category: category === "all" ? null : category,
          p_open_access_only: openOnly,
          p_limit: 100,
          p_offset: 0,
        });
        if (cancelled) return;
        setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) console.warn("[PublicationsIndex]", e?.message || e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 200);
    return () => { cancelled = true; clearTimeout(t); };
  }, [search, journal, category, openOnly, selectedDecade]);

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto" }}>
      <style>{`
        .geocon-card-hover { transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s; }
        .geocon-card-hover:hover { border-color: #d4cfb8 !important; box-shadow: 0 4px 14px rgba(0,0,0,0.05); transform: translateY(-1px); }
      `}</style>
      <Link href="/geocon/species" style={{ fontSize: 11, color: "#888", textDecoration: "none", letterSpacing: 0.5 }}>
        ← ATLAS
      </Link>
      <div style={{ marginTop: 8, marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 14, flexWrap: "wrap" }}>
        <div>
          <h1 className="gx-h1">Publications</h1>
          <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
            Peer-reviewed publications curated alongside the Atlas{rows.length > 0 ? ` · ${rows.length} shown` : ""}. {facets.year_min && facets.year_max && (
              <>Coverage: {facets.year_min}–{facets.year_max}.</>
            )}
          </div>
        </div>
        {isAdmin && <DoiImporter onImported={() => setSearch((s) => s)} />}
      </div>

      {/* Category chip row — primary axis */}
      {Array.isArray(facets.categories) && facets.categories.length > 0 && (
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10,
          padding: "10px 12px",
          background: "var(--gx-surface)",
          border: "1px solid var(--gx-border-soft)",
          borderRadius: 10,
        }}>
          <CatChip
            active={category === "all"}
            tint="var(--gx-ink)"
            icon="✦"
            label="All"
            onClick={() => setCategory("all")}
          />
          {facets.categories.map((c) => {
            const meta = CATEGORY_META[c] || { icon: "·", tint: "var(--gx-ink-muted)" };
            return (
              <CatChip
                key={c}
                active={category === c}
                tint={meta.tint}
                icon={meta.icon}
                label={c}
                onClick={() => setCategory(category === c ? "all" : c)}
              />
            );
          })}
        </div>
      )}

      {/* Secondary filter row */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title, author, journal, species…"
          style={{ padding: "8px 10px", fontSize: 12, border: "1px solid var(--gx-card-border)", borderRadius: 7, minWidth: 240, flex: 1, background: "var(--gx-card-bg)" }}
        />
        <Select value={journal} onChange={setJournal} label="All journals" options={facets.journals} />
        <div style={{ display: "flex", gap: 4 }}>
          {DECADES.map((d) => (
            <button
              key={d.key}
              onClick={() => setDecade(decade === d.key ? "all" : d.key)}
              style={{
                padding: "8px 10px", fontSize: 11, fontWeight: 700,
                background: decade === d.key ? "rgba(83, 74, 183, 0.12)" : "#fff",
                color: decade === d.key ? "var(--gx-accent-violet)" : "#666",
                border: "1px solid",
                borderColor: decade === d.key ? "rgba(83, 74, 183, 0.4)" : "#e8e6e1",
                borderRadius: 7, cursor: "pointer",
              }}
            >
              {d.label}
            </button>
          ))}
        </div>
        <button onClick={() => setOpenOnly((o) => !o)}
          style={{
            padding: "8px 12px", fontSize: 11, fontWeight: 700,
            background: openOnly ? "#FCE89B" : "#fff",
            color: openOnly ? "#85651A" : "#666",
            border: "1px solid", borderColor: openOnly ? "#E6C24A" : "#e8e6e1",
            borderRadius: 7, cursor: "pointer",
          }}>
          🔓 Open access
        </button>
      </div>

      {loading ? (
        <Skeleton />
      ) : rows.length === 0 ? (
        <Empty />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {rows.map((p) => <PublicationRow key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}

function PublicationRow({ p }) {
  return (
    <Link href={`/geocon/publications/${p.id}`}
      className="geocon-card-hover"
      style={{
        display: "block", padding: 12,
        background: "var(--gx-card-bg)", border: "1px solid var(--gx-card-border)", borderRadius: 10,
        textDecoration: "none", color: "inherit",
      }}>
      <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap", marginBottom: 4 }}>
        {p.year && <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 999, background: "var(--gx-surface-3)", color: "#444", fontWeight: 700 }}>{p.year}</span>}
        {p.open_access && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 999, background: "#FCE89B", color: "#85651A", fontWeight: 700 }}>🔓 OA</span>}
        {p.category && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 999, background: "#EEEDFE", color: "#534AB7", fontWeight: 600 }}>{p.category}</span>}
        {p.metabolite_count > 0 && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 999, background: "#E1F5EE", color: "#085041", fontWeight: 600 }}>🧪 {p.metabolite_count}</span>}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--gx-ink)", lineHeight: 1.35 }}>
        {p.title || "(untitled)"}
      </div>
      <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>
        {p.authors && <span>{p.authors}</span>}
        {p.journal && <span> · <em>{p.journal}</em></span>}
        {p.species_name && <span> · 🌿 <em>{p.species_name}</em></span>}
        {typeof p.cited_by_count === "number" && p.cited_by_count > 0 && <span> · {p.cited_by_count} citations</span>}
      </div>
    </Link>
  );
}

function CatChip({ active, tint, icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="gx-btn"
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "5px 11px",
        fontSize: 11, fontWeight: 700, letterSpacing: 0.2,
        background: active ? `${tint}1a` : "transparent",
        color: active ? tint : "var(--gx-ink-soft)",
        border: `1px solid ${active ? `${tint}55` : "var(--gx-border-soft)"}`,
        borderRadius: 999, cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      <span aria-hidden style={{ fontSize: 12 }}>{icon}</span>
      {label}
    </button>
  );
}

function Select({ value, onChange, label, options }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      style={{ padding: "8px 10px", fontSize: 12, border: "1px solid var(--gx-card-border)", borderRadius: 7, background: "var(--gx-card-bg)", cursor: "pointer", maxWidth: 200 }}>
      <option value="all">{label}</option>
      {(options || []).map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function DoiImporter({ onImported }) {
  const [doi, setDoi] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  async function submit() {
    if (!doi.trim()) return;
    setBusy(true); setMsg(null);
    try {
      const r = await fetch("/api/admin/import-doi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doi: doi.trim() }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json?.error || "import failed");
      setMsg(json.status === "already_present" ? "Already in atlas." : `Imported · ${json.row?.title?.slice(0, 60) || ""}…`);
      setDoi("");
      onImported?.();
    } catch (e) {
      setMsg(`Error: ${e.message}`);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
      <input
        value={doi}
        onChange={(e) => setDoi(e.target.value)}
        placeholder="Import DOI…"
        style={{ padding: "8px 10px", fontSize: 11, border: "1px solid var(--gx-card-border)", borderRadius: 7, width: 220, background: "var(--gx-card-bg)", fontFamily: "monospace" }}
      />
      <button
        onClick={submit}
        disabled={busy || !doi.trim()}
        style={{ padding: "8px 12px", fontSize: 11, fontWeight: 700, background: "#534AB7", color: "#fff", border: "none", borderRadius: 7, cursor: busy ? "default" : "pointer", opacity: busy ? 0.55 : 1 }}
      >
        {busy ? "Importing…" : "→ CrossRef"}
      </button>
      {msg && (
        <span style={{ fontSize: 10, color: msg.startsWith("Error") ? "#A32D2D" : "#0F6E56" }}>
          {msg}
        </span>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {[1,2,3,4].map((i) => <div key={i} style={{ height: 80, background: "var(--gx-surface-3)", borderRadius: 10 }} />)}
    </div>
  );
}

function Empty() {
  return (
    <EmptyState
      icon="📚"
      title="No publications match these filters"
      hint="Try widening the year range, clearing the open-access filter, or searching a broader topic."
    />
  );
}
