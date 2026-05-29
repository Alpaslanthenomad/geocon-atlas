"use client";
// /geocon/metabolites — modern searchable metabolite index backed by
// list_metabolites_filtered. Replaces the legacy MetaboliteExplorer.

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

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
      <div style={{ marginBottom: 14 }}>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 28, fontWeight: 700, color: "#2c2c2a", margin: 0 }}>Metabolites</h1>
        <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
          Bioactive compounds isolated from geophyte species in the atlas.
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
      style={{
        display: "flex", gap: 12, padding: 12,
        background: "#fff", border: "1px solid #ece9e2", borderRadius: 10,
        textDecoration: "none", color: "inherit",
      }}
    >
      <div style={{ width: 64, height: 64, flexShrink: 0, borderRadius: 8, overflow: "hidden", background: "#f4f3ef" }}>
        {m.species_thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={m.species_thumbnail} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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
    <div style={{ padding: 60, textAlign: "center", color: "#888", fontSize: 12, border: "1px dashed #ece9e2", borderRadius: 12, background: "#fafaf7" }}>
      <div style={{ fontSize: 32, marginBottom: 10 }}>🧪</div>
      No metabolites match these filters.
    </div>
  );
}
