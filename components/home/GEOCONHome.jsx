"use client";
import { useState, useEffect } from "react";
import { ROLES, S, MODULE_COLORS, MODULE_DESC } from "../../lib/constants";
import { iucnC, iucnBg } from "../../lib/helpers";
import { Pill } from "../shared";
import { fetchRecentStoryEntries, fetchDueActions } from "../../lib/programs";

export default function GEOCONHome({
  species, publications, metabolites, researchers,
  programs, user, setView, onSpeciesClick,
}) {
  const [storyFeed,   setStoryFeed]   = useState([]);
  const [dueActions,  setDueActions]  = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);

  useEffect(() => {
    if (programs.length === 0) { setFeedLoading(false); return; }
    Promise.all([
      fetchRecentStoryEntries(6),
      fetchDueActions(5),
    ]).then(([stories, actions]) => {
      setStoryFeed(stories);
      setDueActions(actions);
      setFeedLoading(false);
    }).catch(() => setFeedLoading(false));
  }, [programs.length]);

  const threatened        = species.filter(s => ["CR","EN","VU"].includes(s.iucn_status)).length;
  const activeProgs       = programs.filter(p => p.status === "Active");
  const blockedProgs      = programs.filter(p => p.status === "Blocked" || p.primary_blocker);
  const programSpeciesIds = new Set(programs.map(p => p.species_id).filter(Boolean));
  const unassignedUrgent  = species.filter(s => ["CR","EN"].includes(s.iucn_status) && !programSpeciesIds.has(s.id));
  const ventureReady      = [...species].sort((a,b)=>(b.composite_score||0)-(a.composite_score||0)).filter(s => !programSpeciesIds.has(s.id)).slice(0,5);
  const modules = ["Origin","Forge","Mesh","Exchange","Accord"].map(m => ({
    name:m, color:MODULE_COLORS[m], desc:MODULE_DESC[m],
    count: programs.filter(p => p.current_module === m).length,
  }));

  const entryColor = t => ({
    "Evidence Added":"#185FA5","Gate Passed":"#0F6E56","Risk Raised":"#A32D2D",
    "Protocol Updated":"#639922","Decision Made":"#BA7517","Milestone Reached":"#1D9E75",
    "Governance Review Opened":"#D85A30","Community Signal Added":"#534AB7",
    "Active":"#0F6E56","Draft":"#888","Blocked":"#A32D2D",
  }[t]||"#888");

  const fallbackFeed = [...publications].sort((a,b)=>(b.year||0)-(a.year||0)).slice(0,4).map(p => ({
    title:`${p.species?.accepted_name||"Species"} — new evidence linked`,
    body:`${p.year||"Recent"} · ${p.journal||p.source||""}`,
    type:"Evidence Added", cta:"Review publications", view:"publications",
  }));

  return <div>
    {/* Hero */}
    <div style={{...S.card,padding:24,marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"flex-start",flexWrap:"wrap",marginBottom:20}}>
        <div style={{maxWidth:700}}>
          <div style={{fontSize:11,color:"#b4b2a9",letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>GEOCON Home</div>
          <h2 style={{fontSize:26,margin:"0 0 8px",fontFamily:"Georgia,serif",color:"#2c2c2a",lineHeight:1.2}}>Program intelligence for species that need action</h2>
          <div style={{fontSize:13,color:"#6f6d66",lineHeight:1.7}}>Welcome, <strong>{ROLES[user.role]?.label||user.role}</strong>. Monitor active programs, review what needs attention, and drive species from evidence to action.</div>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <button onClick={()=>setView("programs")} style={{padding:"10px 16px",border:"none",borderRadius:10,background:"#1D9E75",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>View programs</button>
          <button onClick={()=>setView("species")}  style={{padding:"10px 16px",border:"1px solid #1D9E75",borderRadius:10,background:"#fff",color:"#1D9E75",fontSize:12,fontWeight:700,cursor:"pointer"}}>Explore species</button>
        </div>
      </div>
      {/* Programs-first metrics */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,minmax(0,1fr))",gap:10}}>
        {[
          {l:"Active programs",   v:activeProgs.length,  c:"#1D9E75"},
          {l:"Blocked",           v:blockedProgs.length, c:"#A32D2D"},
          {l:"Due actions",       v:dueActions.length,   c:"#BA7517"},
          {l:"Threatened species",v:threatened,          c:"#E24B4A"},
          {l:"Publications",      v:publications.length, c:"#185FA5"},
        ].map(m=><div key={m.l} style={{background:"#f7f5f0",padding:"10px 12px",borderRadius:10}}>
          <div style={S.mLabel}>{m.l}</div>
          <div style={S.mVal(m.c)}>{m.v}</div>
        </div>)}
      </div>
    </div>

    {/* Active programs + Story feed */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
      {/* Active programs */}
      <div style={{...S.card,padding:18}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{fontSize:15,fontWeight:700,color:"#2c2c2a",fontFamily:"Georgia,serif"}}>Active programs</div>
          <button onClick={()=>setView("programs")} style={{fontSize:11,color:"#1D9E75",background:"none",border:"none",cursor:"pointer",fontWeight:600}}>View all →</button>
        </div>
        {activeProgs.length===0
          ?<div style={{textAlign:"center",padding:32,color:"#999",fontSize:12}}>
            <div style={{fontSize:28,marginBottom:8}}>🌿</div>No active programs yet.
            <br/><button onClick={()=>setView("species")} style={{marginTop:12,padding:"7px 14px",border:"1px solid #1D9E75",borderRadius:8,background:"#E1F5EE",color:"#085041",fontSize:11,fontWeight:600,cursor:"pointer"}}>Find a species to start</button>
          </div>
          :<div style={{display:"flex",flexDirection:"column",gap:8}}>
            {activeProgs.slice(0,5).map(p=>{const mc=MODULE_COLORS[p.current_module]||"#888";return<div key={p.id} onClick={()=>setView("programs")} style={{padding:"10px 12px",borderRadius:10,background:"#fcfbf9",border:`1px solid ${mc}22`,borderLeft:`3px solid ${mc}`,cursor:"pointer"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:700,color:"#2c2c2a",lineHeight:1.3}}>{p.program_name}</div>
                  {p.species&&<div style={{fontSize:10,fontStyle:"italic",color:"#888",marginTop:2}}>{p.species.accepted_name}</div>}
                </div>
                <span style={{fontSize:9,padding:"2px 7px",borderRadius:99,background:mc+"15",color:mc,fontWeight:600,flexShrink:0}}>{p.current_module}</span>
              </div>
              {p.next_action&&<div style={{fontSize:10,color:"#5f5e5a",marginTop:6}}>→ {p.next_action.slice(0,65)}</div>}
              {p.primary_blocker&&<div style={{fontSize:10,color:"#A32D2D",marginTop:3}}>⚠ {p.primary_blocker.slice(0,55)}</div>}
            </div>;})}
          </div>
        }
      </div>

      {/* Story feed — real data */}
      <div style={{...S.card,padding:18}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{fontSize:15,fontWeight:700,color:"#2c2c2a",fontFamily:"Georgia,serif"}}>Program story feed</div>
          <span style={{...S.pill("#0C447C","#E6F1FB")}}>Live movement</span>
        </div>
        {feedLoading?<div style={{textAlign:"center",padding:32,color:"#999",fontSize:12}}>Loading...</div>
        :storyFeed.length>0
          ?<div style={{display:"flex",flexDirection:"column",gap:8}}>
            {storyFeed.map((entry,idx)=><div key={entry.id||idx} style={{padding:"10px 14px",borderRadius:10,background:"#fcfbf9",border:"1px solid #ece9e2"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,marginBottom:4}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:11,fontWeight:600,color:"#2c2c2a",lineHeight:1.4}}>{entry.title}</div>
                  {entry.programs&&<div style={{fontSize:10,color:"#888",marginTop:1,fontStyle:"italic"}}>{entry.programs.program_name}</div>}
                </div>
                <span style={{fontSize:9,padding:"2px 7px",borderRadius:99,background:entryColor(entry.entry_type)+"18",color:entryColor(entry.entry_type),flexShrink:0,fontWeight:600}}>{entry.entry_type}</span>
              </div>
              {entry.summary&&<div style={{fontSize:10,color:"#7d7a72",lineHeight:1.6}}>{entry.summary.slice(0,100)}{entry.summary.length>100?"...":""}</div>}
              <div style={{fontSize:9,color:"#b4b2a9",marginTop:4}}>{entry.entry_date}</div>
            </div>)}
          </div>
          :fallbackFeed.length>0
            ?<div style={{display:"flex",flexDirection:"column",gap:8}}>
              {fallbackFeed.map((entry,idx)=><div key={idx} style={{padding:"10px 14px",borderRadius:10,background:"#fcfbf9",border:"1px solid #ece9e2"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,marginBottom:4}}>
                  <div style={{fontSize:11,fontWeight:600,color:"#2c2c2a"}}>{entry.title}</div>
                  <span style={{fontSize:9,padding:"2px 7px",borderRadius:99,background:entryColor(entry.type)+"18",color:entryColor(entry.type),flexShrink:0,fontWeight:600}}>{entry.type}</span>
                </div>
                <div style={{fontSize:10,color:"#7d7a72"}}>{entry.body}</div>
                <button onClick={()=>setView(entry.view)} style={{marginTop:6,padding:"4px 10px",fontSize:10,fontWeight:600,color:"#185FA5",background:"#E6F1FB",border:"none",borderRadius:6,cursor:"pointer"}}>{entry.cta}</button>
              </div>)}
            </div>
            :<div style={{textAlign:"center",padding:32,color:"#999",fontSize:12}}>No activity yet — create a program and add story entries.</div>
        }
      </div>
    </div>

    {/* Priority queue + Module map */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
      {/* Priority queue */}
      <div style={{...S.card,padding:18}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{fontSize:15,fontWeight:700,color:"#2c2c2a",fontFamily:"Georgia,serif"}}>What needs attention now</div>
          <span style={{...S.pill("#633806","#FAEEDA")}}>Priority queue</span>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {[
            {title:"Programs with blockers",    value:blockedProgs.length,      desc:"Programs with an active blocker or in blocked status.",     action:"Review programs",    view:"programs",color:"#A32D2D"},
            {title:"CR/EN without a program",   value:unassignedUrgent.length,  desc:"Most urgent species not yet in any GEOCON program.",        action:"Inspect threatened", view:"species", color:"#BA7517"},
            {title:"Due actions",               value:dueActions.length,        desc:"Open actions that are overdue or high priority.",           action:"View programs",      view:"programs",color:"#D85A30"},
            {title:"High-potential candidates", value:ventureReady.length,      desc:"Top-scoring species not yet assigned to any program.",      action:"Explore top species",view:"species", color:"#185FA5"},
          ].map(item=><div key={item.title} style={{padding:"12px 14px",borderRadius:12,background:"#fcfbf9",border:"1px solid #ece9e2",borderLeft:`3px solid ${item.color}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <div style={{fontSize:13,fontWeight:600,color:"#2c2c2a"}}>{item.title}</div>
              <div style={{fontSize:22,fontWeight:700,color:item.color,fontFamily:"Georgia,serif"}}>{item.value}</div>
            </div>
            <div style={{fontSize:11,color:"#7d7a72",lineHeight:1.6,marginBottom:10}}>{item.desc}</div>
            <button onClick={()=>setView(item.view)} style={{padding:"7px 12px",fontSize:11,fontWeight:600,color:item.color,background:item.color+"15",border:"none",borderRadius:8,cursor:"pointer"}}>{item.action}</button>
          </div>)}
        </div>
      </div>

      {/* Module map + due actions */}
      <div style={{...S.card,padding:18}}>
        <div style={{fontSize:15,fontWeight:700,color:"#2c2c2a",fontFamily:"Georgia,serif",marginBottom:14}}>Module map</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
          {modules.map(m=><div key={m.name} onClick={()=>setView("programs")} style={{padding:14,borderRadius:12,background:"#fcfbf9",border:`1px solid ${m.color}22`,cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.borderColor=m.color} onMouseLeave={e=>e.currentTarget.style.borderColor=m.color+"22"}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
              <div style={{fontSize:12,fontWeight:700,color:m.color}}>{m.name}</div>
              <div style={{fontSize:20,fontWeight:700,color:"#2c2c2a",fontFamily:"Georgia,serif"}}>{m.count}</div>
            </div>
            <div style={{fontSize:10,color:"#7d7a72",lineHeight:1.5}}>{m.desc}</div>
          </div>)}
        </div>
        {dueActions.length>0&&<>
          <div style={{fontSize:11,fontWeight:600,color:"#2c2c2a",marginBottom:8}}>Due actions</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {dueActions.slice(0,3).map(a=><div key={a.id} style={{padding:"8px 10px",borderRadius:8,background:"#FAEEDA",border:"1px solid #BA7517",fontSize:11}}>
              <div style={{fontWeight:600,color:"#633806"}}>{a.action_title}</div>
              {a.programs&&<div style={{fontSize:10,color:"#854F0B",marginTop:2}}>{a.programs.program_name}</div>}
              {a.due_date&&<div style={{fontSize:9,color:"#854F0B",marginTop:2}}>📅 {a.due_date}</div>}
            </div>)}
          </div>
        </>}
      </div>
    </div>

    {/* Featured species (secondary) */}
    <div style={{...S.card,padding:18,marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div>
          <div style={{fontSize:15,fontWeight:700,color:"#2c2c2a",fontFamily:"Georgia,serif"}}>Featured species</div>
          <div style={{fontSize:11,color:"#888",marginTop:2}}>Top candidates not yet in any program — click to open, then start a GEOCON journey</div>
        </div>
        <span style={{...S.pill("#085041","#E1F5EE")}}>Action candidates</span>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}}>
        {ventureReady.map(s=><div key={s.id} onClick={()=>onSpeciesClick(s)} style={{padding:"10px 12px",borderRadius:10,background:"#fcfbf9",border:"1px solid #e8e6e1",cursor:"pointer",display:"flex",alignItems:"center",gap:10}} onMouseEnter={e=>e.currentTarget.style.borderColor="#1D9E75"} onMouseLeave={e=>e.currentTarget.style.borderColor="#e8e6e1"}>
          {s.thumbnail_url&&<img src={s.thumbnail_url} alt={s.accepted_name} style={{width:38,height:38,borderRadius:8,objectFit:"cover",flexShrink:0}} onError={e=>e.target.style.display="none"}/>}
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:11,fontWeight:700,fontStyle:"italic",color:"#2c2c2a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.accepted_name}</div>
            <div style={{display:"flex",gap:4,marginTop:3,flexWrap:"wrap"}}>
              {s.iucn_status&&<span style={{fontSize:9,padding:"1px 5px",borderRadius:99,background:iucnBg(s.iucn_status),color:iucnC(s.iucn_status)}}>{s.iucn_status}</span>}
              <span style={{fontSize:9,padding:"1px 5px",borderRadius:99,background:"#f4f3ef",color:"#5f5e5a"}}>Score {s.composite_score||"—"}</span>
            </div>
          </div>
        </div>)}
      </div>
    </div>

    {/* Ask GEOCON */}
    <div style={{...S.card,padding:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
        <div>
          <div style={{fontSize:15,fontWeight:700,color:"#2c2c2a",fontFamily:"Georgia,serif",marginBottom:4}}>Ask GEOCON</div>
          <div style={{fontSize:11,color:"#7d7a72"}}>The intelligence layer — coming in the next phase.</div>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {["Which species are closest to venture readiness?","Which programs are blocked?","Show understudied high-potential species"].map(q=><button key={q} onClick={()=>setView("species")} style={{padding:"8px 12px",fontSize:11,color:"#534AB7",background:"#EEEDFE",border:"none",borderRadius:8,cursor:"pointer"}}>{q}</button>)}
        </div>
      </div>
    </div>
  </div>;
}
