"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { FAMILY_COLORS, DEF_FAM } from "../../lib/constants";
import { iucnC, iucnBg, flag } from "../../lib/helpers";

// ---------- Inline helpers (so we never miss imports) ----------
const decBg = d => ({ Accelerate:"#E1F5EE","Rescue Now":"#FCEBEB","Urgent Conserve":"#FCEBEB",Develop:"#E6F1FB",Scale:"#EAF3DE",Monitor:"#f1efe8","Data Needed":"#EEEDFE" }[d]||"#f1efe8");
const decC  = d => ({ Accelerate:"#0F6E56","Rescue Now":"#A32D2D","Urgent Conserve":"#A32D2D",Develop:"#185FA5",Scale:"#3B6D11",Monitor:"#888","Data Needed":"#534AB7" }[d]||"#888");
const freshC = v => v>0.85?"#0F6E56":v>0.65?"#BA7517":"#A32D2D";
const riskColor = r => ({ high:"#A32D2D",medium:"#BA7517",low:"#0F6E56" }[r?.toLowerCase()]||"#888");
const riskBg    = r => ({ high:"#FCEBEB",medium:"#FAEEDA",low:"#E1F5EE" }[r?.toLowerCase()]||"#f4f3ef");

// ---------- Score helpers ----------
const scoreColor = (v, type) => {
  if (v == null || v === "") return "#888";
  const n = Number(v);
  if (type === "gps") return n >= 60 ? "#0F6E56" : n >= 40 ? "#BA7517" : "#A32D2D";
  if (type === "cs")  return n >= 60 ? "#A32D2D" : n >= 40 ? "#BA7517" : "#0F6E56";
  return n >= 60 ? "#0F6E56" : n >= 40 ? "#BA7517" : "#A32D2D";
};

function deriveScores(sp) {
  if (!sp) return { gps:null, cs:null, fs:null, evs:null, svs:null };
  const gps  = sp.gps_score        ?? sp.composite_score    ?? sp.score_composite ?? null;
  const cs   = sp.cs_score         ?? sp.score_conservation ?? sp.conservation_score ?? null;
  const fs   = sp.fs_score         ?? sp.score_feasibility  ?? sp.feasibility_score ?? null;
  const evs  = sp.evs_score        ?? sp.score_ecosystem    ?? sp.score_environment ?? sp.ecosystem_score ?? null;
  const svs  = sp.svs_score        ?? sp.score_venture      ?? sp.venture_score    ?? sp.science_score ?? null;
  return { gps, cs, fs, evs, svs };
}

function deriveNextAction(sp, story) {
  const explicit =
    sp?.next_best_action ||
    sp?.next_action ||
    story?.next_best_action ||
    story?.next_action ||
    null;
  if (explicit) return explicit;

  const decision = sp?.current_decision || sp?.decision || "";
  const map = {
    "Rescue Now":      "Begin ex situ conservation — establish seed bank and TC protocol",
    "Urgent Conserve": "Begin ex situ conservation — establish seed bank and TC protocol",
    "Develop":         "Develop propagation protocol — characterize dormancy and tissue culture pathway",
    "Scale":           "Scale to commercial production — establish supply chain and partner network",
    "Accelerate":      "Accelerate program — secure funding, expand pilot, prepare commercialization",
    "Monitor":         "Maintain monitoring — periodic review of population and market signals",
    "Data Needed":     "Close data gaps — commission targeted survey or literature review"
  };
  return map[decision] || "Define next program step based on data review";
}

function deriveConfidence(sp, pubs, mets) {
  if (sp?.confidence != null) return Number(sp.confidence) <= 1 ? Math.round(sp.confidence * 100) : Math.round(sp.confidence);
  if (sp?.data_confidence != null) return Math.round(sp.data_confidence * (sp.data_confidence <= 1 ? 100 : 1));
  const pubCount = pubs?.length || 0;
  const metCount = mets?.length || 0;
  const raw = Math.min(95, 30 + pubCount * 2 + metCount * 3);
  return raw;
}

const fmtDate = s => {
  if (!s) return "—";
  if (typeof s === "string" && s.length >= 10) return s.slice(0, 10);
  try { return new Date(s).toISOString().slice(0,10); } catch { return String(s); }
};

// =============================================================
//                  MAIN PANEL COMPONENT
// =============================================================
export default function SpeciesDetailPanel({ species, onClose, onStartProgram }) {
  const [pubs, setPubs] = useState([]);
  const [mets, setMets] = useState([]);
  const [cons, setCons] = useState([]);
  const [gov, setGov] = useState(null);
  const [prop, setProp] = useState([]);
  const [comm, setComm] = useState([]);
  const [locs, setLocs] = useState([]);
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("decision");

  useEffect(() => {
    if (!species) return;
    let mounted = true;

    setLoading(true);
    setPubs([]); setMets([]); setCons([]); setGov(null);
    setProp([]); setComm([]); setLocs([]); setStory(null);
    setTab("decision");

    Promise.all([
      supabase.from("publications").select("id,title,authors,year,journal,doi,open_access,source,abstract").eq("species_id", species.id).order("year", { ascending: false }).limit(50),
      supabase.from("metabolites").select("id,compound_name,compound_class,reported_activity,activity_category,evidence,confidence,therapeutic_area,plant_organ").eq("species_id", species.id).order("confidence", { ascending: false }),
      supabase.from("conservation").select("*").eq("species_id", species.id),
      supabase.from("governance").select("*").eq("species_id", species.id).maybeSingle(),
      supabase.from("propagation").select("*").eq("species_id", species.id),
      supabase.from("commercial").select("*").eq("species_id", species.id),
      supabase.from("locations").select("*").eq("species_id", species.id),
      supabase.from("species_stories").select("*").eq("species_id", species.id).maybeSingle(),
    ])
      .then(([pubR, metR, conR, govR, propR, commR, locR, storyR]) => {
        if (!mounted) return;
        setPubs(pubR.data || []);
        setMets(metR.data || []);
        setCons(conR.data || []);
        setGov(govR.data || null);
        setProp(propR.data || []);
        setComm(commR.data || []);
        setLocs(locR.data || []);
        setStory(storyR.data || null);
        setLoading(false);
      })
      .catch(() => { if (mounted) setLoading(false); });

    return () => { mounted = false; };
  }, [species?.id]);

  if (!species) return null;

  const c = FAMILY_COLORS[species.family] || DEF_FAM;
  const scores = deriveScores(species);
  const nextAction = deriveNextAction(species, story);
  const confidence = deriveConfidence(species, pubs, mets);
  const decision = species.current_decision || species.decision;
  const pathway = species.pathway || species.program_pathway || (decision === "Rescue Now" || decision === "Urgent Conserve" ? "Conservation Program" : decision === "Scale" || decision === "Accelerate" ? "Commercial Program" : decision === "Develop" ? "Development Program" : "Monitoring");

  const TABS = [
    { k: "decision", l: "⚡ Decision" },
    { k: "story", l: "Story" },
    { k: "pubs",  l: `Publications (${pubs.length})` },
    { k: "mets",  l: `Metabolites (${mets.length})` },
    { k: "cons",  l: "Conservation" },
    { k: "gov",   l: "Governance" },
    { k: "prop",  l: "Propagation" },
    { k: "comm",  l: "Commercial" },
    { k: "info",  l: "Details" },
  ];

  const SCORE_DEFS = [
    { key: "gps", label: "GPS", value: scores.gps, type: "gps", title: "GEOCON Priority Score" },
    { key: "cs",  label: "CS",  value: scores.cs,  type: "cs",  title: "Conservation Score" },
    { key: "fs",  label: "FS",  value: scores.fs,  type: "fs",  title: "Feasibility Score" },
    { key: "evs", label: "EVS", value: scores.evs, type: "evs", title: "Ecosystem Value Score" },
    { key: "svs", label: "SVS", value: scores.svs, type: "svs", title: "Science / Venture Score" },
  ];

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 100 }}
      />

      <div
        style={{
          position: "fixed",
          top: 0, right: 0, bottom: 0,
          width: 880,
          maxWidth: "98vw",
          background: "#fff",
          zIndex: 101,
          display: "flex",
          flexDirection: "column",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.15)",
        }}
      >
        {/* ============ GREEN HERO ============ */}
        <div style={{ flexShrink: 0, background: "linear-gradient(135deg,#1f7a5a 0%,#0F6E56 60%,#0a5142 100%)", color: "#fff", padding: "14px 20px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
              <button
                onClick={onClose}
                style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 8, color: "#fff", padding: "5px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
              >
                ← Back
              </button>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {species.family} <span style={{ opacity: 0.5 }}>›</span> {species.genus} <span style={{ opacity: 0.5 }}>›</span> <span style={{ fontStyle: "italic" }}>{species.accepted_name}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{ background: "rgba(0,0,0,0.2)", border: "none", borderRadius: "50%", width: 28, height: 28, color: "#fff", fontSize: 14, cursor: "pointer", flexShrink: 0 }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            {species.photo_url ? (
              <div style={{ width: 110, height: 110, borderRadius: 10, overflow: "hidden", flexShrink: 0, border: "1px solid rgba(255,255,255,0.25)", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
                <img
                  src={species.photo_url}
                  alt={species.accepted_name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => { e.currentTarget.parentElement.style.display = "none"; }}
                />
              </div>
            ) : (
              <div style={{ width: 110, height: 110, borderRadius: 10, flexShrink: 0, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>🌱</div>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.85)", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 4 }}>
                {species.family}{species.geophyte_type ? ` · ${species.geophyte_type}` : ""}
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, fontStyle: "italic", fontFamily: "Georgia,serif", lineHeight: 1.15, marginBottom: 8 }}>
                {species.accepted_name}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {species.iucn_status && (
                  <span style={{ fontSize: 10, padding: "3px 9px", borderRadius: 99, background: iucnBg(species.iucn_status), color: iucnC(species.iucn_status), fontWeight: 600 }}>
                    IUCN: {species.iucn_status}
                  </span>
                )}
                {species.country_focus && (
                  <span style={{ fontSize: 10, padding: "3px 9px", borderRadius: 99, background: "rgba(255,255,255,0.18)", color: "#fff" }}>
                    {species.country_focus}
                  </span>
                )}
                {decision && (
                  <span style={{ fontSize: 10, padding: "3px 9px", borderRadius: 99, background: decBg(decision), color: decC(decision), fontWeight: 600 }}>
                    {decision}
                  </span>
                )}
                {pathway && (
                  <span style={{ fontSize: 10, padding: "3px 9px", borderRadius: 99, background: "rgba(255,255,255,0.18)", color: "#fff" }}>
                    {pathway}
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: 6, alignItems: "stretch" }}>
              {SCORE_DEFS.map(s => (
                <div
                  key={s.key}
                  title={s.title}
                  style={{ minWidth: 52, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "8px 6px", textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center" }}
                >
                  <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1, color: s.value == null ? "rgba(255,255,255,0.4)" : "#fff" }}>
                    {s.value == null ? "—" : Math.round(Number(s.value))}
                  </div>
                  <div style={{ fontSize: 8, color: "rgba(255,255,255,0.75)", textTransform: "uppercase", letterSpacing: 0.6, marginTop: 4 }}>
                    {s.label}
                  </div>
                </div>
              ))}

              <button
                onClick={() => onStartProgram && onStartProgram(species)}
                style={{ marginLeft: 4, padding: "0 14px", background: "rgba(255,255,255,0.95)", color: "#0F6E56", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }}
              >
                + Start Program
              </button>
            </div>
          </div>
        </div>

        {/* ============ TABS ============ */}
        <div style={{ display: "flex", borderBottom: "1px solid #e8e6e1", flexShrink: 0, overflowX: "auto", background: "#fafaf7" }}>
          {TABS.map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              style={{ flexShrink: 0, padding: "11px 14px", border: "none", borderBottom: tab === t.k ? "2px solid #0F6E56" : "2px solid transparent", background: "none", cursor: "pointer", fontSize: 12, fontWeight: tab === t.k ? 600 : 500, color: tab === t.k ? "#0F6E56" : "#666", whiteSpace: "nowrap" }}
            >
              {t.l}
            </button>
          ))}
        </div>

        {/* ============ BODY: SIDEBAR + CONTENT ============ */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", minHeight: 0 }}>
          <aside
            style={{ width: 260, flexShrink: 0, borderRight: "1px solid #e8e6e1", overflowY: "auto", padding: "16px 16px 24px", background: "#fbfaf7", fontSize: 12 }}
          >
            <SidebarBlock title="Species Info">
              <SidebarRow label="Genus" value={species.genus} />
              <SidebarRow label="Family" value={species.family} />
              <SidebarRow label="Type" value={species.geophyte_type} />
              <SidebarRow label="Region" value={species.region} truncate />
              <SidebarRow label="Country" value={species.country_focus} />
              <SidebarRow label="Habitat" value={species.habitat} truncate />
              <SidebarRow label="TC status" value={species.tc_status} truncate />
              <SidebarRow label="Market" value={species.market_area} truncate />
            </SidebarBlock>

            <SidebarBlock title="Data Trust">
              <SidebarRow
                label="Confidence"
                value={
                  <span style={{ color: confidence >= 70 ? "#0F6E56" : confidence >= 50 ? "#BA7517" : "#A32D2D", fontWeight: 600 }}>
                    {confidence}%
                  </span>
                }
              />
              <SidebarRow label="Last verified" value={fmtDate(species.last_verified || species.updated_at)} />
              <SidebarRow label="Module" value={species.module || species.geocon_module || "Origin"} />
            </SidebarBlock>

            <SidebarBlock title="Linked Data">
              <SidebarRow label="Publications" value={pubs.length} />
              <SidebarRow label="Metabolites" value={mets.length} />
              <SidebarRow label="Conservation" value={cons.length} />
              <SidebarRow label="Propagation" value={prop.length} />
              <SidebarRow label="Commercial" value={comm.length} />
            </SidebarBlock>
          </aside>

          <div style={{ flex: 1, overflowY: "auto", padding: "16px 22px 28px" }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: 60, color: "#999", fontSize: 13 }}>Loading…</div>
            ) : (
              <>
                {tab === "decision" && (
                  <DecisionTab
                    species={species}
                    pubs={pubs} mets={mets} cons={cons} gov={gov}
                    prop={prop} comm={comm} locs={locs} story={story}
                    nextAction={nextAction}
                    decision={decision}
                    pathway={pathway}
                    onStartProgram={onStartProgram}
                  />
                )}

                {tab === "story" && (
                  <StoryTab species={species} story={story} nextAction={nextAction} decision={decision} />
                )}

                {tab === "pubs" && <PubsTab pubs={pubs} />}
                {tab === "mets" && <MetsTab mets={mets} />}
                {tab === "cons" && <ConsTab cons={cons} />}
                {tab === "gov"  && <GovTab gov={gov} />}
                {tab === "prop" && <PropTab prop={prop} />}
                {tab === "comm" && <CommTab comm={comm} />}
                {tab === "info" && <InfoTab species={species} />}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// =============================================================
//                  DECISION TAB (the heart of the panel)
// =============================================================
function DecisionTab({ species, pubs, mets, cons, gov, prop, comm, locs, story, nextAction, decision, pathway, onStartProgram }) {
  // Gap analysis
  const gaps = [
    {
      l: "Propagation Protocol",
      status: prop.length > 0 ? "strong" : (species.tc_status && species.tc_status !== "Not established" && species.tc_status !== "—") ? "partial" : "missing",
      note: prop.length > 0 ? `${prop.length} protocol(s)` : species.tc_status || "No data",
    },
    {
      l: "Metabolite Evidence",
      status: mets.length > 5 ? "strong" : mets.length > 0 ? "partial" : "missing",
      note: mets.length > 0 ? `${mets.length} compounds` : "No data",
    },
    {
      l: "Conservation Assessment",
      status: cons.length > 0 ? "strong" : (species.iucn_status && species.iucn_status !== "NE") ? "partial" : "missing",
      note: cons.length > 0 ? cons[0].source : species.iucn_status || "Not evaluated",
    },
    {
      l: "Commercial Hypothesis",
      status: comm.length > 0 ? "strong" : species.market_area ? "partial" : "missing",
      note: comm.length > 0 ? comm[0].application_area : species.market_area || "No hypothesis",
    },
    {
      l: "Governance Readiness",
      status: gov ? (gov.abs_nagoya_risk === "low" ? "strong" : "partial") : "missing",
      note: gov ? `ABS risk: ${gov.abs_nagoya_risk || "unknown"}` : "Not assessed",
    },
    {
      l: "Field / Location Data",
      status: locs.length > 2 ? "strong" : locs.length > 0 ? "partial" : "missing",
      note: locs.length > 0 ? `${locs.length} location(s)` : "No data",
    },
    {
      l: "Publications",
      status: pubs.length > 10 ? "strong" : pubs.length > 0 ? "partial" : "missing",
      note: pubs.length > 0 ? `${pubs.length} publications` : "No publications",
    },
  ];

  // Recommended actions
  const candidateActions = [
    prop.length === 0 ? { urgency: "high",   action: "Initiate in vitro propagation trial", detail: "No protocol exists — first priority" } : null,
    mets.length === 0 ? { urgency: "high",   action: "Validate metabolite presence",         detail: "Run LC-MS or extract profiling" } : null,
    locs.length === 0 ? { urgency: "medium", action: "Collect field location data",          detail: "Map distribution and habitat" } : null,
    comm.length === 0 ? { urgency: "medium", action: "Develop commercial hypothesis",        detail: "Identify market application" } : null,
    !gov              ? { urgency: "low",    action: "Assess governance & ABS compliance",   detail: "Required before commercialization" } : null,
    !story            ? { urgency: "low",    action: "Generate GEOCON species story",        detail: "Run harvest story endpoint" } : null,
  ].filter(Boolean).slice(0, 5);

  const allCovered = candidateActions.length === 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* ===== NEXT BEST ACTION (highlight) ===== */}
      <div
        style={{ background: "linear-gradient(135deg,#E1F5EE 0%,#d3efe2 100%)", border: "1px solid #1D9E75", borderLeft: "4px solid #0F6E56", borderRadius: 12, padding: "14px 18px" }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ fontSize: 22, lineHeight: 1, color: "#0F6E56", marginTop: 1 }}>→</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 9, color: "#0F6E56", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700, marginBottom: 4 }}>
              Next Best Action
            </div>
            <div style={{ fontSize: 14, color: "#0a5142", fontWeight: 600, lineHeight: 1.4 }}>
              {nextAction}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 12, paddingLeft: 34 }}>
          <ActionChip label="Search"   onClick={() => window.open(`https://scholar.google.com/scholar?q=${encodeURIComponent(species.accepted_name)}`, "_blank")} />
          <ActionChip label="Copy"     onClick={() => { try { navigator.clipboard.writeText(nextAction); } catch (e) {} }} />
          <ActionChip label="Snapshot" onClick={() => alert("Snapshot saved (stub)")} />
        </div>
      </div>

      {/* ===== GAP ANALYSIS ===== */}
      <div style={{ padding: "14px 16px", background: "#fff", borderRadius: 12, border: "1px solid #e8e6e1" }}>
        <div style={{ fontSize: 9, color: "#888", textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 700, marginBottom: 10 }}>
          Gap Analysis
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {gaps.map(gap => {
            const icons  = { strong: "✅", partial: "⚠️", missing: "❌" };
            const colors = { strong: "#085041", partial: "#633806", missing: "#A32D2D" };
            const bgs    = { strong: "#E1F5EE", partial: "#FAEEDA", missing: "#FCEBEB" };
            return (
              <div
                key={gap.l}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: bgs[gap.status], borderRadius: 8 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13 }}>{icons[gap.status]}</span>
                  <span style={{ fontSize: 12, color: "#2c2c2a", fontWeight: 500 }}>{gap.l}</span>
                </div>
                <span style={{ fontSize: 10, color: colors[gap.status], fontWeight: 600 }}>{gap.note}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== RECOMMENDED ACTIONS ===== */}
      <div style={{ padding: "14px 16px", background: "#fff", borderRadius: 12, border: "1px solid #e8e6e1" }}>
        <div style={{ fontSize: 9, color: "#888", textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 700, marginBottom: 10 }}>
          Recommended Actions
        </div>
        {allCovered ? (
          <div style={{ textAlign: "center", padding: 20, color: "#0F6E56", fontSize: 13, fontWeight: 600, background: "#E1F5EE", borderRadius: 8 }}>
            ✅ All key data points are covered
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {candidateActions.map((item, i) => {
              const uc = { high: "#A32D2D", medium: "#BA7517", low: "#185FA5" };
              const ub = { high: "#FCEBEB", medium: "#FAEEDA", low: "#E6F1FB" };
              return (
                <div
                  key={i}
                  style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", background: "#f8f7f4", borderRadius: 8, borderLeft: `3px solid ${uc[item.urgency]}` }}
                >
                  <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 99, background: ub[item.urgency], color: uc[item.urgency], fontWeight: 700, flexShrink: 0, marginTop: 1 }}>
                    {item.urgency.toUpperCase()}
                  </span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#2c2c2a" }}>{item.action}</div>
                    <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>{item.detail}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===== PROGRAM STATUS ===== */}
      <div style={{ padding: "14px 16px", background: "#fff", borderRadius: 12, border: "1px solid #e8e6e1" }}>
        <div style={{ fontSize: 9, color: "#888", textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 700, marginBottom: 10 }}>
          Program Status
        </div>
        <div style={{ padding: "12px 14px", background: "#f8f7f4", borderRadius: 10, border: "1px solid #e8e6e1" }}>
          <div style={{ fontSize: 11, color: "#5f5e5a", marginBottom: 10 }}>
            Suggested pathway: <strong style={{ color: "#0F6E56" }}>{pathway}</strong>
          </div>
          <button
            onClick={() => onStartProgram && onStartProgram(species)}
            style={{ width: "100%", padding: "10px 14px", background: "#1D9E75", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
          >
            + Start Program
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================
//                  SIDEBAR PIECES
// =============================================================
function SidebarBlock({ title, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 9, color: "#999", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, marginBottom: 8, paddingBottom: 6, borderBottom: "1px solid #e8e6e1" }}>
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {children}
      </div>
    </div>
  );
}

function SidebarRow({ label, value, truncate }) {
  if (value == null || value === "" || value === undefined) {
    return (
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <span style={{ color: "#888" }}>{label}</span>
        <span style={{ color: "#ccc" }}>—</span>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
      <span style={{ color: "#888", flexShrink: 0 }}>{label}</span>
      <span
        title={typeof value === "string" ? value : undefined}
        style={{
          color: "#2c2c2a",
          fontWeight: 500,
          textAlign: "right",
          ...(truncate ? { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 150 } : {}),
        }}
      >
        {value}
      </span>
    </div>
  );
}

// =============================================================
//                  STORY TAB
// =============================================================
function StoryTab({ species, story, nextAction, decision }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {(story?.geocon_rationale || story?.rescue_urgency) && (
        <StoryBlock color="#0F6E56" bg="#f4faf7" border="1px solid #cde7dc" label="GEOCON Perspective">
          {story.geocon_rationale && (
            <p style={{ fontSize: 13, color: "#2c2c2a", lineHeight: 1.65, margin: "0 0 10px" }}>
              {story.geocon_rationale}
            </p>
          )}
          {story.rescue_urgency && (
            <div style={{ fontSize: 12, color: "#A32D2D", lineHeight: 1.6, padding: "10px 12px", background: "#FCEBEB", borderRadius: 8 }}>
              <strong style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 0.6, marginRight: 6 }}>
                Rescue urgency:
              </strong>
              {story.rescue_urgency}
            </div>
          )}
        </StoryBlock>
      )}

      <div style={{ display: "grid", gridTemplateColumns: story?.conservation_context ? "1fr 1fr" : "1fr", gap: 14 }}>
        {(story?.scientific_narrative || story?.habitat_story) && (
          <StoryBlock color="#534AB7" bg="#fbfbff" border="1px solid #e2e0f5" label="Scientific Narrative">
            {story.scientific_narrative && (
              <p style={{ fontSize: 12, color: "#2c2c2a", lineHeight: 1.65, margin: "0 0 10px" }}>
                {story.scientific_narrative}
              </p>
            )}
            {story.habitat_story && (
              <>
                <div style={{ fontSize: 9, color: "#888", textTransform: "uppercase", letterSpacing: 0.6, marginTop: 8, marginBottom: 4 }}>
                  Habitat
                </div>
                <p style={{ fontSize: 11, color: "#5f5e5a", lineHeight: 1.55, margin: 0 }}>
                  {story.habitat_story}
                </p>
              </>
            )}
          </StoryBlock>
        )}

        {story?.conservation_context && (
          <StoryBlock color="#BA7517" bg="#fdf7e9" border="1px solid #ecdcb2" label="Conservation Context">
            <p style={{ fontSize: 12, color: "#2c2c2a", lineHeight: 1.65, margin: 0 }}>
              {story.conservation_context}
            </p>
          </StoryBlock>
        )}
      </div>

      {story?.propagation_pathway && (
        <StoryBlock color="#0F6E56" bg="#E1F5EE" border="1px solid #1D9E75" label="Propagation Pathway">
          <p style={{ fontSize: 12, color: "#2c2c2a", lineHeight: 1.65, margin: 0 }}>
            {story.propagation_pathway}
          </p>
        </StoryBlock>
      )}

      {(story?.commercial_hypothesis || story?.market_narrative || story?.value_chain) && (
        <div style={{ padding: "14px 16px", background: "#f8f7f4", borderRadius: 12, border: "1px solid #e8e6e1", borderLeft: "3px solid #185FA5" }}>
          <div style={{ fontSize: 9, color: "#185FA5", textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 700, marginBottom: 8 }}>
            Commercial Hypothesis
            <span style={{ fontSize: 8, color: "#888", fontWeight: 400, textTransform: "none", marginLeft: 6 }}>
              (GEOCON internal)
            </span>
          </div>

          {story.commercial_hypothesis && (
            <p style={{ fontSize: 12, color: "#2c2c2a", lineHeight: 1.65, margin: "0 0 10px" }}>
              {story.commercial_hypothesis}
            </p>
          )}

          {(story.market_narrative || story.value_chain) && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 4 }}>
              {story.market_narrative && (
                <div>
                  <div style={{ fontSize: 9, color: "#888", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 }}>Market</div>
                  <p style={{ fontSize: 11, color: "#5f5e5a", lineHeight: 1.55, margin: 0 }}>{story.market_narrative}</p>
                </div>
              )}
              {story.value_chain && (
                <div>
                  <div style={{ fontSize: 9, color: "#888", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 }}>Value chain</div>
                  <p style={{ fontSize: 11, color: "#5f5e5a", lineHeight: 1.55, margin: 0 }}>{story.value_chain}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!story && (
        <div style={{ textAlign: "center", padding: 32, background: "#f8f7f4", borderRadius: 12 }}>
          <div style={{ fontSize: 30, marginBottom: 10 }}>📖</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#2c2c2a", marginBottom: 6 }}>No story yet</div>
          <div style={{ fontSize: 11, color: "#888", marginBottom: 14 }}>Generate a GEOCON story for this species.</div>
          <code style={{ fontSize: 10, background: "#fff", padding: "6px 10px", borderRadius: 6, color: "#534AB7", border: "1px solid #e8e6e1" }}>
            /api/harvest/story?species_id={species.id}&secret=atlas2026
          </code>
        </div>
      )}

      {story && (
        <div style={{ fontSize: 10, color: "#b4b2a9", textAlign: "right", marginTop: 4 }}>
          Generated by {story.generated_by || "GEOCON"} · {fmtDate(story.last_generated_at)}
        </div>
      )}
    </div>
  );
}

function ActionChip({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ background: "rgba(15,110,86,0.85)", color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 10, fontWeight: 600, cursor: "pointer" }}
    >
      {label}
    </button>
  );
}

function StoryBlock({ color, bg, border, label, children }) {
  return (
    <div style={{ padding: "14px 16px", background: bg, borderRadius: 12, border, borderLeft: `3px solid ${color}` }}>
      <div style={{ fontSize: 9, color, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 700, marginBottom: 8 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

// =============================================================
//                  OTHER TABS
// =============================================================
function PubsTab({ pubs }) {
  if (!pubs.length) return <Empty msg="No publications found" />;
  return pubs.map((p) => (
    <div key={p.id} style={{ marginBottom: 10, padding: "11px 13px", background: "#f8f7f4", borderRadius: 8, borderLeft: "3px solid #378ADD" }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#2c2c2a", lineHeight: 1.4, marginBottom: 4 }}>
        {p.doi ? (
          <a href={p.doi} target="_blank" rel="noopener noreferrer" style={{ color: "#185FA5", textDecoration: "none" }}>
            {(p.title || "").slice(0, 120)}{(p.title || "").length > 120 ? "..." : ""}
          </a>
        ) : (
          (p.title || "").slice(0, 120)
        )}
      </div>
      <div style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>
        {(p.authors || "").slice(0, 80)}{(p.authors || "").length > 80 ? "..." : ""}
      </div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {p.year && <Chip bg="#E6F1FB" color="#0C447C">{p.year}</Chip>}
        {p.journal && <Chip bg="#EEEDFE" color="#3C3489">{p.journal.slice(0, 30)}</Chip>}
        {p.open_access && <Chip bg="#E1F5EE" color="#085041">OA</Chip>}
      </div>
      {p.abstract && (
        <div style={{ fontSize: 10, color: "#5f5e5a", marginTop: 6, lineHeight: 1.5 }}>
          {p.abstract.slice(0, 220)}...
        </div>
      )}
    </div>
  ));
}

function MetsTab({ mets }) {
  if (!mets.length) return <Empty msg="No metabolites yet" />;
  return mets.map((m) => (
    <div key={m.id} style={{ marginBottom: 10, padding: "11px 13px", background: "#f8f7f4", borderRadius: 8, borderLeft: "3px solid #534AB7" }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#2c2c2a", marginBottom: 4 }}>{m.compound_name}</div>
      {m.reported_activity && (
        <div style={{ fontSize: 11, color: "#5f5e5a", marginBottom: 6 }}>{m.reported_activity}</div>
      )}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {m.compound_class && <Chip bg="#EEEDFE" color="#3C3489">{m.compound_class}</Chip>}
        {m.activity_category && <Chip bg="#E1F5EE" color="#085041">{m.activity_category}</Chip>}
        {m.evidence && <Chip bg="#FAEEDA" color="#633806">{m.evidence}</Chip>}
        {m.confidence && <Chip bg="#f4f3ef" color="#5f5e5a">Conf: {Math.round(m.confidence * 100)}%</Chip>}
      </div>
    </div>
  ));
}

function ConsTab({ cons }) {
  if (!cons.length) return <Empty msg="No conservation assessments yet" />;
  return cons.map((a) => (
    <div key={a.id} style={{ marginBottom: 12, padding: "12px 14px", background: "#f8f7f4", borderRadius: 8, borderLeft: "3px solid #E24B4A" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#2c2c2a" }}>{a.source}</div>
        {a.status_interpreted && <Chip bg={iucnBg(a.status_interpreted)} color={iucnC(a.status_interpreted)}>{a.status_interpreted}</Chip>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px", fontSize: 11 }}>
        {a.assessment_year && <FieldPair label="Year" value={a.assessment_year} />}
        {a.trend && <FieldPair label="Trend" value={a.trend} />}
      </div>
      {a.notes && <div style={{ fontSize: 10, color: "#5f5e5a", marginTop: 6, lineHeight: 1.5 }}>{a.notes}</div>}
    </div>
  ));
}

function GovTab({ gov }) {
  if (!gov) return <Empty msg="No governance data yet" />;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ padding: "14px 16px", background: "#f8f7f4", borderRadius: 8, borderLeft: "3px solid #D85A30" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px" }}>
          {[
            { l: "Access regime", v: gov.access_regime },
            { l: "ABS/Nagoya risk", v: gov.abs_nagoya_risk, col: true },
            { l: "Collection sensitivity", v: gov.collection_sensitivity, col: true },
            { l: "Public visibility", v: gov.public_visibility_level },
          ].map(({ l, v, col }) =>
            v ? (
              <div key={l}>
                <div style={{ fontSize: 9, color: "#b4b2a9", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 3 }}>{l}</div>
                {col ? (
                  <Chip bg={riskBg(v)} color={riskColor(v)}><strong>{v}</strong></Chip>
                ) : (
                  <div style={{ fontSize: 12, color: "#2c2c2a", fontWeight: 500 }}>{v}</div>
                )}
              </div>
            ) : null
          )}
        </div>
      </div>
      {gov.notes && (
        <div style={{ padding: "10px 14px", background: "#f8f7f4", borderRadius: 8, fontSize: 11, color: "#5f5e5a", lineHeight: 1.6 }}>
          {gov.notes}
        </div>
      )}
    </div>
  );
}

function PropTab({ prop }) {
  if (!prop.length) return <Empty msg="No propagation protocols yet" />;
  return prop.map((p) => (
    <div key={p.id} style={{ marginBottom: 12, padding: "12px 14px", background: "#f8f7f4", borderRadius: 8, borderLeft: "3px solid #1D9E75" }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#2c2c2a", marginBottom: 8 }}>{p.protocol_type}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", fontSize: 11 }}>
        {p.explant && <FieldPair label="Explant" value={p.explant} />}
        {p.medium_or_condition && <FieldPair label="Medium" value={p.medium_or_condition} />}
        {p.success_rate != null && <FieldPair label="Success rate" value={`${p.success_rate}%`} highlight="#0F6E56" />}
      </div>
      {p.notes && <div style={{ fontSize: 10, color: "#5f5e5a", marginTop: 8, lineHeight: 1.5 }}>{p.notes}</div>}
    </div>
  ));
}

function CommTab({ comm }) {
  if (!comm.length) return <Empty msg="No commercial hypotheses yet" />;
  return comm.map((h) => (
    <div key={h.id} style={{ marginBottom: 12, padding: "12px 14px", background: "#f8f7f4", borderRadius: 8, borderLeft: "3px solid #185FA5" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#2c2c2a" }}>{h.application_area}</div>
        {h.status && <Chip bg={h.status === "monitor" ? "#FAEEDA" : "#E1F5EE"} color={h.status === "monitor" ? "#633806" : "#085041"}>{h.status}</Chip>}
      </div>
      {h.justification && <div style={{ fontSize: 11, color: "#5f5e5a", lineHeight: 1.6 }}>{h.justification}</div>}
    </div>
  ));
}

function InfoTab({ species }) {
  return (
    <div style={{ padding: "4px 2px" }}>
      <div style={{ fontSize: 10, color: "#999", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, marginBottom: 12 }}>
        Full Species Record
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 22px" }}>
        {[
          { l: "ID", v: species.id },
          { l: "Accepted name", v: species.accepted_name },
          { l: "Genus", v: species.genus },
          { l: "Family", v: species.family },
          { l: "Geophyte type", v: species.geophyte_type },
          { l: "Region", v: species.region },
          { l: "Country", v: species.country_focus },
          { l: "IUCN status", v: species.iucn_status },
          { l: "TC status", v: species.tc_status },
          { l: "Decision", v: species.current_decision || species.decision },
          { l: "Pathway", v: species.pathway || species.program_pathway },
          { l: "Market area", v: species.market_area },
          { l: "Habitat", v: species.habitat },
          { l: "GEOCON module", v: species.module || species.geocon_module },
        ].map(({ l, v }) =>
          v ? (
            <div key={l}>
              <div style={{ fontSize: 9, color: "#999", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 3 }}>{l}</div>
              <div style={{ fontSize: 12, color: "#2c2c2a", fontWeight: 500, lineHeight: 1.4 }}>{v}</div>
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}

// =============================================================
//                  SHARED LITTLE COMPONENTS
// =============================================================
function Empty({ msg }) {
  return <div style={{ textAlign: "center", padding: 40, color: "#999", fontSize: 13 }}>{msg}</div>;
}

function Chip({ children, bg, color }) {
  return (
    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: bg, color, fontWeight: 500, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

function FieldPair({ label, value, highlight }) {
  return (
    <div>
      <div style={{ color: "#b4b2a9", fontSize: 9, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</div>
      <div style={{ color: highlight || "#2c2c2a", fontWeight: highlight ? 700 : 500 }}>{value}</div>
    </div>
  );
}
