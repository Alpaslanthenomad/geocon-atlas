"use client";
import { useState, useEffect } from "react";
import { fetchRecentStories, fetchDueActions } from "../../lib/dashboard";
import { ROLES, S, MODULE_COLORS, MODULE_DESC, STATUS_COLORS } from "../../lib/constants";
import { iucnC, iucnBg, decC, decBg } from "../../lib/helpers";
import { Pill, Dot } from "../shared";

export default function GEOCONHome({ species, publications, metabolites, researchers, programs, user, setView, onSpeciesClick, onStartProgram }) {
  const [recentStories, setRecentStories] = useState([]);
  const [dueActions,    setDueActions]    = useState([]);

  useEffect(() => {
    fetchRecentStories(6).then(setRecentStories);
    fetchDueActions(14, 5).then(setDueActions);
  }, [programs.length]);

  const threatened   = species.filter(s => ["CR","EN","VU"].includes(s.iucn_status)).length;
  const activeProgs  = programs.filter(p => p.status === "Active");
  const blockedProgs = programs.filter(p => p.status === "Blocked" || p.primary_blocker);
  const draftProgs   = programs.filter(p => p.status === "Draft");

  // Species not yet in any program
  const programSpeciesIds = new Set(programs.map(p => p.species_id).filter(Boolean));
  const unassigned = species.filter(s => !programSpeciesIds.has(s.id) && ["CR","EN"].includes(s.iucn_status));

  // Top venture candidates without programs
  const ventureReady = [...species]
    .sort((a,b) => (b.composite_score||0)-(a.composite_score||0))
    .filter(s => !programSpeciesIds.has(s.id))
    .slice(0,5);

  // Module distribution
  const modules = ["Origin","Forge","Mesh","Exchange","Accord"].map(m => ({
    name: m, color: MODULE_COLORS[m], desc: MODULE_DESC[m],
    count: programs.filter(p => p.current_module === m).length,
  }));

  // Story feed — from programs if available, else from publications
  const storyFeed = programs.length > 0
    ? programs.slice(0,5).map(p => ({
        title: p.program_name,
        body:  `${p.current_module} · ${p.current_gate}${p.next_action?` — ${p.next_action}`:""}`,
        type:  p.status,
        cta:   "Open program",
        view:  "programs",
      }))
    : [...publications].sort((a,b)=>(b.year||0)-(a.year||0)).slice(0,4).map(p => ({
        title: `${p.species?.accepted_name||"Species"} — new evidence linked`,
        body:  `${p.year||"Recent"} · ${p.journal||p.source||""}`,
        type:  "Evidence Added",
        cta:   "Review publications",
        view:  "publications",
      }));

  const entryColor = t => ({
    "Evidence Added":"#185FA5","Gate Passed":"#0F6E56","Risk Raised":"#A32D2D",
    "Protocol Updated":"#639922","Decision Made":"#BA7517","Milestone Reached":"#1D9E75",
    "Active":"#0F6E56","Draft":"#888","Blocked":"#A32D2D","On Hold":"#BA7517",
  }[t]||"#888");

  return (
    <div>
      {/* ── Hero metrics ── */}
      <div style={{ ...S.card, padding:24, marginBottom:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", gap:16, alignItems:"flex-start", flexWrap:"wrap", marginBottom:20 }}>
          <div style={{ maxWidth:700 }}>
            <div style={{ fontSize:11, color:"#b4b2a9", letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>GEOCON Home</div>
            <h2 style={{ fontSize:26, margin:"0 0 8px", fontFamily:"Georgia,serif", color:"#2c2c2a", lineHeight:1.2 }}>Program intelligence for species that need action</h2>
            <div style={{ fontSize:13, color:"#6f6d66", lineHeight:1.7 }}>
              Welcome, <strong>{ROLES[user.role]?.label||user.role}</strong>. Monitor active programs, review what needs attention, and drive species from evidence to action.
            </div>
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <button onClick={() => setView("programs")} style={{ padding:"10px 16px", border:"none", borderRadius:10, background:"#1D9E75", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}>View programs</button>
            <button onClick={() => setView("species")}  style={{ padding:"10px 16px", border:"1px solid #1D9E75", borderRadius:10, background:"#fff", color:"#1D9E75", fontSize:12, fontWeight:700, cursor:"pointer" }}>Explore species</button>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,minmax(0,1fr))", gap:10 }}>
          {[
            { l:"Active programs",  v:activeProgs.length,    c:"#1D9E75" },
            { l:"Blocked",          v:blockedProgs.length,   c:"#A32D2D" },
            { l:"Threatened species",v:threatened,           c:"#E24B4A" },
            { l:"Publications",     v:publications.length,   c:"#185FA5" },
            { l:"Metabolites",      v:metabolites.length,    c:"#534AB7" },
          ].map(m => (
            <div key={m.l} style={{ background:"#f7f5f0", padding:"10px 12px", borderRadius:10 }}>
              <div style={S.mLabel}>{m.l}</div>
              <div style={S.mVal(m.c)}>{m.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Active programs + Story feed ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>

        {/* Active programs list */}
        <div style={{ ...S.card, padding:18 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <div style={{ fontSize:15, fontWeight:700, color:"#2c2c2a", fontFamily:"Georgia,serif" }}>Active programs</div>
            <button onClick={() => setView("programs")} style={{ fontSize:11, color:"#1D9E75", background:"none", border:"none", cursor:"pointer", fontWeight:600 }}>View all →</button>
          </div>
          {activeProgs.length === 0 ? (
            <div style={{ textAlign:"center", padding:32, color:"#999", fontSize:13 }}>
              <div style={{ fontSize:28, marginBottom:8 }}>🌿</div>
              No active programs yet. Start a program from any species page.
              <br/>
              <button onClick={() => setView("species")} style={{ marginTop:12, padding:"7px 14px", border:"1px solid #1D9E75", borderRadius:8, background:"#E1F5EE", color:"#085041", fontSize:11, fontWeight:600, cursor:"pointer" }}>
                Find a species to start
              </button>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {activeProgs.slice(0,5).map(p => {
                const modColor = MODULE_COLORS[p.current_module]||"#888";
                return (
                  <div key={p.id} onClick={() => setView("programs")} style={{ padding:"10px 12px", borderRadius:10, background:"#fcfbf9", border:`1px solid ${modColor}22`, borderLeft:`3px solid ${modColor}`, cursor:"pointer" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:"#2c2c2a", lineHeight:1.3 }}>{p.program_name}</div>
                        <div style={{ fontSize:10, fontStyle:"italic", color:"#888", marginTop:2 }}>{p.species?.accepted_name||""}</div>
                      </div>
                      <span style={{ fontSize:9, padding:"2px 7px", borderRadius:99, background:modColor+"15", color:modColor, fontWeight:600, flexShrink:0 }}>{p.current_module}</span>
                    </div>
                    {p.next_action && <div style={{ fontSize:10, color:"#5f5e5a", marginTop:6 }}>→ {p.next_action.slice(0,70)}{p.next_action.length>70?"...":""}</div>}
                    {p.primary_blocker && <div style={{ fontSize:10, color:"#A32D2D", marginTop:3 }}>⚠ {p.primary_blocker.slice(0,60)}</div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Story feed — real data */}
        <div style={{ ...S.card, padding:18 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <div style={{ fontSize:15, fontWeight:700, color:"#2c2c2a", fontFamily:"Georgia,serif" }}>Program story feed</div>
            <span style={{ ...S.pill("#0C447C","#E6F1FB") }}>Live movement</span>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {recentStories.length > 0 ? recentStories.map((s,idx) => (
              <div key={idx} onClick={() => setView("programs")} style={{ padding:"10px 14px", borderRadius:10, background:"#fcfbf9", border:"1px solid #ece9e2", cursor:"pointer" }}
                onMouseEnter={e=>e.currentTarget.style.borderColor="#1D9E75"} onMouseLeave={e=>e.currentTarget.style.borderColor="#ece9e2"}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8, marginBottom:4 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:"#2c2c2a", lineHeight:1.4 }}>{s.title}</div>
                  {s.entry_type && <span style={{ fontSize:9, padding:"2px 7px", borderRadius:99, background:entryColor(s.entry_type)+"18", color:entryColor(s.entry_type), flexShrink:0, fontWeight:600 }}>{s.entry_type}</span>}
                </div>
                {s.summary && <div style={{ fontSize:11, color:"#7d7a72", lineHeight:1.6, marginBottom:4 }}>{s.summary.slice(0,120)}{s.summary.length>120?"...":""}</div>}
                <div style={{ fontSize:10, color:"#b4b2a9" }}>{s.programs?.program_name||""} · {s.entry_date||s.created_at?.split("T")[0]||""}</div>
              </div>
            )) : storyFeed.map((entry,idx) => (
              <div key={idx} style={{ padding:"10px 14px", borderRadius:10, background:"#fcfbf9", border:"1px solid #ece9e2" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8, marginBottom:4 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:"#2c2c2a", lineHeight:1.4 }}>{entry.title}</div>
                  <span style={{ fontSize:9, padding:"2px 7px", borderRadius:99, background:entryColor(entry.type)+"18", color:entryColor(entry.type), flexShrink:0, fontWeight:600 }}>{entry.type}</span>
                </div>
                <div style={{ fontSize:11, color:"#7d7a72", lineHeight:1.6, marginBottom:8 }}>{entry.body}</div>
                <button onClick={() => setView(entry.view)} style={{ padding:"5px 10px", fontSize:11, fontWeight:600, color:"#185FA5", background:"#E6F1FB", border:"none", borderRadius:7, cursor:"pointer" }}>{entry.cta}</button>
              </div>
            ))}
            {recentStories.length === 0 && storyFeed.length === 0 && <div style={{ textAlign:"center", padding:32, color:"#999", fontSize:13 }}>No activity yet — create a program to start the story feed.</div>}
          </div>
          {/* Due actions */}
          {dueActions.length > 0 && (
            <div style={{ marginTop:14, paddingTop:14, borderTop:"1px solid #ece9e2" }}>
              <div style={{ fontSize:12, fontWeight:600, color:"#A32D2D", marginBottom:8 }}>⏰ Due soon</div>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {dueActions.map(a => {
                  const days = Math.ceil((new Date(a.due_date) - new Date()) / 86400000);
                  const col = days <= 0 ? "#A32D2D" : days <= 3 ? "#BA7517" : "#1D9E75";
                  return (
                    <div key={a.id} onClick={() => setView("programs")} style={{ display:"flex", justifyContent:"space-
