"use client";
// components/geocon/ProgramsIndexRoute.jsx
//
// /geocon/programs — modern program directory. Filters, search, "My
// programs" toggle, + New program CTA. Replaces the legacy ProgramsView.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";

const STATUS_TINT = {
  Draft:      "#888780",
  Active:     "#0F6E56",
  "On Hold":  "#BA7517",
  Completed:  "#185FA5",
  Archived:   "#888780",
  Blocked:    "#A32D2D",
};

const MODULE_TINT = {
  Origin:   "#1D9E75",
  Forge:    "#BA7517",
  Mesh:     "#185FA5",
  Exchange: "#D85A30",
  Accord:   "#5F5E5A",
};

export default function ProgramsIndexRoute() {
  const { user } = useAuthContext();
  const [rows, setRows] = useState([]);
  const [facets, setFacets] = useState({ statuses: [], modules: [], modes: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [module, setModule] = useState("all");
  const [entryMode, setEntryMode] = useState("all");
  const [mineOnly, setMineOnly] = useState(false);

  // Initial facets fetch (once)
  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc("get_program_filter_facets");
      setFacets(data || { statuses: [], modules: [], modes: [] });
    })();
  }, []);

  // Programs fetch on filter change (debounced for search)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      const { data, error: e } = await supabase.rpc("list_programs_filtered", {
        p_search: search.trim() || null,
        p_status: status === "all" ? null : status,
        p_module: module === "all" ? null : module,
        p_entry_mode: entryMode === "all" ? null : entryMode,
        p_country: null,
        p_mine_only: !!mineOnly,
        p_limit: 100,
      });
      if (cancelled) return;
      if (e) setError(e.message);
      setRows(Array.isArray(data) ? data : []);
      setLoading(false);
    }, 200);
    return () => { cancelled = true; clearTimeout(t); };
  }, [search, status, module, entryMode, mineOnly]);

  const filteredCount = rows.length;

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
        <div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 28, fontWeight: 700, color: "#2c2c2a", margin: 0 }}>Programs</h1>
          <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
            Structured execution programs spanning conservation and value pathways.
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Link href="/geocon/programs/analytics" style={{ padding: "8px 12px", fontSize: 11, fontWeight: 700, background: "#fff", color: "#534AB7", border: "1px solid #ddd5f5", borderRadius: 7, textDecoration: "none" }}>
            📊 Analytics
          </Link>
          {user && (
            <>
              <button
                onClick={() => setMineOnly((m) => !m)}
                style={{
                  padding: "8px 12px", fontSize: 11, fontWeight: 700,
                  background: mineOnly ? "#FCE89B" : "#fff",
                  color: mineOnly ? "#85651A" : "#666",
                  border: "1px solid", borderColor: mineOnly ? "#E6C24A" : "#e8e6e1",
                  borderRadius: 7, cursor: "pointer",
                }}
              >
                ★ {mineOnly ? "Only mine" : "All programs"}
              </button>
              <Link href="/geocon/programs/new" style={{ padding: "8px 14px", fontSize: 12, fontWeight: 700, background: "#0a4a3e", color: "#fff", borderRadius: 7, textDecoration: "none" }}>
                + New program
              </Link>
            </>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, code, species…"
          style={{ padding: "8px 10px", fontSize: 12, border: "1px solid #e8e6e1", borderRadius: 7, minWidth: 240, flex: 1, background: "#fff" }}
        />
        <FilterSelect value={status}     onChange={setStatus}     options={facets.statuses} label="All statuses" />
        <FilterSelect value={module}     onChange={setModule}     options={facets.modules}  label="All modules" />
        <FilterSelect value={entryMode}  onChange={setEntryMode}  options={facets.modes}    label="All modes" />
      </div>

      {error && (
        <div style={{ padding: 10, background: "#fdecec", border: "1px solid #fcc", borderRadius: 6, fontSize: 11, color: "#A32D2D", marginBottom: 12 }}>
          {error}
        </div>
      )}

      {loading ? (
        <Skeleton />
      ) : filteredCount === 0 ? (
        <EmptyState mineOnly={mineOnly} isSignedIn={!!user} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
          {rows.map((p) => <ProgramCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}

function ProgramCard({ p }) {
  const statusTint = STATUS_TINT[p.status] || "#888";
  const moduleTint = MODULE_TINT[p.current_module] || "#888";
  return (
    <Link
      href={`/geocon/programs/${p.id}`}
      style={{
        display: "flex", flexDirection: "column", gap: 0,
        background: "#fff",
        border: "1px solid #ece9e2",
        borderLeft: `4px solid ${moduleTint}`,
        borderRadius: 10,
        overflow: "hidden",
        textDecoration: "none", color: "inherit",
        transition: "transform 0.1s, box-shadow 0.12s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.boxShadow = "0 8px 22px rgba(0,0,0,0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {p.species_thumbnail && (
        <div style={{ aspectRatio: "16/7", background: "#f4f3ef", position: "relative", overflow: "hidden" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.species_thumbnail} alt="" loading="lazy"
               style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.6) 100%)" }} />
          {p.species_name && (
            <div style={{ position: "absolute", bottom: 8, left: 10, fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: "italic", color: "#fff", fontSize: 12, fontWeight: 700, textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}>
              {p.species_name}
            </div>
          )}
        </div>
      )}
      <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontSize: 9, fontFamily: "monospace", color: "#aaa", letterSpacing: 0.5 }}>{p.program_code || "—"}</span>
          {p.status && (
            <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 999, background: statusTint + "22", color: statusTint, fontWeight: 700, textTransform: "uppercase" }}>
              {p.status}
            </span>
          )}
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#2c2c2a", lineHeight: 1.3 }}>
          {p.program_name || "(untitled)"}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, fontSize: 10, color: "#666", marginTop: 2 }}>
          {p.current_module && (
            <span style={{ padding: "2px 8px", borderRadius: 999, background: moduleTint + "1a", color: moduleTint, fontWeight: 600 }}>
              {p.current_module}{p.current_gate && ` · ${p.current_gate}`}
            </span>
          )}
          {p.entry_mode && (
            <span style={{ padding: "2px 8px", borderRadius: 999, background: "#f4f3ef", color: "#666" }}>
              {p.entry_mode}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 4, fontSize: 10, color: "#888" }}>
          <span title="active members">👥 {p.member_count || 0}</span>
          <span title="participating organizations">🏢 {p.org_count || 0}</span>
          {p.owner_name && <span title="owner">· 👤 {p.owner_name}</span>}
          {typeof p.readiness_score === "number" && (
            <span style={{ marginLeft: "auto", color: "#1D9E75", fontWeight: 700 }}>
              {p.readiness_score}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function FilterSelect({ value, onChange, options, label }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ padding: "8px 10px", fontSize: 12, border: "1px solid #e8e6e1", borderRadius: 7, background: "#fff", cursor: "pointer", minWidth: 130 }}
    >
      <option value="all">{label}</option>
      {(options || []).map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function EmptyState({ mineOnly, isSignedIn }) {
  return (
    <div style={{ padding: 60, textAlign: "center", color: "#888", fontSize: 12, border: "1px dashed #ece9e2", borderRadius: 12, background: "#fafaf7" }}>
      <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
      {mineOnly ? (
        <>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#444", marginBottom: 4 }}>You're not on any program yet.</div>
          <div style={{ maxWidth: 380, margin: "0 auto", lineHeight: 1.6 }}>
            Start a new one, or accept a collaboration proposal to become a member.
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#444", marginBottom: 4 }}>No programs match these filters.</div>
          <div style={{ maxWidth: 380, margin: "0 auto", lineHeight: 1.6 }}>
            Try clearing the filters or {isSignedIn ? "start a new program." : "sign in to start one."}
          </div>
        </>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
      {[1, 2, 3, 4].map((i) => <div key={i} style={{ height: 220, background: "#f4f3ef", borderRadius: 10 }} />)}
    </div>
  );
}
