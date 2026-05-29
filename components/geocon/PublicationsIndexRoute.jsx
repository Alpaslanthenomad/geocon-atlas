"use client";
// /geocon/publications — modern searchable publication index.

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default function PublicationsIndexRoute() {
  const [rows, setRows] = useState([]);
  const [facets, setFacets] = useState({ journals: [], categories: [], year_min: null, year_max: null });
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [journal, setJournal] = useState("all");
  const [category, setCategory] = useState("all");
  const [openOnly, setOpenOnly] = useState(false);

  useEffect(() => {
    supabase.rpc("get_publication_filter_facets").then(({ data }) => setFacets(data || {}));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      const { data } = await supabase.rpc("list_publications_filtered", {
        p_search: search.trim() || null,
        p_year_min: null,
        p_year_max: null,
        p_journal: journal === "all" ? null : journal,
        p_category: category === "all" ? null : category,
        p_open_access_only: openOnly,
        p_limit: 100,
        p_offset: 0,
      });
      if (cancelled) return;
      setRows(Array.isArray(data) ? data : []);
      setLoading(false);
    }, 200);
    return () => { cancelled = true; clearTimeout(t); };
  }, [search, journal, category, openOnly]);

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto" }}>
      <div style={{ marginBottom: 14 }}>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 28, fontWeight: 700, color: "#2c2c2a", margin: 0 }}>Publications</h1>
        <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
          Peer-reviewed publications curated alongside the Atlas. {facets.year_min && facets.year_max && (
            <>Coverage: {facets.year_min}–{facets.year_max}.</>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title, author, journal, species…"
          style={{ padding: "8px 10px", fontSize: 12, border: "1px solid #e8e6e1", borderRadius: 7, minWidth: 240, flex: 1, background: "#fff" }}
        />
        <Select value={journal}  onChange={setJournal}  label="All journals"   options={facets.journals} />
        <Select value={category} onChange={setCategory} label="All categories" options={facets.categories} />
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
      style={{
        display: "block", padding: 12,
        background: "#fff", border: "1px solid #ece9e2", borderRadius: 10,
        textDecoration: "none", color: "inherit",
      }}>
      <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap", marginBottom: 4 }}>
        {p.year && <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 999, background: "#f4f3ef", color: "#444", fontWeight: 700 }}>{p.year}</span>}
        {p.open_access && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 999, background: "#FCE89B", color: "#85651A", fontWeight: 700 }}>🔓 OA</span>}
        {p.category && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 999, background: "#EEEDFE", color: "#534AB7", fontWeight: 600 }}>{p.category}</span>}
        {p.metabolite_count > 0 && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 999, background: "#E1F5EE", color: "#085041", fontWeight: 600 }}>🧪 {p.metabolite_count}</span>}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#2c2c2a", lineHeight: 1.35 }}>
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

function Select({ value, onChange, label, options }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      style={{ padding: "8px 10px", fontSize: 12, border: "1px solid #e8e6e1", borderRadius: 7, background: "#fff", cursor: "pointer", maxWidth: 200 }}>
      <option value="all">{label}</option>
      {(options || []).map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function Skeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {[1,2,3,4].map((i) => <div key={i} style={{ height: 80, background: "#f4f3ef", borderRadius: 10 }} />)}
    </div>
  );
}

function Empty() {
  return (
    <div style={{ padding: 60, textAlign: "center", color: "#888", fontSize: 12, border: "1px dashed #ece9e2", borderRadius: 12, background: "#fafaf7" }}>
      <div style={{ fontSize: 32, marginBottom: 10 }}>📚</div>
      No publications match these filters.
    </div>
  );
}
