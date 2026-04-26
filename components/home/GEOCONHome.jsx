"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { ROLES, S, MODULE_COLORS, MODULE_DESC, STATUS_COLORS } from "../../lib/constants";
import { iucnC, iucnBg, decC, decBg } from "../../lib/helpers";
import { Pill, Dot } from "../shared";

export default function GEOCONHome({ species, publications, metabolites, researchers, programs, user, setView, onSpeciesClick, onStartProgram }) {
  const [recentStories, setRecentStories] = useState([]);
  const [dueActions,    setDueActions]    = useState([]);

  useEffect(() => {
    // Fetch real story entries
    supabase.from("program_story_entries")
      .select("*, programs(program_name)")
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => setRecentStories(data || []));

    // Fetch due actions (open, due within 14 days)
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + 14);
    supabase.from("program_actions")
      .select("*, programs(program_name)")
      .eq("status", "open")
      .lte("due_date", cutoff.toISOString().split("T")[0])
      .order("due_date", { ascending: true })
      .limit(5)
      .then(({ data }) => setDueActions(data || []));
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
        {/* Hero metric bar (HIDDEN: change `false` to `true` to re-enable — duplicates top page metric bar) */}
        {false && (
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
        )}
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
                    <div key={a.id} onClick={() => setView("programs")} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 10px", borderRadius:8, background:col+"0D", border:`1px solid ${col}22`, cursor:"pointer" }}>
                      <div>
                        <div style={{ fontSize:11, fontWeight:600, color:"#2c2c2a" }}>{a.action_title}</div>
                        <div style={{ fontSize:10, color:"#888" }}>{a.programs?.program_name||""}</div>
                      </div>
                      <span style={{ fontSize:10, fontWeight:700, color:col, flexShrink:0 }}>{days <= 0 ? "Overdue" : days === 1 ? "Tomorrow" : `${days}d`}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── What needs attention + Module map ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:16, marginBottom:16 }}>

        {/* Priority queue */}
        <div style={{ ...S.card, padding:18 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <div style={{ fontSize:15, fontWeight:700, color:"#2c2c2a", fontFamily:"Georgia,serif" }}>What needs attention now</div>
            <span style={{ ...S.pill("#633806","#FAEEDA") }}>Priority queue</span>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {[
              { title:"Programs with blockers",    value:blockedProgs.length,   desc:"Active programs with a blocker or in blocked status.",        action:"Review programs",        view:"programs",    color:"#A32D2D" },
              { title:"CR/EN without a program",   value:unassigned.length,     desc:"Most urgent species not yet in any GEOCON program.",           action:"Inspect threatened",     view:"species",     color:"#BA7517" },
              // HIDDEN: High-potential candidates card — duplicates Featured species section below
              // { title:"High-potential candidates", value:ventureReady.length,   desc:"Top-scoring species not yet assigned to a program.",           action:"Explore top species",    view:"species",     color:"#185FA5" },
            ].map(item => (
              <div key={item.title} style={{ padding:14, borderRadius:12, background:"#fcfbf9", border:"1px solid #ece9e2", borderLeft:`3px solid ${item.color}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"#2c2c2a" }}>{item.title}</div>
                  <div style={{ fontSize:22, fontWeight:700, color:item.color, fontFamily:"Georgia,serif" }}>{item.value}</div>
                </div>
                <div style={{ fontSize:11, color:"#7d7a72", lineHeight:1.6, marginBottom:10 }}>{item.desc}</div>
                <button onClick={() => setView(item.view)} style={{ padding:"7px 12px", fontSize:11, fontWeight:600, color:item.color, background:item.color+"15", border:"none", borderRadius:8, cursor:"pointer" }}>{item.action}</button>
              </div>
            ))}
          </div>
        </div>

        {/* Module map (HIDDEN: change `false` to `true` to re-enable — all 0 until first program) */}
        {false && (
        <div style={{ ...S.card, padding:18 }}>
          <div style={{ fontSize:15, fontWeight:700, color:"#2c2c2a", fontFamily:"Georgia,serif", marginBottom:14 }}>Module map</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {modules.map(m => (
              <div key={m.name} onClick={() => setView("programs")} style={{ padding:14, borderRadius:12, background:"#fcfbf9", border:`1px solid ${m.color}22`, cursor:"pointer" }} onMouseEnter={e=>e.currentTarget.style.borderColor=m.color} onMouseLeave={e=>e.currentTarget.style.borderColor=m.color+"22"}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:m.color }}>{m.name}</div>
                  <div style={{ fontSize:20, fontWeight:700, color:"#2c2c2a", fontFamily:"Georgia,serif" }}>{m.count}</div>
                </div>
                <div style={{ fontSize:10, color:"#7d7a72", lineHeight:1.5 }}>{m.desc}</div>
              </div>
            ))}
          </div>
        </div>
        )}
      </div>

      {/* ── Featured species (secondary) ── */}
      <div style={{ ...S.card, padding:18, marginBottom:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:"#2c2c2a", fontFamily:"Georgia,serif" }}>Featured species</div>
            <div style={{ fontSize:11, color:"#888", marginTop:2 }}>Top candidates not yet in any program — click to open, then start a program</div>
          </div>
          <span style={{ ...S.pill("#085041","#E1F5EE") }}>Action candidates</span>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:10 }}>
          {ventureReady.map(s => (
            <div key={s.id} onClick={() => onSpeciesClick(s)} style={{ padding:"10px 12px", borderRadius:10, background:"#fcfbf9", border:"1px solid #e8e6e1", cursor:"pointer", display:"flex", alignItems:"center", gap:10 }} onMouseEnter={e=>e.currentTarget.style.borderColor="#1D9E75"} onMouseLeave={e=>e.currentTarget.style.borderColor="#e8e6e1"}>
              {s.thumbnail_url && <img src={s.thumbnail_url} alt={s.accepted_name} style={{ width:38, height:38, borderRadius:8, objectFit:"cover", flexShrink:0 }} onError={e=>e.target.style.display="none"} />}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:11, fontWeight:700, fontStyle:"italic", color:"#2c2c2a", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.accepted_name}</div>
                <div style={{ display:"flex", gap:4, marginTop:3, flexWrap:"wrap" }}>
                  {s.iucn_status && <span style={{ fontSize:9, padding:"1px 5px", borderRadius:99, background:iucnBg(s.iucn_status), color:iucnC(s.iucn_status) }}>{s.iucn_status}</span>}
                  <span style={{ fontSize:9, padding:"1px 5px", borderRadius:99, background:"#f4f3ef", color:"#5f5e5a" }}>Score {s.composite_score||"—"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Impact / Outcomes ── (HIDDEN: change `false` to `true` to re-enable) */}
      {false && (
      <div style={{ ...S.card, padding:18, marginBottom:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div style={{ fontSize:15, fontWeight:700, color:"#2c2c2a", fontFamily:"Georgia,serif" }}>Impact & outcomes</div>
          <span style={{ ...S.pill("#085041","#E1F5EE") }}>Platform progress</span>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:10 }}>
          {[
            { l:"Active rescue programs",  v:activeProgs.length,                                                    c:"#1D9E75", icon:"🛡" },
            { l:"Species in programs",     v:new Set(programs.map(p=>p.species_id).filter(Boolean)).size,           c:"#185FA5", icon:"🌿" },
            { l:"CR/EN species tracked",   v:species.filter(s=>["CR","EN"].includes(s.iucn_status)).length,         c:"#A32D2D", icon:"⚠️" },
            { l:"Total compounds found",   v:metabolites.length,                                                    c:"#534AB7", icon:"⚗️" },
            { l:"Publications indexed",    v:publications.length,                                                   c:"#D85A30", icon:"📚" },
            { l:"Researchers in network",  v:researchers.length,                                                    c:"#BA7517", icon:"👨‍🔬" },
          ].map(m => (
            <div key={m.l} style={{ padding:"12px 14px", borderRadius:12, background:"#fcfbf9", border:"1px solid #ece9e2", textAlign:"center" }}>
              <div style={{ fontSize:20, marginBottom:4 }}>{m.icon}</div>
              <div style={{ fontSize:22, fontWeight:700, color:m.c, fontFamily:"Georgia,serif", lineHeight:1 }}>{m.v}</div>
              <div style={{ fontSize:10, color:"#7d7a72", marginTop:4, lineHeight:1.4 }}>{m.l}</div>
            </div>
          ))}
        </div>
      </div>
      )}

      {/* ── Ask GEOCON ── */}
      <AskGEOCON species={species} programs={programs} metabolites={metabolites} publications={publications} setView={setView} />
    </div>
  );
}

function AskGEOCON({ species, programs, metabolites, publications, setView }) {
  const [query,    setQuery]    = useState("");
  const [answer,   setAnswer]   = useState(null);
  const [loading,  setLoading]  = useState(false);

  const SUGGESTED = [
    "Which species are closest to venture readiness?",
    "Which programs are blocked and why?",
    "Which CR or EN species have no program yet?",
    "Which genera have the most metabolites?",
    "What are the top 5 species by composite score?",
  ];

  async function ask(q) {
    const question = q || query;
    if (!question.trim()) return;
    setLoading(true);
    setAnswer(null);

    // Build a compact data summary to send to Claude
    const top20 = [...species]
      .sort((a,b) => (b.composite_score||0)-(a.composite_score||0))
      .slice(0,20)
      .map(s => `${s.accepted_name} | IUCN:${s.iucn_status||"?"} | Score:${s.composite_score||0} | Decision:${s.decision||"?"} | Program:${programs.some(p=>p.species_id===s.id)?"Yes":"No"}`);

    const blockedProgs = programs.filter(p => p.status==="Blocked" || p.primary_blocker);
    const activeProgs  = programs.filter(p => p.status==="Active");
    const unassigned   = species.filter(s => ["CR","EN"].includes(s.iucn_status) && !programs.some(p=>p.species_id===s.id));

    const context = `GEOCON ATLAS Data Summary:
- Total species: ${species.length} | CR: ${species.filter(s=>s.iucn_status==="CR").length} | EN: ${species.filter(s=>s.iucn_status==="EN").length}
- Active programs: ${activeProgs.length} | Blocked: ${blockedProgs.length}
- CR/EN without program: ${unassigned.length}
- Total metabolites: ${metabolites.length} | Publications: ${publications.length}

Top 20 species by composite score:
${top20.join("\n")}

Blocked programs: ${blockedProgs.map(p=>`${p.program_name} (${p.primary_blocker||p.status})`).join(", ")||"None"}

Active programs: ${activeProgs.map(p=>`${p.program_name} - ${p.current_module}/${p.current_gate}`).join(", ")||"None"}`;

    try {
      const res = await fetch("/api/ask-geocon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, context })
      });
      const data = await res.json();
      if (data.answer) {
        setAnswer(data.answer);
      } else {
        setAnswer("Error: " + (data.error || "Unknown error"));
      }
    } catch(e) {
      setAnswer("Error: " + e.message);
    }
        setLoading(false);
  }

  return (
    <div style={{ ...S.card, padding:20 }}>
      <div style={{ fontSize:15, fontWeight:700, color:"#2c2c2a", fontFamily:"Georgia,serif", marginBottom:4 }}>Ask GEOCON</div>
      <div style={{ fontSize:11, color:"#7d7a72", marginBottom:14 }}>Intelligence layer — ask anything about species, programs, or strategy.</div>

      {/* Suggested questions */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
        {SUGGESTED.map(q => (
          <button key={q} onClick={() => { setQuery(q); ask(q); }} style={{ padding:"6px 10px", fontSize:10, color:"#534AB7", background:"#EEEDFE", border:"1px solid #534AB722", borderRadius:8, cursor:"pointer" }}>{q}</button>
        ))}
      </div>

      {/* Input */}
      <div style={{ display:"flex", gap:8, marginBottom:14 }}>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && ask()}
          placeholder="Ask anything about the GEOCON portfolio..."
          style={{ flex:1, ...S.input }}
        />
        <button
          onClick={() => ask()}
          disabled={loading || !query.trim()}
          style={{ padding:"8px 18px", background: loading||!query.trim() ? "#ccc" : "#1D9E75", color:"#fff", border:"none", borderRadius:8, cursor: loading||!query.trim() ? "default" : "pointer", fontSize:12, fontWeight:600, flexShrink:0 }}
        >
          {loading ? "..." : "Ask"}
        </button>
      </div>

      {/* Answer */}
      {loading && (
        <div style={{ padding:"14px 16px", background:"#f8f7f4", borderRadius:10, fontSize:12, color:"#888", fontStyle:"italic" }}>
          GEOCON is thinking...
        </div>
      )}
      {answer && (
        <div style={{ padding:"14px 16px", background:"linear-gradient(135deg,#E1F5EE,#f8fff8)", borderRadius:10, border:"1px solid #1D9E75", fontSize:12, color:"#2c2c2a", lineHeight:1.8, whiteSpace:"pre-wrap" }}>
          <div style={{ fontSize:9, color:"#085041", textTransform:"uppercase", letterSpacing:0.8, fontWeight:600, marginBottom:8 }}>GEOCON Intelligence</div>
          {answer}
        </div>
      )}
    </div>
  );
}
