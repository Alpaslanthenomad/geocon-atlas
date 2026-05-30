"use client";
// /geocon/publications — modern searchable publication index.

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";
import { EmptyState } from "../shared";

export default function PublicationsIndexRoute() {
  const { profile } = useAuthContext();
  const isAdmin = profile?.role === "admin";
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
      <style>{`
        .geocon-card-hover { transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s; }
        .geocon-card-hover:hover { border-color: #d4cfb8 !important; box-shadow: 0 4px 14px rgba(0,0,0,0.05); transform: translateY(-1px); }
      `}</style>
      <Link href="/geocon/species" style={{ fontSize: 11, color: "#888", textDecoration: "none", letterSpacing: 0.5 }}>
        ← ATLAS
      </Link>
      <div style={{ marginTop: 8, marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 14, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 28, fontWeight: 700, color: "#2c2c2a", margin: 0 }}>Publications</h1>
          <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
            Peer-reviewed publications curated alongside the Atlas{rows.length > 0 ? ` · ${rows.length} shown` : ""}. {facets.year_min && facets.year_max && (
              <>Coverage: {facets.year_min}–{facets.year_max}.</>
            )}
          </div>
        </div>
        {isAdmin && <DoiImporter onImported={() => setSearch((s) => s)} />}
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
      className="geocon-card-hover"
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
        style={{ padding: "8px 10px", fontSize: 11, border: "1px solid #e8e6e1", borderRadius: 7, width: 220, background: "#fff", fontFamily: "monospace" }}
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
      {[1,2,3,4].map((i) => <div key={i} style={{ height: 80, background: "#f4f3ef", borderRadius: 10 }} />)}
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
