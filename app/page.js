"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { ROLES, S } from "../lib/constants";

// Shared
import { Dot, Loading } from "../components/shared";

// Gateway
import LoginScreen from "../components/gateway/LoginScreen";

// Home
import GEOCONHome from "../components/home/GEOCONHome";

// Programs
import StartProgramModal from "../components/programs/StartProgramModal";
import ProgramsView from "../components/programs/ProgramsView";

// Species
import SpeciesDetailPanel from "../components/species/SpeciesDetailPanel";
import SpeciesModule from "../components/species/SpeciesModule";

// Admin
import AdminPanel from "../components/admin/AdminPanel";

/* ─────────────────────────────────────────────────────────
   Secondary views kept inline for now
───────────────────────────────────────────────────────── */

const freshC = (v) => (v > 0.85 ? "#0F6E56" : v > 0.65 ? "#BA7517" : "#A32D2D");

function MarketView({ markets }) {
  const [expanded, setExpanded] = useState(null);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { l: "Hypotheses", v: markets.length },
          { l: "Spin-offs", v: [...new Set(markets.map((m) => m.spinoff_link).filter(Boolean))].length },
        ].map((s) => (
          <div key={s.l} style={{ flex: "1 1 110px", ...S.metric }}>
            <div style={S.mLabel}>{s.l}</div>
            <div style={S.mVal()}>{s.v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))", gap: 10 }}>
        {markets.map((m) => (
          <div
            key={m.id}
            onClick={() => setExpanded(expanded === m.id ? null : m.id)}
            style={{ ...S.card, padding: 16, cursor: "pointer" }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, color: "#2c2c2a", marginBottom: 4 }}>
              {m.application_area}
            </div>
            <div style={{ fontSize: 10, fontStyle: "italic", color: "#888" }}>
              {m.species?.accepted_name || "—"} — {m.market_segment || m.market_type || "—"}
            </div>

            {expanded === m.id && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #e8e6e1" }}>
                {m.justification && (
                  <div style={{ fontSize: 11, color: "#5f5e5a", lineHeight: 1.6, marginBottom: 6 }}>
                    {m.justification}
                  </div>
                )}
                {m.notes && <div style={{ fontSize: 10, color: "#888" }}>{m.notes}</div>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ResearchersView({ researchers }) {
  const [search, setSearch] = useState("");

  const filtered = researchers.filter((r) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (r.name || "").toLowerCase().includes(s) ||
      (r.expertise_area || "").toLowerCase().includes(s) ||
      (r.country || "").toLowerCase().includes(s) ||
      (r.notes || "").toLowerCase().includes(s)
    );
  });

  const sorted = [...filtered].sort((a, b) => (b.h_index || 0) - (a.h_index || 0));
  const countries = [...new Set(researchers.map((r) => r.country).filter(Boolean))];

  return (
    <div>
      <input
        type="text"
        placeholder="Search name, expertise, or country..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: "100%", marginBottom: 12, ...S.input }}
      />

      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        {[
          { l: "Total researchers", v: researchers.length },
          { l: "Countries", v: countries.length },
          { l: "With h-index", v: researchers.filter((r) => r.h_index).length },
        ].map((s) => (
          <div key={s.l} style={{ flex: "1 1 100px", ...S.metric }}>
            <div style={S.mLabel}>{s.l}</div>
            <div style={S.mVal()}>{s.v}</div>
          </div>
        ))}
      </div>

      <p style={S.sub}>{sorted.length} researchers · Sorted by h-index</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 8 }}>
        {sorted.slice(0, 60).map((r) => (
          <div key={r.id} style={{ ...S.card, padding: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#2c2c2a" }}>{r.name}</div>
            <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>{r.expertise_area || "—"}</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
              {r.country && (
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: "#E6F1FB", color: "#0C447C" }}>
                  {r.country}
                </span>
              )}
              {r.h_index && (
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: "#EEEDFE", color: "#3C3489" }}>
                  h: {r.h_index}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PartnerView({ institutions }) {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 8 }}>
        {institutions.map((i) => (
          <div key={i.id} style={{ ...S.card, padding: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#2c2c2a" }}>{i.name}</div>
            <div style={{ fontSize: 10, color: "#888" }}>
              {i.city ? `${i.city}, ` : ""}
              {i.country || "—"}
            </div>
            <div style={{ fontSize: 11, color: "#5f5e5a", marginTop: 4 }}>
              {i.research_focus || i.focus_area || "—"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SourcesPanel({ sources }) {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 8 }}>
        {sources.map((src) => (
          <div key={src.id} style={{ ...S.card, padding: "10px 12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#2c2c2a" }}>
                {src.source_name || src.name}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <Dot color={freshC(src.freshness_score || 0)} size={7} />
                <span style={{ fontSize: 10, fontWeight: 600, color: freshC(src.freshness_score || 0) }}>
                  {Math.round((src.freshness_score || 0) * 100)}%
                </span>
              </div>
            </div>
            <div style={S.sub}>
              {src.data_domain || src.source_type || "—"} · {src.update_frequency || "—"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PortfolioView({ species }) {
  return (
    <div>
      <p style={S.sub}>Composite vs urgency — bubble = value score</p>
      <div
        style={{
          position: "relative",
          width: "100%",
          height: 320,
          background: "#fff",
          borderRadius: 14,
          border: "1px solid #e8e6e1",
          overflow: "hidden",
          marginTop: 8,
        }}
      >
        {species.map((sp) => {
          const c = sp.composite_score || 50;
          const con = sp.score_conservation || 50;
          const v = sp.score_venture || 50;
          const x = ((c - 40) / 50) * 82 + 9;
          const y = 100 - ((con - 20) / 80) * 88;
          const sz = 16 + (v / 100) * 28;

          return (
            <div
              key={sp.id}
              title={`${sp.accepted_name}\nComp:${c}`}
              style={{
                position: "absolute",
                left: `${x}%`,
                top: `${y}%`,
                width: sz,
                height: sz,
                borderRadius: "50%",
                background: "#1D9E75",
                opacity: 0.75,
                transform: "translate(-50%,-50%)",
                border: "2px solid #fff",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function PublicationsView({ publications }) {
  const [search, setSearch] = useState("");

  const filtered = publications.filter((p) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (p.title || "").toLowerCase().includes(s) ||
      (p.authors || "").toLowerCase().includes(s) ||
      (p.journal || "").toLowerCase().includes(s) ||
      (p.category || "").toLowerCase().includes(s)
    );
  });

  return (
    <div>
      <input
        type="text"
        placeholder="Search title, author, journal, or category..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: "100%", marginBottom: 12, ...S.input }}
      />

      <p style={S.sub}>{filtered.length} publications</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.slice(0, 120).map((p) => (
          <div key={p.id} style={{ ...S.card, padding: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#2c2c2a", lineHeight: 1.45 }}>
              {p.title || "Untitled"}
            </div>
            <div style={{ fontSize: 10, color: "#888", marginTop: 4 }}>
              {(p.authors || "").slice(0, 120)}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
              {p.year && (
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: "#E6F1FB", color: "#0C447C" }}>
                  {p.year}
                </span>
              )}
              {p.category && (
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: "#EEEDFE", color: "#3C3489" }}>
                  {p.category}
                </span>
              )}
              {p.open_access && (
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: "#E1F5EE", color: "#085041" }}>
                  OA
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetaboliteExplorer({ metabolites }) {
  const [search, setSearch] = useState("");

  const filtered = metabolites.filter((m) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (m.compound_name || "").toLowerCase().includes(s) ||
      (m.species?.accepted_name || "").toLowerCase().includes(s) ||
      (m.activity_category || "").toLowerCase().includes(s)
    );
  });

  return (
    <div>
      <input
        type="text"
        placeholder="Search compound, category, or species..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: "100%", marginBottom: 12, ...S.input }}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 8 }}>
        {filtered.map((m) => (
          <div key={m.id} style={{ ...S.card, padding: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#2c2c2a" }}>{m.compound_name}</div>
            <div style={{ fontSize: 10, fontStyle: "italic", color: "#888", marginTop: 2 }}>
              {m.species?.accepted_name || "—"}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
              {m.compound_class && (
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: "#EEEDFE", color: "#3C3489" }}>
                  {m.compound_class}
                </span>
              )}
              {m.activity_category && (
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: "#E1F5EE", color: "#085041" }}>
                  {m.activity_category}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

async function fetchAllPublications() {
  const pageSize = 1000;
  let allPubs = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("publications")
      .select("id,species_id,title,authors,doi,year,journal,open_access,primary_topic,relevance_score,cited_by_count,source,abstract,pubmed_id,openalex_id,category,species(accepted_name)")
      .order("year", { ascending: false })
      .range(from, from + pageSize - 1);

    if (error || !data || data.length === 0) break;

    allPubs = [...allPubs, ...data];

    if (data.length < pageSize) break;
    from += pageSize;
  }

  return allPubs;
}

export default function Home() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("home");
  const [side, setSide] = useState(true);
  const [loading, setLoading] = useState(true);
  const [dbOk, setDbOk] = useState(false);

  const [species, setSpecies] = useState([]);
  const [metabolites, setMetabolites] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [sources, setSources] = useState([]);
  const [publications, setPublications] = useState([]);
  const [researchers, setResearchers] = useState([]);
  const [programs, setPrograms] = useState([]);

  const [detailSpecies, setDetailSpecies] = useState(null);
  const [startProgramSp, setStartProgramSp] = useState(null);

  useEffect(() => {
    async function loadAll() {
      try {
        const [sp, mt, mk, inst, src, res, prog] = await Promise.all([
          supabase.from("species").select("*").order("composite_score", { ascending: false }),
          supabase.from("metabolites").select("*, species(accepted_name)"),
          supabase.from("market_intelligence").select("*, species(accepted_name)"),
          supabase.from("institutions").select("*").order("priority"),
          supabase.from("data_sources").select("*").order("freshness_score", { ascending: false }),
          supabase.from("researchers").select("*").order("h_index", { ascending: false, nullsFirst: false }),
          supabase.from("programs").select("*, species(accepted_name,iucn_status,thumbnail_url)").order("priority_score", { ascending: false }),
        ]);

        const pub = await fetchAllPublications();

        if (sp.data) setSpecies(sp.data);
        if (mt.data) setMetabolites(mt.data);
        if (mk.data) setMarkets(mk.data);
        if (inst.data) setInstitutions(inst.data);
        if (src.data) setSources(src.data);
        if (res.data) setResearchers(res.data);
        if (prog.data) setPrograms(prog.data);

        setPublications(pub);
        setDbOk(true);
      } catch {
        setDbOk(false);
      } finally {
        setLoading(false);
      }
    }

    loadAll();
  }, []);

  if (!user) return <LoginScreen onLogin={setUser} />;
  if (loading) return <Loading />;

  const role = ROLES[user.role];
  const threatened = species.filter((s) => ["CR", "EN", "VU"].includes(s.iucn_status)).length;
  const activePrograms = programs.filter((p) => p.status === "Active").length;

  const navItems = [
    { key: "home", label: "Home", icon: "🏠" },
    { key: "programs", label: "Programs", icon: "📋" },
    { key: "species", label: "Species", icon: "🌿" },
    { key: "metabolites", label: "Metabolites", icon: "🧪" },
    { key: "market", label: "Market", icon: "💰" },
    { key: "publications", label: "Publications", icon: "📚" },
    { key: "researchers", label: "Researchers", icon: "👨‍🔬" },
    { key: "partners", label: "Institutions", icon: "🏛" },
    { key: "portfolio", label: "Portfolio", icon: "📊" },
    { key: "sources", label: "Sources", icon: "🔗" },
    ...(user.role === "admin" ? [{ key: "admin", label: "Admin", icon: "⚙️" }] : []),
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8f7f4" }}>
      <div
        style={{
          width: side ? 220 : 0,
          flexShrink: 0,
          overflow: "hidden",
          background: "#fff",
          borderRight: "1px solid #e8e6e1",
          transition: "width 0.25s ease",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: "18px 14px 14px", flex: 1, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "linear-gradient(145deg,#085041,#1D9E75)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: "Georgia,serif" }}>
                A
              </span>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: -0.5, color: "#2c2c2a", fontFamily: "Georgia,serif" }}>
                ATLAS
              </div>
              <div style={{ fontSize: 7, color: "#b4b2a9", letterSpacing: 1.5, textTransform: "uppercase" }}>
                GEOCON v3.0
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {navItems.map((n) => (
              <button
                key={n.key}
                onClick={() => setView(n.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 10px",
                  border: "none",
                  borderRadius: 7,
                  cursor: "pointer",
                  fontSize: 11,
                  background: view === n.key ? "#f4f3ef" : "transparent",
                  color: view === n.key ? "#2c2c2a" : "#888",
                  fontWeight: view === n.key ? 600 : 400,
                  transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: 13 }}>{n.icon}</span>
                {n.label}
                {n.key === "programs" && activePrograms > 0 && (
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: 9,
                      padding: "1px 5px",
                      borderRadius: 99,
                      background: "#E1F5EE",
                      color: "#085041",
                      fontWeight: 700,
                    }}
                  >
                    {activePrograms}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 12, padding: 10, background: "#f4f3ef", borderRadius: 8, fontSize: 9, color: "#888", lineHeight: 1.8 }}>
            <div>
              <Dot color={dbOk ? "#0F6E56" : "#A32D2D"} size={6} />
              <span style={{ marginLeft: 4 }}>{dbOk ? "Supabase connected" : "Offline"}</span>
            </div>
            <div>
              <strong style={{ color: "#2c2c2a" }}>{species.length}</strong> species ·{" "}
              <strong style={{ color: "#2c2c2a" }}>{programs.length}</strong> programs
            </div>
            <div>
              <strong style={{ color: "#2c2c2a" }}>{publications.length}</strong> pubs ·{" "}
              <strong style={{ color: "#2c2c2a" }}>{metabolites.length}</strong> cpds
            </div>
          </div>
        </div>

        <div style={{ padding: 14, borderTop: "1px solid #e8e6e1" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 6,
                background: role.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ color: "#fff", fontSize: 10, fontWeight: 600 }}>{role.ic}</span>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#2c2c2a" }}>{user.name}</div>
              <div style={{ fontSize: 8, color: "#b4b2a9" }}>{role.label}</div>
            </div>
          </div>

          <a
            href="/upload-admin"
            style={{
              display: "block",
              textAlign: "center",
              padding: "6px 0",
              fontSize: 9,
              color: "#1D9E75",
              textDecoration: "none",
              border: "1px solid #1D9E75",
              borderRadius: 6,
              marginBottom: 6,
              fontWeight: 600,
            }}
          >
            📊 Excel Upload
          </a>

          <button
            onClick={() => {
              setUser(null);
              setView("home");
            }}
            style={{
              width: "100%",
              padding: "5px 0",
              fontSize: 9,
              color: "#888",
              background: "none",
              border: "1px solid #e8e6e1",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0, padding: "16px 20px 28px", overflow: "auto" }}>
        <button
          onClick={() => setSide(!side)}
          style={{
            fontSize: 16,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#888",
            marginBottom: 10,
            padding: 0,
          }}
        >
          {side ? "◀" : "▶"}
        </button>

        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          {[
            { l: "Species", v: species.length, c: "#1D9E75" },
            { l: "Programs", v: programs.length, c: "#534AB7" },
            { l: "Compounds", v: metabolites.length, c: "#185FA5" },
            { l: "Publications", v: publications.length, c: "#D85A30" },
            { l: "Threatened", v: threatened, c: "#E24B4A" },
          ].map((s) => (
            <div key={s.l} style={{ flex: "1 1 100px", ...S.card, padding: "10px 14px", border: "1px solid #e8e6e1" }}>
              <div style={S.mLabel}>{s.l}</div>
              <div style={S.mVal(s.c)}>{s.v}</div>
            </div>
          ))}
        </div>

        {view === "home" && (
          <GEOCONHome
            species={species}
            publications={publications}
            metabolites={metabolites}
            researchers={researchers}
            programs={programs}
            user={user}
            setView={setView}
            onSpeciesClick={setDetailSpecies}
          />
        )}

        {view === "programs" && <ProgramsView species={species} user={user} />}
        {view === "species" && <SpeciesModule species={species} onSpeciesClick={setDetailSpecies} />}
        {view === "metabolites" && <MetaboliteExplorer metabolites={metabolites} />}
        {view === "market" && <MarketView markets={markets} />}
        {view === "publications" && <PublicationsView publications={publications} />}
        {view === "researchers" && <ResearchersView researchers={researchers} />}
        {view === "partners" && <PartnerView institutions={institutions} />}
        {view === "portfolio" && <PortfolioView species={species} />}
        {view === "sources" && <SourcesPanel sources={sources} />}
        {view === "admin" && user.role === "admin" && (
          <AdminPanel species={species} programs={programs} onDataChange={() => window.location.reload()} />
        )}

        <div
          style={{
            marginTop: 32,
            paddingTop: 10,
            borderTop: "1px solid #e8e6e1",
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 4,
            fontSize: 8,
            color: "#b4b2a9",
          }}
        >
          <span>
            GEOCON ATLAS v3.0 · {species.length} species · {programs.length} programs · {publications.length} pubs
          </span>
          <span>Venn BioVentures OÜ</span>
        </div>
      </div>

      {detailSpecies && (
        <SpeciesDetailPanel
          species={detailSpecies}
          onClose={() => setDetailSpecies(null)}
          onStartProgram={(sp) => {
            setStartProgramSp(sp);
            setDetailSpecies(null);
          }}
        />
      )}

      {startProgramSp && (
        <StartProgramModal
          species={startProgramSp}
          onClose={() => setStartProgramSp(null)}
          onSuccess={() => {
            setStartProgramSp(null);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
