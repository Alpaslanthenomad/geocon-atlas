"use client";
// /geocon/metabolites — modern searchable metabolite index backed by
// list_metabolites_filtered. Replaces the legacy MetaboliteExplorer.

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { EmptyState } from "../shared";

export default function MetabolitesIndexRoute() {
  const [rows, setRows] = useState([]);
  const [facets, setFacets] = useState({ classes: [], activities: [], therapeutic_areas: [] });
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [cls, setCls] = useState("all");
  const [activity, setActivity] = useState("all");
  const [therapeutic, setTherapeutic] = useState("all");

  useEffect(() => {
    supabase.rpc("get_metabolite_filter_facets").then(({ data }) => {
      setFacets(data || { classes: [], activities: [], therapeutic_areas: [] });
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      const { data } = await supabase.rpc("list_metabolites_filtered", {
        p_search: search.trim() || null,
        p_class: cls === "all" ? null : cls,
        p_activity: activity === "all" ? null : activity,
        p_therapeutic: therapeutic === "all" ? null : therapeutic,
        p_limit: 100,
        p_offset: 0,
      });
      if (cancelled) return;
      setRows(Array.isArray(data) ? data : []);
      setLoading(false);
    }, 200);
    return () => { cancelled = true; clearTimeout(t); };
  }, [search, cls, activity, therapeutic]);

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto" }}>
      <style>{`
        .geocon-card-hover { transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s; }
        .geocon-card-hover:hover { border-color: #d4cfb8 !important; box-shadow: 0 4px 14px rgba(0,0,0,0.05); transform: translateY(-1px); }
      `}</style>
      <Link href="/geocon/species" style={{ fontSize: 11, color: "#888", textDecoration: "none", letterSpacing: 0.5 }}>
        ← ATLAS
      </Link>
      <div style={{ marginTop: 8, marginBottom: 14 }}>
        <h1 className="gx-h1">Metabolites</h1>
        <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
          Bioactive compounds isolated from geophyte species in the atlas{rows.length > 0 ? ` · ${rows.length} shown` : ""}.
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search compound, class, species…"
          style={{ padding: "8px 10px", fontSize: 12, border: "1px solid #e8e6e1", borderRadius: 7, minWidth: 240, flex: 1, background: "#fff" }}
        />
        <Select value={cls}         onChange={setCls}         label="All classes"           options={facets.classes} />
        <Select value={activity}    onChange={setActivity}    label="All activities"        options={facets.activities} />
        <Select value={therapeutic} onChange={setTherapeutic} label="All therapeutic areas" options={facets.therapeutic_areas} />
      </div>

      {loading ? (
        <Skeleton />
      ) : rows.length === 0 ? (
        <Empty />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
          {rows.map((m) => <MetaboliteCard key={m.id} m={m} />)}
        </div>
      )}
    </div>
  );
}

function MetaboliteCard({ m }) {
  return (
    <Link
      href={`/geocon/metabolites/${m.id}`}
      className="geocon-card-hover"
      style={{
        display: "flex", gap: 12, padding: 12,
        background: "#fff", border: "1px solid #ece9e2", borderRadius: 10,
        textDecoration: "none", color: "inherit",
      }}
    >
      <div style={{ width: 64, height: 64, flexShrink: 0, borderRadius: 8, overflow: "hidden", background: "#f4f3ef" }}>
        {(m.species_photo || m.species_thumbnail) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={m.species_photo || m.species_thumbnail}
            alt=""
            loading="lazy"
            onError={(e) => {
              if (m.species_thumbnail && e.currentTarget.src !== m.species_thumbnail) {
                e.currentTarget.src = m.species_thumbnail;
              } else {
                e.currentTarget.style.display = "none";
              }
            }}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#bbb", fontSize: 24 }}>🧪</div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#2c2c2a", lineHeight: 1.3 }}>
          {m.compound_name || "(unnamed)"}
        </div>
        <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>
          {m.compound_class || "—"}
          {m.molecular_formula && <> · {m.molecular_formula}</>}
        </div>
        {m.species_name && (
          <div style={{ fontSize: 11, marginTop: 4, fontStyle: "italic", fontFamily: 'Georgia, "Times New Roman", serif', color: "#0a4a3e" }}>
            🌿 {m.species_name}
          </div>
        )}
        <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
          {m.activity_category && (
            <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 999, background: "#E1F5EE", color: "#085041", fontWeight: 600 }}>
              {m.activity_category}
            </span>
          )}
          {m.therapeutic_area && (
            <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 999, background: "#EEEDFE", color: "#534AB7", fontWeight: 600 }}>
              {m.therapeutic_area}
            </span>
          )}
          {m.publication_count > 0 && (
            <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 999, background: "#f4f3ef", color: "#666", fontWeight: 600 }}>
              📚 {m.publication_count}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function Select({ value, onChange, label, options }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      style={{ padding: "8px 10px", fontSize: 12, border: "1px solid #e8e6e1", borderRadius: 7, background: "#fff", cursor: "pointer", maxWidth: 180 }}>
      <option value="all">{label}</option>
      {(options || []).map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function Skeleton() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
      {[1,2,3,4,5,6].map((i) => <div key={i} style={{ height: 100, background: "#f4f3ef", borderRadius: 10 }} />)}
    </div>
  );
}

function Empty() {
  return (
    <EmptyState
      icon="🧪"
      title="No metabolites match these filters"
      hint="Try clearing a filter or searching for a broader compound class."
    />
  );
}
