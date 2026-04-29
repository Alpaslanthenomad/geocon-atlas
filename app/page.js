"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { ROLES, S, FAMILY_COLORS, DEF_FAM, MODULE_COLORS, STATUS_COLORS } from "../lib/constants";
import { iucnC, iucnBg, flag, decC, decBg, freshC, riskColor, riskBg } from "../lib/helpers";
import { useAuth } from "../lib/auth";

// Shared
import { Pill, Dot, MiniBar, Loading, SecondaryLoading, RadarChart } from "../components/shared";

// Auth (Open Platform)
import AuthBar from "../components/auth/AuthBar";
import AuthModal from "../components/auth/AuthModal";
import ClaimResearcherModal from "../components/auth/ClaimResearcherModal";
import MyProfilePanel from "../components/auth/MyProfilePanel";
import AdminApprovalPanel from "../components/auth/AdminApprovalPanel";

// Home
import GEOCONHome from "../components/home/GEOCONHome";

// Programs
import StartProgramModal from "../components/programs/StartProgramModal";
import ProgramsView from "../components/programs/ProgramsView";

// Metabolites
import MetaboliteExplorer from "../components/metabolites/MetaboliteExplorer";

// Publications
import PublicationsView from "../components/publications/PublicationsView";

// Researchers
import ResearchersView from "../components/researchers/ResearchersView";
import ResearcherDetailPanel from "../components/researchers/ResearcherDetailPanel";

/* ─────────────────────────────────────────────────────────
   Helpers & constants are imported from lib/ (above).
   See lib/helpers.js for: iucnC, iucnBg, flag, decC, decBg, freshC, riskColor, riskBg
   See lib/constants.js for: ROLES, S, FAMILY_COLORS, DEF_FAM, MODULE_COLORS, STATUS_COLORS
───────────────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────────────
   Helpers & constants are imported from lib/ (above).
   See lib/helpers.js for: iucnC, iucnBg, flag, decC, decBg, freshC, riskColor, riskBg
   See lib/constants.js for: ROLES, S, FAMILY_COLORS, DEF_FAM, MODULE_COLORS, STATUS_COLORS
───────────────────────────────────────────────────────── */

/* ══════════════════════════════════════════════════════════
   INLINE COMPONENTS (to be extracted in next refactor pass)
══════════════════════════════════════════════════════════ */

/* ── Species Detail Panel ── */
function SpeciesDetailPanel({species,programs,metabolitePublications=[],onClose,onStartProgram,onOpenProgram,onOpenResearcher,breadcrumbBack}){
  const[pubs,setPubs]=useState([]);const[mets,setMets]=useState([]);const[cons,setCons]=useState([]);const[gov,setGov]=useState(null);const[prop,setProp]=useState([]);const[comm,setComm]=useState([]);const[locs,setLocs]=useState([]);const[story,setStory]=useState(null);const[loading,setLoading]=useState(true);const[tab,setTab]=useState("decision");
  // B yönü: bu tür hangi programlarda kullanılıyor (multi-species programlar dahil)
  const[usedInPrograms,setUsedInPrograms]=useState([]);
  useEffect(()=>{
    if(!species)return;
    setLoading(true);setPubs([]);setMets([]);setCons([]);setGov(null);setProp([]);setComm([]);setLocs([]);setStory(null);setUsedInPrograms([]);setTab("decision");
    Promise.all([
      supabase.from("publications").select("id,title,authors,year,journal,doi,open_access,source,abstract").eq("species_id",species.id).order("year",{ascending:false}).limit(50),
      supabase.from("metabolites").select("id,compound_name,compound_class,cas_number,reported_activity,activity_category,evidence,confidence,therapeutic_area,plant_organ").eq("species_id",species.id).order("confidence",{ascending:false}),
      supabase.from("conservation").select("*").eq("species_id",species.id),
      supabase.from("governance").select("*").eq("species_id",species.id).maybeSingle(),
      supabase.from("propagation").select("*").eq("species_id",species.id),
      supabase.from("commercial").select("*").eq("species_id",species.id),
      supabase.from("locations").select("*").eq("species_id",species.id),
      supabase.from("species_stories").select("*").eq("species_id",species.id).maybeSingle(),
      // Bu türün dahil olduğu tüm programlar (program_species üzerinden)
      supabase.from("program_species").select("role,added_at,programs(id,program_name,status,current_module,current_gate,priority_score)").eq("species_id",species.id),
    ]).then(([pubR,metR,conR,govR,propR,commR,locR,storyR,upR])=>{
      setPubs(pubR.data||[]);setMets(metR.data||[]);setCons(conR.data||[]);setGov(govR.data||null);setProp(propR.data||[]);setComm(commR.data||[]);setLocs(locR.data||[]);setStory(storyR.data||null);setUsedInPrograms(upR.data||[]);setLoading(false);
    });
  },[species?.id]);
  if(!species)return null;
  const c=FAMILY_COLORS[species.family]||DEF_FAM;
  const TABS=[{k:"decision",l:"⚡ Program Readiness"},{k:"story",l:"Story"},{k:"pubs",l:`Publications (${pubs.length})`},{k:"mets",l:`Metabolites (${mets.length})`},{k:"cons",l:"Conservation"},{k:"gov",l:"Governance"},{k:"prop",l:"Propagation"},{k:"comm",l:"Commercial"},{k:"linked",l:"Linked"}];

  return<>
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:100}}/>
    <div style={{position:"fixed",inset:0,zIndex:101,display:"flex",flexDirection:"column",background:"#f8f7f4"}}>

      {/* ── Gradient Header ── */}
      <div style={{background:"linear-gradient(150deg,#0a4a3e 0%,#1a8a68 65%,#3eaf85 100%)",flexShrink:0}}>
        <div style={{padding:"16px 24px 0"}}>
          {/* Back + breadcrumb */}
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
            <button onClick={onClose} style={{background:"rgba(255,255,255,0.15)",border:"none",borderRadius:6,padding:"5px 12px",color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer"}}>{breadcrumbBack?`← ${breadcrumbBack}`:"← Back"}</button>
            <span style={{fontSize:11,color:"rgba(255,255,255,0.6)"}}>{species.family} › {species.genus} › {species.accepted_name}</span>
          </div>
          {/* Species info row — thumbnail | name+pills | score grid yatay */}
          <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:14}}>
            {species.photo_url
              ?<img src={species.photo_url} alt={species.accepted_name} style={{width:60,height:60,borderRadius:10,objectFit:"cover",border:"1.5px solid rgba(255,255,255,0.3)",flexShrink:0}} onError={e=>e.target.style.display="none"}/>
              :<div style={{width:60,height:60,borderRadius:10,background:"rgba(255,255,255,0.15)",border:"1.5px solid rgba(255,255,255,0.25)",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>🌿</div>
            }
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.6)",textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>{species.family} · {species.geophyte_type||"Geophyte"}</div>
              <div style={{fontSize:20,fontWeight:600,fontStyle:"italic",color:"#fff",lineHeight:1.2,marginBottom:6}}>{species.accepted_name}{species.common_name&&<span style={{fontSize:13,fontStyle:"normal",opacity:0.7,marginLeft:8}}>· {species.common_name}</span>}</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {species.iucn_status&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:99,background:"rgba(162,45,45,0.7)",color:"#fff",fontWeight:600}}>IUCN: {species.iucn_status}</span>}
                {species.country_focus&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:99,background:"rgba(255,255,255,0.15)",color:"rgba(255,255,255,0.9)"}}>{flag(species.country_focus)}</span>}
                {species.current_decision&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:99,background:decBg(species.current_decision),color:decC(species.current_decision),fontWeight:600}}>{species.current_decision}</span>}
                {species.recommended_pathway&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:99,background:"rgba(255,255,255,0.15)",color:"rgba(255,255,255,0.85)"}}>{species.recommended_pathway}</span>}
              </div>
            </div>
            {/* Score grid — thumbnail ile aynı hizada, yatay, monospace */}
            <div style={{display:"flex",gap:6,flexShrink:0}}>
              {[{l:"Conservation",v:species.score_conservation},{l:"Scientific",v:species.score_scientific},{l:"Economic",v:species.score_venture},{l:"Feasibility",v:species.score_feasibility}].map(({l,v})=><div key={l} style={{background:"rgba(255,255,255,0.08)",borderRadius:8,padding:"10px 12px",textAlign:"center",border:"1px solid rgba(255,255,255,0.14)",minWidth:78}}>
                <div style={{fontSize:28,fontWeight:600,color:v?"#fff":"rgba(255,255,255,0.35)",fontFamily:'ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace',lineHeight:1,letterSpacing:-0.5}}>{v||"—"}</div>
                <div style={{fontSize:9,color:"rgba(255,255,255,0.65)",marginTop:6,textTransform:"uppercase",letterSpacing:0.6,fontWeight:600}}>{l}</div>
              </div>)}
            </div>
          </div>
          {/* Tabs — punto 13px, daha okunabilir */}
          <div style={{display:"flex",overflowX:"auto",gap:2}}>
            {TABS.map(t=><button key={t.k} onClick={()=>setTab(t.k)} style={{flexShrink:0,padding:"10px 18px",border:"none",borderBottom:tab===t.k?"2px solid #fff":"2px solid transparent",background:"none",cursor:"pointer",fontSize:13,fontWeight:tab===t.k?600:400,color:tab===t.k?"#fff":"rgba(255,255,255,0.55)",whiteSpace:"nowrap",letterSpacing:0.2}}>{t.l}</button>)}
          </div>
        </div>
      </div>

      {/* ── Body: Left panel + Right content ── */}
      <div style={{flex:1,display:"grid",gridTemplateColumns:"220px 1fr",overflow:"hidden"}}>

        {/* Left info panel */}
        <div style={{borderRight:"1px solid #e8e6e1",padding:"16px",background:"#fff",overflowY:"auto"}}>
          {/* Species info */}
          <div style={{marginBottom:14}}>
            <div style={{fontSize:9,color:"#b4b2a9",textTransform:"uppercase",letterSpacing:0.6,fontWeight:600,marginBottom:8}}>Species info</div>
            {[{l:"Genus",v:species.genus},{l:"Family",v:species.family},{l:"Type",v:species.geophyte_type},{l:"Region",v:species.region},{l:"Country",v:species.country_focus},{l:"Habitat",v:species.habitat},{l:"TC status",v:species.tc_status},{l:"Market",v:species.market_area}].map(({l,v})=>v?<div key={l} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"0.5px solid #f4f3ef",fontSize:11}}>
              <span style={{color:"#888"}}>{l}</span>
              <span style={{fontWeight:500,color:"#2c2c2a",textAlign:"right",maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={v}>{v}</span>
            </div>:null)}
          </div>
          {/* Data trust */}
          <div style={{marginBottom:14,paddingTop:12,borderTop:"0.5px solid #e8e6e1"}}>
            <div style={{fontSize:9,color:"#b4b2a9",textTransform:"uppercase",letterSpacing:0.6,fontWeight:600,marginBottom:8}}>Data trust</div>
            {[{l:"Confidence",v:species.confidence?`${species.confidence}%`:null,colored:true},{l:"Last verified",v:species.last_verified},{l:"Module",v:species.geocon_module}].map(({l,v,colored})=>v?<div key={l} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"0.5px solid #f4f3ef",fontSize:11}}>
              <span style={{color:"#888"}}>{l}</span>
              <span style={{fontWeight:500,color:colored?"#1D9E75":"#2c2c2a"}}>{v}</span>
            </div>:null)}
          </div>
          {/* Linked data */}
          <div style={{paddingTop:12,borderTop:"0.5px solid #e8e6e1"}}>
            <div style={{fontSize:9,color:"#b4b2a9",textTransform:"uppercase",letterSpacing:0.6,fontWeight:600,marginBottom:8}}>Linked data</div>
            {[{l:"Publications",v:pubs.length,c:"#185FA5"},{l:"Metabolites",v:mets.length,c:"#534AB7"},{l:"Locations",v:locs.length,c:"#1D9E75"},{l:"Propagation",v:prop.length,c:"#639922"},{l:"Commercial",v:comm.length,c:"#D85A30"}].map(({l,v,c})=><div key={l} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"0.5px solid #f4f3ef",fontSize:11}}>
              <span style={{color:"#888"}}>{l}</span>
              <span style={{fontWeight:600,color:v>0?c:"#b4b2a9"}}>{v}</span>
            </div>)}
          </div>
        </div>

        {/* Right content area */}
        <div style={{overflowY:"auto",padding:"20px 24px",background:"#f8f7f4"}}>
          {loading?<div style={{textAlign:"center",padding:60,color:"#999",fontSize:13}}>Loading...</div>:<>

            {/* DECISION TAB */}
            {tab==="decision"&&(()=>{
              // ── Gap analysis (5 bloklu wireframe için) ──
              const gaps = [
                {
                  key: "propagation",
                  label: "Propagation Protocol",
                  status: prop.length===0 ? "missing" : prop.some(p=>p.success_rate>=70) ? "ok" : "weak",
                  icon: prop.length===0 ? "❌" : prop.some(p=>p.success_rate>=70) ? "✅" : "⚠️",
                  detail: prop.length===0 ? "Missing" : prop.some(p=>p.success_rate>=70) ? "Available" : "Partial",
                  color: prop.length===0 ? "#A32D2D" : prop.some(p=>p.success_rate>=70) ? "#1D9E75" : "#BA7517"
                },
                {
                  key: "metabolite",
                  label: "Metabolite Evidence",
                  status: mets.length===0 ? "missing" : mets.length<5 ? "weak" : "ok",
                  icon: mets.length===0 ? "❌" : mets.length<5 ? "⚠️" : "✅",
                  detail: mets.length===0 ? "Missing" : mets.length<5 ? "Partial" : "Available",
                  color: mets.length===0 ? "#A32D2D" : mets.length<5 ? "#BA7517" : "#1D9E75"
                },
                {
                  key: "field_data",
                  label: "Field Data",
                  status: locs.length===0 ? "missing" : "ok",
                  icon: locs.length===0 ? "❌" : "✅",
                  detail: locs.length===0 ? "Missing" : "Available",
                  color: locs.length===0 ? "#A32D2D" : "#1D9E75"
                },
                {
                  key: "commercial",
                  label: "Commercial Hypothesis",
                  status: comm.length===0 ? "missing" : "ok",
                  icon: comm.length===0 ? "⚠️" : "✅",
                  detail: comm.length===0 ? "Emerging" : "Available",
                  color: comm.length===0 ? "#BA7517" : "#1D9E75"
                },
                {
                  key: "governance",
                  label: "Governance Readiness",
                  status: !gov ? "missing" : (gov.abs_nagoya_risk==="high"||gov.collection_sensitivity==="high") ? "blocked" : "ok",
                  icon: !gov ? "❓" : (gov.abs_nagoya_risk==="high"||gov.collection_sensitivity==="high") ? "❌" : "✅",
                  detail: !gov ? "Unknown" : (gov.abs_nagoya_risk==="high"||gov.collection_sensitivity==="high") ? "Blocked" : "Available",
                  color: !gov ? "#888" : (gov.abs_nagoya_risk==="high"||gov.collection_sensitivity==="high") ? "#A32D2D" : "#1D9E75"
                },
              ];

              // ── WHAT SHOULD BE DONE — actions derived from gaps + species fields ──
              const actionList = [];
              if (species.next_action) actionList.push(species.next_action);
              gaps.filter(g=>g.status==="missing"||g.status==="critical"||g.status==="blocked").slice(0,3).forEach(g=>{
                const action = {
                  propagation: "Initiate propagation feasibility trial — explore in vitro / seed-based methods",
                  metabolite: "Validate metabolite presence — phytochemical screening + literature review",
                  field_data: "Collect field samples — GPS coordinates, habitat data, population estimates",
                  commercial: "Define commercial hypothesis — market segment, value chain, target product",
                  governance: "Resolve ABS/Nagoya governance — partner agreements, collection permits"
                }[g.key];
                if (action && !actionList.includes(action)) actionList.push(action);
              });
              if (actionList.length === 0 && species.recommended_pathway) actionList.push(species.recommended_pathway);

              // ── WHY THIS SPECIES MATTERS — derived summary ──
              const composite = species.composite_score || 0;
              const whyParts = [];
              if (species.score_venture >= 60 && species.score_feasibility < 50) whyParts.push("strong economic upside but technical propagation challenges");
              else if (species.score_venture >= 60 && species.score_feasibility >= 60) whyParts.push("strong economic upside with workable propagation pathway");
              else if (species.score_conservation >= 60 && species.score_venture < 50) whyParts.push("conservation priority with limited commercial pathway");
              else if (species.score_scientific >= 60) whyParts.push("strong scientific value");
              else if (composite >= 50) whyParts.push("balanced GEOCON candidate");
              else whyParts.push("low-priority candidate");
              if (mets.length === 0 && species.score_venture >= 50) whyParts.push("partial metabolite evidence");
              if (prop.length === 0) whyParts.push("missing propagation protocol");
              const whySummary = `${species.iucn_status==="CR"?"Critically endangered ":species.iucn_status==="EN"?"Endangered ":species.iucn_status==="VU"?"Vulnerable ":""}${species.recommended_pathway?species.recommended_pathway+" candidate":"GEOCON candidate"} with ${whyParts.join(", ")}.`;

              // ── PROGRAM STATUS — find program(s) for this species ──
              const linkedProgram = (programs||[]).find(p => p.species_id === species.id);

              // ── KEY INSIGHTS — derived from data ──
              const insights = [];
              if (species.family === "Orchidaceae") insights.push("Likely symbiotic germination dependency");
              if (mets.some(m=>m.compound_class && m.compound_class.toLowerCase().includes("polysac"))) insights.push("Polysaccharide presence documented");
              else if (species.market_area && species.market_area.toLowerCase().includes("polysac")) insights.push("High potential for functional polysaccharides");
              if (species.market_area) insights.push(`Market area: ${species.market_area}`);
              if (species.endemic) insights.push(`Endemic to ${species.country_focus||species.region||"target region"} — habitat loss = species loss`);
              if (mets.length >= 5) insights.push(`${mets.length} compounds documented — chemistry baseline established`);
              if (prop.some(p=>p.success_rate>=70)) insights.push("Working propagation protocol available");
              if (insights.length === 0) insights.push("Limited derived insights — more data needed");

              return <div style={{display:"flex",flexDirection:"column",gap:14}}>

                {/* ─────────── 0. PROGRAM-FIRST BANNER ─────────── */}
                <div style={{padding:"12px 16px",background:"#fcfbf9",borderRadius:10,border:"1px solid #e8e6e1",borderLeft:"3px solid #888"}}>
                  <div style={{fontSize:11,color:"#5f5e5a",lineHeight:1.5}}>
                    <strong style={{color:"#2c2c2a"}}>This species is an input.</strong> Execution happens through programs.
                  </div>
                </div>

                {/* ─────────── 1. WHAT SHOULD BE DONE (HERO) ─────────── */}
                <div style={{padding:"20px 22px",background:"linear-gradient(135deg,#085041 0%,#1D9E75 100%)",borderRadius:14,boxShadow:"0 6px 16px rgba(8,80,65,0.25)"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                    <span style={{fontSize:22}}>⚡</span>
                    <span style={{fontSize:10,color:"rgba(255,255,255,0.8)",textTransform:"uppercase",letterSpacing:1.2,fontWeight:700}}>What should be done</span>
                  </div>
                  {actionList.length>0?<div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
                    {actionList.slice(0,4).map((a,i)=><div key={i} style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                      <span style={{fontSize:14,color:"rgba(255,255,255,0.9)",flexShrink:0,fontWeight:700,lineHeight:1.5}}>→</span>
                      <span style={{fontSize:14,color:"#fff",lineHeight:1.5,fontWeight:500}}>{a}</span>
                    </div>)}
                  </div>:<div style={{fontSize:13,color:"rgba(255,255,255,0.85)",fontStyle:"italic",marginBottom:14}}>No actions defined yet — start a program to generate them.</div>}
                  {linkedProgram?(onOpenProgram&&<button onClick={()=>onOpenProgram(linkedProgram)} style={{padding:"10px 20px",background:"#fff",color:"#085041",border:"none",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",letterSpacing:0.5,textTransform:"uppercase"}}>Open Program →</button>):(onStartProgram&&<button onClick={()=>onStartProgram(species)} style={{padding:"10px 20px",background:"#fff",color:"#085041",border:"none",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",letterSpacing:0.5,textTransform:"uppercase"}}>+ Start Program</button>)}
                </div>

                {/* ─────────── 2. WHY THIS SPECIES MATTERS ─────────── */}
                <div style={{background:"#fff",borderRadius:14,border:"1px solid #e8e6e1",padding:"14px 18px"}}>
                  <div style={{fontSize:10,color:"#888",textTransform:"uppercase",letterSpacing:1,fontWeight:700,marginBottom:8}}>Why this species matters</div>
                  <div style={{padding:"10px 14px",background:"#f8f7f4",borderRadius:10,borderLeft:"3px solid #1D9E75"}}>
                    <div style={{fontSize:13,color:"#2c2c2a",lineHeight:1.6,fontWeight:500}}>→ {whySummary}</div>
                  </div>
                </div>

                {/* ─────────── 3. CURRENT GAPS ─────────── */}
                <div style={{background:"#fff",borderRadius:14,border:"1px solid #e8e6e1",padding:"16px 18px"}}>
                  <div style={{fontSize:10,color:"#888",textTransform:"uppercase",letterSpacing:1,fontWeight:700,marginBottom:12}}>Readiness signals</div>
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {gaps.map(g=><div key={g.key} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",background:"#fcfbf9",borderRadius:8,border:"1px solid #f4f3ef"}}>
                      <span style={{fontSize:16,flexShrink:0}}>{g.icon}</span>
                      <div style={{flex:1,minWidth:0,fontSize:12,fontWeight:500,color:"#2c2c2a"}}>{g.label}</div>
                      <span style={{fontSize:11,fontWeight:600,color:g.color,flexShrink:0}}>{g.detail}</span>
                    </div>)}
                  </div>
                </div>

                {/* ─────────── 4. PROGRAM STATUS ─────────── */}
                {linkedProgram?<div style={{background:"#fff",borderRadius:14,border:"2px solid #1D9E75",padding:"16px 18px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                    <span style={{fontSize:9,padding:"3px 8px",borderRadius:99,background:"#E1F5EE",color:"#085041",fontWeight:700,letterSpacing:0.5}}>ACTIVE PROGRAM</span>
                  </div>
                  <div style={{fontSize:14,fontWeight:700,color:"#2c2c2a",marginBottom:6}}>{linkedProgram.program_name}</div>
                  <div style={{display:"flex",gap:14,fontSize:11,color:"#5f5e5a",marginBottom:12,flexWrap:"wrap"}}>
                    {linkedProgram.program_type&&<span><strong style={{color:"#888"}}>Type:</strong> {linkedProgram.program_type}</span>}
                    <span><strong style={{color:"#888"}}>Module:</strong> {linkedProgram.current_module||"Origin"}</span>
                    {linkedProgram.readiness_score!=null&&<span><strong style={{color:"#888"}}>Progress:</strong> {linkedProgram.readiness_score}%</span>}
                    {linkedProgram.status&&<span><strong style={{color:"#888"}}>Status:</strong> {linkedProgram.status}</span>}
                  </div>
                  {linkedProgram.next_action&&<div style={{padding:"10px 12px",background:"#fcfbf9",borderRadius:8,borderLeft:"3px solid #1D9E75",marginBottom:12}}>
                    <div style={{fontSize:9,color:"#888",textTransform:"uppercase",letterSpacing:0.5,fontWeight:600,marginBottom:3}}>Next Action</div>
                    <div style={{fontSize:12,color:"#2c2c2a",lineHeight:1.5}}>{linkedProgram.next_action}</div>
                  </div>}
                  {onOpenProgram&&<button onClick={()=>onOpenProgram(linkedProgram)} style={{padding:"8px 16px",background:"#1D9E75",color:"#fff",border:"none",borderRadius:7,fontSize:11,fontWeight:600,cursor:"pointer",letterSpacing:0.3}}>Open Program →</button>}
                </div>:<div style={{background:"#fcfbf9",borderRadius:14,border:"1px dashed #BA7517",padding:"16px 18px"}}>
                  <div style={{fontSize:9,color:"#888",textTransform:"uppercase",letterSpacing:0.5,fontWeight:700,marginBottom:6}}>No active program</div>
                  {species.recommended_pathway&&<div style={{fontSize:12,color:"#5f5e5a"}}>Suggested pathway: <strong style={{color:"#2c2c2a"}}>{species.recommended_pathway}</strong></div>}
                </div>}

                {/* ─────────── 5. KEY INSIGHTS ─────────── */}
                <div style={{background:"#fff",borderRadius:14,border:"1px solid #e8e6e1",padding:"16px 18px"}}>
                  <div style={{fontSize:10,color:"#888",textTransform:"uppercase",letterSpacing:1,fontWeight:700,marginBottom:12}}>Key insights</div>
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {insights.slice(0,4).map((ins,i)=><div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",padding:"8px 0"}}>
                      <span style={{fontSize:12,color:"#888",flexShrink:0,fontWeight:700}}>—</span>
                      <span style={{fontSize:12,color:"#2c2c2a",lineHeight:1.5}}>{ins}</span>
                    </div>)}
                  </div>
                </div>

                {/* ─────────── 6. KNOWLEDGE link ─────────── */}
                <div style={{padding:"12px 16px",background:"#f8f7f4",borderRadius:10,border:"1px solid #e8e6e1",fontSize:11,color:"#888",textAlign:"center"}}>
                  Supporting knowledge available in tabs above: <strong style={{color:"#5f5e5a"}}>Story · Publications ({pubs.length}) · Metabolites ({mets.length}) · Conservation · Governance · Propagation · Commercial · Details</strong>
                </div>

              </div>;
            })()}

            {/* STORY TAB */}
            {tab==="story"&&<div style={{display:"flex",flexDirection:"column",gap:12}}>
              {!story?<div style={{textAlign:"center",padding:60,background:"#fff",borderRadius:14,border:"1px solid #e8e6e1"}}>
                <div style={{fontSize:32,marginBottom:12}}>📖</div>
                <div style={{fontSize:14,fontWeight:600,color:"#2c2c2a",marginBottom:8}}>No story yet</div>
                <div style={{fontSize:12,color:"#888",lineHeight:1.6}}>An admin needs to generate the GEOCON story for this species.</div>
              </div>:<>
                {/* Next best action */}
                {species.next_action&&<div style={{padding:"12px 16px",background:"#1D9E75",borderRadius:12,display:"flex",alignItems:"center",gap:12}}>
                  <span style={{fontSize:18}}>→</span>
                  <div>
                    <div style={{fontSize:9,color:"rgba(255,255,255,0.7)",textTransform:"uppercase",letterSpacing:0.6,marginBottom:2}}>Next best action</div>
                    <div style={{fontSize:12,fontWeight:600,color:"#fff"}}>{species.next_action}</div>
                  </div>
                </div>}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <div style={{padding:"14px 16px",background:"linear-gradient(135deg,#E1F5EE,#f8fff8)",borderRadius:12,border:"1px solid #1D9E75",gridColumn:"1/-1"}}>
                    <div style={{fontSize:9,color:"#085041",textTransform:"uppercase",letterSpacing:0.8,fontWeight:600,marginBottom:8}}>GEOCON perspective</div>
                    {story.geocon_rationale&&<div style={{fontSize:12,color:"#2c2c2a",lineHeight:1.7,marginBottom:6}}>{story.geocon_rationale}</div>}
                    {story.rescue_urgency&&<div style={{fontSize:11,color:"#A32D2D",lineHeight:1.6,padding:"8px 10px",background:"#FCEBEB",borderRadius:8,marginTop:6}}><strong style={{fontSize:9,textTransform:"uppercase",letterSpacing:0.6}}>Rescue urgency: </strong>{story.rescue_urgency}</div>}
                  </div>
                  {story.scientific_narrative&&<div style={{padding:"14px 16px",background:"#fff",borderRadius:12,border:"1px solid #e8e6e1",borderLeft:"3px solid #534AB7"}}>
                    <div style={{fontSize:9,color:"#534AB7",textTransform:"uppercase",letterSpacing:0.8,fontWeight:600,marginBottom:8}}>Scientific narrative</div>
                    <div style={{fontSize:12,color:"#2c2c2a",lineHeight:1.7}}>{story.scientific_narrative}</div>
                    {story.habitat_story&&<div style={{marginTop:8,paddingTop:8,borderTop:"1px solid #f4f3ef"}}><div style={{fontSize:9,color:"#888",textTransform:"uppercase",marginBottom:4}}>Habitat</div><div style={{fontSize:11,color:"#5f5e5a",lineHeight:1.6}}>{story.habitat_story}</div></div>}
                  </div>}
                  {story.conservation_context&&<div style={{padding:"14px 16px",background:"#FAEEDA",borderRadius:12,border:"1px solid #BA7517",borderLeft:"3px solid #BA7517"}}>
                    <div style={{fontSize:9,color:"#633806",textTransform:"uppercase",letterSpacing:0.8,fontWeight:600,marginBottom:8}}>Conservation context</div>
                    <div style={{fontSize:12,color:"#2c2c2a",lineHeight:1.7}}>{story.conservation_context}</div>
                  </div>}
                  {story.propagation_pathway&&<div style={{padding:"14px 16px",background:"#E1F5EE",borderRadius:12,border:"1px solid #1D9E75",borderLeft:"3px solid #1D9E75"}}>
                    <div style={{fontSize:9,color:"#085041",textTransform:"uppercase",letterSpacing:0.8,fontWeight:600,marginBottom:8}}>Propagation pathway</div>
                    <div style={{fontSize:12,color:"#2c2c2a",lineHeight:1.7}}>{story.propagation_pathway}</div>
                  </div>}
                  {(story.commercial_hypothesis||story.market_narrative||story.value_chain)&&<div style={{padding:"14px 16px",background:"#fff",borderRadius:12,border:"1px solid #e8e6e1",borderLeft:"3px solid #185FA5",gridColumn:"1/-1"}}>
                    <div style={{fontSize:9,color:"#185FA5",textTransform:"uppercase",letterSpacing:0.8,fontWeight:600,marginBottom:8}}>Commercial hypothesis</div>
                    {story.commercial_hypothesis&&<div style={{fontSize:12,color:"#2c2c2a",lineHeight:1.7,marginBottom:8}}>{story.commercial_hypothesis}</div>}
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}>
                      {story.market_narrative&&<div style={{padding:"8px 10px",background:"#f8f7f4",borderRadius:8}}><div style={{fontSize:9,color:"#888",textTransform:"uppercase",marginBottom:3}}>Market</div><div style={{fontSize:11,color:"#5f5e5a",lineHeight:1.6}}>{story.market_narrative}</div></div>}
                      {story.value_chain&&<div style={{padding:"8px 10px",background:"#f8f7f4",borderRadius:8}}><div style={{fontSize:9,color:"#888",textTransform:"uppercase",marginBottom:3}}>Value chain</div><div style={{fontSize:11,color:"#5f5e5a",lineHeight:1.6}}>{story.value_chain}</div></div>}
                    </div>
                  </div>}
                </div>
                <div style={{fontSize:9,color:"#b4b2a9",textAlign:"right"}}>Generated by {story.generated_by||"GEOCON"} · {story.last_generated_at?.split("T")[0]||""}</div>
              </>}
            </div>}

            {/* PUBLICATIONS TAB */}
            {tab==="pubs"&&<div>{pubs.length===0?<div style={{textAlign:"center",padding:40,color:"#999",fontSize:13,background:"#fff",borderRadius:12,border:"1px solid #e8e6e1"}}>No publications found</div>:<div style={{display:"flex",flexDirection:"column",gap:8}}>{pubs.map(p=><div key={p.id} style={{padding:"12px 14px",background:"#fff",borderRadius:10,border:"1px solid #e8e6e1",borderLeft:"3px solid #378ADD"}}><div style={{fontSize:12,fontWeight:600,color:"#2c2c2a",lineHeight:1.4,marginBottom:4}}>{p.doi?<a href={p.doi} target="_blank" rel="noopener noreferrer" style={{color:"#185FA5",textDecoration:"none"}}>{(p.title||"").slice(0,120)}{(p.title||"").length>120?"...":""}</a>:(p.title||"").slice(0,120)}</div><div style={{fontSize:10,color:"#888",marginBottom:6}}>{(p.authors||"").slice(0,80)}{(p.authors||"").length>80?"...":""}</div><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{p.year&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:99,background:"#E6F1FB",color:"#0C447C"}}>{p.year}</span>}{p.journal&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:99,background:"#EEEDFE",color:"#3C3489"}}>{p.journal.slice(0,30)}</span>}{p.open_access&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:99,background:"#E1F5EE",color:"#085041"}}>OA</span>}</div>{p.abstract&&<div style={{fontSize:10,color:"#5f5e5a",marginTop:6,lineHeight:1.5}}>{p.abstract.slice(0,250)}...</div>}</div>)}</div>}</div>}

            {/* METABOLITES TAB */}
            {tab==="mets"&&(()=>{
              if(mets.length===0)return<div style={{textAlign:"center",padding:40,color:"#999",fontSize:13,background:"#fff",borderRadius:12,border:"1px solid #e8e6e1"}}>No metabolites yet</div>;
              // Bu türün metabolite_id'leri için publication link'lerini grupla
              const linksByMet={};
              for(const link of metabolitePublications){
                if(!linksByMet[link.metabolite_id])linksByMet[link.metabolite_id]=[];
                linksByMet[link.metabolite_id].push(link);
              }
              // Class breakdown
              const classCounts={};
              for(const m of mets){const c=m.compound_class||"Unidentified";classCounts[c]=(classCounts[c]||0)+1;}
              const classOrder=Object.entries(classCounts).sort((a,b)=>b[1]-a[1]);
              const classColor=(c)=>({"Alkaloid":"#534AB7","Flavonoid":"#BA7517","Phenolic acid":"#854F0B","Phytohormone":"#0F6E56","Saponin/Glycoside":"#993556","Carotenoid":"#D85A30","Stilbene":"#A32D2D","Fatty acid":"#185FA5","Amino acid":"#185FA5","Tuliposide":"#3C3489","Steroid":"#639922","Unidentified":"#b4b2a9"}[c]||"#888780");
              return<div>
                {/* Class breakdown stripe */}
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
                  {classOrder.slice(0,8).map(([cls,n])=><span key={cls} style={{fontSize:10,padding:"3px 8px",borderRadius:99,background:"#fff",border:"1px solid "+classColor(cls)+"55",color:classColor(cls),fontWeight:600}}>{cls} <span style={{opacity:0.7}}>({n})</span></span>)}
                  {classOrder.length>8&&<span style={{fontSize:10,color:"#999",padding:"3px 8px"}}>+{classOrder.length-8} more</span>}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:8}}>
                  {mets.map(m=>{
                    const pubLinks=linksByMet[m.id]||[];
                    const distinctPubs=new Set(pubLinks.map(l=>l.publication_id)).size;
                    const primaryCount=pubLinks.filter(l=>l.is_primary_source).length;
                    const cls=m.compound_class||"Unidentified";
                    return<div key={m.id} style={{padding:"12px 14px",background:"#fff",borderRadius:10,border:"1px solid #e8e6e1",borderLeft:"3px solid "+classColor(cls)}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:6,marginBottom:4}}>
                        <div style={{fontSize:13,fontWeight:600,color:"#2c2c2a",flex:1}}>{m.compound_name}</div>
                        {distinctPubs>0&&<span style={{fontSize:9,padding:"2px 7px",borderRadius:99,background:"#E6F1FB",color:"#0C447C",fontWeight:700,whiteSpace:"nowrap"}}>📄 {distinctPubs}{primaryCount>0&&<span style={{marginLeft:3,opacity:0.8}}>({primaryCount}★)</span>}</span>}
                      </div>
                      {m.reported_activity&&<div style={{fontSize:11,color:"#5f5e5a",marginBottom:6,lineHeight:1.5}}>{m.reported_activity.length>120?m.reported_activity.slice(0,120)+"…":m.reported_activity}</div>}
                      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                        <span style={{fontSize:10,padding:"1px 6px",borderRadius:99,background:classColor(cls)+"22",color:classColor(cls),fontWeight:600}}>{cls}</span>
                        {m.cas_number&&<span style={{fontSize:9,padding:"1px 5px",borderRadius:4,background:"#f4f3ef",color:"#888",fontFamily:"monospace"}}>CAS {m.cas_number}</span>}
                        {m.evidence&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:99,background:"#E1F5EE",color:"#085041"}}>{m.evidence}</span>}
                      </div>
                    </div>;
                  })}
                </div>
              </div>;
            })()}

            {/* CONSERVATION TAB */}
            {tab==="cons"&&<div>{cons.length===0?<div style={{textAlign:"center",padding:40,color:"#999",fontSize:13,background:"#fff",borderRadius:12,border:"1px solid #e8e6e1"}}>No conservation assessments yet</div>:cons.map(a=><div key={a.id} style={{marginBottom:10,padding:"14px 16px",background:"#fff",borderRadius:10,border:"1px solid #e8e6e1",borderLeft:"3px solid #E24B4A"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}><div style={{fontSize:13,fontWeight:600,color:"#2c2c2a"}}>{a.source}</div>{a.status_interpreted&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:99,background:iucnBg(a.status_interpreted),color:iucnC(a.status_interpreted)}}>{a.status_interpreted}</span>}</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px 12px",fontSize:11}}>{a.assessment_year&&<div><span style={{color:"#b4b2a9",fontSize:9,textTransform:"uppercase"}}>Year</span><div style={{color:"#2c2c2a",fontWeight:500}}>{a.assessment_year}</div></div>}{a.trend&&<div><span style={{color:"#b4b2a9",fontSize:9,textTransform:"uppercase"}}>Trend</span><div style={{color:"#2c2c2a",fontWeight:500}}>{a.trend}</div></div>}</div>{a.notes&&<div style={{fontSize:11,color:"#5f5e5a",marginTop:8,lineHeight:1.5}}>{a.notes}</div>}</div>)}</div>}

            {/* GOVERNANCE TAB */}
            {tab==="gov"&&<div>{!gov?<div style={{textAlign:"center",padding:40,color:"#999",fontSize:13,background:"#fff",borderRadius:12,border:"1px solid #e8e6e1"}}>No governance data yet</div>:<div style={{display:"flex",flexDirection:"column",gap:10}}><div style={{padding:"16px",background:"#fff",borderRadius:10,border:"1px solid #e8e6e1",borderLeft:"3px solid #D85A30"}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px 16px"}}>{[{l:"Access regime",v:gov.access_regime},{l:"ABS/Nagoya risk",v:gov.abs_nagoya_risk,colored:true},{l:"Collection sensitivity",v:gov.collection_sensitivity,colored:true},{l:"Public visibility",v:gov.public_visibility_level}].map(({l,v,colored})=>v?<div key={l}><div style={{fontSize:9,color:"#b4b2a9",textTransform:"uppercase",letterSpacing:0.4,marginBottom:3}}>{l}</div>{colored?<span style={{fontSize:11,padding:"2px 8px",borderRadius:99,background:riskBg(v),color:riskColor(v),fontWeight:600}}>{v}</span>:<div style={{fontSize:12,color:"#2c2c2a",fontWeight:500}}>{v}</div>}</div>:null)}</div></div>{gov.notes&&<div style={{padding:"12px 14px",background:"#fff",borderRadius:10,border:"1px solid #e8e6e1",fontSize:11,color:"#5f5e5a",lineHeight:1.6}}>{gov.notes}</div>}</div>}</div>}

            {/* PROPAGATION TAB */}
            {tab==="prop"&&<div>{prop.length===0?<div style={{textAlign:"center",padding:40,color:"#999",fontSize:13,background:"#fff",borderRadius:12,border:"1px solid #e8e6e1"}}>No propagation protocols yet</div>:prop.map(p=><div key={p.id} style={{marginBottom:10,padding:"14px 16px",background:"#fff",borderRadius:10,border:"1px solid #e8e6e1",borderLeft:"3px solid #1D9E75"}}><div style={{fontSize:13,fontWeight:600,color:"#2c2c2a",marginBottom:10}}>{p.protocol_type}</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px 16px",fontSize:11}}>{p.explant&&<div><span style={{color:"#b4b2a9",fontSize:9,textTransform:"uppercase"}}>Explant</span><div style={{color:"#2c2c2a",fontWeight:500}}>{p.explant}</div></div>}{p.medium_or_condition&&<div><span style={{color:"#b4b2a9",fontSize:9,textTransform:"uppercase"}}>Medium</span><div style={{color:"#2c2c2a",fontWeight:500}}>{p.medium_or_condition}</div></div>}{p.success_rate&&<div><span style={{color:"#b4b2a9",fontSize:9,textTransform:"uppercase"}}>Success rate</span><div style={{color:"#1D9E75",fontWeight:700}}>{p.success_rate}%</div></div>}</div>{p.notes&&<div style={{fontSize:11,color:"#5f5e5a",marginTop:8,lineHeight:1.5}}>{p.notes}</div>}</div>)}</div>}

            {/* COMMERCIAL TAB */}
            {tab==="comm"&&<div>{comm.length===0?<div style={{textAlign:"center",padding:40,color:"#999",fontSize:13,background:"#fff",borderRadius:12,border:"1px solid #e8e6e1"}}>No commercial hypotheses yet</div>:comm.map(h=><div key={h.id} style={{marginBottom:10,padding:"14px 16px",background:"#fff",borderRadius:10,border:"1px solid #e8e6e1",borderLeft:"3px solid #185FA5"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}><div style={{fontSize:13,fontWeight:600,color:"#2c2c2a"}}>{h.application_area}</div>{h.status&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:99,background:h.status==="monitor"?"#FAEEDA":"#E1F5EE",color:h.status==="monitor"?"#633806":"#085041"}}>{h.status}</span>}</div>{h.justification&&<div style={{fontSize:11,color:"#5f5e5a",lineHeight:1.6}}>{h.justification}</div>}</div>)}</div>}

            {/* DETAILS TAB */}
            {tab==="linked"&&(()=>{
              const researcherMap = new Map();
              pubs.forEach(p=>{
                // authors is a comma-separated string (e.g. "Smith J, Doe A, ..."); take first as proxy for first_author
                const authorsStr = p.authors;
                if(authorsStr){
                  const firstAuthor = authorsStr.split(",")[0].trim();
                  if(firstAuthor){
                    if(!researcherMap.has(firstAuthor)) researcherMap.set(firstAuthor,{name:firstAuthor,id:null,pubCount:0,member:false});
                    researcherMap.get(firstAuthor).pubCount++;
                  }
                }
              });
              const linkedResearcherList = Array.from(researcherMap.values()).sort((a,b)=>b.pubCount-a.pubCount).slice(0,8);
              const sourceCounts = [
                {l:"Publications",v:pubs.length,c:"#185FA5"},
                {l:"Metabolites",v:mets.length,c:"#534AB7"},
                {l:"Propagation records",v:prop.length,c:"#639922"},
                {l:"Conservation records",v:cons.length,c:"#E24B4A"},
                {l:"Governance",v:gov?1:0,c:"#BA7517"},
                {l:"Locations",v:locs.length,c:"#1D9E75"}
              ];
              return <div style={{display:"flex",flexDirection:"column",gap:14}}>

                {/* ─── USED IN PROGRAMS ─── (multi-species programlar dahil) */}
                {usedInPrograms.length>0?<div style={{background:"#fff",borderRadius:12,border:"2px solid #1D9E75",padding:"16px 18px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:12}}>
                    <div style={{fontSize:9,color:"#085041",textTransform:"uppercase",letterSpacing:0.6,fontWeight:700}}>
                      Used in programs · {usedInPrograms.length}
                    </div>
                    {usedInPrograms.some(up=>up.role==="Primary")&&<div style={{fontSize:10,color:"#888"}}>
                      {usedInPrograms.filter(up=>up.role==="Primary").length} primary · {usedInPrograms.filter(up=>up.role!=="Primary").length} linked
                    </div>}
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {usedInPrograms.map((up,i)=>{
                      const prog=up.programs;if(!prog)return null;
                      const isPrimary=up.role==="Primary";
                      return <div
                        key={prog.id||i}
                        onClick={()=>onOpenProgram&&onOpenProgram(prog)}
                        style={{padding:"10px 12px",background:isPrimary?"#fcfbf9":"transparent",borderRadius:8,border:isPrimary?"1px solid #1D9E7544":"1px solid #f4f3ef",cursor:onOpenProgram?"pointer":"default",transition:"border-color 0.15s"}}
                        onMouseEnter={e=>onOpenProgram&&(e.currentTarget.style.borderColor="#1D9E75")}
                        onMouseLeave={e=>(e.currentTarget.style.borderColor=isPrimary?"#1D9E7544":"#f4f3ef")}
                      >
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginBottom:4}}>
                          <div style={{fontSize:13,fontWeight:600,color:"#2c2c2a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>
                            {prog.program_name}
                          </div>
                          {isPrimary&&<span style={{fontSize:9,padding:"1px 7px",borderRadius:99,background:"#1D9E75",color:"#fff",fontWeight:700,letterSpacing:0.3,flexShrink:0}}>PRIMARY</span>}
                        </div>
                        <div style={{display:"flex",gap:10,fontSize:10,color:"#888",flexWrap:"wrap"}}>
                          {prog.current_module&&<span>{prog.current_module}</span>}
                          {prog.current_gate&&<span>/ {prog.current_gate}</span>}
                          {prog.status&&<span>· {prog.status}</span>}
                          {prog.priority_score!=null&&<span>· Priority {prog.priority_score}</span>}
                        </div>
                      </div>;
                    })}
                  </div>
                </div>:<div style={{background:"#fcfbf9",borderRadius:12,border:"1px dashed #d4d2c9",padding:"16px 18px"}}>
                  <div style={{fontSize:9,color:"#b4b2a9",textTransform:"uppercase",letterSpacing:0.6,fontWeight:600,marginBottom:6}}>Not in any program</div>
                  <div style={{fontSize:12,color:"#5f5e5a"}}>This species is not yet linked to any GEOCON program.{species.recommended_pathway&&<> Suggested pathway: <strong style={{color:"#2c2c2a"}}>{species.recommended_pathway}</strong>.</>}</div>
                </div>}

                {/* ─── LINKED RESEARCHERS ─── */}
                <div style={{background:"#fff",borderRadius:12,border:"1px solid #e8e6e1",padding:"16px 18px"}}>
                  <div style={{fontSize:9,color:"#b4b2a9",textTransform:"uppercase",letterSpacing:0.6,fontWeight:600,marginBottom:12}}>Linked researchers · {linkedResearcherList.length}{researcherMap.size>linkedResearcherList.length?<span style={{color:"#888",fontWeight:400,letterSpacing:0}}> of {researcherMap.size}</span>:""}</div>
                  {linkedResearcherList.length>0?<div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {linkedResearcherList.map(r=><div key={r.name} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,padding:"8px 10px",background:"#fcfbf9",borderRadius:8,fontSize:12}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0,flex:1}}>
                        <span style={{fontSize:14,flexShrink:0}}>👤</span>
                        <span style={{color:"#2c2c2a",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.name}</span>
                      </div>
                      <span style={{fontSize:10,color:"#888",flexShrink:0}}>{r.pubCount} pub{r.pubCount>1?"s":""}</span>
                    </div>)}
                  </div>:<div style={{fontSize:12,color:"#b4b2a9",fontStyle:"italic"}}>No researchers linked through publications yet.</div>}
                </div>

                {/* ─── DATA SOURCES ─── */}
                <div style={{background:"#fff",borderRadius:12,border:"1px solid #e8e6e1",padding:"16px 18px"}}>
                  <div style={{fontSize:9,color:"#b4b2a9",textTransform:"uppercase",letterSpacing:0.6,fontWeight:600,marginBottom:12}}>Data sources</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:8}}>
                    {sourceCounts.map(({l,v,c})=><div key={l} style={{padding:"10px 12px",background:"#fcfbf9",borderRadius:8,border:"1px solid #f4f3ef"}}>
                      <div style={{fontSize:18,fontWeight:700,color:c,lineHeight:1}}>{v}</div>
                      <div style={{fontSize:10,color:"#888",marginTop:4,textTransform:"uppercase",letterSpacing:0.3}}>{l}</div>
                    </div>)}
                  </div>
                </div>

                {/* ─── AUDIT TRAIL ─── */}
                <div style={{background:"#fff",borderRadius:12,border:"1px solid #e8e6e1",padding:"16px 18px"}}>
                  <div style={{fontSize:9,color:"#b4b2a9",textTransform:"uppercase",letterSpacing:0.6,fontWeight:600,marginBottom:12}}>Audit trail</div>
                  <div style={{display:"flex",flexDirection:"column",gap:0}}>
                    {[
                      {l:"Confidence",v:species.confidence!=null?`${species.confidence}%`:null},
                      {l:"Last verified",v:species.last_verified},
                      {l:"GEOCON module",v:species.geocon_module},
                      {l:"Record ID",v:species.id,mono:true},
                      {l:"Contributed by",v:species.contributed_by||species.created_by},
                      {l:"Last updated",v:species.updated_at?new Date(species.updated_at).toISOString().slice(0,10):null}
                    ].filter(x=>x.v).map(({l,v,mono})=><div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"0.5px solid #f4f3ef",fontSize:11,gap:12}}>
                      <span style={{color:"#888",flexShrink:0}}>{l}</span>
                      <span style={{fontWeight:500,color:"#2c2c2a",fontFamily:mono?"monospace":"inherit",fontSize:mono?10:11,textAlign:"right",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v}</span>
                    </div>)}
                  </div>
                </div>

              </div>;
            })()}

          </>}
        </div>
      </div>
    </div>
  </>;
}



function FamilySpeciesCard({sp,onClick}){const c=FAMILY_COLORS[sp.family]||DEF_FAM;return<div onClick={onClick} style={{background:"#fff",border:"0.5px solid #e8e6e1",borderLeft:`3px solid ${c.dot}`,borderRadius:10,cursor:"pointer",overflow:"hidden"}} onMouseEnter={e=>e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,0.08)"} onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>{sp.thumbnail_url&&<div style={{height:80,overflow:"hidden"}}><img src={sp.thumbnail_url} alt={sp.accepted_name} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.parentElement.style.display="none"}/></div>}<div style={{padding:"8px 12px 10px"}}><p style={{margin:"0 0 4px",fontSize:12,fontStyle:"italic",fontWeight:600,color:"#2c2c2a"}}>{sp.accepted_name}</p>{sp.common_name&&<p style={{margin:"0 0 4px",fontSize:10,color:"#888"}}>{sp.common_name}</p>}<div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{sp.iucn_status&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:99,background:iucnBg(sp.iucn_status),color:iucnC(sp.iucn_status),border:"0.5px solid currentColor"}}>IUCN: {sp.iucn_status}</span>}{sp.country_focus&&<span style={{fontSize:10,color:"#b4b2a9"}}>{flag(sp.country_focus)}</span>}</div></div></div>}

/* ── Species Module ── */
function SpeciesModule({species,programs,onSpeciesClick,onStartProgram,onOpenProgram}){
  const[selectedFamily,setSelectedFamily]=useState(null);
  const[selectedGenus,setSelectedGenus]=useState(null);
  const[search,setSearch]=useState("");
  const[fC,setFC]=useState("all");
  const[sortBy,setSortBy]=useState("score"); // "score" | "scientific" | "economic"
  const[filters,setFilters]=useState({opportunity:[], risk:[], program:[]});

  const FAMILY_ORDER=["Asparagaceae","Amaryllidaceae","Orchidaceae","Araceae","Liliaceae","Iridaceae","Ranunculaceae","Primulaceae","Colchicaceae","Gentianaceae","Paeoniaceae","Nymphaeaceae","Geraniaceae","Tecophilaeaceae","Alstroemeriaceae"];
  const families=[...new Set(species.map(s=>s.family).filter(Boolean))].sort((a,b)=>{const ai=FAMILY_ORDER.indexOf(a),bi=FAMILY_ORDER.indexOf(b);return(ai===-1?99:ai)-(bi===-1?99:bi);});
  const countries=[...new Set(species.map(s=>s.country_focus).filter(Boolean))];

  // Genera within selected family
  const familySpecies = selectedFamily ? species.filter(s=>s.family===selectedFamily) : [];
  const genera = [...new Set(familySpecies.map(s=>s.genus).filter(Boolean))].sort();
  const hasGenera = genera.length > 1;

  // ── Atlas filter + sort helper (client-side only, MVP) ──
  function applyFiltersAndSort(list){
    const hasProgram = (sp) => (programs||[]).some(p => p.species_id === sp.id);
    let result = [...list];
    // Opportunity
    if (filters.opportunity.includes("highEconomic"))    result = result.filter(sp => (sp.score_venture||0) >= 60);
    if (filters.opportunity.includes("highScientific"))  result = result.filter(sp => (sp.score_scientific||0) >= 60);
    // Risk
    if (filters.risk.includes("missingPropagation")) {
      result = result.filter(sp => {
        const tc = (sp.tc_status||"").toLowerCase();
        return !sp.tc_status || tc.includes("early") || tc.includes("missing") || tc.includes("none");
      });
    }
    if (filters.risk.includes("dataPoor"))               result = result.filter(sp => (sp.score_scientific||0) < 40);
    // Program
    if (filters.program.includes("noProgram"))           result = result.filter(sp => !hasProgram(sp));
    if (filters.program.includes("activeProgram"))       result = result.filter(sp => hasProgram(sp));
    // Sort
    if (sortBy === "score")        result.sort((a,b) => (b.composite_score||0) - (a.composite_score||0));
    else if (sortBy === "scientific") result.sort((a,b) => (b.score_scientific||0) - (a.score_scientific||0));
    else if (sortBy === "economic")   result.sort((a,b) => (b.score_venture||0) - (a.score_venture||0));
    return result;
  }

  // Species within selected genus (or family if only 1 genus) — preserves existing search + country chain
  const baseList = selectedGenus
    ? species.filter(s=>s.genus===selectedGenus && (!search||(s.accepted_name||"").toLowerCase().includes(search.toLowerCase())) && (fC==="all"||s.country_focus===fC))
    : (!hasGenera && selectedFamily)
      ? species.filter(s=>s.family===selectedFamily && (!search||(s.accepted_name||"").toLowerCase().includes(search.toLowerCase())) && (fC==="all"||s.country_focus===fC))
      : [];
  const genusSpecies = applyFiltersAndSort(baseList);

  // ── Filter toggle helper ──
  const toggleFilter = (group, value) => {
    setFilters(prev => ({
      ...prev,
      [group]: prev[group].includes(value)
        ? prev[group].filter(v => v !== value)
        : [...prev[group], value]
    }));
  };
  const removeFilter = (group, value) => {
    setFilters(prev => ({...prev, [group]: prev[group].filter(v => v !== value)}));
  };
  const filterCount = filters.opportunity.length + filters.risk.length + filters.program.length;
  const FILTER_LABELS = {
    highEconomic: "High Economic",
    highScientific: "High Scientific",
    missingPropagation: "Missing Propagation",
    dataPoor: "Data Poor",
    noProgram: "No Program",
    activeProgram: "Active Program"
  };
  const SORT_LABELS = { score: "Composite score", scientific: "Scientific score", economic: "Economic score" };

  function FamilyCard({family}){
    const members=species.filter(s=>s.family===family);
    const withPhoto=members.find(s=>s.thumbnail_url);
    const c=FAMILY_COLORS[family]||DEF_FAM;
    const threatened=members.filter(s=>["CR","EN","VU"].includes(s.iucn_status)).length;
    return<div onClick={()=>{setSelectedFamily(family);setSelectedGenus(null);setSearch("");}} style={{background:"#fff",border:`1px solid ${selectedFamily===family?c.border:"#e8e6e1"}`,borderRadius:14,overflow:"hidden",cursor:"pointer",transition:"all 0.2s"}} onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"} onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
      <div style={{height:90,overflow:"hidden",position:"relative",background:c.bg}}>
        {withPhoto?<img src={withPhoto.thumbnail_url} alt={family} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>:<div style={{width:"100%",height:"100%",background:c.bg,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:28,opacity:0.5}}>🌿</span></div>}
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,transparent 40%,rgba(0,0,0,0.55))"}}/>
        <div style={{position:"absolute",bottom:6,left:8,right:8,display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
          <span style={{fontSize:10,fontWeight:600,color:"#fff",textShadow:"0 1px 2px rgba(0,0,0,0.8)",lineHeight:1.3}}>{family}</span>
          {threatened>0&&<span style={{fontSize:8,padding:"1px 5px",borderRadius:99,background:"rgba(162,45,45,0.85)",color:"#fff"}}>{threatened}⚠</span>}
        </div>
      </div>
      <div style={{padding:"7px 10px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:11,color:"#5f5e5a"}}>{members.length} species</span>
        <div style={{display:"flex",gap:2}}>{["CR","EN","VU"].map(s=>{const n=members.filter(m=>m.iucn_status===s).length;return n>0?<span key={s} style={{fontSize:8,padding:"1px 4px",borderRadius:99,background:iucnBg(s),color:iucnC(s)}}>{s}:{n}</span>:null;})}</div>
      </div>
    </div>;
  }

  function GenusCard({genus}){
    const members=familySpecies.filter(s=>s.genus===genus);
    const withPhoto=members.find(s=>s.thumbnail_url);
    const c=FAMILY_COLORS[selectedFamily]||DEF_FAM;
    const threatened=members.filter(s=>["CR","EN","VU"].includes(s.iucn_status)).length;
    return<div onClick={()=>{setSelectedGenus(genus);setSearch("");}} style={{background:"#fff",border:`1px solid ${selectedGenus===genus?c.border:"#e8e6e1"}`,borderRadius:12,overflow:"hidden",cursor:"pointer",transition:"all 0.2s"}} onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"} onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
      <div style={{height:70,overflow:"hidden",position:"relative",background:c.bg}}>
        {withPhoto?<img src={withPhoto.thumbnail_url} alt={genus} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>:<div style={{width:"100%",height:"100%",background:c.bg,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:22,opacity:0.4}}>🌿</span></div>}
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,transparent 30%,rgba(0,0,0,0.5))"}}/>
        <div style={{position:"absolute",bottom:5,left:8}}>
          <span style={{fontSize:11,fontWeight:700,fontStyle:"italic",color:"#fff",textShadow:"0 1px 2px rgba(0,0,0,0.8)"}}>{genus}</span>
        </div>
        {threatened>0&&<span style={{position:"absolute",top:5,right:6,fontSize:8,padding:"1px 5px",borderRadius:99,background:"rgba(162,45,45,0.85)",color:"#fff"}}>{threatened}⚠</span>}
      </div>
      <div style={{padding:"6px 10px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:10,color:"#5f5e5a"}}>{members.length} species</span>
        <span style={{fontSize:10,color:"#b4b2a9"}}>→</span>
      </div>
    </div>;
  }

  function SpeciesRow({sp}){
    const c=FAMILY_COLORS[sp.family]||DEF_FAM;

    // ── Linked program lookup ──
    const linkedProgram = (programs||[]).find(p => p.species_id === sp.id);

    // ── Gap derivation from row-level fields (no fetch) ──
    // Each gap returns: {key, concept, label, icon}
    // - concept: bare noun used inside the summary sentence (do not change)
    // - label:   inferred-signal phrasing shown on the card (avoid stating as confirmed fact)
    const gaps = [];
    // Propagation: derived from tc_status / recommended_pathway
    const tc = (sp.tc_status||"").toLowerCase();
    if (!sp.tc_status || tc.includes("early") || tc.includes("none") || tc.includes("missing")) {
      gaps.push({key:"prop", concept:"propagation", label:"Propagation gap (likely)", icon:"❌"});
    } else if (tc.includes("partial") || tc.includes("research")) {
      gaps.push({key:"prop", concept:"propagation", label:"Propagation gap (partial)", icon:"⚠️"});
    }
    // Metabolite: score_scientific düşükse veya yoksa
    if (!sp.score_scientific || sp.score_scientific < 40) {
      gaps.push({key:"met", concept:"metabolite", label:"Metabolite gap (likely)", icon:"❌"});
    } else if (sp.score_scientific < 60) {
      gaps.push({key:"met", concept:"metabolite", label:"Metabolite gap (partial)", icon:"⚠️"});
    }
    // Governance: current_decision veya implicit
    if (!sp.current_decision || sp.current_decision === "Hold" || sp.current_decision === "Block") {
      gaps.push({key:"gov", concept:"governance", label:"Governance unclear", icon:"❓"});
    }
    // Commercial: score_venture
    if (!sp.score_venture || sp.score_venture < 40) {
      gaps.push({key:"com", concept:"commercial", label:"Commercial signal weak", icon:"⚠️"});
    }
    // priority order: prop > met > gov > com — already ordered above by push order
    const topGaps = gaps.slice(0, 3);

    // ── 1-sentence summary (with per-species rotation for natural variety) ──
    // Deterministic index from species ID — same species always shows same phrasing
    const idStr = String(sp.id||sp.accepted_name||"");
    let h = 0; for (let i=0;i<idStr.length;i++) h = ((h<<5)-h+idStr.charCodeAt(i))|0;
    const rot = Math.abs(h);
    const pick = (arr) => arr[rot % arr.length];

    let sentence = "";
    if (sp.recommended_pathway) {
      const pathway = sp.recommended_pathway;
      const critGap = gaps.find(g=>g.icon==="❌");
      if (critGap) {
        sentence = pick([
          `${pathway} candidate lacking a validated ${critGap.concept} protocol`,
          `${pathway} candidate constrained by ${critGap.concept} gap`,
          `${pathway} candidate — ${critGap.concept} protocol still missing`,
          `${pathway} candidate, ${critGap.concept} barrier unresolved`
        ]);
      } else if (gaps.length>0) {
        sentence = pick([
          `${pathway} candidate with partial ${gaps[0].concept} evidence`,
          `${pathway} candidate, ${gaps[0].concept} evidence still incomplete`,
          `${pathway} candidate — ${gaps[0].concept} signal partially supported`
        ]);
      } else {
        sentence = pick([
          `${pathway} candidate ready for program initiation`,
          `${pathway}-ready candidate, no major technical barriers`,
          `Strong ${pathway} candidate ready to advance`,
          `Viable ${pathway} candidate, ready for execution`
        ]);
      }
    } else if (gaps.find(g=>g.key==="prop" && g.icon==="❌")) {
      sentence = pick([
        "Promising candidate without a validated propagation protocol",
        "Promising species, propagation pathway still unresolved",
        "Strong potential held back by missing propagation work"
      ]);
    } else if (gaps.find(g=>g.key==="met" && g.icon==="⚠️")) {
      sentence = pick([
        "Promising metabolite profile with partial evidence",
        "Interesting chemistry, evidence base still building",
        "Metabolite signals visible, full picture not yet established"
      ]);
    } else if (!linkedProgram && (sp.composite_score||0) >= 60) {
      sentence = pick([
        "Strong candidate ready for program initiation",
        "High-priority species ready to enter an active program",
        "Solid candidate waiting for a program to anchor it"
      ]);
    } else if ((sp.composite_score||0) >= 50) {
      sentence = pick([
        "Balanced GEOCON candidate worth a closer look",
        "Moderate candidate with mixed signals — worth review",
        "Stable GEOCON candidate, no urgent action yet"
      ]);
    } else {
      sentence = pick([
        "Low-priority candidate at this stage",
        "Limited signals — keep on watchlist",
        "Background candidate, monitoring only"
      ]);
    }
    if (sentence.length > 120) sentence = sentence.slice(0,117) + "...";

    return <div onClick={()=>onSpeciesClick(sp)} style={{display:"flex",alignItems:"stretch",gap:0,background:"#fff",borderRadius:10,border:"1px solid #e8e6e1",borderLeft:`4px solid ${c.dot}`,cursor:"pointer",overflow:"hidden",transition:"all 0.15s"}} onMouseEnter={e=>{e.currentTarget.style.background="#fcfbf9";e.currentTarget.style.transform="translateY(-1px)";e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,0.06)";}} onMouseLeave={e=>{e.currentTarget.style.background="#fff";e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}>

      {/* Thumbnail */}
      <div style={{width:64,minHeight:64,flexShrink:0,background:c.bg,position:"relative"}}>{sp.thumbnail_url?<img src={sp.thumbnail_url} alt={sp.accepted_name} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.parentElement.style.background=c.bg}/>:<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:22}}>🌿</span></div>}</div>

      {/* Body */}
      <div style={{flex:1,minWidth:0,padding:"10px 14px",display:"flex",flexDirection:"column",gap:6}}>

        {/* Top row: name + scores + IUCN */}
        <div style={{display:"flex",alignItems:"flex-start",gap:8,justifyContent:"space-between"}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,fontWeight:600,fontStyle:"italic",color:"#2c2c2a",fontFamily:"Georgia,serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sp.accepted_name}</div>
            <div style={{fontSize:10,color:"#b4b2a9",marginTop:1,display:"flex",gap:6,flexWrap:"wrap"}}>
              {sp.iucn_status&&<span style={{padding:"1px 6px",borderRadius:99,background:iucnBg(sp.iucn_status),color:iucnC(sp.iucn_status),fontWeight:600}}>{sp.iucn_status}</span>}
              {sp.country_focus&&<span>{flag(sp.country_focus)} {sp.country_focus}</span>}
              {sp.geophyte_type&&<span>· {sp.geophyte_type}</span>}
            </div>
          </div>
          {sp.composite_score!=null&&(()=>{
            const s=sp.composite_score;
            const band = s>=80 ? "Very high potential" : s>=60 ? "High potential" : s>=40 ? "Moderate potential" : "Low potential";
            return <div style={{textAlign:"right",flexShrink:0,minWidth:96}}>
              <div style={{fontSize:18,fontWeight:700,color:"#1D9E75",fontFamily:"Georgia,serif",lineHeight:1}}>{s}</div>
              <div style={{fontSize:8,color:"#b4b2a9",textTransform:"uppercase",letterSpacing:0.5,marginTop:2}}>{band}</div>
            </div>;
          })()}
        </div>

        {/* 1-sentence summary */}
        <div style={{fontSize:11,color:"#5f5e5a",lineHeight:1.4}}>→ {sentence}</div>

        {/* Linked program indicator (only when a program exists) */}
        {linkedProgram&&<div style={{fontSize:10,color:"#085041",display:"flex",alignItems:"center",gap:4}}>
          <span style={{color:"#888"}}>Linked program:</span>
          <span style={{fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{linkedProgram.program_name}</span>
        </div>}

        {/* Bottom row: signals (gap strip) + CTA */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,flexWrap:"wrap"}}>
          <div style={{display:"flex",gap:8,fontSize:10,color:"#888",flexWrap:"wrap",alignItems:"center"}}>
            <span style={{fontSize:8,color:"#b4b2a9",textTransform:"uppercase",letterSpacing:0.5,fontWeight:700,marginRight:2}}>Signals:</span>
            {topGaps.length>0?topGaps.map((g,i)=><span key={g.key} style={{display:"inline-flex",alignItems:"center",gap:3}}>
              <span style={{fontSize:10}}>{g.icon}</span>
              <span>{g.label}</span>
              {i<topGaps.length-1&&<span style={{color:"#ccc",marginLeft:2}}>·</span>}
            </span>):<span style={{fontSize:10,color:"#b4b2a9",fontStyle:"italic"}}>{pick(["No major technical barriers","Ready for execution","No critical constraints identified"])}</span>}
          </div>
          {linkedProgram?<button onClick={e=>{e.stopPropagation();if(onOpenProgram)onOpenProgram(linkedProgram);else onSpeciesClick(sp);}} onMouseEnter={e=>{e.currentTarget.style.background="#1D9E75";e.currentTarget.style.color="#fff";e.currentTarget.style.boxShadow="0 2px 6px rgba(29,158,117,0.25)";}} onMouseLeave={e=>{e.currentTarget.style.background="#E1F5EE";e.currentTarget.style.color="#085041";e.currentTarget.style.boxShadow="none";}} style={{padding:"6px 12px",background:"#E1F5EE",color:"#085041",border:"1px solid #1D9E75",borderRadius:7,fontSize:11,fontWeight:700,cursor:"pointer",flexShrink:0,letterSpacing:0.2,transition:"all 0.15s"}}>Open Program →</button>:<button onClick={e=>{e.stopPropagation();if(onStartProgram)onStartProgram(sp);else onSpeciesClick(sp);}} onMouseEnter={e=>{e.currentTarget.style.background="#085041";e.currentTarget.style.boxShadow="0 2px 6px rgba(8,80,65,0.3)";}} onMouseLeave={e=>{e.currentTarget.style.background="#1D9E75";e.currentTarget.style.boxShadow="none";}} style={{padding:"6px 12px",background:"#1D9E75",color:"#fff",border:"none",borderRadius:7,fontSize:11,fontWeight:700,cursor:"pointer",flexShrink:0,letterSpacing:0.2,transition:"all 0.15s"}}>+ Start Program</button>}
        </div>

      </div>
    </div>;
  }

  // Breadcrumb
  const Breadcrumb = () => <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:14,fontSize:11,color:"#888",flexWrap:"wrap"}}>
    <button onClick={()=>{setSelectedFamily(null);setSelectedGenus(null);setSearch("");}} style={{background:"none",border:"none",cursor:"pointer",color:"#1D9E75",fontWeight:600,fontSize:11,padding:0}}>Families</button>
    {selectedFamily&&<><span>›</span>
    <button onClick={()=>{setSelectedGenus(null);setSearch("");}} style={{background:"none",border:"none",cursor:"pointer",color:selectedGenus?"#1D9E75":"#2c2c2a",fontWeight:600,fontSize:11,padding:0}}>{selectedFamily}</button></>}
    {selectedGenus&&<><span>›</span><span style={{color:"#2c2c2a",fontWeight:600,fontStyle:"italic"}}>{selectedGenus}</span></>}
  </div>;

  return<div>
    {/* Header stats */}
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
      <div>
        <div style={{fontSize:16,fontWeight:700,color:"#2c2c2a",fontFamily:"Georgia,serif"}}>
          {!selectedFamily?"Species Families":selectedGenus?selectedGenus:selectedFamily}
        </div>
        <div style={{fontSize:11,color:"#888",marginTop:2}}>
          {!selectedFamily?`${species.length} species · ${families.length} families`:
           !selectedGenus&&hasGenera?`${familySpecies.length} species · ${genera.length} genera`:
           `${genusSpecies.length} species`}
        </div>
      </div>
      <div style={{display:"flex",gap:6}}>
        {[{l:"Total",v:species.length,c:"#1D9E75"},{l:"Threatened",v:species.filter(s=>["CR","EN","VU"].includes(s.iucn_status)).length,c:"#E24B4A"},{l:"TR",v:species.filter(s=>s.country_focus==="TR").length,c:"#185FA5"},{l:"CL",v:species.filter(s=>s.country_focus==="CL").length,c:"#D85A30"}].map(s=><div key={s.l} style={{textAlign:"center",padding:"5px 10px",background:"#f4f3ef",borderRadius:8}}><div style={{fontSize:14,fontWeight:700,color:s.c}}>{s.v}</div><div style={{fontSize:9,color:"#999"}}>{s.l}</div></div>)}
      </div>
    </div>

    {/* Breadcrumb */}
    {selectedFamily && <Breadcrumb/>}

    {/* Layer 1: Families */}
    {!selectedFamily&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:10}}>{families.map(f=><FamilyCard key={f} family={f}/>)}</div>}

    {/* Layer 2: Genera */}
    {selectedFamily&&!selectedGenus&&hasGenera&&(
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:10}}>
        {genera.map(g=><GenusCard key={g} genus={g}/>)}
      </div>
    )}

    {/* Layer 3: Species list */}
    {(selectedGenus||(selectedFamily&&!hasGenera))&&<>
      <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>
        <input type="text" placeholder="Search species..." value={search} onChange={e=>setSearch(e.target.value)} style={{flex:"1 1 160px",...S.input}}/>
        <select value={fC} onChange={e=>setFC(e.target.value)} style={S.input}><option value="all">All countries</option>{countries.map(c=><option key={c} value={c}>{c==="TR"?"Türkiye":"Chile"}</option>)}</select>
      </div>

      {/* Filter bar: sort + 3 filter groups */}
      <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:10,color:"#888",textTransform:"uppercase",letterSpacing:0.5,fontWeight:600,marginRight:2}}>Sort</span>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{...S.input,fontSize:11,padding:"5px 8px"}}>
          <option value="score">Composite score</option>
          <option value="scientific">Scientific score</option>
          <option value="economic">Economic score</option>
        </select>

        <span style={{fontSize:10,color:"#ccc",margin:"0 2px"}}>·</span>

        {/* Opportunity dropdown */}
        <details name="atlas-filter" style={{position:"relative"}}>
          <summary style={{listStyle:"none",cursor:"pointer",padding:"5px 10px",border:"1px solid #e8e6e1",borderRadius:7,background:filters.opportunity.length>0?"#E1F5EE":"#fff",color:filters.opportunity.length>0?"#085041":"#5f5e5a",fontSize:11,fontWeight:600,display:"inline-flex",alignItems:"center",gap:4}}>
            Opportunity{filters.opportunity.length>0&&<span style={{fontSize:10}}>({filters.opportunity.length})</span>} ▾
          </summary>
          <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,zIndex:10,background:"#fff",border:"1px solid #e8e6e1",borderRadius:8,boxShadow:"0 4px 12px rgba(0,0,0,0.08)",padding:6,minWidth:200}}>
            {[{k:"highEconomic",l:"High Economic (≥60)"},{k:"highScientific",l:"High Scientific (≥60)"}].map(o=><label key={o.k} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",fontSize:11,cursor:"pointer",borderRadius:5,color:"#2c2c2a"}} onMouseEnter={e=>e.currentTarget.style.background="#f8f7f4"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <input type="checkbox" checked={filters.opportunity.includes(o.k)} onChange={()=>toggleFilter("opportunity",o.k)} style={{cursor:"pointer"}}/>
              <span>{o.l}</span>
            </label>)}
          </div>
        </details>

        {/* Risk dropdown */}
        <details name="atlas-filter" style={{position:"relative"}}>
          <summary style={{listStyle:"none",cursor:"pointer",padding:"5px 10px",border:"1px solid #e8e6e1",borderRadius:7,background:filters.risk.length>0?"#FCEBEB":"#fff",color:filters.risk.length>0?"#A32D2D":"#5f5e5a",fontSize:11,fontWeight:600,display:"inline-flex",alignItems:"center",gap:4}}>
            Risk{filters.risk.length>0&&<span style={{fontSize:10}}>({filters.risk.length})</span>} ▾
          </summary>
          <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,zIndex:10,background:"#fff",border:"1px solid #e8e6e1",borderRadius:8,boxShadow:"0 4px 12px rgba(0,0,0,0.08)",padding:6,minWidth:220}}>
            {[{k:"missingPropagation",l:"Missing Propagation"},{k:"dataPoor",l:"Data Poor (<40 scientific)"}].map(o=><label key={o.k} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",fontSize:11,cursor:"pointer",borderRadius:5,color:"#2c2c2a"}} onMouseEnter={e=>e.currentTarget.style.background="#f8f7f4"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <input type="checkbox" checked={filters.risk.includes(o.k)} onChange={()=>toggleFilter("risk",o.k)} style={{cursor:"pointer"}}/>
              <span>{o.l}</span>
            </label>)}
          </div>
        </details>

        {/* Program dropdown */}
        <details name="atlas-filter" style={{position:"relative"}}>
          <summary style={{listStyle:"none",cursor:"pointer",padding:"5px 10px",border:"1px solid #e8e6e1",borderRadius:7,background:filters.program.length>0?"#E6F1FB":"#fff",color:filters.program.length>0?"#0C447C":"#5f5e5a",fontSize:11,fontWeight:600,display:"inline-flex",alignItems:"center",gap:4}}>
            Program{filters.program.length>0&&<span style={{fontSize:10}}>({filters.program.length})</span>} ▾
          </summary>
          <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,zIndex:10,background:"#fff",border:"1px solid #e8e6e1",borderRadius:8,boxShadow:"0 4px 12px rgba(0,0,0,0.08)",padding:6,minWidth:180}}>
            {[{k:"noProgram",l:"No Program"},{k:"activeProgram",l:"Active Program"}].map(o=><label key={o.k} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",fontSize:11,cursor:"pointer",borderRadius:5,color:"#2c2c2a"}} onMouseEnter={e=>e.currentTarget.style.background="#f8f7f4"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <input type="checkbox" checked={filters.program.includes(o.k)} onChange={()=>toggleFilter("program",o.k)} style={{cursor:"pointer"}}/>
              <span>{o.l}</span>
            </label>)}
          </div>
        </details>

        {filterCount>0&&<button onClick={()=>setFilters({opportunity:[],risk:[],program:[]})} style={{padding:"5px 10px",border:"none",background:"none",color:"#888",fontSize:10,cursor:"pointer",textDecoration:"underline"}}>Clear all</button>}
      </div>

      {/* Active filter tags */}
      {filterCount>0&&<div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:9,color:"#b4b2a9",textTransform:"uppercase",letterSpacing:0.5,fontWeight:600}}>Active:</span>
        {Object.entries(filters).flatMap(([group,vals])=>vals.map(v=>
          <span key={`${group}-${v}`} style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 8px",background:group==="opportunity"?"#E1F5EE":group==="risk"?"#FCEBEB":"#E6F1FB",color:group==="opportunity"?"#085041":group==="risk"?"#A32D2D":"#0C447C",borderRadius:99,fontSize:10,fontWeight:600}}>
            {FILTER_LABELS[v]||v}
            <button onClick={()=>removeFilter(group,v)} style={{background:"none",border:"none",cursor:"pointer",color:"inherit",fontSize:11,padding:0,lineHeight:1,opacity:0.7}}>×</button>
          </span>
        ))}
      </div>}

      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {genusSpecies.length===0?<div style={{textAlign:"center",padding:"48px 24px",color:"#999",fontSize:13,background:"#fcfbf9",borderRadius:10,border:"1px dashed #e8e6e1"}}>
          {filterCount>0?<>
            <div style={{fontSize:14,fontWeight:600,color:"#5f5e5a",marginBottom:6}}>No matching species</div>
            <div style={{fontSize:11,color:"#888"}}>Try removing one filter or changing the opportunity/risk setting.</div>
          </>:<div style={{fontSize:13}}>No species found</div>}
        </div>:genusSpecies.map(sp=><SpeciesRow key={sp.id} sp={sp}/>)}
      </div>
    </>}
  </div>;
}


/* ── Programs View ── */

/* ── Other views (Market, Researchers, Partners, Sources, Portfolio, Admin) ── */
function MarketView({markets}){const[expanded,setExpanded]=useState(null);return<div><div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>{[{l:"Hypotheses",v:markets.length},{l:"Spin-offs",v:[...new Set(markets.map(m=>m.spinoff_link))].length}].map(s=><div key={s.l} style={{flex:"1 1 110px",...S.metric}}><div style={S.mLabel}>{s.l}</div><div style={S.mVal()}>{s.v}</div></div>)}</div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:10}}>{markets.map(m=><div key={m.id} onClick={()=>setExpanded(expanded===m.id?null:m.id)} style={{...S.card,padding:16,cursor:"pointer"}}><div style={{fontSize:14,fontWeight:600,color:"#2c2c2a",marginBottom:4}}>{m.application_area}</div><div style={{fontSize:10,fontStyle:"italic",color:"#888"}}>{m.species?.accepted_name||"—"} — {m.market_segment}</div></div>)}</div></div>;}
function PartnerView({institutions}){return<div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:8}}>{institutions.map(i=><div key={i.id} style={{...S.card,padding:14}}><div style={{fontSize:13,fontWeight:600,color:"#2c2c2a"}}>{i.name}</div><div style={{fontSize:10,color:"#888"}}>{i.city}, {i.country}</div><div style={{fontSize:11,color:"#5f5e5a",marginTop:4}}>{i.research_focus}</div></div>)}</div></div>;}
function SourcesPanel({sources}){return<div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:8}}>{sources.map(src=><div key={src.id} style={{...S.card,padding:"10px 12px"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}><span style={{fontSize:12,fontWeight:600,color:"#2c2c2a"}}>{src.source_name}</span><div style={{display:"flex",alignItems:"center",gap:3}}><Dot color={freshC(src.freshness_score||0)}/><span style={{fontSize:10,fontWeight:600,color:freshC(src.freshness_score||0)}}>{Math.round((src.freshness_score||0)*100)}%</span></div></div><div style={S.sub}>{src.data_domain} · {src.update_frequency}</div><MiniBar value={(src.freshness_score||0)*100} color={freshC(src.freshness_score||0)} h={3}/></div>)}</div></div>;}
function PortfolioView({species}){return<div><p style={S.sub}>Composite vs. urgency — bubble = value score</p><div style={{position:"relative",width:"100%",height:320,background:"#fff",borderRadius:14,border:"1px solid #e8e6e1",overflow:"hidden",marginTop:8}}>{species.map(sp=>{const c=sp.composite_score||50,con=sp.score_conservation||50,v=sp.score_venture||50;const x=((c-40)/50)*82+9,y=100-((con-20)/80)*88,sz=16+(v/100)*28;return<div key={sp.id} title={`${sp.accepted_name}\nComp:${c}`} style={{position:"absolute",left:`${x}%`,top:`${y}%`,width:sz,height:sz,borderRadius:"50%",background:iucnC(sp.iucn_status),opacity:0.75,transform:"translate(-50%,-50%)",border:"2px solid #fff",cursor:"default"}}/>})}</div></div>;}

/* ── Admin Panel (inline for now) ── */

/* ── Link Researcher Form (used in AdminPanel) ── */
function LinkResearcherForm({species, onDataChange, notify}) {
  const [researchers, setResearchers] = useState([]);
  const [selSpecies, setSelSpecies] = useState("");
  const [selResearcher, setSelResearcher] = useState("");
  const [role, setRole] = useState("Researcher");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [links, setLinks] = useState([]);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newR, setNewR] = useState({name:"",expertise_area:"",country:"",institution:"",h_index:""});
  const [newSaving, setNewSaving] = useState(false);
  const INP = {padding:"8px 10px",border:"1px solid #e8e6e1",borderRadius:6,fontSize:12,background:"#fff",width:"100%"};
  const LBL = {fontSize:10,color:"#888",marginBottom:3,display:"block",textTransform:"uppercase",letterSpacing:0.4};

  useEffect(() => {
    supabase.from("researchers").select("id,name,expertise_area,country").order("name").then(({data})=>setResearchers(data||[]));
  }, []);

  async function handleNewResearcher() {
    if (!newR.name.trim()) return;
    setNewSaving(true);
    const id = "RES-" + Date.now();
    const {data, error} = await supabase.from("researchers").insert({
      id, name: newR.name, expertise_area: newR.expertise_area||null,
      country: newR.country||null, institution: newR.institution||null,
      h_index: newR.h_index ? parseInt(newR.h_index) : null
    }).select().single();
    setNewSaving(false);
    if (error) { notify("Hata: "+error.message, false); return; }
    notify("✓ Araştırmacı eklendi");
    setResearchers(prev => [...prev, data].sort((a,b)=>(a.name||"").localeCompare(b.name||"")));
    setSelResearcher(data.id);
    setNewR({name:"",expertise_area:"",country:"",institution:"",h_index:""});
    setShowNewForm(false);
    onDataChange?.();
  }

  useEffect(() => {
    if (!selSpecies) { setLinks([]); return; }
    supabase.from("researcher_species")
      .select("*, researchers(name,expertise_area)")
      .eq("species_id", selSpecies)
      .then(({data}) => setLinks(data||[]));
  }, [selSpecies]);

  async function handleLink() {
    if (!selSpecies || !selResearcher) return;
    setSaving(true);
    const {error} = await supabase.from("researcher_species").insert({
      species_id: selSpecies,
      researcher_id: selResearcher,
      role, notes: notes||null
    });
    setSaving(false);
    if (error) notify("Hata: " + error.message, false);
    else {
      notify("✓ Araştırmacı bağlandı");
      setSelResearcher(""); setNotes("");
      // Refresh links
      const {data} = await supabase.from("researcher_species").select("*, researchers(name,expertise_area)").eq("species_id", selSpecies);
      setLinks(data||[]);
      onDataChange?.();
    }
  }

  async function handleUnlink(linkId) {
    const {error} = await supabase.from("researcher_species").delete().eq("id", linkId);
    if (error) notify("Hata: " + error.message, false);
    else {
      notify("✓ Bağlantı kaldırıldı");
      setLinks(links.filter(l => l.id !== linkId));
      onDataChange?.();
    }
  }

  return <div style={{display:"flex",flexDirection:"column",gap:12}}>
    {/* New researcher quick-add */}
    <div style={{padding:"10px 14px",background:"#f8f7f4",borderRadius:10,border:"1px solid #e8e6e1"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:showNewForm?10:0}}>
        <div style={{fontSize:11,color:"#5f5e5a",fontWeight:600}}>Yeni araştırmacı ekle</div>
        <button onClick={()=>setShowNewForm(!showNewForm)} style={{padding:"4px 10px",background:showNewForm?"#f4f3ef":"#1D9E75",color:showNewForm?"#888":"#fff",border:"none",borderRadius:6,cursor:"pointer",fontSize:10,fontWeight:600}}>{showNewForm?"İptal":"+ Ekle"}</button>
      </div>
      {showNewForm && <div style={{display:"flex",flexDirection:"column",gap:8}}>
        <div><label style={LBL}>İsim *</label><input value={newR.name} onChange={e=>setNewR({...newR,name:e.target.value})} placeholder="Ad Soyad" style={INP}/></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <div><label style={LBL}>Uzmanlık</label><input value={newR.expertise_area} onChange={e=>setNewR({...newR,expertise_area:e.target.value})} placeholder="Ör: Plant biotechnology" style={INP}/></div>
          <div><label style={LBL}>Ülke</label><input value={newR.country} onChange={e=>setNewR({...newR,country:e.target.value})} placeholder="Ör: TR" style={INP}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <div><label style={LBL}>Kurum</label><input value={newR.institution} onChange={e=>setNewR({...newR,institution:e.target.value})} placeholder="Üniversite/Kurum" style={INP}/></div>
          <div><label style={LBL}>h-index</label><input type="number" value={newR.h_index} onChange={e=>setNewR({...newR,h_index:e.target.value})} placeholder="0" style={INP}/></div>
        </div>
        <button disabled={newSaving||!newR.name.trim()} onClick={handleNewResearcher}
          style={{padding:"8px 16px",background:newSaving||!newR.name.trim()?"#ccc":"#185FA5",color:"#fff",border:"none",borderRadius:8,cursor:newSaving||!newR.name.trim()?"default":"pointer",fontSize:11,fontWeight:600}}>
          {newSaving?"Kaydediliyor...":"Araştırmacı Oluştur & Seç"}
        </button>
      </div>}
    </div>

    <div>
      <label style={LBL}>Tür *</label>
      <select value={selSpecies} onChange={e=>setSelSpecies(e.target.value)} style={INP}>
        <option value="">-- Tür seçin --</option>
        {[...species].sort((a,b)=>(a.accepted_name||"").localeCompare(b.accepted_name||"")).map(s=><option key={s.id} value={s.id}>{s.accepted_name}</option>)}
      </select>
    </div>
    <div>
      <label style={LBL}>Araştırmacı *</label>
      <select value={selResearcher} onChange={e=>setSelResearcher(e.target.value)} style={INP}>
        <option value="">-- Araştırmacı seçin --</option>
        {researchers.map(r=><option key={r.id} value={r.id}>{r.name} {r.country?`(${r.country})`:""}</option>)}
      </select>
    </div>
    <div>
      <label style={LBL}>Rol</label>
      <select value={role} onChange={e=>setRole(e.target.value)} style={INP}>
        {["Researcher","Lead Researcher","PhD Student","Collaborator","Expert Advisor"].map(r=><option key={r}>{r}</option>)}
      </select>
    </div>
    <div>
      <label style={LBL}>Notlar</label>
      <input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Opsiyonel..." style={INP}/>
    </div>
    <button disabled={saving||!selSpecies||!selResearcher} onClick={handleLink}
      style={{padding:"10px 20px",background:saving||!selSpecies||!selResearcher?"#ccc":"#1D9E75",color:"#fff",border:"none",borderRadius:8,cursor:saving||!selSpecies||!selResearcher?"default":"pointer",fontSize:12,fontWeight:600}}>
      {saving?"Kaydediliyor...":"Araştırmacıyı Bağla"}
    </button>

    {/* Existing links for selected species */}
    {selSpecies && links.length > 0 && <div style={{marginTop:8,paddingTop:12,borderTop:"1px solid #e8e6e1"}}>
      <div style={{fontSize:10,color:"#888",textTransform:"uppercase",marginBottom:8}}>Mevcut bağlantılar</div>
      {links.map(l=><div key={l.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 10px",background:"#f8f7f4",borderRadius:8,marginBottom:4}}>
        <div>
          <div style={{fontSize:12,fontWeight:600,color:"#2c2c2a"}}>{l.researchers?.name}</div>
          <div style={{fontSize:10,color:"#888"}}>{l.role}</div>
        </div>
        <button onClick={()=>handleUnlink(l.id)} style={{padding:"4px 8px",background:"#FCEBEB",color:"#A32D2D",border:"none",borderRadius:6,cursor:"pointer",fontSize:10}}>Kaldır</button>
      </div>)}
    </div>}
  </div>;
}

function S2EnrichmentCard() {
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enqueueing, setEnqueueing] = useState(null); // 'metadata' | 'embedding' | null
  const [lastAction, setLastAction] = useState(null);

  const refresh = async () => {
    try {
      const { data } = await supabase.from("v_s2_enrichment_progress").select("*");
      setProgress(data || []);
    } catch (e) {
      console.warn("S2 progress fetch failed:", e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 30000);
    return () => clearInterval(t);
  }, []);

  const enqueueNow = async (pipeline) => {
    setEnqueueing(pipeline);
    try {
      const fnName = pipeline === "metadata" ? "s2_enqueue_batch" : "s2_embedding_enqueue_batch";
      const { data, error } = await supabase.rpc(fnName, { p_batch_size: 100 });
      if (error) {
        setLastAction({ ok: false, text: `${pipeline}: ${error.message}` });
      } else {
        const r = data?.[0];
        setLastAction({ ok: true, text: `${pipeline}: enqueued ${r?.n_publications || r?.n_requested || 0} publications` });
        setTimeout(refresh, 5000);
      }
    } catch (e) {
      setLastAction({ ok: false, text: e.message });
    }
    setEnqueueing(null);
    setTimeout(() => setLastAction(null), 6000);
  };

  // Pipeline başına breakdown
  const breakdown = (pipeline) => {
    const rows = progress.filter(r => r.pipeline === pipeline);
    const total = rows.reduce((s, r) => s + Number(r.n), 0);
    const get = (status) => Number(rows.find(r => r.status === status)?.n || 0);
    return {
      total,
      success: get("success"),
      pending: get("pending"),
      notFound: get("not_found"),
      error: get("error"),
      skip: get("skip"),
    };
  };

  const meta = breakdown("metadata");
  const emb = breakdown("embedding");

  const PipelineRow = ({ title, subtitle, icon, accent, bg, b, onEnqueue, btnLabel, isEnqueueing }) => {
    const successPct = b.total > 0 ? (b.success / b.total * 100) : 0;
    const notFoundPct = b.total > 0 ? (b.notFound / b.total * 100) : 0;
    const errorPct = b.total > 0 ? (b.error / b.total * 100) : 0;
    const skipPct = b.total > 0 ? (b.skip / b.total * 100) : 0;

    return (
      <div style={{padding:"10px 12px",background:bg,borderRadius:8,marginTop:8}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,marginBottom:6,flexWrap:"wrap"}}>
          <div style={{flex:1,minWidth:160}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
              <span style={{fontSize:14}}>{icon}</span>
              <div style={{fontSize:11,fontWeight:700,color:accent}}>{title}</div>
            </div>
            <div style={{fontSize:9,color:"#888"}}>{subtitle}</div>
          </div>
          <button
            onClick={onEnqueue}
            disabled={isEnqueueing || b.pending === 0}
            style={{padding:"4px 10px",background:isEnqueueing||b.pending===0?"#ddd":accent,color:"#fff",border:"none",borderRadius:5,cursor:isEnqueueing||b.pending===0?"default":"pointer",fontSize:10,fontWeight:600,whiteSpace:"nowrap"}}
          >
            {isEnqueueing ? "..." : btnLabel}
          </button>
        </div>

        <div style={{height:6,background:"#f4f3ef",borderRadius:3,overflow:"hidden",marginBottom:6,display:"flex"}}>
          <div style={{width:`${successPct}%`,background:"#1D9E75",transition:"width 0.4s"}} />
          <div style={{width:`${notFoundPct}%`,background:"#b4b2a9",transition:"width 0.4s"}} />
          <div style={{width:`${errorPct}%`,background:"#A32D2D",transition:"width 0.4s"}} />
          <div style={{width:`${skipPct}%`,background:"#e8e6e1",transition:"width 0.4s"}} />
        </div>

        <div style={{display:"flex",gap:10,fontSize:9,color:"#5f5e5a",flexWrap:"wrap"}}>
          <span><strong style={{color:"#1D9E75"}}>{b.success}</strong> ok</span>
          {b.pending > 0 && <span><strong style={{color:"#854F0B"}}>{b.pending}</strong> pending</span>}
          {b.notFound > 0 && <span><strong style={{color:"#b4b2a9"}}>{b.notFound}</strong> not found</span>}
          {b.error > 0 && <span><strong style={{color:"#A32D2D"}}>{b.error}</strong> err</span>}
          {b.skip > 0 && <span style={{color:"#b4b2a9"}}>{b.skip} skip</span>}
          <span style={{marginLeft:"auto",color:"#999"}}>{b.total} total</span>
        </div>
      </div>
    );
  };

  return (
    <div style={{marginBottom:20,padding:"14px 16px",background:"linear-gradient(135deg,#EEEDFE 0%,#fff 100%)",borderRadius:12,border:"1px solid #534AB744"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",gap:8,flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:18}}>🔬</span>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:"#3C3489"}}>Semantic Scholar Enrichment</div>
            <div style={{fontSize:10,color:"#888"}}>Otomatik cron · auto-refresh 30s</div>
          </div>
        </div>
      </div>

      <PipelineRow
        title="Metadata"
        subtitle="TLDR · influential citations · reference count · fields of study"
        icon="📝"
        accent="#534AB7"
        bg="#fff"
        b={meta}
        onEnqueue={() => enqueueNow("metadata")}
        btnLabel="Enqueue 100 →"
        isEnqueueing={enqueueing === "metadata"}
      />

      <PipelineRow
        title="Embedding (SPECTER2)"
        subtitle="768-dim vectors · enables similarity search"
        icon="🧠"
        accent="#185FA5"
        bg="#fff"
        b={emb}
        onEnqueue={() => enqueueNow("embedding")}
        btnLabel="Enqueue 100 →"
        isEnqueueing={enqueueing === "embedding"}
      />

      {lastAction && (
        <div style={{marginTop:8,padding:"6px 10px",borderRadius:6,fontSize:10,background:lastAction.ok?"#E1F5EE":"#FCEBEB",color:lastAction.ok?"#085041":"#A32D2D"}}>
          {lastAction.text}
        </div>
      )}
    </div>
  );
}

function AdminPanel({species,programs=[],onDataChange}){
  const[activeForm,setActiveForm]=useState("editprogram");const[editProgF,setEditProgF]=useState(null);const[editSaving,setEditSaving]=useState(false);const[selectedSpecies,setSelectedSpecies]=useState("");const[msg,setMsg]=useState(null);const[loading,setLoading]=useState(false);
  const notify=(text,ok=true)=>{setMsg({text,ok});setTimeout(()=>setMsg(null),4000);};
  const inp={padding:"8px 10px",border:"1px solid #e8e6e1",borderRadius:6,fontSize:12,background:"#fff",outline:"none",color:"#2c2c2a",width:"100%"};
  const lbl={fontSize:10,color:"#888",marginBottom:3,display:"block",textTransform:"uppercase",letterSpacing:0.4};
  async function save(table,data,resetFn){
    if(!selectedSpecies){notify("Önce tür seçin","error");return;}
    setLoading(true);
    try{
      const payload={...data,species_id:selectedSpecies};
      if(table==="metabolites")payload.id=crypto.randomUUID();
      if(table==="propagation")payload.protocol_id=`PROP-${selectedSpecies}-${Date.now()}`;
      if(table==="conservation")payload.assessment_id=`CONS-${selectedSpecies}-${Date.now()}`;
      if(table==="commercial")payload.hypothesis_id=`COM-${selectedSpecies}-${Date.now()}`;
      const{error}=await supabase.from(table).insert(payload);
      if(error)throw error;
      notify(`✓ ${table} kaydı eklendi`);resetFn();if(onDataChange)onDataChange();
    }catch(e){notify(`Hata: ${e.message}`,false);}finally{setLoading(false);}
  }
  async function saveProgram(form,resetFn){
    setLoading(true);
    try{const{error}=await supabase.from("programs").insert({...form,program_code:`PROG-${Date.now()}`,readiness_score:parseInt(form.readiness_score)||0,confidence_score:parseInt(form.confidence_score)||0,priority_score:parseInt(form.priority_score)||0});if(error)throw error;notify("✓ Program oluşturuldu");resetFn();if(onDataChange)onDataChange();}catch(e){notify(`Hata: ${e.message}`,false);}finally{setLoading(false);}
  }
  async function saveStory(form,resetFn){if(!form.program_id||!form.title)return;setLoading(true);try{const{error}=await supabase.from("program_story_entries").insert({...form});if(error)throw error;notify("✓ Story entry eklendi");resetFn();if(onDataChange)onDataChange();}catch(e){notify(`Hata: ${e.message}`,false);}finally{setLoading(false);}
  }
  async function saveAction(form,resetFn){if(!form.program_id||!form.action_title)return;setLoading(true);try{const{error}=await supabase.from("program_actions").insert({...form});if(error)throw error;notify("✓ Aksiyon eklendi");resetFn();if(onDataChange)onDataChange();}catch(e){notify(`Hata: ${e.message}`,false);}finally{setLoading(false);}
  }
  async function saveDecision(form,resetFn){if(!form.program_id||!form.decision_title)return;setLoading(true);try{const{error}=await supabase.from("program_decisions").insert({...form});if(error)throw error;notify("✓ Karar kaydedildi");resetFn();if(onDataChange)onDataChange();}catch(e){notify(`Hata: ${e.message}`,false);}finally{setLoading(false);}
  }
  async function saveNewSpecies(form,resetFn){if(!form.accepted_name)return;setLoading(true);try{const id=`GEO-UPL-${form.accepted_name.replace(/\s+/g,"-").slice(0,20)}-${Math.random().toString(36).slice(2,6)}`;const{error}=await supabase.from("species").insert({...form,id,confidence:50,last_verified:new Date().toISOString().split("T")[0]});if(error)throw error;notify("✓ Tür eklendi");resetFn();if(onDataChange)onDataChange();}catch(e){notify(`Hata: ${e.message}`,false);}finally{setLoading(false);}
  }
  const FORMS=[{k:"editprogram",l:"Program Düzenle",icon:"✏️"},{k:"linkresearcher",l:"Araştırmacı Bağla",icon:"🤝"},{k:"program",l:"Program Oluştur",icon:"📋"},{k:"story",l:"Story Entry",icon:"📖"},{k:"action",l:"Aksiyon Ekle",icon:"✅"},{k:"decision",l:"Karar Kaydet",icon:"⚖️"},{k:"newspecies",l:"Yeni Tür Ekle",icon:"🌿"},{k:"metabolite",l:"Metabolit Ekle",icon:"🧪"},{k:"propagation",l:"Propagasyon",icon:"🌱"},{k:"conservation",l:"Koruma Kaydı",icon:"🛡"},{k:"commercial",l:"Ticari Hipotez",icon:"💼"}];
  const selectedSp=species.find(s=>s.id===selectedSpecies);
  // Form states
  const[metF,setMetF]=useState({compound_name:"",compound_class:"",reported_activity:"",activity_category:"other",evidence:"Early research",confidence:0.8,notes:""});
  const[propF,setPropF]=useState({protocol_type:"micropropagation",explant:"",medium_or_condition:"",success_rate:"",ex_situ_fit:"under_review",notes:""});
  const[consF,setConsF]=useState({source:"BGCI ThreatSearch",status_original:"",status_interpreted:"",scope:"Regional",assessment_year:new Date().getFullYear(),trend:"Unknown",notes:""});
  const[commF,setCommF]=useState({application_area:"",market_type:"",venture_fit:"candidate",justification:"",status:"monitor",notes:""});
  const[progF,setProgF]=useState({program_name:"",species_id:"",program_type:"Conservation & Propagation",status:"Draft",current_module:"Origin",current_gate:"Selection",owner_name:"",readiness_score:0,priority_score:0,why_this_program:"",next_action:""});
  const[storyF,setStoryF]=useState({program_id:"",title:"",entry_type:"Evidence Added",summary:"",entry_date:new Date().toISOString().split("T")[0],author:"",linked_module:"",linked_gate:""});
  const[actionF,setActionF]=useState({program_id:"",action_title:"",action_description:"",action_owner:"",due_date:"",status:"open",priority:"medium"});
  const[decisionF,setDecisionF]=useState({program_id:"",decision_title:"",decision_type:"Gate Decision",rationale:"",made_by:"",decision_date:new Date().toISOString().split("T")[0]});
  const[spF,setSpF]=useState({accepted_name:"",genus:"",family:"",geophyte_type:"Bulbous",country_focus:"TR",iucn_status:"",endemicity_flag:false,common_name:"",habitat:"",decision:"Monitor"});
  const sel=(label,val,onChange,opts)=><div style={{marginBottom:12}}><label style={lbl}>{label}</label><select value={val} onChange={e=>onChange(e.target.value)} style={inp}>{opts.map(o=><option key={o} value={o}>{o}</option>)}</select></div>;
  const txt=(label,val,onChange,ph="")=><div style={{marginBottom:12}}><label style={lbl}>{label}</label><input value={val} onChange={e=>onChange(e.target.value)} style={inp} placeholder={ph}/></div>;
  const ta=(label,val,onChange)=><div style={{marginBottom:12}}><label style={lbl}>{label}</label><textarea value={val} onChange={e=>onChange(e.target.value)} rows={3} style={{...inp,resize:"vertical"}}/></div>;
  const btn=(label,onClick,disabled)=><button disabled={disabled} onClick={onClick} style={{padding:"10px 24px",background:disabled?"#ccc":"#1D9E75",color:"#fff",border:"none",borderRadius:8,cursor:disabled?"default":"pointer",fontSize:12,fontWeight:600}}>{loading?"Kaydediliyor...":label}</button>;
  return<div style={{maxWidth:700}}>
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:20}}><div style={{width:32,height:32,borderRadius:8,background:"#1D9E75",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:"#fff",fontSize:16}}>⚙</span></div><div><div style={{fontSize:16,fontWeight:700,color:"#2c2c2a"}}>Admin Paneli</div><div style={{fontSize:10,color:"#888"}}>Veri ekleme ve düzenleme</div></div></div>
    <S2EnrichmentCard />
    {msg&&<div style={{padding:"10px 14px",borderRadius:8,marginBottom:16,background:msg.ok?"#E1F5EE":"#FCEBEB",color:msg.ok?"#085041":"#A32D2D",fontSize:12,fontWeight:500}}>{msg.text}</div>}
    <div style={{marginBottom:16}}>
      <label style={lbl}>Tür Seç (species gerektiren formlar için)</label>
      <select value={selectedSpecies} onChange={e=>setSelectedSpecies(e.target.value)} style={{...inp,marginBottom:0}}><option value="">-- Tür seçin --</option>{[...species].sort((a,b)=>(a.accepted_name||"").localeCompare(b.accepted_name||"")).map(s=><option key={s.id} value={s.id}>{s.accepted_name}</option>)}</select>
      {selectedSp&&<div style={{marginTop:6,padding:"6px 10px",background:"#f4f3ef",borderRadius:6,fontSize:11,color:"#5f5e5a"}}>Seçili: <strong style={{fontStyle:"italic"}}>{selectedSp.accepted_name}</strong> · {selectedSp.iucn_status||"—"}</div>}
    </div>
    <div style={{display:"flex",gap:4,marginBottom:20,flexWrap:"wrap"}}>{FORMS.map(f=><button key={f.k} onClick={()=>setActiveForm(f.k)} style={{padding:"7px 12px",border:"none",borderRadius:7,cursor:"pointer",fontSize:11,background:activeForm===f.k?"#1D9E75":"#f4f3ef",color:activeForm===f.k?"#fff":"#888",fontWeight:activeForm===f.k?600:400}}>{f.icon} {f.l}</button>)}</div>
    <div style={{background:"#fff",border:"1px solid #e8e6e1",borderRadius:12,padding:20}}>
      {activeForm==="editprogram"&&<div>
  <div style={{marginBottom:12}}>
    <label style={{fontSize:10,color:"#888",marginBottom:4,display:"block",textTransform:"uppercase"}}>Program Seç</label>
    <select value={editProgF?.id||""} onChange={e=>{const p=programs.find(x=>x.id===e.target.value);setEditProgF(p?{...p}:null);}} style={{padding:"8px 10px",border:"1px solid #e8e6e1",borderRadius:6,fontSize:12,background:"#fff",width:"100%"}}>
      <option value="">-- Program seçin --</option>
      {programs.map(p=><option key={p.id} value={p.id}>{p.program_name}</option>)}
    </select>
  </div>
  {editProgF&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
    <div><label style={{fontSize:10,color:"#888",marginBottom:3,display:"block",textTransform:"uppercase"}}>Program Adı</label><input value={editProgF.program_name||""} onChange={e=>setEditProgF({...editProgF,program_name:e.target.value})} style={{...inp}}/></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
      <div><label style={{fontSize:10,color:"#888",marginBottom:3,display:"block",textTransform:"uppercase"}}>Status</label>
        <select value={editProgF.status||"Draft"} onChange={e=>setEditProgF({...editProgF,status:e.target.value})} style={{...inp,marginBottom:0}}>
          {["Draft","Active","Blocked","On Hold","Completed","Archived"].map(s=><option key={s}>{s}</option>)}
        </select>
      </div>
      <div><label style={{fontSize:10,color:"#888",marginBottom:3,display:"block",textTransform:"uppercase"}}>Modül</label>
        <select value={editProgF.current_module||"Origin"} onChange={e=>setEditProgF({...editProgF,current_module:e.target.value})} style={{...inp,marginBottom:0}}>
          {["Origin","Forge","Mesh","Exchange","Accord"].map(s=><option key={s}>{s}</option>)}
        </select>
      </div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
      <div><label style={{fontSize:10,color:"#888",marginBottom:3,display:"block",textTransform:"uppercase"}}>Gate</label>
        <select value={editProgF.current_gate||"Selection"} onChange={e=>setEditProgF({...editProgF,current_gate:e.target.value})} style={{...inp,marginBottom:0}}>
          {["Selection","Validation","Protocol","Deployment","Venture","Governance"].map(s=><option key={s}>{s}</option>)}
        </select>
      </div>
      <div><label style={{fontSize:10,color:"#888",marginBottom:3,display:"block",textTransform:"uppercase"}}>Readiness (0-100)</label>
        <input type="number" min="0" max="100" value={editProgF.readiness_score||0} onChange={e=>setEditProgF({...editProgF,readiness_score:parseInt(e.target.value)||0})} style={{...inp}}/>
      </div>
    </div>
    <div><label style={{fontSize:10,color:"#888",marginBottom:3,display:"block",textTransform:"uppercase"}}>Neden bu program?</label><textarea value={editProgF.why_this_program||""} onChange={e=>setEditProgF({...editProgF,why_this_program:e.target.value})} rows={3} style={{...inp,resize:"vertical"}}/></div>
    <div><label style={{fontSize:10,color:"#888",marginBottom:3,display:"block",textTransform:"uppercase"}}>Sonraki aksiyon</label><input value={editProgF.next_action||""} onChange={e=>setEditProgF({...editProgF,next_action:e.target.value})} style={{...inp}}/></div>
    <div><label style={{fontSize:10,color:"#888",marginBottom:3,display:"block",textTransform:"uppercase"}}>Primary Blocker</label><input value={editProgF.primary_blocker||""} onChange={e=>setEditProgF({...editProgF,primary_blocker:e.target.value})} style={{...inp}}/></div>
    <div style={{display:"flex",gap:8,marginTop:4}}>
      <button disabled={editSaving} onClick={async()=>{setEditSaving(true);const{error}=await supabase.from("programs").update({program_name:editProgF.program_name,status:editProgF.status,current_module:editProgF.current_module,current_gate:editProgF.current_gate,readiness_score:editProgF.readiness_score,why_this_program:editProgF.why_this_program,next_action:editProgF.next_action,primary_blocker:editProgF.primary_blocker}).eq("id",editProgF.id);setEditSaving(false);if(error)notify("Hata: "+error.message,false);else{notify("✓ Program güncellendi");onDataChange?.();}}} style={{padding:"10px 20px",background:editSaving?"#ccc":"#1D9E75",color:"#fff",border:"none",borderRadius:8,cursor:editSaving?"default":"pointer",fontSize:12,fontWeight:600}}>{editSaving?"Kaydediliyor...":"Kaydet"}</button>
      <button onClick={async()=>{if(!confirm("Bu programı silmek istediğinizden emin misiniz?"))return;const{error}=await supabase.from("programs").delete().eq("id",editProgF.id);if(error)notify("Hata: "+error.message,false);else{notify("✓ Program silindi");setEditProgF(null);onDataChange?.();}}} style={{padding:"10px 20px",background:"#FCEBEB",color:"#A32D2D",border:"1px solid #A32D2D",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600}}>Sil</button>
    </div>
  </div>}
</div>}
{activeForm==="linkresearcher"&&<div>
  <div style={{padding:"10px 14px",background:"#E1F5EE",borderRadius:10,border:"1px solid #1D9E75",marginBottom:12}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div style={{fontSize:11,color:"#085041",fontWeight:600}}>+ Yeni araştırmacı ekle (listede yoksa)</div>
      <button onClick={()=>setActiveForm("addresearcher")} style={{padding:"4px 10px",background:"#1D9E75",color:"#fff",border:"none",borderRadius:6,cursor:"pointer",fontSize:10,fontWeight:600}}>Ekle →</button>
    </div>
  </div>
  <LinkResearcherForm species={species} onDataChange={onDataChange} notify={notify}/>
</div>}
{activeForm==="addresearcher"&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
  <div><label style={lbl}>İsim *</label><input value={progF.newRName||""} onChange={e=>setProgF({...progF,newRName:e.target.value})} placeholder="Ad Soyad" style={inp}/></div>
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
    <div><label style={lbl}>Uzmanlık</label><input value={progF.newRExp||""} onChange={e=>setProgF({...progF,newRExp:e.target.value})} placeholder="Plant biotechnology" style={inp}/></div>
    <div><label style={lbl}>Ülke</label><input value={progF.newRCountry||""} onChange={e=>setProgF({...progF,newRCountry:e.target.value})} placeholder="TR" style={inp}/></div>
  </div>
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
    <div><label style={lbl}>Kurum</label><input value={progF.newRInst||""} onChange={e=>setProgF({...progF,newRInst:e.target.value})} placeholder="Üniversite/Kurum" style={inp}/></div>
    <div><label style={lbl}>h-index</label><input type="number" value={progF.newRH||""} onChange={e=>setProgF({...progF,newRH:e.target.value})} placeholder="0" style={inp}/></div>
  </div>
  <button disabled={loading||!progF.newRName} onClick={async()=>{
    if(!progF.newRName?.trim()) return;
    setLoading(true);
    const newId="RES-"+Date.now();
    const {error}=await supabase.from("researchers").insert({id:newId,name:progF.newRName,expertise_area:progF.newRExp||null,country:progF.newRCountry||null,institution:progF.newRInst||null,h_index:progF.newRH?parseInt(progF.newRH):null});
    setLoading(false);
    if(error)notify("Hata: "+error.message,false);
    else{notify("✓ Araştırmacı eklendi! Şimdi 'Araştırmacı Bağla' sekmesinden bağlayabilirsiniz.");setProgF({...progF,newRName:"",newRExp:"",newRCountry:"",newRInst:"",newRH:""});onDataChange?.();}
  }} style={{padding:"10px 20px",background:loading||!progF.newRName?"#ccc":"#185FA5",color:"#fff",border:"none",borderRadius:8,cursor:loading||!progF.newRName?"default":"pointer",fontSize:12,fontWeight:600}}>
    {loading?"Kaydediliyor...":"Araştırmacıyı Kaydet"}
  </button>
  <button onClick={()=>setActiveForm("linkresearcher")} style={{padding:"8px",background:"none",border:"none",cursor:"pointer",fontSize:11,color:"#888"}}>← Geri dön</button>
</div>}
{activeForm==="program"&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
  {txt("Program adı *",progF.program_name,v=>setProgF({...progF,program_name:v}))}
  <div>
    <label style={lbl}>Program kapsamı</label>
    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
      {[{k:"single",l:"🌿 Tek tür"},{k:"genus",l:"🌱 Genus"},{k:"region",l:"🗺 Bölge"},{k:"custom",l:"⚗️ Özel seçim"}].map(t=>
        <button key={t.k} onClick={()=>setProgF({...progF,scope_type:t.k,species_id:"",selectedSpeciesIds:[]})}
          style={{padding:"6px 12px",border:`1px solid ${(progF.scope_type||"single")===t.k?"#1D9E75":"#e8e6e1"}`,borderRadius:8,background:(progF.scope_type||"single")===t.k?"#E1F5EE":"#fff",color:(progF.scope_type||"single")===t.k?"#085041":"#888",fontSize:11,cursor:"pointer",fontWeight:(progF.scope_type||"single")===t.k?600:400}}>
          {t.l}
        </button>
      )}
    </div>
  </div>
  {(progF.scope_type||"single")==="single"&&<div>
    <label style={lbl}>Tür</label>
    <select value={progF.species_id||""} onChange={e=>setProgF({...progF,species_id:e.target.value})} style={inp}>
      <option value="">-- Tür seçin --</option>
      {[...species].sort((a,b)=>(a.accepted_name||"").localeCompare(b.accepted_name||"")).map(s=><option key={s.id} value={s.id}>{s.accepted_name}{s.iucn_status?` [${s.iucn_status}]`:""}</option>)}
    </select>
  </div>}
  {(progF.scope_type)==="genus"&&<div>
    <label style={lbl}>Genus → o genusun tüm türleri eklenir</label>
    <select onChange={e=>{const g=e.target.value;if(!g)return;const ids=species.filter(s=>s.genus===g).map(s=>s.id);setProgF({...progF,scope_label:g,selectedSpeciesIds:ids,species_id:ids[0]||"",program_name:progF.program_name||g+" Conservation Program"});}} style={inp}>
      <option value="">-- Genus seçin --</option>
      {[...new Set(species.map(s=>s.genus).filter(Boolean))].sort().map(g=><option key={g} value={g}>{g} ({species.filter(s=>s.genus===g).length} tür)</option>)}
    </select>
    {(progF.selectedSpeciesIds||[]).length>0&&<div style={{marginTop:6,padding:"8px 10px",background:"#E1F5EE",borderRadius:8,fontSize:11,color:"#085041"}}>✓ {(progF.selectedSpeciesIds||[]).length} tür: {species.filter(s=>(progF.selectedSpeciesIds||[]).includes(s.id)).map(s=>s.accepted_name).join(", ")}</div>}
  </div>}
  {(progF.scope_type)==="region"&&<div>
    <label style={lbl}>Bölge/Ülke → o bölgedeki tüm türler eklenir</label>
    <select onChange={e=>{const r=e.target.value;if(!r)return;const ids=species.filter(s=>s.region===r||s.country_focus===r).map(s=>s.id);setProgF({...progF,scope_label:r,selectedSpeciesIds:ids,species_id:ids[0]||"",program_name:progF.program_name||r+" Geophyte Conservation"});}} style={inp}>
      <option value="">-- Bölge/Ülke seçin --</option>
      {[...new Set(species.map(s=>s.region||s.country_focus).filter(Boolean))].sort().map(r=><option key={r} value={r}>{r} ({species.filter(s=>s.region===r||s.country_focus===r).length} tür)</option>)}
    </select>
    {(progF.selectedSpeciesIds||[]).length>0&&<div style={{marginTop:6,padding:"8px 10px",background:"#E6F1FB",borderRadius:8,fontSize:11,color:"#0C447C"}}>✓ {(progF.selectedSpeciesIds||[]).length} tür seçildi</div>}
  </div>}
  {(progF.scope_type)==="custom"&&<div>
    <label style={lbl}>Türleri seç (Ctrl/Cmd ile çoklu)</label>
    <select multiple onChange={e=>{const ids=[...e.target.selectedOptions].map(o=>o.value);setProgF({...progF,selectedSpeciesIds:ids,species_id:ids[0]||""});}} style={{...inp,height:130}}>
      {[...species].sort((a,b)=>(a.accepted_name||"").localeCompare(b.accepted_name||"")).map(s=><option key={s.id} value={s.id}>{s.accepted_name} [{s.family}]{s.iucn_status?` [${s.iucn_status}]`:""}</option>)}
    </select>
    {(progF.selectedSpeciesIds||[]).length>0&&<div style={{marginTop:6,padding:"6px 10px",background:"#EEEDFE",borderRadius:8,fontSize:11,color:"#3C3489"}}>✓ {(progF.selectedSpeciesIds||[]).length} tür seçildi</div>}
  </div>}
  {sel("Program tipi",progF.program_type,v=>setProgF({...progF,program_type:v}),["Conservation & Propagation","Conservation Rescue","Propagation Program","Metabolite Discovery","Premium Ornamental","Functional Ingredient","Venture Formation"])}
  {sel("Modül",progF.current_module,v=>setProgF({...progF,current_module:v}),["Origin","Forge","Mesh","Exchange","Accord"])}
  {sel("Gate",progF.current_gate,v=>setProgF({...progF,current_gate:v}),["Selection","Validation","Protocol","Deployment","Venture","Governance"])}
  {ta("Neden bu program?",progF.why_this_program,v=>setProgF({...progF,why_this_program:v}))}
  {txt("Sonraki aksiyon",progF.next_action,v=>setProgF({...progF,next_action:v}))}
  {btn("Program Oluştur",async()=>{
    setLoading(true);
    try{
      const{data:prog,error}=await supabase.from("programs").insert({
        ...progF,program_code:`PROG-${Date.now()}`,
        scope_type:progF.scope_type||"single",scope_label:progF.scope_label||null,
        readiness_score:parseInt(progF.readiness_score)||0,
        confidence_score:parseInt(progF.confidence_score)||0,
        priority_score:parseInt(progF.priority_score)||0
      }).select().single();
      if(error)throw error;
      const allIds=[...new Set([...(progF.selectedSpeciesIds||[]),...(progF.species_id?[progF.species_id]:[])]) ].filter(Boolean);
      if(allIds.length>1){
        await supabase.from("program_species").insert(allIds.map(sid=>({program_id:prog.id,species_id:sid,role:"Primary"})));
      }
      notify("✓ Program oluşturuldu"+(allIds.length>1?` — ${allIds.length} tür bağlandı`:""));
      setProgF({program_name:"",species_id:"",scope_type:"single",selectedSpeciesIds:[],scope_label:"",program_type:"Conservation & Propagation",status:"Draft",current_module:"Origin",current_gate:"Selection",owner_name:"",readiness_score:0,priority_score:0,why_this_program:"",next_action:""});
      if(onDataChange)onDataChange();
    }catch(e){notify("Hata: "+e.message,false);}
    setLoading(false);
  },loading||!progF.program_name)}
</div>}
      {activeForm==="story"&&<><div style={{marginBottom:12}}><label style={lbl}>Program *</label><select value={storyF.program_id} onChange={e=>setStoryF({...storyF,program_id:e.target.value})} style={inp}><option value="">-- Program seçin --</option>{programs.map(p=><option key={p.id} value={p.id}>{p.program_name}</option>)}</select></div>{sel("Entry tipi",storyF.entry_type,v=>setStoryF({...storyF,entry_type:v}),["Evidence Added","Gate Passed","Risk Raised","Protocol Updated","Governance Review Opened","Community Signal Added","Decision Made","Milestone Reached"])}{txt("Başlık *",storyF.title,v=>setStoryF({...storyF,title:v}))}{ta("Özet",storyF.summary,v=>setStoryF({...storyF,summary:v}))}{txt("Yazan",storyF.author,v=>setStoryF({...storyF,author:v}))}{btn("Story Entry Ekle",()=>saveStory(storyF,()=>setStoryF({program_id:storyF.program_id,title:"",entry_type:"Evidence Added",summary:"",entry_date:new Date().toISOString().split("T")[0],author:"",linked_module:"",linked_gate:""})),loading||!storyF.program_id||!storyF.title)}</>}
      {activeForm==="action"&&<><div style={{marginBottom:12}}><label style={lbl}>Program *</label><select value={actionF.program_id} onChange={e=>setActionF({...actionF,program_id:e.target.value})} style={inp}><option value="">-- Program seçin --</option>{programs.map(p=><option key={p.id} value={p.id}>{p.program_name}</option>)}</select></div>{txt("Aksiyon başlığı *",actionF.action_title,v=>setActionF({...actionF,action_title:v}))}{ta("Açıklama",actionF.action_description,v=>setActionF({...actionF,action_description:v}))}{txt("Sorumlu",actionF.action_owner,v=>setActionF({...actionF,action_owner:v}))}{sel("Öncelik",actionF.priority,v=>setActionF({...actionF,priority:v}),["low","medium","high"])}{btn("Aksiyon Ekle",()=>saveAction(actionF,()=>setActionF({program_id:actionF.program_id,action_title:"",action_description:"",action_owner:"",due_date:"",status:"open",priority:"medium"})),loading||!actionF.program_id||!actionF.action_title)}</>}
      {activeForm==="decision"&&<><div style={{marginBottom:12}}><label style={lbl}>Program *</label><select value={decisionF.program_id} onChange={e=>setDecisionF({...decisionF,program_id:e.target.value})} style={inp}><option value="">-- Program seçin --</option>{programs.map(p=><option key={p.id} value={p.id}>{p.program_name}</option>)}</select></div>{txt("Karar başlığı *",decisionF.decision_title,v=>setDecisionF({...decisionF,decision_title:v}))}{sel("Karar tipi",decisionF.decision_type,v=>setDecisionF({...decisionF,decision_type:v}),["Gate Decision","Program Launch","Risk Escalation","Module Transition","Governance Review","Strategic Pivot"])}{ta("Gerekçe",decisionF.rationale,v=>setDecisionF({...decisionF,rationale:v}))}{txt("Karar veren",decisionF.made_by,v=>setDecisionF({...decisionF,made_by:v}))}{btn("Karar Kaydet",()=>saveDecision(decisionF,()=>setDecisionF({program_id:decisionF.program_id,decision_title:"",decision_type:"Gate Decision",rationale:"",made_by:"",decision_date:new Date().toISOString().split("T")[0]})),loading||!decisionF.program_id||!decisionF.decision_title)}</>}
      {activeForm==="newspecies"&&<>{txt("Kabul edilen isim *",spF.accepted_name,v=>setSpF({...spF,accepted_name:v}))}{txt("Genus",spF.genus,v=>setSpF({...spF,genus:v}))}{txt("Familya",spF.family,v=>setSpF({...spF,family:v}))}{sel("Geofit tipi",spF.geophyte_type,v=>setSpF({...spF,geophyte_type:v}),["Bulbous","Cormous","Rhizomatous","Tuberous","Other"])}{sel("Ülke",spF.country_focus,v=>setSpF({...spF,country_focus:v}),["TR","CL","OTHER"])}{sel("IUCN",spF.iucn_status,v=>setSpF({...spF,iucn_status:v}),["","CR","EN","VU","NT","LC","DD","NE"])}{txt("Yaygın isim",spF.common_name,v=>setSpF({...spF,common_name:v}))}{sel("Karar",spF.decision,v=>setSpF({...spF,decision:v}),["Monitor","Develop","Scale","Accelerate","Rescue Now","Data Needed"])}<div style={{marginBottom:12,display:"flex",alignItems:"center",gap:8}}><input type="checkbox" checked={spF.endemicity_flag} onChange={e=>setSpF({...spF,endemicity_flag:e.target.checked})} id="endemic"/><label htmlFor="endemic" style={{fontSize:12,color:"#2c2c2a"}}>Endemik tür</label></div>{btn("Tür Ekle",()=>saveNewSpecies(spF,()=>setSpF({accepted_name:"",genus:"",family:"",geophyte_type:"Bulbous",country_focus:"TR",iucn_status:"",endemicity_flag:false,common_name:"",habitat:"",decision:"Monitor"})),loading||!spF.accepted_name)}</>}
      {activeForm==="metabolite"&&<>{txt("Bileşik adı *",metF.compound_name,v=>setMetF({...metF,compound_name:v}))}{sel("Aktivite kategorisi",metF.activity_category,v=>setMetF({...metF,activity_category:v}),["alkaloid","flavonoid","terpenoid","phenolic","saponin","glycoside","steroid","amino acid","other"])}{ta("Bildirilen aktivite",metF.reported_activity,v=>setMetF({...metF,reported_activity:v}))}{btn("Metabolit Ekle",()=>save("metabolites",metF,()=>setMetF({compound_name:"",compound_class:"",reported_activity:"",activity_category:"other",evidence:"Early research",confidence:0.8,notes:""})),loading||!metF.compound_name)}</>}
      {activeForm==="propagation"&&<>{sel("Protokol tipi",propF.protocol_type,v=>setPropF({...propF,protocol_type:v}),["micropropagation","shoot tip culture","embryo rescue","callus culture","bulblet induction"])}{txt("Explant",propF.explant,v=>setPropF({...propF,explant:v}))}{txt("Ortam",propF.medium_or_condition,v=>setPropF({...propF,medium_or_condition:v}))}{ta("Notlar",propF.notes,v=>setPropF({...propF,notes:v}))}{btn("Protokol Ekle",()=>save("propagation",propF,()=>setPropF({protocol_type:"micropropagation",explant:"",medium_or_condition:"",success_rate:"",ex_situ_fit:"under_review",notes:""})),loading)}</>}
      {activeForm==="conservation"&&<>{sel("Kaynak",consF.source,v=>setConsF({...consF,source:v}),["BGCI ThreatSearch","IUCN Red List","Regional Assessment","Expert Opinion"])}{sel("Yorumlanan statü",consF.status_interpreted,v=>setConsF({...consF,status_interpreted:v}),["Critically Endangered","Endangered","Vulnerable","Near Threatened","Least Concern","Data Deficient"])}{ta("Notlar",consF.notes,v=>setConsF({...consF,notes:v}))}{btn("Kayıt Ekle",()=>save("conservation",consF,()=>setConsF({source:"BGCI ThreatSearch",status_original:"",status_interpreted:"",scope:"Regional",assessment_year:new Date().getFullYear(),trend:"Unknown",notes:""})),loading)}</>}
      {activeForm==="commercial"&&<>{txt("Uygulama alanı *",commF.application_area,v=>setCommF({...commF,application_area:v}))}{sel("Venture uyumu",commF.venture_fit,v=>setCommF({...commF,venture_fit:v}),["candidate","developing","validated","ready"])}{ta("Gerekçe",commF.justification,v=>setCommF({...commF,justification:v}))}{btn("Hipotez Ekle",()=>save("commercial",commF,()=>setCommF({application_area:"",market_type:"",venture_fit:"candidate",justification:"",status:"monitor",notes:""})),loading||!commF.application_area)}</>}
    </div>
  </div>;
}

/* ════════════════════════════════════════════════════════
   DATA FETCHER
════════════════════════════════════════════════════════ */

/* ── Communities View ── */
function CommunitiesView({species, researchers}) {
  const [links, setLinks] = useState([]);
  const [selectedSpecies, setSelectedSpecies] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("researcher_species")
      .select("*, researchers(id,name,expertise_area,country,h_index), species(id,accepted_name,family,iucn_status,thumbnail_url)")
      .then(({data}) => { setLinks(data||[]); setLoading(false); });
  }, []);

  const speciesWithResearchers = species.filter(sp =>
    links.some(l => l.species_id === sp.id)
  );

  const filteredSpecies = speciesWithResearchers.filter(sp =>
    !search || (sp.accepted_name||"").toLowerCase().includes(search.toLowerCase()) ||
    (sp.family||"").toLowerCase().includes(search.toLowerCase())
  );

  const getResearchers = (spId) => links.filter(l => l.species_id === spId);

  if (loading) return <div style={{textAlign:"center",padding:40,color:"#999"}}>Loading communities...</div>;

  return <div>
    {/* Header */}
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:8}}>
      <div>
        <div style={{fontSize:16,fontWeight:700,color:"#2c2c2a",fontFamily:"Georgia,serif"}}>Research Communities</div>
        <div style={{fontSize:11,color:"#888",marginTop:2}}>{links.length} researcher-species links · {speciesWithResearchers.length} species with communities</div>
      </div>
      <div style={{display:"flex",gap:6}}>
        {[
          {l:"Total links", v:links.length, c:"#1D9E75"},
          {l:"Active species", v:speciesWithResearchers.length, c:"#185FA5"},
          {l:"Researchers linked", v:new Set(links.map(l=>l.researcher_id)).size, c:"#534AB7"},
        ].map(s=><div key={s.l} style={{textAlign:"center",padding:"5px 10px",background:"#f4f3ef",borderRadius:8}}>
          <div style={{fontSize:14,fontWeight:700,color:s.c}}>{s.v}</div>
          <div style={{fontSize:9,color:"#999"}}>{s.l}</div>
        </div>)}
      </div>
    </div>

    {links.length === 0 ? (
      <div style={{textAlign:"center",padding:60,color:"#999"}}>
        <div style={{fontSize:32,marginBottom:12}}>🤝</div>
        <div style={{fontSize:15,fontWeight:600,color:"#2c2c2a",marginBottom:8}}>No communities yet</div>
        <div style={{fontSize:12,lineHeight:1.6}}>Go to Admin → "Araştırmacı Bağla" to connect researchers to species.</div>
      </div>
    ) : (
      <>
        <input type="text" placeholder="Search species or family..." value={search}
          onChange={e=>setSearch(e.target.value)}
          style={{width:"100%",marginBottom:14,padding:"8px 12px",border:"1px solid #e8e6e1",borderRadius:8,fontSize:12,outline:"none"}}/>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:12}}>
          {filteredSpecies.map(sp => {
            const spResearchers = getResearchers(sp.id);
            const iucnColors = {CR:"#A32D2D",EN:"#854F0B",VU:"#BA7517",NT:"#3B6D11",LC:"#0F6E56"};
            const iucnBgs = {CR:"#FCEBEB",EN:"#FAEEDA",VU:"#FFF3CD",NT:"#EAF3DE",LC:"#E1F5EE"};
            const ic = iucnColors[sp.iucn_status]||"#888";
            const ib = iucnBgs[sp.iucn_status]||"#f4f3ef";
            return (
              <div key={sp.id} style={{background:"#fff",borderRadius:14,border:"1px solid #e8e6e1",overflow:"hidden"}}>
                {/* Species header */}
                <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderBottom:"1px solid #f4f3ef",background:"#fcfbf9"}}>
                  {sp.thumbnail_url && <img src={sp.thumbnail_url} alt={sp.accepted_name} style={{width:40,height:40,borderRadius:8,objectFit:"cover",flexShrink:0}} onError={e=>e.target.style.display="none"}/>}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:700,fontStyle:"italic",color:"#2c2c2a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sp.accepted_name}</div>
                    <div style={{fontSize:10,color:"#888"}}>{sp.family}</div>
                  </div>
                  {sp.iucn_status && <span style={{fontSize:9,padding:"2px 7px",borderRadius:99,background:ib,color:ic,fontWeight:600,flexShrink:0}}>{sp.iucn_status}</span>}
                </div>
                {/* Researchers */}
                <div style={{padding:"10px 14px"}}>
                  <div style={{fontSize:9,color:"#b4b2a9",textTransform:"uppercase",letterSpacing:0.6,marginBottom:8}}>Research community ({spResearchers.length})</div>
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {spResearchers.map(link => (
                      <div key={link.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",background:"#f8f7f4",borderRadius:8}}>
                        <div style={{width:28,height:28,borderRadius:6,background:"#1D9E75",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                          <span style={{color:"#fff",fontSize:11,fontWeight:700}}>{(link.researchers?.name||"?")[0]}</span>
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:12,fontWeight:600,color:"#2c2c2a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{link.researchers?.name||"Unknown"}</div>
                          <div style={{fontSize:9,color:"#888"}}>{link.researchers?.expertise_area||""} {link.researchers?.country?`· ${link.researchers.country}`:""}</div>
                        </div>
                        {link.role && <span style={{fontSize:9,padding:"1px 6px",borderRadius:99,background:"#E1F5EE",color:"#085041",flexShrink:0}}>{link.role}</span>}
                        {link.researchers?.h_index && <span style={{fontSize:9,padding:"1px 6px",borderRadius:99,background:"#EEEDFE",color:"#3C3489",flexShrink:0}}>h:{link.researchers.h_index}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </>
    )}
  </div>;
}

async function fetchAllPublications() {
  const pageSize = 1000; let allPubs = []; let from = 0;
  while (true) {
    const { data, error } = await supabase.from("publications")
      .select("id,species_id,title,authors,doi,year,journal,open_access,primary_topic,relevance_score,cited_by_count,source,abstract,pubmed_id,openalex_id,category,is_curated,contributed_by,s2_tldr,s2_influential_citation_count,s2_reference_count,s2_fields_of_study,s2_enrichment_status,species(accepted_name)")
      .order("year", { ascending:false }).range(from, from+pageSize-1);
    if (error || !data || data.length === 0) break;
    allPubs = [...allPubs, ...data];
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return allPubs;
}

async function fetchAllMetabolites() {
  const pageSize = 1000; let all = []; let from = 0;
  while (true) {
    const { data, error } = await supabase.from("metabolites")
      .select("*, species(accepted_name)")
      .range(from, from+pageSize-1);
    if (error || !data || data.length === 0) break;
    all = [...all, ...data];
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

async function fetchAllMetabolitePublications() {
  const pageSize = 1000; let all = []; let from = 0;
  while (true) {
    const { data, error } = await supabase.from("metabolite_publications")
      .select("metabolite_id,publication_id,confidence,is_primary_source,match_method")
      .range(from, from+pageSize-1);
    if (error || !data || data.length === 0) break;
    all = [...all, ...data];
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

async function fetchAllResearchers() {
  const pageSize = 1000; let allRes = []; let from = 0;
  while (true) {
    const { data, error } = await supabase.from("researchers")
      .select("*")
      .order("h_index", { ascending: false, nullsFirst: false })
      .range(from, from+pageSize-1);
    if (error || !data || data.length === 0) break;
    allRes = [...allRes, ...data];
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return allRes;
}

/* ════════════════════════════════════════════════════════
   MAIN APP — ORCHESTRATION ONLY
════════════════════════════════════════════════════════ */
/* ════════════════════════════════════════════════════════
   MAIN APP — ORCHESTRATION ONLY
════════════════════════════════════════════════════════ */
export default function Home() {
  // Real auth (Supabase Auth)
  const auth = useAuth();
  const { user, profile, researcher: authResearcher, refreshProfile } = auth;

  // Auth UI state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [myProfileOpen, setMyProfileOpen] = useState(false);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [claimPrompted, setClaimPrompted] = useState(false);

  // Login sonrası: profile yüklendi, researcher bağlı değil ve intent ayarlanmamışsa, claim modal'ını otomatik aç
  useEffect(() => {
    if (!claimPrompted && user && profile && !profile.researcher_id && !profile.signup_intent && !profile.claim_request_for_researcher_id) {
      setClaimModalOpen(true);
      setClaimPrompted(true);
    }
  }, [user, profile, claimPrompted]);

  const [view,             setView]             = useState("home");
  const [exp,              setExp]              = useState(null);
  const [side,             setSide]             = useState(true);
  const [loading,          setLoading]          = useState(true);
  // İkincil veriler (publications/researchers/metabolites/metabolitePublications)
  // critical-first render için ayrı bayrak — UI loading'de bunları beklemiyor,
  // tab'lar boş gelir ve doldukça popüle olur.
  const [secondaryLoading, setSecondaryLoading] = useState(true);
  const [dbOk,             setDbOk]             = useState(false);
  const [species,          setSpecies]          = useState([]);
  const [metabolites,      setMetabolites]      = useState([]);
  const [metabolitePublications, setMetabolitePublications] = useState([]);
  const [markets,          setMarkets]          = useState([]);
  const [institutions,     setInstitutions]     = useState([]);
  const [sources,          setSources]          = useState([]);
  const [publications,     setPublications]     = useState([]);
  const [researchers,      setResearchers]      = useState([]);
  const [programs,         setPrograms]         = useState([]);
  const [detailSpecies,    setDetailSpecies]    = useState(null);
  const [detailResearcherId, setDetailResearcherId] = useState(null);
  const [startProgramSp,   setStartProgramSp]   = useState(null);
  const [preselectProgramId, setPreselectProgramId] = useState(null);
  // Cross-panel navigation stack — geri linki için ne olduğunu hatırlar
  const [navStack, setNavStack] = useState([]);

  // Cross-panel navigation callbacks
  function pushAndOpen(target) {
    if (target.type === "researcher") {
      setDetailResearcherId(target.id);
    } else if (target.type === "species") {
      const spObj = species.find(s => s.id === target.id) || target.species || target;
      setDetailSpecies(spObj);
    } else if (target.type === "program") {
      setPreselectProgramId(target.id);
      setView("programs");
    }
  }

  function openResearcher(researcherId, fromContext) {
    if (!researcherId) return;
    if (fromContext) {
      setNavStack(prev => [...prev, fromContext]);
    }
    if (fromContext?.type === "species") setDetailSpecies(null);
    setDetailResearcherId(researcherId);
  }

  function openSpeciesFromPanel(sp, fromContext) {
    if (!sp?.id) return;
    if (fromContext) {
      setNavStack(prev => [...prev, fromContext]);
    }
    const fullSp = species.find(s => s.id === sp.id) || sp;
    if (fromContext?.type === "researcher") setDetailResearcherId(null);
    setDetailSpecies(fullSp);
  }

  function openProgramFromPanel(prog, fromContext) {
    if (!prog?.id) return;
    if (fromContext) {
      setNavStack(prev => [...prev, fromContext]);
    }
    setDetailResearcherId(null);
    setDetailSpecies(null);
    setPreselectProgramId(prog.id);
    setView("programs");
  }

  function closePanelWithBack(currentType) {
    const back = navStack[navStack.length - 1];
    if (back) {
      setNavStack(prev => prev.slice(0, -1));
      if (currentType === "researcher") setDetailResearcherId(null);
      if (currentType === "species") setDetailSpecies(null);
      setTimeout(() => pushAndOpen(back), 0);
    } else {
      if (currentType === "researcher") setDetailResearcherId(null);
      if (currentType === "species") setDetailSpecies(null);
    }
  }

  const breadcrumbBack = navStack.length > 0 ? `Back to ${navStack[navStack.length - 1].label}` : null;

  useEffect(() => {
    let cancelled = false;

    // ── CRITICAL ── İlk paint için zorunlu veriler (5 paralel sorgu)
    // species + programs + members + ppubs → sidebar rozeti, ATLAS, Programs sayfası açılır
    // markets + institutions + sources → küçük tablolar, Promise.all'a dahil
    async function loadCritical() {
      try {
        const [sp, mk, inst, src, prog, pmem, ppub] = await Promise.all([
          supabase.from("species").select("*").order("composite_score",{ascending:false}),
          supabase.from("market_intelligence").select("*, species(accepted_name)"),
          supabase.from("institutions").select("*").order("priority"),
          supabase.from("data_sources").select("*").order("freshness_score",{ascending:false}),
          supabase.from("programs").select("*, species(accepted_name,iucn_status,thumbnail_url)").order("priority_score",{ascending:false}),
          supabase.from("program_members").select("researcher_id,program_id,role"),
          supabase.from("program_publications").select("publication_id,program_id"),
        ]);

        if (cancelled) return;

        if (sp.data)   setSpecies(sp.data);
        if (mk.data)   setMarkets(mk.data);
        if (inst.data) setInstitutions(inst.data);
        if (src.data)  setSources(src.data);
        if (prog.data) setPrograms(prog.data);

        setDbOk(true);

        // Critical bitti, ana ekran açılabilir.
        setLoading(false);

        // Bağıntı set'leri (loadSecondary annotation için kullanılacak)
        return {
          activeResearcherIds: new Set((pmem.data||[]).map(m => m.researcher_id)),
          curatedPubIds: new Set((ppub.data||[]).map(pp => pp.publication_id)),
        };
      } catch (e) {
        if (!cancelled) {
          setDbOk(false);
          setLoading(false);
        }
        return null;
      }
    }

    // ── SECONDARY ── Büyük tablolar — 4 paralel pagination zinciri.
    // Önceki kod bunları sıralı await ediyordu; şimdi paralel.
    async function loadSecondary(idSets) {
      try {
        const [pub, allResearchers, allMetabolites, allMetabPubs] = await Promise.all([
          fetchAllPublications(),
          fetchAllResearchers(),
          fetchAllMetabolites(),
          fetchAllMetabolitePublications(),
        ]);

        if (cancelled) return;

        // Annotation: critical'den gelen idSet'lerle annotate et.
        // idSets null ise (critical başarısız) annotation atla, ham veriyi yine de göster.
        const activeIds  = idSets?.activeResearcherIds || new Set();
        const curatedIds = idSets?.curatedPubIds || new Set();

        const researchersAnnotated = allResearchers.map(r => ({
          ...r,
          is_geocon_active: activeIds.has(r.id),
        }));
        researchersAnnotated.sort((a,b) => {
          if (a.is_geocon_active !== b.is_geocon_active) return a.is_geocon_active ? -1 : 1;
          return (b.h_index||0) - (a.h_index||0);
        });

        const publicationsAnnotated = pub.map(p => ({
          ...p,
          is_geocon_curated: curatedIds.has(p.id),
        }));

        setMetabolites(allMetabolites);
        setMetabolitePublications(allMetabPubs);
        setResearchers(researchersAnnotated);
        setPublications(publicationsAnnotated);
      } catch (e) {
        // sessizce geç — secondary hata loading'i bloklamaz
      } finally {
        if (!cancelled) setSecondaryLoading(false);
      }
    }

    // Sıralama: critical ilk, sonra secondary.
    // Secondary critical'den hemen sonra başlar; idSets ile annotate eder.
    // Critical başarısız olursa idSets null gelir, secondary yine de çalışır.
    (async () => {
      const idSets = await loadCritical();
      // Loading false'a düştü, ekran açıldı — secondary arka planda devam eder
      loadSecondary(idSets);
    })();

    return () => { cancelled = true; };
  }, []);

  if (loading)  return <Loading />;

  // Compute role: profile.role > observer (anon)
  const userRole = profile?.role || "observer";
  const role = ROLES[userRole] || { label: "Observer", color: "#888780", ic: "O", accent: "#f4f3ef" };
  const isAdminUser = userRole === "admin";
  const threatened = species.filter(s => ["CR","EN","VU"].includes(s.iucn_status)).length;

  const navItems = [
    { key:"home",        label:"Home",        icon:"🏠" },
    { key:"programs",    label:"Programs",    icon:"📋" },
    { key:"species",     label:"ATLAS",       icon:"🌿" },
    { key:"metabolites", label:"Metabolites", icon:"🧪" },
    { key:"market",      label:"Market",      icon:"💰" },
    { key:"publications",label:"Publications",icon:"📚" },
    { key:"researchers", label:"Researchers", icon:"👨‍🔬" },
    { key: "communities", label: "Communities", icon: "🤝" },
    { key:"partners",    label:"Institutions",icon:"🏛" },
    { key:"portfolio",   label:"Portfolio",   icon:"📊" },
    { key:"sources",     label:"Sources",     icon:"🔗" },
    ...(isAdminUser ? [{ key:"admin", label:"Admin", icon:"⚙️" }] : []),
  ];

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#f8f7f4" }}>

      {/* ── Sidebar ── */}
      <div style={{ width:side?220:0, flexShrink:0, overflow:"hidden", background:"#fff", borderRight:"1px solid #e8e6e1", transition:"width 0.25s ease", display:"flex", flexDirection:"column" }}>
        <div style={{ padding:"18px 14px 14px", flex:1, overflow:"hidden" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:20 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:"linear-gradient(145deg,#085041,#1D9E75)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ color:"#fff", fontSize:14, fontWeight:700, fontFamily:"Georgia,serif" }}>A</span>
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:700, letterSpacing:-0.5, color:"#2c2c2a", fontFamily:"Georgia,serif" }}>ATLAS</div>
              <div style={{ fontSize:7, color:"#b4b2a9", letterSpacing:1.5, textTransform:"uppercase" }}>GEOCON v3.0</div>
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:1 }}>
            {navItems.map(n => (
              <button key={n.key} onClick={() => { setView(n.key); setExp(null); }} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 10px", border:"none", borderRadius:7, cursor:"pointer", fontSize:11, background:view===n.key?"#f4f3ef":"transparent", color:view===n.key?"#2c2c2a":"#888", fontWeight:view===n.key?600:400, transition:"all 0.15s" }}>
                <span style={{ fontSize:13 }}>{n.icon}</span>{n.label}
                {n.key === "programs" && programs.filter(p=>p.status==="Active").length > 0 && (
                  <span style={{ marginLeft:"auto", fontSize:9, padding:"1px 5px", borderRadius:99, background:"#E1F5EE", color:"#085041", fontWeight:700 }}>
                    {programs.filter(p=>p.status==="Active").length}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div style={{ marginTop:12, padding:10, background:"#f4f3ef", borderRadius:8, fontSize:9, color:"#888", lineHeight:1.8 }}>
            <div><Dot color={dbOk?"#0F6E56":"#A32D2D"} size={6}/><span style={{ marginLeft:4 }}>{dbOk?"Supabase connected":"Offline"}</span></div>
            <div><strong style={{ color:"#2c2c2a" }}>{species.length}</strong> species · <strong style={{ color:"#2c2c2a" }}>{programs.length}</strong> programs</div>
            <div>
              <strong style={{ color:"#2c2c2a" }}>{secondaryLoading && publications.length===0 ? "…" : publications.length}</strong> pubs ·{" "}
              <strong style={{ color:"#2c2c2a" }}>{secondaryLoading && metabolites.length===0 ? "…" : metabolites.length}</strong> cpds
              {secondaryLoading && (
                <span style={{ marginLeft:6, fontSize:8, color:"#b08518", fontWeight:600 }}>loading…</span>
              )}
            </div>
          </div>
        </div>
        <div style={{ padding:14, borderTop:"1px solid #e8e6e1" }}>
          {user ? (
            <>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                <div style={{ width:26, height:26, borderRadius:6, background:role.color, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <span style={{ color:"#fff", fontSize:10, fontWeight:600 }}>{role.ic}</span>
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize:11, fontWeight:600, color:"#2c2c2a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {authResearcher?.name || profile?.full_name || user.email.split("@")[0]}
                  </div>
                  <div style={{ fontSize:8, color:"#b4b2a9" }}>
                    {role.label}{profile?.approval_status === "pending" && " · pending"}
                  </div>
                </div>
              </div>
              {isAdminUser && (
                <a href="/upload-admin" style={{ display:"block", textAlign:"center", padding:"6px 0", fontSize:9, color:"#1D9E75", textDecoration:"none", border:"1px solid #1D9E75", borderRadius:6, marginBottom:6, fontWeight:600 }}>📊 Excel Upload</a>
              )}
              <button onClick={() => setMyProfileOpen(true)} style={{ width:"100%", padding:"5px 0", fontSize:9, color:"#888", background:"none", border:"1px solid #e8e6e1", borderRadius:6, cursor:"pointer", marginBottom: 4 }}>My profile</button>
              <button onClick={async () => { const { signOut } = await import("../lib/auth"); await signOut(); }} style={{ width:"100%", padding:"5px 0", fontSize:9, color:"#A32D2D", background:"none", border:"1px solid #FCEBEB", borderRadius:6, cursor:"pointer" }}>Sign out</button>
            </>
          ) : (
            <>
              <div style={{ fontSize:10, color:"#888", marginBottom:8, textAlign:"center", lineHeight: 1.5 }}>
                Browsing as <strong>observer</strong>
              </div>
              <button onClick={() => setAuthModalOpen(true)} style={{ width:"100%", padding:"8px 0", fontSize:11, color:"#fff", background:"#0a4a3e", border:"none", borderRadius:6, cursor:"pointer", fontWeight: 600 }}>Sign in / Sign up</button>
            </>
          )}
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ flex:1, minWidth:0, padding:"16px 20px 28px", overflow:"auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <button onClick={() => setSide(!side)} style={{ fontSize:16, background:"none", border:"none", cursor:"pointer", color:"#888", padding:0 }}>
            {side?"◀":"▶"}
          </button>
          <AuthBar
            user={user}
            profile={profile}
            researcher={authResearcher}
            onLoginClick={() => setAuthModalOpen(true)}
            onClaimClick={() => setClaimModalOpen(true)}
            onProfileClick={() => setMyProfileOpen(true)}
            onAdminClick={() => setAdminPanelOpen(true)}
          />
        </div>

        {/* Top metrics bar (HIDDEN: change `false` to `true` to re-enable) */}
        {false && (
        <div style={{ display:"flex", gap:6, marginBottom:16, flexWrap:"wrap" }}>
          {[
            { l:"Species",     v:species.length,      c:"#1D9E75" },
            { l:"Programs",    v:programs.length,     c:"#534AB7" },
            { l:"Compounds",   v:metabolites.length,  c:"#185FA5" },
            { l:"Publications",v:publications.length, c:"#D85A30" },
            { l:"Threatened",  v:threatened,          c:"#E24B4A" },
          ].map(s => (
            <div key={s.l} style={{ flex:"1 1 100px", ...S.card, padding:"10px 14px", border:"1px solid #e8e6e1" }}>
              <div style={S.mLabel}>{s.l}</div>
              <div style={S.mVal(s.c)}>{s.v}</div>
            </div>
          ))}
        </div>
        )}

        {/* ── View routing ── */}
        {view === "home"         && <GEOCONHome species={species} publications={publications} metabolites={metabolites} researchers={researchers} programs={programs} user={user || { role: userRole, name: profile?.full_name || authResearcher?.name || "Observer" }} setView={setView} onSpeciesClick={setDetailSpecies} onStartProgram={sp=>{setStartProgramSp(sp);}} />}
        {view === "programs"     && <ProgramsView preselectProgramId={preselectProgramId} onPreselectConsumed={()=>setPreselectProgramId(null)} onStartProgram={()=>{}} onOpenResearcher={researcherId => openResearcher(researcherId)} onOpenSpecies={sp => openSpeciesFromPanel(sp)} />}
        {view === "species"      && <SpeciesModule species={species} programs={programs} exp={exp} setExp={setExp} onSpeciesClick={setDetailSpecies} onStartProgram={sp=>{setStartProgramSp(sp);}} onOpenProgram={prog=>{setPreselectProgramId(prog.id);setView("programs");}} />}
        {view === "metabolites"  && (secondaryLoading && metabolites.length===0
          ? <SecondaryLoading label="Loading metabolites and publication links" />
          : <MetaboliteExplorer metabolites={metabolites} metabolitePublications={metabolitePublications} publications={publications} species={species} onSpeciesClick={setDetailSpecies} />)}
        {view === "market"       && <MarketView markets={markets} />}
        {view === "publications" && (secondaryLoading && publications.length===0
          ? <SecondaryLoading label="Loading publications and metabolite links" />
          : <PublicationsView publications={publications} metabolites={metabolites} metabolitePublications={metabolitePublications} />)}
        {view === "researchers"  && (secondaryLoading && researchers.length===0
          ? <SecondaryLoading label="Loading researchers" />
          : <ResearchersView researchers={researchers} onOpenResearcher={researcherId => openResearcher(researcherId)} />)}
        {view === "communities" && <CommunitiesView species={species} researchers={researchers} />}
        {view === "partners"     && <PartnerView institutions={institutions} />}
        {view === "portfolio"    && <PortfolioView species={species} />}
        {view === "sources"      && <SourcesPanel sources={sources} />}
        {view === "admin" && isAdminUser && <AdminPanel species={species} programs={programs} onDataChange={() => window.location.reload()} />}

        <div style={{ marginTop:32, paddingTop:10, borderTop:"1px solid #e8e6e1", display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:4, fontSize:8, color:"#b4b2a9" }}>
          <span>GEOCON v3.0 · ATLAS intelligence layer · {species.length} species · {programs.length} programs · {publications.length} pubs</span>
          <span>Venn BioVentures OÜ</span>
        </div>
      </div>

      {/* ── Overlays ── */}
      {detailSpecies && (
        <SpeciesDetailPanel
          species={detailSpecies}
          programs={programs}
          metabolitePublications={metabolitePublications}
          onClose={() => closePanelWithBack("species")}
          onStartProgram={sp => { setStartProgramSp(sp); setDetailSpecies(null); }}
          onOpenProgram={prog => openProgramFromPanel(prog, { type: "species", id: detailSpecies.id, label: detailSpecies.accepted_name })}
          onOpenResearcher={researcherId => openResearcher(researcherId, { type: "species", id: detailSpecies.id, label: detailSpecies.accepted_name })}
          breadcrumbBack={breadcrumbBack}
        />
      )}
      {detailResearcherId && (
        <ResearcherDetailPanel
          researcherId={detailResearcherId}
          onClose={() => closePanelWithBack("researcher")}
          onOpenProgram={prog => openProgramFromPanel(prog, { type: "researcher", id: detailResearcherId, label: "researcher" })}
          onOpenSpecies={sp => openSpeciesFromPanel(sp, { type: "researcher", id: detailResearcherId, label: "researcher" })}
          breadcrumb={breadcrumbBack}
        />
      )}
      {startProgramSp && (
        <StartProgramModal
          species={startProgramSp}
          onClose={() => setStartProgramSp(null)}
          onSuccess={() => { setStartProgramSp(null); window.location.reload(); }}
        />
      )}

      {/* ── Auth modals ── */}
      {authModalOpen && (
        <AuthModal
          onClose={() => setAuthModalOpen(false)}
          onSuccess={() => { /* useAuth listener auto-updates */ }}
        />
      )}
      {claimModalOpen && user && (
        <ClaimResearcherModal
          user={user}
          onClose={() => setClaimModalOpen(false)}
          onSubmitted={() => { setClaimModalOpen(false); refreshProfile(); }}
        />
      )}
      {myProfileOpen && user && (
        <MyProfilePanel
          user={user}
          profile={profile}
          researcher={authResearcher}
          onClose={() => setMyProfileOpen(false)}
          onRefresh={refreshProfile}
          onClaimClick={() => { setMyProfileOpen(false); setClaimModalOpen(true); }}
        />
      )}
      {adminPanelOpen && user && isAdminUser && (
        <AdminApprovalPanel
          user={user}
          onClose={() => setAdminPanelOpen(false)}
        />
      )}
    </div>
  );
}
