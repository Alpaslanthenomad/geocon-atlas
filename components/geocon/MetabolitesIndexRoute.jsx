"use client";
// /geocon/metabolites — modern searchable metabolite index backed by
// list_metabolites_filtered. Replaces the legacy MetaboliteExplorer.

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { EmptyState } from "../shared";

// Compound class icon + tint registry — chip palette.
const CLASS_META = {
  "Alkaloid":                  { icon: "⬢", tint: "#534AB7" },
  "Flavonoid":                 { icon: "✦", tint: "#BA7517" },
  "Flavanoid":                 { icon: "✦", tint: "#BA7517" },
  "Phenolic acid":             { icon: "◇", tint: "#0F6E56" },
  "Saponin/Glycoside":         { icon: "◈", tint: "#185FA5" },
  "Fatty acid":                { icon: "≈", tint: "#85651A" },
  "Carotenoid":                { icon: "◉", tint: "#D85A30" },
  "Tuliposide":                { icon: "○", tint: "#1D9E75" },
  "Phytohormone":              { icon: "↯", tint: "#534AB7" },
  "Other secondary metabolite":{ icon: "·",  tint: "var(--gx-ink-muted)" },
  "Unidentified":              { icon: "?",  tint: "var(--gx-ink-faint)" },
};

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
      try {
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
      } catch (e) {
        if (!cancelled) console.warn("[MetabolitesIndex]", e?.message || e);
      } finally {
        if (!cancelled) setLoading(false);
      }
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

      {/* Compound class chip row — primary axis */}
      {Array.isArray(facets.classes) && facets.classes.length > 0 && (
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10,
          padding: "10px 12px",
          background: "var(--gx-surface)",
          border: "1px solid var(--gx-border-soft)",
          borderRadius: 10,
        }}>
          <ClassChip
            active={cls === "all"}
            tint="var(--gx-ink)"
            icon="✦"
            label="All compounds"
            onClick={() => setCls("all")}
          />
          {facets.classes.map((c) => {
            const meta = CLASS_META[c] || { icon: "·", tint: "var(--gx-ink-muted)" };
            return (
              <ClassChip
                key={c}
                active={cls === c}
                tint={meta.tint}
                icon={meta.icon}
                label={c}
                onClick={() => setCls(cls === c ? "all" : c)}
              />
            );
          })}
        </div>
      )}

      {/* Secondary filter row */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search compound, class, species…"
          style={{ padding: "8px 10px", fontSize: 12, border: "1px solid #e8e6e1", borderRadius: 7, minWidth: 240, flex: 1, background: "#fff" }}
        />
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
      <div style={{ width: 64, height: 64, flexShrink: 0, borderRadius: 8, overflow: "hidden", background: "var(--gx-surface-3)" }}>
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
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gx-ink)", lineHeight: 1.3 }}>
          {m.compound_name || "(unnamed)"}
        </div>
        <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>
          {m.compound_class || "—"}
          {m.molecular_formula && <> · {m.molecular_formula}</>}
        </div>
        {m.species_name && (
          <div style={{ fontSize: 11, marginTop: 4, fontStyle: "italic", fontFamily: "var(--gx-font-serif)", color: "#0a4a3e" }}>
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
            <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 999, background: "var(--gx-surface-3)", color: "#666", fontWeight: 600 }}>
              📚 {m.publication_count}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function ClassChip({ active, tint, icon, label, onClick }) {
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
      style={{ padding: "8px 10px", fontSize: 12, border: "1px solid #e8e6e1", borderRadius: 7, background: "#fff", cursor: "pointer", maxWidth: 180 }}>
      <option value="all">{label}</option>
      {(options || []).map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function Skeleton() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
      {[1,2,3,4,5,6].map((i) => <div key={i} style={{ height: 100, background: "var(--gx-surface-3)", borderRadius: 10 }} />)}
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
