"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { ROLES, S } from "../lib/constants";
import { iucnC } from "../lib/helpers";

// Shared
import { Pill, Dot, MiniBar, Loading, RadarChart } from "../components/shared";

// Gateway
import LoginScreen from "../components/gateway/LoginScreen";

// Home
import GEOCONHome from "../components/home/GEOCONHome";

// Programs
import StartProgramModal from "../components/programs/StartProgramModal";

/* ─────────────────────────────────────────────────────────
   The following components remain inline until the next
   refactor pass (species, metabolites, admin etc.)
   They are extracted below this orchestration shell.
───────────────────────────────────────────────────────── */

/* ── helpers still needed inline ── */
const iucnBg = s=>({CR:"#FCEBEB",EN:"#FAEEDA",VU:"#FFF3CD",NT:"#EAF3DE",LC:"#E1F5EE"}[s]||"#f1efe8");
const decC   = d=>({Accelerate:"#0F6E56","Rescue Now":"#A32D2D","Urgent Conserve":"#A32D2D",Develop:"#185FA5",Scale:"#3B6D11",Monitor:"#888","Data Needed":"#534AB7"}[d]||"#888");
const decBg  = d=>({Accelerate:"#E1F5EE","Rescue Now":"#FCEBEB","Urgent Conserve":"#FCEBEB",Develop:"#E6F1FB",Scale:"#EAF3DE",Monitor:"#f1efe8","Data Needed":"#EEEDFE"}[d]||"#f1efe8");
const freshC = v=>v>0.85?"#0F6E56":v>0.65?"#BA7517":"#A32D2D";
const flag   = c=>c==="TR"?"🇹🇷":c==="CL"?"🇨🇱":"🌍";
const riskColor = r=>({high:"#A32D2D",medium:"#BA7517",low:"#0F6E56"}[r?.toLowerCase()]||"#888");
const riskBg    = r=>({high:"#FCEBEB",medium:"#FAEEDA",low:"#E1F5EE"}[r?.toLowerCase()]||"#f4f3ef");

const FAMILY_COLORS={Liliaceae:{bg:"#EAF3DE",border:"#639922",text:"#27500A",dot:"#639922"},Amaryllidaceae:{bg:"#E6F1FB",border:"#378ADD",text:"#0C447C",dot:"#378ADD"},Asparagaceae:{bg:"#E1F5EE",border:"#1D9E75",text:"#085041",dot:"#1D9E75"},Iridaceae:{bg:"#EEEDFE",border:"#7F77DD",text:"#3C3489",dot:"#7F77DD"},Orchidaceae:{bg:"#FBEAF0",border:"#D4537E",text:"#72243E",dot:"#D4537E"},Araceae:{bg:"#FAECE7",border:"#D85A30",text:"#712B13",dot:"#D85A30"},Colchicaceae:{bg:"#FAEEDA",border:"#BA7517",text:"#633806",dot:"#BA7517"},Primulaceae:{bg:"#FCEBEB",border:"#E24B4A",text:"#791F1F",dot:"#E24B4A"},Ranunculaceae:{bg:"#F1EFE8",border:"#5F5E5A",text:"#2C2C2A",dot:"#5F5E5A"},Gentianaceae:{bg:"#E1F5EE",border:"#0F6E56",text:"#04342C",dot:"#0F6E56"},Paeoniaceae:{bg:"#FBEAF0",border:"#993556",text:"#4B1528",dot:"#993556"},Nymphaeaceae:{bg:"#E6F1FB",border:"#185FA5",text:"#042C53",dot:"#185FA5"},Geraniaceae:{bg:"#FAEEDA",border:"#854F0B",text:"#412402",dot:"#854F0B"},Tecophilaeaceae:{bg:"#EEEDFE",border:"#534AB7",text:"#26215C",dot:"#534AB7"},Alstroemeriaceae:{bg:"#EAF3DE",border:"#3B6D11",text:"#173404",dot:"#3B6D11"}};
const DEF_FAM={bg:"#F1EFE8",border:"#888780",text:"#2C2C2A",dot:"#888780"};
const MODULE_COLORS={Origin:"#1D9E75",Forge:"#BA7517",Mesh:"#185FA5",Exchange:"#D85A30",Accord:"#5F5E5A"};
const STATUS_COLORS={Active:"#0F6E56",Draft:"#888",Blocked:"#A32D2D","On Hold":"#BA7517",Completed:"#185FA5"};

/* ══════════════════════════════════════════════════════════
   INLINE COMPONENTS (to be extracted in next refactor pass)
══════════════════════════════════════════════════════════ */

/* ── Species Detail Panel ── */
function SpeciesDetailPanel({species,onClose,onStartProgram}){
  const[pubs,setPubs]=useState([]);const[mets,setMets]=useState([]);const[cons,setCons]=useState([]);const[gov,setGov]=useState(null);const[prop,setProp]=useState([]);const[comm,setComm]=useState([]);const[locs,setLocs]=useState([]);const[story,setStory]=useState(null);const[loading,setLoading]=useState(true);const[tab,setTab]=useState("story");
  useEffect(()=>{
    if(!species)return;
    setLoading(true);setPubs([]);setMets([]);setCons([]);setGov(null);setProp([]);setComm([]);setLocs([]);setStory(null);setTab("story");
    Promise.all([
      supabase.from("publications").select("id,title,authors,year,journal,doi,open_access,source,abstract").eq("species_id",species.id).order("year",{ascending:false}).limit(50),
      supabase.from("metabolites").select("id,compound_name,compound_class,reported_activity,activity_category,evidence,confidence,therapeutic_area,plant_organ").eq("species_id",species.id).order("confidence",{ascending:false}),
      supabase.from("conservation").select("*").eq("species_id",species.id),
      supabase.from("governance").select("*").eq("species_id",species.id).maybeSingle(),
      supabase.from("propagation").select("*").eq("species_id",species.id),
      supabase.from("commercial").select("*").eq("species_id",species.id),
      supabase.from("locations").select("*").eq("species_id",species.id),
      supabase.from("species_stories").select("*").eq("species_id",species.id).maybeSingle(),
    ]).then(([pubR,metR,conR,govR,propR,commR,locR,storyR])=>{
      setPubs(pubR.data||[]);setMets(metR.data||[]);setCons(conR.data||[]);setGov(govR.data||null);setProp(propR.data||[]);setComm(commR.data||[]);setLocs(locR.data||[]);setStory(storyR.data||null);setLoading(false);
    });
  },[species?.id]);
  if(!species)return null;
  const c=FAMILY_COLORS[species.family]||DEF_FAM;
  const TABS=[{k:"story",l:"Story"},{k:"pubs",l:`Publications (${pubs.length})`},{k:"mets",l:`Metabolites (${mets.length})`},{k:"cons",l:"Conservation"},{k:"gov",l:"Governance"},{k:"prop",l:"Propagation"},{k:"comm",l:"Commercial"},{k:"info",l:"Details"}];
  return<>
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.3)",zIndex:100}}/>
    <div style={{position:"fixed",top:0,right:0,bottom:0,width:540,background:"#fff",zIndex:101,display:"flex",flexDirection:"column",boxShadow:"-4px 0 24px rgba(0,0,0,0.12)"}}>
      <div style={{flexShrink:0}}>
        {species.photo_url&&<div style={{height:200,overflow:"hidden",position:"relative"}}><img src={species.photo_url} alt={species.accepted_name} style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center top"}} onError={e=>e.target.parentElement.style.display="none"}/><div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,transparent 30%,rgba(0,0,0,0.7))"}}/><div style={{position:"absolute",bottom:12,left:16,right:40}}><div style={{fontSize:9,color:"rgba(255,255,255,0.7)",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>{species.family}</div><div style={{fontSize:20,fontWeight:700,fontStyle:"italic",color:"#fff",fontFamily:"Georgia,serif",lineHeight:1.2}}>{species.accepted_name}</div>{species.common_name&&<div style={{fontSize:12,color:"rgba(255,255,255,0.8)",marginTop:2}}>{species.common_name}</div>}</div><button onClick={onClose} style={{position:"absolute",top:10,right:10,background:"rgba(0,0,0,0.4)",border:"none",borderRadius:"50%",width:28,height:28,cursor:"pointer",color:"#fff",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>{species.photo_credit&&<div style={{position:"absolute",bottom:4,right:8,fontSize:8,color:"rgba(255,255,255,0.5)"}}>{species.photo_credit}</div>}</div>}
        <div style={{padding:"16px 20px",borderBottom:"1px solid #e8e6e1",background:c.bg}}>
          {!species.photo_url&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div style={{flex:1}}><div style={{fontSize:9,color:c.text,opacity:0.7,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>{species.family}</div><div style={{fontSize:18,fontWeight:700,fontStyle:"italic",color:"#2c2c2a",fontFamily:"Georgia,serif",lineHeight:1.3}}>{species.accepted_name}</div>{species.common_name&&<div style={{fontSize:12,color:"#888",marginTop:2}}>{species.common_name}</div>}</div><button onClick={onClose} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#888",padding:"0 0 0 12px",lineHeight:1}}>✕</button></div>}
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:species.photo_url?0:10}}>
            {species.iucn_status&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:99,background:iucnBg(species.iucn_status),color:iucnC(species.iucn_status),border:"0.5px solid currentColor"}}>IUCN: {species.iucn_status}</span>}
            {species.family&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:99,background:c.bg,color:c.text,border:`0.5px solid ${c.border}`}}>{species.family}</span>}
            {species.geophyte_type&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:99,background:"#f4f3ef",color:"#5f5e5a"}}>{species.geophyte_type}</span>}
            {species.country_focus&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:99,background:"#f4f3ef",color:"#5f5e5a"}}>{flag(species.country_focus)}</span>}
          </div>
        </div>
      </div>
      {(species.composite_score||species.score_conservation)&&<div style={{padding:"10px 20px",borderBottom:"1px solid #e8e6e1",display:"flex",gap:6,flexShrink:0}}>{[{l:"Composite",v:species.composite_score,c:"#1D9E75"},{l:"Urgency",v:species.score_conservation,c:"#E24B4A"},{l:"Value",v:species.score_venture,c:"#185FA5"},{l:"TRL",v:species.trl_level,c:"#534AB7"}].map(m=>m.v?<div key={m.l} style={{flex:1,background:"#f4f3ef",borderRadius:8,padding:"6px 8px",textAlign:"center"}}><div style={{fontSize:8,color:"#999",textTransform:"uppercase",marginBottom:2}}>{m.l}</div><div style={{fontSize:16,fontWeight:700,color:m.c}}>{m.v}</div></div>:null)}</div>}
      <div style={{padding:"10px 20px",borderBottom:"1px solid #e8e6e1",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
        <span style={{fontSize:11,color:"#888"}}>GEOCON program pathway</span>
        <button onClick={()=>{if(onStartProgram)onStartProgram(species);}} style={{padding:"6px 14px",border:"none",borderRadius:8,background:"#1D9E75",color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer"}}>+ Start Program</button>
      </div>
      <div style={{display:"flex",borderBottom:"1px solid #e8e6e1",flexShrink:0,overflowX:"auto"}}>
        {TABS.map(t=><button key={t.k} onClick={()=>setTab(t.k)} style={{flexShrink:0,padding:"10px 12px",border:"none",borderBottom:tab===t.k?"2px solid #1D9E75":"2px solid transparent",background:"none",cursor:"pointer",fontSize:11,fontWeight:tab===t.k?600:400,color:tab===t.k?"#1D9E75":"#888",whiteSpace:"nowrap"}}>{t.l}</button>)}
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"14px 20px"}}>
        {loading?<div style={{textAlign:"center",padding:40,color:"#999",fontSize:13}}>Loading...</div>:<>
          {tab==="story"&&<div>
            {!story?<div style={{textAlign:"center",padding:40}}>
              <div style={{fontSize:32,marginBottom:12}}>📖</div>
              <div style={{fontSize:14,fontWeight:600,color:"#2c2c2a",marginBottom:8}}>No story yet</div>
              <div style={{fontSize:12,color:"#888",marginBottom:16,lineHeight:1.6}}>Generate a GEOCON story for this species using the harvest endpoint.</div>
              <div style={{fontSize:11,color:"#b4b2a9",background:"#f8f7f4",padding:"8px 14px",borderRadius:8,textAlign:"left"}}>Run: <code style={{fontSize:10}}>/api/harvest/story?species_id={species.id}&secret=atlas2026</code></div>
            </div>:<div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div style={{padding:"14px 16px",background:"linear-gradient(135deg,#E1F5EE,#f8fff8)",borderRadius:12,border:"1px solid #1D9E75"}}>
                <div style={{fontSize:9,color:"#085041",textTransform:"uppercase",letterSpacing:0.8,fontWeight:600,marginBottom:8}}>GEOCON Perspective</div>
                {story.geocon_rationale&&<div style={{fontSize:12,color:"#2c2c2a",lineHeight:1.7,marginBottom:8}}>{story.geocon_rationale}</div>}
                {story.rescue_urgency&&<div style={{fontSize:11,color:"#A32D2D",lineHeight:1.6,padding:"8px 10px",background:"#FCEBEB",borderRadius:8,marginTop:6}}><strong style={{fontSize:9,textTransform:"uppercase",letterSpacing:0.6}}>Rescue urgency: </strong>{story.rescue_urgency}</div>}
              </div>
              <div style={{padding:"14px 16px",background:"#f8f7f4",borderRadius:12,border:"1px solid #e8e6e1"}}>
                <div style={{fontSize:9,color:"#534AB7",textTransform:"uppercase",letterSpacing:0.8,fontWeight:600,marginBottom:8}}>Scientific narrative</div>
                {story.scientific_narrative&&<div style={{fontSize:12,color:"#2c2c2a",lineHeight:1.7,marginBottom:10}}>{story.scientific_narrative}</div>}
                {story.habitat_story&&<div><div style={{fontSize:9,color:"#888",textTransform:"uppercase",marginBottom:4}}>Habitat</div><div style={{fontSize:11,color:"#5f5e5a",lineHeight:1.6}}>{story.habitat_story}</div></div>}
              </div>
              {story.conservation_context&&<div style={{padding:"14px 16px",background:"#FAEEDA",borderRadius:12,border:"1px solid #BA7517"}}><div style={{fontSize:9,color:"#633806",textTransform:"uppercase",letterSpacing:0.8,fontWeight:600,marginBottom:8}}>Conservation context</div><div style={{fontSize:12,color:"#2c2c2a",lineHeight:1.7}}>{story.conservation_context}</div></div>}
              {story.propagation_pathway&&<div style={{padding:"14px 16px",background:"#E1F5EE",borderRadius:12,border:"1px solid #1D9E75"}}><div style={{fontSize:9,color:"#085041",textTransform:"uppercase",letterSpacing:0.8,fontWeight:600,marginBottom:8}}>Propagation pathway</div><div style={{fontSize:12,color:"#2c2c2a",lineHeight:1.7}}>{story.propagation_pathway}</div></div>}
              <div style={{padding:"14px 16px",background:"#f8f7f4",borderRadius:12,border:"1px solid #e8e6e1",borderLeft:"3px solid #185FA5"}}>
                <div style={{fontSize:9,color:"#185FA5",textTransform:"uppercase",letterSpacing:0.8,fontWeight:600,marginBottom:8}}>Commercial hypothesis <span style={{fontSize:8,color:"#888",fontWeight:400,textTransform:"none"}}>(GEOCON internal)</span></div>
                {story.commercial_hypothesis&&<div style={{fontSize:12,color:"#2c2c2a",lineHeight:1.7,marginBottom:8}}>{story.commercial_hypothesis}</div>}
                {story.market_narrative&&<div style={{fontSize:11,color:"#5f5e5a",lineHeight:1.6,marginBottom:6}}><strong style={{fontSize:9,textTransform:"uppercase",color:"#888"}}>Market: </strong>{story.market_narrative}</div>}
                {story.value_chain&&<div style={{fontSize:11,color:"#5f5e5a",lineHeight:1.6}}><strong style={{fontSize:9,textTransform:"uppercase",color:"#888"}}>Value chain: </strong>{story.value_chain}</div>}
              </div>
              <div style={{fontSize:9,color:"#b4b2a9",textAlign:"right",marginTop:4}}>Generated by {story.generated_by||"GEOCON"} · {story.last_generated_at?.split("T")[0]||""}</div>
            </div>}
          </div>}
          {tab==="pubs"&&<div>{pubs.length===0?<p style={{color:"#999",fontSize:13,textAlign:"center",padding:20}}>No publications found</p>:pubs.map(p=><div key={p.id} style={{marginBottom:10,padding:"10px 12px",background:"#f8f7f4",borderRadius:8,borderLeft:"3px solid #378ADD"}}><div style={{fontSize:12,fontWeight:600,color:"#2c2c2a",lineHeight:1.4,marginBottom:4}}>{p.doi?<a href={p.doi} target="_blank" rel="noopener noreferrer" style={{color:"#185FA5",textDecoration:"none"}}>{(p.title||"").slice(0,100)}{(p.title||"").length>100?"...":""}</a>:(p.title||"").slice(0,100)}</div><div style={{fontSize:10,color:"#888",marginBottom:4}}>{(p.authors||"").slice(0,60)}{(p.authors||"").length>60?"...":""}</div><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{p.year&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:99,background:"#E6F1FB",color:"#0C447C"}}>{p.year}</span>}{p.journal&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:99,background:"#EEEDFE",color:"#3C3489"}}>{p.journal.slice(0,25)}</span>}{p.open_access&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:99,background:"#E1F5EE",color:"#085041"}}>OA</span>}</div>{p.abstract&&<div style={{fontSize:10,color:"#5f5e5a",marginTop:6,lineHeight:1.5}}>{p.abstract.slice(0,200)}...</div>}</div>)}</div>}
          {tab==="mets"&&<div>{mets.length===0?<p style={{color:"#999",fontSize:13,textAlign:"center",padding:20}}>No metabolites yet</p>:mets.map(m=><div key={m.id} style={{marginBottom:10,padding:"10px 12px",background:"#f8f7f4",borderRadius:8,borderLeft:"3px solid #534AB7"}}><div style={{fontSize:13,fontWeight:600,color:"#2c2c2a",marginBottom:4}}>{m.compound_name}</div>{m.reported_activity&&<div style={{fontSize:11,color:"#5f5e5a",marginBottom:6}}>{m.reported_activity}</div>}<div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{m.compound_class&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:99,background:"#EEEDFE",color:"#3C3489"}}>{m.compound_class}</span>}{m.activity_category&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:99,background:"#E1F5EE",color:"#085041"}}>{m.activity_category}</span>}{m.evidence&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:99,background:"#FAEEDA",color:"#633806"}}>{m.evidence}</span>}{m.confidence&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:99,background:"#f4f3ef",color:"#5f5e5a"}}>Conf: {Math.round(m.confidence*100)}%</span>}</div></div>)}</div>}
          {tab==="cons"&&<div>{cons.length===0?<div style={{textAlign:"center",padding:32}}><p style={{color:"#999",fontSize:13}}>No conservation assessments yet</p></div>:cons.map(a=><div key={a.id} style={{marginBottom:12,padding:"12px 14px",background:"#f8f7f4",borderRadius:8,borderLeft:"3px solid #E24B4A"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}><div style={{fontSize:13,fontWeight:600,color:"#2c2c2a"}}>{a.source}</div>{a.status_interpreted&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:99,background:iucnBg(a.status_interpreted),color:iucnC(a.status_interpreted)}}>{a.status_interpreted}</span>}</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px 12px",fontSize:11}}>{a.assessment_year&&<div><span style={{color:"#b4b2a9",fontSize:9,textTransform:"uppercase"}}>Year</span><div style={{color:"#2c2c2a",fontWeight:500}}>{a.assessment_year}</div></div>}{a.trend&&<div><span style={{color:"#b4b2a9",fontSize:9,textTransform:"uppercase"}}>Trend</span><div style={{color:"#2c2c2a",fontWeight:500}}>{a.trend}</div></div>}</div>{a.notes&&<div style={{fontSize:10,color:"#5f5e5a",marginTop:6,lineHeight:1.5}}>{a.notes}</div>}</div>)}</div>}
          {tab==="gov"&&<div>{!gov?<div style={{textAlign:"center",padding:32}}><p style={{color:"#999",fontSize:13}}>No governance data yet</p></div>:<div style={{display:"flex",flexDirection:"column",gap:10}}><div style={{padding:"14px 16px",background:"#f8f7f4",borderRadius:8,borderLeft:"3px solid #D85A30"}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px 16px"}}>{[{l:"Access regime",v:gov.access_regime},{l:"ABS/Nagoya risk",v:gov.abs_nagoya_risk,colored:true},{l:"Collection sensitivity",v:gov.collection_sensitivity,colored:true},{l:"Public visibility",v:gov.public_visibility_level}].map(({l,v,colored})=>v?<div key={l}><div style={{fontSize:9,color:"#b4b2a9",textTransform:"uppercase",letterSpacing:0.4,marginBottom:3}}>{l}</div>{colored?<span style={{fontSize:11,padding:"2px 8px",borderRadius:99,background:riskBg(v),color:riskColor(v),fontWeight:600}}>{v}</span>:<div style={{fontSize:12,color:"#2c2c2a",fontWeight:500}}>{v}</div>}</div>:null)}</div></div>{gov.notes&&<div style={{padding:"10px 14px",background:"#f8f7f4",borderRadius:8,fontSize:11,color:"#5f5e5a",lineHeight:1.6}}>{gov.notes}</div>}</div>}</div>}
          {tab==="prop"&&<div>{prop.length===0?<div style={{textAlign:"center",padding:32}}><p style={{color:"#999",fontSize:13}}>No propagation protocols yet</p></div>:prop.map(p=><div key={p.id} style={{marginBottom:12,padding:"12px 14px",background:"#f8f7f4",borderRadius:8,borderLeft:"3px solid #1D9E75"}}><div style={{fontSize:13,fontWeight:600,color:"#2c2c2a",marginBottom:8}}>{p.protocol_type}</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px 16px",fontSize:11}}>{p.explant&&<div><span style={{color:"#b4b2a9",fontSize:9,textTransform:"uppercase"}}>Explant</span><div style={{color:"#2c2c2a",fontWeight:500}}>{p.explant}</div></div>}{p.medium_or_condition&&<div><span style={{color:"#b4b2a9",fontSize:9,textTransform:"uppercase"}}>Medium</span><div style={{color:"#2c2c2a",fontWeight:500}}>{p.medium_or_condition}</div></div>}{p.success_rate&&<div><span style={{color:"#b4b2a9",fontSize:9,textTransform:"uppercase"}}>Success rate</span><div style={{color:"#1D9E75",fontWeight:700}}>{p.success_rate}%</div></div>}</div>{p.notes&&<div style={{fontSize:10,color:"#5f5e5a",marginTop:8,lineHeight:1.5}}>{p.notes}</div>}</div>)}</div>}
          {tab==="comm"&&<div>{comm.length===0?<div style={{textAlign:"center",padding:32}}><p style={{color:"#999",fontSize:13}}>No commercial hypotheses yet</p></div>:comm.map(h=><div key={h.id} style={{marginBottom:12,padding:"12px 14px",background:"#f8f7f4",borderRadius:8,borderLeft:"3px solid #185FA5"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}><div style={{fontSize:13,fontWeight:600,color:"#2c2c2a"}}>{h.application_area}</div>{h.status&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:99,background:h.status==="monitor"?"#FAEEDA":"#E1F5EE",color:h.status==="monitor"?"#633806":"#085041"}}>{h.status}</span>}</div>{h.justification&&<div style={{fontSize:11,color:"#5f5e5a",lineHeight:1.6}}>{h.justification}</div>}</div>)}</div>}
          {tab==="info"&&<div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px 16px",marginBottom:14}}>{[{l:"ID",v:species.id},{l:"Genus",v:species.genus},{l:"Family",v:species.family},{l:"Geophyte type",v:species.geophyte_type},{l:"Region",v:species.region},{l:"Country",v:species.country_focus},{l:"TC status",v:species.tc_status},{l:"Decision",v:species.current_decision||species.decision},{l:"Market area",v:species.market_area},{l:"Habitat",v:species.habitat}].map(({l,v})=>v?<div key={l}><div style={{fontSize:9,color:"#b4b2a9",textTransform:"uppercase",letterSpacing:0.4}}>{l}</div><div style={{fontSize:12,color:"#2c2c2a",fontWeight:500}}>{v}</div></div>:null)}</div><div style={{padding:"12px 14px",background:"#f8f7f4",borderRadius:10,borderLeft:"3px solid #185FA5"}}><div style={{fontSize:9,color:"#185FA5",textTransform:"uppercase",letterSpacing:0.8,fontWeight:600,marginBottom:8}}>Data trust</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px 12px",fontSize:11}}>{species.confidence&&<div><div style={{fontSize:9,color:"#b4b2a9",textTransform:"uppercase"}}>Confidence</div><div style={{fontWeight:700,color:species.confidence>=70?"#0F6E56":species.confidence>=40?"#BA7517":"#A32D2D"}}>{species.confidence}%</div></div>}{species.last_verified&&<div><div style={{fontSize:9,color:"#b4b2a9",textTransform:"uppercase"}}>Last verified</div><div style={{color:"#2c2c2a"}}>{species.last_verified}</div></div>}{species.geocon_module&&<div><div style={{fontSize:9,color:"#b4b2a9",textTransform:"uppercase"}}>GEOCON module</div><div style={{color:"#1D9E75",fontWeight:600}}>{species.geocon_module}</div></div>}</div></div></div>}
        </>}
      </div>
    </div>
  </>;
}

/* ── Family Species Card ── */
function FamilySpeciesCard({sp,onClick}){const c=FAMILY_COLORS[sp.family]||DEF_FAM;return<div onClick={onClick} style={{background:"#fff",border:"0.5px solid #e8e6e1",borderLeft:`3px solid ${c.dot}`,borderRadius:10,cursor:"pointer",overflow:"hidden"}} onMouseEnter={e=>e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,0.08)"} onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>{sp.thumbnail_url&&<div style={{height:80,overflow:"hidden"}}><img src={sp.thumbnail_url} alt={sp.accepted_name} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.parentElement.style.display="none"}/></div>}<div style={{padding:"8px 12px 10px"}}><p style={{margin:"0 0 4px",fontSize:12,fontStyle:"italic",fontWeight:600,color:"#2c2c2a"}}>{sp.accepted_name}</p>{sp.common_name&&<p style={{margin:"0 0 4px",fontSize:10,color:"#888"}}>{sp.common_name}</p>}<div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{sp.iucn_status&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:99,background:iucnBg(sp.iucn_status),color:iucnC(sp.iucn_status),border:"0.5px solid currentColor"}}>IUCN: {sp.iucn_status}</span>}{sp.country_focus&&<span style={{fontSize:10,color:"#b4b2a9"}}>{flag(sp.country_focus)}</span>}</div></div></div>}

/* ── Species Module ── */
function SpeciesModule({species,onSpeciesClick}){
  const[selectedFamily,setSelectedFamily]=useState(null);
  const[selectedGenus,setSelectedGenus]=useState(null);
  const[search,setSearch]=useState("");
  const[fC,setFC]=useState("all");

  const FAMILY_ORDER=["Asparagaceae","Amaryllidaceae","Orchidaceae","Araceae","Liliaceae","Iridaceae","Ranunculaceae","Primulaceae","Colchicaceae","Gentianaceae","Paeoniaceae","Nymphaeaceae","Geraniaceae","Tecophilaeaceae","Alstroemeriaceae"];
  const families=[...new Set(species.map(s=>s.family).filter(Boolean))].sort((a,b)=>{const ai=FAMILY_ORDER.indexOf(a),bi=FAMILY_ORDER.indexOf(b);return(ai===-1?99:ai)-(bi===-1?99:bi);});
  const countries=[...new Set(species.map(s=>s.country_focus).filter(Boolean))];

  // Genera within selected family
  const familySpecies = selectedFamily ? species.filter(s=>s.family===selectedFamily) : [];
  const genera = [...new Set(familySpecies.map(s=>s.genus).filter(Boolean))].sort();
  const hasGenera = genera.length > 1;

  // Species within selected genus (or family if only 1 genus)
  const genusSpecies = selectedGenus
    ? species.filter(s=>s.genus===selectedGenus && (!search||(s.accepted_name||"").toLowerCase().includes(search.toLowerCase())) && (fC==="all"||s.country_focus===fC))
    : (!hasGenera && selectedFamily)
      ? species.filter(s=>s.family===selectedFamily && (!search||(s.accepted_name||"").toLowerCase().includes(search.toLowerCase())) && (fC==="all"||s.country_focus===fC))
      : [];

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

  function SpeciesRow({sp}){const c=FAMILY_COLORS[sp.family]||DEF_FAM;return<div onClick={()=>onSpeciesClick(sp)} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:"#fff",borderRadius:8,border:"1px solid #e8e6e1",cursor:"pointer",transition:"background 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background="#f8f7f4"} onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
    <div style={{width:44,height:44,borderRadius:8,overflow:"hidden",flexShrink:0,background:c.bg}}>{sp.thumbnail_url?<img src={sp.thumbnail_url} alt={sp.accepted_name} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.parentElement.style.background=c.bg}/>:<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:18}}>🌿</span></div>}</div>
    <div style={{flex:1,minWidth:0}}>
      <div style={{fontSize:13,fontWeight:600,fontStyle:"italic",color:"#2c2c2a",fontFamily:"Georgia,serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sp.accepted_name}</div>
      <div style={{fontSize:10,color:"#b4b2a9",marginTop:1}}>{sp.geophyte_type||"—"} · {sp.region||sp.country_focus||"—"}</div>
    </div>
    <div style={{display:"flex",gap:5,alignItems:"center",flexShrink:0}}>
      {sp.iucn_status&&<span style={{fontSize:9,padding:"2px 6px",borderRadius:99,background:iucnBg(sp.iucn_status),color:iucnC(sp.iucn_status)}}>{sp.iucn_status}</span>}
      {sp.decision&&<span style={{fontSize:9,padding:"2px 6px",borderRadius:99,background:decBg(sp.decision),color:decC(sp.decision)}}>{sp.decision}</span>}
      {sp.composite_score?<span style={{fontSize:12,fontWeight:700,color:"#1D9E75",minWidth:22,textAlign:"right"}}>{sp.composite_score}</span>:null}
      <span style={{color:"#b4b2a9",fontSize:14}}>›</span>
    </div>
  </div>;}

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
      <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
        <input type="text" placeholder="Search species..." value={search} onChange={e=>setSearch(e.target.value)} style={{flex:"1 1 160px",...S.input}}/>
        <select value={fC} onChange={e=>setFC(e.target.value)} style={S.input}><option value="all">All countries</option>{countries.map(c=><option key={c} value={c}>{c==="TR"?"Türkiye":"Chile"}</option>)}</select>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {genusSpecies.length===0?<div style={{textAlign:"center",padding:40,color:"#999",fontSize:13}}>No species found</div>:genusSpecies.map(sp=><SpeciesRow key={sp.id} sp={sp}/>)}
      </div>
    </>}
  </div>;
}


/* ── Metabolite Explorer ── */
function MetaboliteExplorer({metabolites}){
  const[selectedCat,setSelectedCat]=useState(null);const[search,setSearch]=useState("");const[expanded,setExpanded]=useState(null);
  const CAT_META={alkaloid:{icon:"🔵",color:"#534AB7",bg:"#EEEDFE",desc:"Nitrogen-containing plant compounds"},flavonoid:{icon:"🟡",color:"#BA7517",bg:"#FAEEDA",desc:"Polyphenolic antioxidants"},terpenoid:{icon:"🟢",color:"#0F6E56",bg:"#E1F5EE",desc:"Terpenes & terpenoids"},phenolic:{icon:"🟤",color:"#854F0B",bg:"#FAEEDA",desc:"Phenolic acids & compounds"},saponin:{icon:"🔴",color:"#993556",bg:"#FBEAF0",desc:"Steroid & triterpenoid saponins"},glycoside:{icon:"🟣",color:"#185FA5",bg:"#E6F1FB",desc:"Sugar-containing compounds"},steroid:{icon:"⚪",color:"#639922",bg:"#EAF3DE",desc:"Steroidal compounds"},"amino acid":{icon:"🔶",color:"#D85A30",bg:"#FAECE7",desc:"Amino acids & peptides"},other:{icon:"⬜",color:"#888780",bg:"#F1EFE8",desc:"Other compound classes"}};
  const CATS=Object.keys(CAT_META);
  const catCounts={};for(const cat of CATS){catCounts[cat]=metabolites.filter(m=>(m.activity_category||"other")===cat).length;}
  const catMets=selectedCat?metabolites.filter(m=>{const matchCat=(m.activity_category||"other")===selectedCat;const matchSearch=!search||(m.compound_name||"").toLowerCase().includes(search.toLowerCase())||(m.species?.accepted_name||"").toLowerCase().includes(search.toLowerCase());return matchCat&&matchSearch;}):[];
  return<div>
    {!selectedCat?<>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}><div><div style={{fontSize:16,fontWeight:700,color:"#2c2c2a",fontFamily:"Georgia,serif"}}>Metabolites</div><div style={{fontSize:11,color:"#888",marginTop:2}}>{metabolites.length} compounds · {CATS.length} categories</div></div><div style={{display:"flex",gap:6}}>{[{l:"Total",v:metabolites.length,c:"#534AB7"},{l:"Species",v:[...new Set(metabolites.map(m=>m.species_id).filter(Boolean))].length,c:"#185FA5"}].map(s=><div key={s.l} style={{textAlign:"center",padding:"5px 10px",background:"#f4f3ef",borderRadius:8}}><div style={{fontSize:14,fontWeight:700,color:s.c}}>{s.v}</div><div style={{fontSize:9,color:"#999"}}>{s.l}</div></div>)}</div></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:10}}>{CATS.map(cat=>{const m=CAT_META[cat];const count=catCounts[cat]||0;const topMets=metabolites.filter(me=>(me.activity_category||"other")===cat).slice(0,3);return<div key={cat} onClick={()=>{setSelectedCat(cat);setSearch("");}} style={{background:"#fff",border:"1px solid #e8e6e1",borderRadius:12,overflow:"hidden",cursor:"pointer",transition:"all 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=m.color;e.currentTarget.style.transform="translateY(-2px)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="#e8e6e1";e.currentTarget.style.transform="translateY(0)"}}><div style={{background:m.bg,padding:"14px 14px 10px",borderBottom:`1px solid ${m.color}22`}}><div style={{fontSize:24,marginBottom:6}}>{m.icon}</div><div style={{fontSize:13,fontWeight:700,color:m.color,textTransform:"capitalize"}}>{cat}</div><div style={{fontSize:10,color:"#888",marginTop:2}}>{m.desc}</div></div><div style={{padding:"10px 14px"}}><div style={{fontSize:20,fontWeight:700,color:"#2c2c2a",marginBottom:6}}>{count}</div><div style={{display:"flex",flexDirection:"column",gap:2}}>{topMets.map(me=><div key={me.id} style={{fontSize:9,color:"#b4b2a9",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{(me.compound_name||"").slice(0,40)}</div>)}</div></div></div>;})}
      </div>
    </>:<>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}><button onClick={()=>{setSelectedCat(null);setSearch("");}} style={{padding:"6px 12px",border:"1px solid #e8e6e1",borderRadius:7,background:"#fff",cursor:"pointer",fontSize:11,color:"#888"}}>← Categories</button><div style={{flex:1,display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:20}}>{CAT_META[selectedCat]?.icon}</span><div><div style={{fontSize:15,fontWeight:700,color:CAT_META[selectedCat]?.color,textTransform:"capitalize"}}>{selectedCat}</div><div style={{fontSize:11,color:"#888"}}>{catMets.length} compounds</div></div></div></div>
      <input type="text" placeholder="Search compound or species..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:"100%",marginBottom:12,...S.input}}/>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>{catMets.length===0?<div style={{textAlign:"center",padding:40,color:"#999",fontSize:13}}>No compounds found</div>:catMets.map(m=><div key={m.id} onClick={()=>setExpanded(expanded===m.id?null:m.id)} style={{background:"#fff",border:expanded===m.id?"1px solid #85B7EB":"1px solid #e8e6e1",borderRadius:8,padding:"10px 12px",cursor:"pointer",borderLeft:`3px solid ${CAT_META[selectedCat]?.color||"#888"}`}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}><div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:"#2c2c2a"}}>{m.compound_name}</div><div style={{fontSize:10,fontStyle:"italic",color:"#888",marginTop:2}}>{m.species?.accepted_name||"—"}</div></div><div style={{display:"flex",gap:4,alignItems:"center",flexShrink:0}}>{m.evidence&&<span style={{fontSize:9,padding:"2px 6px",borderRadius:99,background:"#E1F5EE",color:"#085041"}}>{m.evidence}</span>}{m.confidence&&<span style={{fontSize:10,fontWeight:700,color:CAT_META[selectedCat]?.color}}>{Math.round(m.confidence*100)}%</span>}</div></div>{m.reported_activity&&<div style={{fontSize:11,color:"#5f5e5a",marginTop:6,lineHeight:1.5}}>{m.reported_activity.slice(0,120)}</div>}{expanded===m.id&&<div style={{marginTop:10,paddingTop:10,borderTop:"1px solid #e8e6e1"}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px 14px",fontSize:11}}>{[{l:"Plant organ",v:m.plant_organ},{l:"Therapeutic area",v:m.therapeutic_area},{l:"Confidence",v:m.confidence?`${Math.round(m.confidence*100)}%`:null}].map(({l,v})=>v?<div key={l}><span style={{color:"#b4b2a9",fontSize:9,textTransform:"uppercase"}}>{l}</span><div style={{color:"#2c2c2a",fontWeight:500}}>{v}</div></div>:null)}</div></div>}</div>)}</div>
    </>}
  </div>;
}

/* ── Programs View ── */
function ProgramsView({species,user}){
  const[programs,setPrograms]=useState([]);const[loading,setLoading]=useState(true);const[selected,setSelected]=useState(null);const[tab,setTab]=useState("overview");const[stories,setStories]=useState([]);const[actions,setActions]=useState([]);const[decisions,setDecisions]=useState([]);
  useEffect(()=>{supabase.from("programs").select("*, species(accepted_name,iucn_status,family,thumbnail_url)").order("priority_score",{ascending:false}).then(({data})=>{setPrograms(data||[]);setLoading(false);});},[]);
  useEffect(()=>{if(!selected)return;Promise.all([supabase.from("program_story_entries").select("*").eq("program_id",selected.id).order("created_at",{ascending:false}),supabase.from("program_actions").select("*").eq("program_id",selected.id).order("priority"),supabase.from("program_decisions").select("*").eq("program_id",selected.id).order("decision_date",{ascending:false})]).then(([s,a,d])=>{setStories(s.data||[]);setActions(a.data||[]);setDecisions(d.data||[]);});},[selected?.id]);
  if(loading)return<Loading/>;
  const active=programs.filter(p=>p.status==="Active");const blocked=programs.filter(p=>p.status==="Blocked");
  return<div>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:8}}>
      <div><div style={{fontSize:16,fontWeight:700,color:"#2c2c2a",fontFamily:"Georgia,serif"}}>GEOCON Programs</div><div style={{fontSize:11,color:"#888",marginTop:2}}>{programs.length} programs · {active.length} active · {blocked.length} blocked</div></div>
      <div style={{display:"flex",gap:6}}>{[{l:"Active",v:active.length,c:"#1D9E75"},{l:"Blocked",v:blocked.length,c:"#A32D2D"},{l:"Draft",v:programs.filter(p=>p.status==="Draft").length,c:"#888"}].map(s=><div key={s.l} style={{textAlign:"center",padding:"5px 10px",background:"#f4f3ef",borderRadius:8}}><div style={{fontSize:14,fontWeight:700,color:s.c}}>{s.v}</div><div style={{fontSize:9,color:"#999"}}>{s.l}</div></div>)}</div>
    </div>
    {programs.length===0?<div style={{textAlign:"center",padding:60,color:"#999"}}><div style={{fontSize:32,marginBottom:12}}>🌿</div><div style={{fontSize:15,fontWeight:600,color:"#2c2c2a",marginBottom:8}}>No programs yet</div><div style={{fontSize:12}}>Open any species and click "+ Start Program" to begin a GEOCON journey.</div></div>:<>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6,marginBottom:16}}>{["Origin","Forge","Mesh","Exchange","Accord"].map(m=>{const count=programs.filter(p=>p.current_module===m).length;return<div key={m} style={{padding:"10px 12px",background:"#fff",borderRadius:10,border:`1px solid ${MODULE_COLORS[m]}33`,textAlign:"center"}}><div style={{fontSize:11,fontWeight:700,color:MODULE_COLORS[m]}}>{m}</div><div style={{fontSize:20,fontWeight:700,color:"#2c2c2a",margin:"4px 0"}}>{count}</div></div>;})}</div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>{programs.map(p=>{const modColor=MODULE_COLORS[p.current_module]||"#888";return<div key={p.id} onClick={()=>{setSelected(p);setTab("overview");}} style={{background:"#fff",border:selected?.id===p.id?"2px solid #1D9E75":"1px solid #e8e6e1",borderLeft:`4px solid ${modColor}`,borderRadius:10,padding:"14px 16px",cursor:"pointer"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}><div style={{flex:1}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}><span style={{fontSize:13,fontWeight:700,color:"#2c2c2a"}}>{p.program_name}</span><span style={{fontSize:9,padding:"2px 8px",borderRadius:99,background:(STATUS_COLORS[p.status]||"#888")+"22",color:STATUS_COLORS[p.status]||"#888",fontWeight:600}}>{p.status}</span></div>{p.species&&<div style={{fontSize:11,fontStyle:"italic",color:"#888",marginBottom:6}}>{p.species.accepted_name} · {p.program_type}</div>}<div style={{display:"flex",gap:6,flexWrap:"wrap"}}><span style={{fontSize:10,padding:"2px 8px",borderRadius:99,background:modColor+"15",color:modColor}}>Module: {p.current_module}</span>{p.current_gate&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:99,background:"#f4f3ef",color:"#5f5e5a"}}>Gate: {p.current_gate}</span>}</div></div>{p.readiness_score>0&&<div style={{textAlign:"center",padding:"4px 10px",background:"#f4f3ef",borderRadius:8}}><div style={{fontSize:7,color:"#999",textTransform:"uppercase"}}>Readiness</div><div style={{fontSize:16,fontWeight:700,color:"#1D9E75"}}>{p.readiness_score}</div></div>}</div>{p.next_action&&<div style={{marginTop:8,padding:"6px 10px",background:"#f8f7f4",borderRadius:6,fontSize:11,color:"#5f5e5a"}}>→ {p.next_action}</div>}{p.primary_blocker&&<div style={{marginTop:4,padding:"6px 10px",background:"#FCEBEB",borderRadius:6,fontSize:11,color:"#A32D2D"}}>⚠ {p.primary_blocker}</div>}</div>;})}
      </div>
    </>}
    {selected&&<>
      <div onClick={()=>setSelected(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.3)",zIndex:100}}/>
      <div style={{position:"fixed",top:0,right:0,bottom:0,width:560,background:"#fff",zIndex:101,display:"flex",flexDirection:"column",boxShadow:"-4px 0 24px rgba(0,0,0,0.12)"}}>
        <div style={{padding:"18px 20px",borderBottom:"1px solid #e8e6e1",background:"#f8f7f4",flexShrink:0}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div style={{flex:1}}><div style={{fontSize:9,color:"#888",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>{selected.program_type}</div><div style={{fontSize:18,fontWeight:700,color:"#2c2c2a",lineHeight:1.3}}>{selected.program_name}</div>{selected.species&&<div style={{fontSize:12,fontStyle:"italic",color:"#888",marginTop:2}}>{selected.species.accepted_name}</div>}</div><button onClick={()=>setSelected(null)} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#888"}}>✕</button></div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:10}}><span style={{fontSize:10,padding:"2px 8px",borderRadius:99,background:(MODULE_COLORS[selected.current_module]||"#888")+"15",color:MODULE_COLORS[selected.current_module]||"#888"}}>{selected.current_module}</span><span style={{fontSize:10,padding:"2px 8px",borderRadius:99,background:"#f4f3ef",color:"#5f5e5a"}}>{selected.current_gate}</span><span style={{fontSize:10,padding:"2px 8px",borderRadius:99,background:(STATUS_COLORS[selected.status]||"#888")+"22",color:STATUS_COLORS[selected.status]||"#888"}}>{selected.status}</span></div>
        </div>
        {(selected.readiness_score||selected.confidence_score||selected.priority_score)&&<div style={{padding:"10px 20px",borderBottom:"1px solid #e8e6e1",display:"flex",gap:6,flexShrink:0}}>{[{l:"Readiness",v:selected.readiness_score,c:"#1D9E75"},{l:"Confidence",v:selected.confidence_score,c:"#185FA5"},{l:"Priority",v:selected.priority_score,c:"#D85A30"}].map(m=>m.v?<div key={m.l} style={{flex:1,background:"#f4f3ef",borderRadius:8,padding:"6px 8px",textAlign:"center"}}><div style={{fontSize:8,color:"#999",textTransform:"uppercase",marginBottom:2}}>{m.l}</div><div style={{fontSize:16,fontWeight:700,color:m.c}}>{m.v}</div></div>:null)}</div>}
        <div style={{display:"flex",borderBottom:"1px solid #e8e6e1",flexShrink:0,overflowX:"auto"}}>{["overview","story","actions","decisions"].map(t=><button key={t} onClick={()=>setTab(t)} style={{flexShrink:0,padding:"10px 14px",border:"none",borderBottom:tab===t?"2px solid #1D9E75":"2px solid transparent",background:"none",cursor:"pointer",fontSize:11,fontWeight:tab===t?600:400,color:tab===t?"#1D9E75":"#888",textTransform:"capitalize"}}>{t}</button>)}</div>
        <div style={{flex:1,overflowY:"auto",padding:"16px 20px"}}>
          {tab==="overview"&&<div style={{display:"flex",flexDirection:"column",gap:12}}>
            {selected.why_this_program&&<div style={{padding:"12px 14px",background:"#f8f7f4",borderRadius:8,borderLeft:"3px solid #1D9E75"}}><div style={{fontSize:9,color:"#888",textTransform:"uppercase",marginBottom:6}}>Why this program</div><div style={{fontSize:12,color:"#2c2c2a",lineHeight:1.7}}>{selected.why_this_program}</div></div>}
            {selected.strategic_rationale&&<div style={{padding:"12px 14px",background:"#f8f7f4",borderRadius:8,borderLeft:"3px solid #185FA5"}}><div style={{fontSize:9,color:"#888",textTransform:"uppercase",marginBottom:6}}>Strategic rationale</div><div style={{fontSize:12,color:"#2c2c2a",lineHeight:1.7}}>{selected.strategic_rationale}</div></div>}
            {selected.next_action&&<div style={{padding:"12px 14px",background:"#E1F5EE",borderRadius:8}}><div style={{fontSize:9,color:"#085041",textTransform:"uppercase",marginBottom:4}}>Next action</div><div style={{fontSize:12,color:"#085041",fontWeight:600}}>{selected.next_action}</div></div>}
            {selected.primary_blocker&&<div style={{padding:"12px 14px",background:"#FCEBEB",borderRadius:8}}><div style={{fontSize:9,color:"#A32D2D",textTransform:"uppercase",marginBottom:4}}>Primary blocker</div><div style={{fontSize:12,color:"#A32D2D"}}>{selected.primary_blocker}</div></div>}
            {selected.what_is_missing&&<div style={{padding:"12px 14px",background:"#FAEEDA",borderRadius:8}}><div style={{fontSize:9,color:"#633806",textTransform:"uppercase",marginBottom:4}}>What is missing</div><div style={{fontSize:12,color:"#633806",lineHeight:1.6}}>{selected.what_is_missing}</div></div>}
            {selected.recommended_pathway&&<div style={{padding:"12px 14px",background:"#f8f7f4",borderRadius:8}}><div style={{fontSize:9,color:"#888",textTransform:"uppercase",marginBottom:4}}>Recommended pathway</div><div style={{fontSize:12,color:"#2c2c2a",lineHeight:1.6}}>{selected.recommended_pathway}</div></div>}
          </div>}
          {tab==="story"&&<div>{stories.length===0?<div style={{textAlign:"center",padding:32,color:"#999",fontSize:13}}>No story entries yet</div>:stories.map(s=><div key={s.id} style={{marginBottom:10,padding:"12px 14px",background:"#f8f7f4",borderRadius:8,borderLeft:"3px solid #534AB7"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:12,fontWeight:600,color:"#2c2c2a"}}>{s.title}</span><span style={{fontSize:9,color:"#888"}}>{s.entry_date}</span></div>{s.entry_type&&<span style={{fontSize:9,padding:"1px 6px",borderRadius:99,background:"#EEEDFE",color:"#3C3489",marginBottom:6,display:"inline-block"}}>{s.entry_type}</span>}{s.summary&&<div style={{fontSize:11,color:"#5f5e5a",lineHeight:1.6,marginTop:4}}>{s.summary}</div>}</div>)}</div>}
          {tab==="actions"&&<div>{actions.length===0?<div style={{textAlign:"center",padding:32,color:"#999",fontSize:13}}>No actions yet</div>:actions.map(a=><div key={a.id} style={{marginBottom:8,padding:"12px 14px",background:"#f8f7f4",borderRadius:8,borderLeft:`3px solid ${a.status==="completed"?"#1D9E75":a.priority==="high"?"#A32D2D":"#888"}`}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:12,fontWeight:600,color:"#2c2c2a"}}>{a.action_title}</span><span style={{fontSize:9,padding:"2px 6px",borderRadius:99,background:a.status==="completed"?"#E1F5EE":"#f4f3ef",color:a.status==="completed"?"#085041":"#888"}}>{a.status}</span></div>{a.action_description&&<div style={{fontSize:11,color:"#5f5e5a",marginBottom:4}}>{a.action_description}</div>}<div style={{display:"flex",gap:8,fontSize:10,color:"#888"}}>{a.action_owner&&<span>Owner: {a.action_owner}</span>}{a.due_date&&<span>Due: {a.due_date}</span>}</div></div>)}</div>}
          {tab==="decisions"&&<div>{decisions.length===0?<div style={{textAlign:"center",padding:32,color:"#999",fontSize:13}}>No decisions recorded yet</div>:decisions.map(d=><div key={d.id} style={{marginBottom:10,padding:"12px 14px",background:"#f8f7f4",borderRadius:8,borderLeft:"3px solid #D85A30"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:12,fontWeight:600,color:"#2c2c2a"}}>{d.decision_title}</span><span style={{fontSize:9,color:"#888"}}>{d.decision_date}</span></div>{d.decision_type&&<span style={{fontSize:9,padding:"1px 6px",borderRadius:99,background:"#FAECE7",color:"#712B13",marginBottom:6,display:"inline-block"}}>{d.decision_type}</span>}{d.rationale&&<div style={{fontSize:11,color:"#5f5e5a",lineHeight:1.6,marginTop:4}}>{d.rationale}</div>}{d.made_by&&<div style={{fontSize:10,color:"#888",marginTop:4}}>Decision by: {d.made_by}</div>}</div>)}</div>}
        </div>
      </div>
    </>}
  </div>;
}

/* ── Publications View ── */
function PublicationsView({publications}){
  const[selectedCat,setSelectedCat]=useState(null);const[search,setSearch]=useState("");const[page,setPage]=useState(0);const[expanded,setExpanded]=useState(null);const PAGE_SIZE=30;
  const CAT_META={Phytochemistry:{icon:"⚗️",color:"#534AB7",bg:"#EEEDFE",desc:"Metabolites, compounds, chemical analysis"},Conservation:{icon:"🛡",color:"#A32D2D",bg:"#FCEBEB",desc:"Threatened species, habitat, population"},Agronomy:{icon:"🌾",color:"#639922",bg:"#EAF3DE",desc:"Cultivation, yield, crop production"},Pharmacology:{icon:"💊",color:"#185FA5",bg:"#E6F1FB",desc:"Medical activity, therapeutic, clinical"},Taxonomy:{icon:"🔬",color:"#854F0B",bg:"#FAEEDA",desc:"Systematics, phylogeny, classification"},Ecology:{icon:"🌍",color:"#0F6E56",bg:"#E1F5EE",desc:"Distribution, habitat, occurrence"},Biotechnology:{icon:"🧬",color:"#993556",bg:"#FBEAF0",desc:"Tissue culture, in vitro, genetic"},Other:{icon:"📄",color:"#888780",bg:"#F1EFE8",desc:"Other topics"}};
  const CATS=Object.keys(CAT_META);const catCounts={};for(const cat of CATS)catCounts[cat]=publications.filter(p=>p.category===cat).length;
  const catPubs=selectedCat?publications.filter(p=>p.category===selectedCat&&(!search||(p.title||"").toLowerCase().includes(search.toLowerCase())||(p.authors||"").toLowerCase().includes(search.toLowerCase()))):[];
  const totalPages=Math.ceil(catPubs.length/PAGE_SIZE);const paginated=catPubs.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE);const uncategorized=publications.filter(p=>!p.category).length;
  return<div>
    {!selectedCat?<>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}><div><div style={{fontSize:16,fontWeight:700,color:"#2c2c2a",fontFamily:"Georgia,serif"}}>Publications</div><div style={{fontSize:11,color:"#888",marginTop:2}}>{publications.length} publications · {CATS.length} categories</div></div><div style={{display:"flex",gap:6}}>{[{l:"Total",v:publications.length,c:"#185FA5"},{l:"Open Access",v:publications.filter(p=>p.open_access).length,c:"#0F6E56"},{l:"With Abstract",v:publications.filter(p=>p.abstract).length,c:"#534AB7"}].map(s=><div key={s.l} style={{textAlign:"center",padding:"5px 10px",background:"#f4f3ef",borderRadius:8}}><div style={{fontSize:14,fontWeight:700,color:s.c}}>{s.v}</div><div style={{fontSize:9,color:"#999"}}>{s.l}</div></div>)}</div></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}}>{CATS.map(cat=>{const m=CAT_META[cat];const count=catCounts[cat]||0;const topPubs=publications.filter(p=>p.category===cat).slice(0,3);return<div key={cat} onClick={()=>{setSelectedCat(cat);setPage(0);setSearch("");}} style={{background:"#fff",border:"1px solid #e8e6e1",borderRadius:12,overflow:"hidden",cursor:"pointer",transition:"all 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=m.color;e.currentTarget.style.transform="translateY(-2px)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="#e8e6e1";e.currentTarget.style.transform="translateY(0)"}}><div style={{background:m.bg,padding:"14px 14px 10px",borderBottom:`1px solid ${m.color}22`}}><div style={{fontSize:24,marginBottom:6}}>{m.icon}</div><div style={{fontSize:13,fontWeight:700,color:m.color}}>{cat}</div><div style={{fontSize:10,color:"#888",marginTop:2}}>{m.desc}</div></div><div style={{padding:"10px 14px"}}><div style={{fontSize:20,fontWeight:700,color:"#2c2c2a",marginBottom:6}}>{count}</div><div style={{display:"flex",flexDirection:"column",gap:2}}>{topPubs.map(p=><div key={p.id} style={{fontSize:9,color:"#b4b2a9",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{(p.title||"").slice(0,45)}</div>)}</div></div></div>;})}
      </div>
      {uncategorized>0&&<div style={{marginTop:12,padding:"8px 12px",background:"#FAEEDA",borderRadius:8,fontSize:11,color:"#633806"}}>⚠ {uncategorized} publications not yet categorized</div>}
    </>:<>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}><button onClick={()=>{setSelectedCat(null);setSearch("");}} style={{padding:"6px 12px",border:"1px solid #e8e6e1",borderRadius:7,background:"#fff",cursor:"pointer",fontSize:11,color:"#888"}}>← Categories</button><div style={{flex:1,display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:20}}>{CAT_META[selectedCat]?.icon}</span><div><div style={{fontSize:15,fontWeight:700,color:CAT_META[selectedCat]?.color}}>{selectedCat}</div><div style={{fontSize:11,color:"#888"}}>{catPubs.length} publications</div></div></div></div>
      <input type="text" placeholder="Search title or author..." value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}} style={{width:"100%",marginBottom:12,...S.input}}/>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>{paginated.map(p=><div key={p.id} onClick={()=>setExpanded(expanded===p.id?null:p.id)} style={{background:"#fff",border:expanded===p.id?"1px solid #85B7EB":"1px solid #e8e6e1",borderRadius:8,padding:"10px 12px",cursor:"pointer",borderLeft:`3px solid ${CAT_META[selectedCat]?.color||"#888"}`}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}><div style={{flex:1}}><div style={{fontSize:12,fontWeight:600,color:"#2c2c2a",lineHeight:1.4}}>{p.doi?<a href={p.doi} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{color:"#185FA5",textDecoration:"none"}}>{(p.title||"Untitled").slice(0,120)}</a>:(p.title||"Untitled").slice(0,120)}</div><div style={{fontSize:10,color:"#888",marginTop:3}}>{(p.authors||"").slice(0,80)}</div></div><div style={{display:"flex",flexDirection:"column",gap:3,alignItems:"flex-end",flexShrink:0}}>{p.year&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:99,background:"#E6F1FB",color:"#0C447C"}}>{p.year}</span>}{p.open_access&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:99,background:"#E1F5EE",color:"#085041"}}>OA</span>}</div></div>{p.journal&&<div style={{fontSize:10,color:"#b4b2a9",marginTop:4,fontStyle:"italic"}}>{p.journal.slice(0,60)}</div>}{expanded===p.id&&<div style={{marginTop:10,paddingTop:10,borderTop:"1px solid #e8e6e1"}}>{p.abstract?<div style={{fontSize:11,color:"#5f5e5a",lineHeight:1.6}}>{p.abstract.slice(0,500)}</div>:<div style={{fontSize:11,color:"#b4b2a9",fontStyle:"italic"}}>No abstract — {p.doi?<a href={p.doi} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{color:"#185FA5"}}>view paper ↗</a>:"no DOI"}</div>}</div>}</div>)}</div>
      {totalPages>1&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginTop:16}}><button onClick={()=>setPage(0)} disabled={page===0} style={{...S.input,padding:"5px 10px",cursor:page===0?"default":"pointer",opacity:page===0?0.4:1}}>«</button><button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0} style={{...S.input,padding:"5px 10px",cursor:page===0?"default":"pointer",opacity:page===0?0.4:1}}>‹</button><span style={{fontSize:12,color:"#888",minWidth:100,textAlign:"center"}}>Page {page+1} / {totalPages}</span><button onClick={()=>setPage(p=>Math.min(totalPages-1,p+1))} disabled={page===totalPages-1} style={{...S.input,padding:"5px 10px",cursor:page===totalPages-1?"default":"pointer",opacity:page===totalPages-1?0.4:1}}>›</button><button onClick={()=>setPage(totalPages-1)} disabled={page===totalPages-1} style={{...S.input,padding:"5px 10px",cursor:page===totalPages-1?"default":"pointer",opacity:page===totalPages-1?0.4:1}}>»</button></div>}
    </>}
  </div>;
}

/* ── Other views (Market, Researchers, Partners, Sources, Portfolio, Admin) ── */
function MarketView({markets}){const[expanded,setExpanded]=useState(null);return<div><div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>{[{l:"Hypotheses",v:markets.length},{l:"Spin-offs",v:[...new Set(markets.map(m=>m.spinoff_link))].length}].map(s=><div key={s.l} style={{flex:"1 1 110px",...S.metric}}><div style={S.mLabel}>{s.l}</div><div style={S.mVal()}>{s.v}</div></div>)}</div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:10}}>{markets.map(m=><div key={m.id} onClick={()=>setExpanded(expanded===m.id?null:m.id)} style={{...S.card,padding:16,cursor:"pointer"}}><div style={{fontSize:14,fontWeight:600,color:"#2c2c2a",marginBottom:4}}>{m.application_area}</div><div style={{fontSize:10,fontStyle:"italic",color:"#888"}}>{m.species?.accepted_name||"—"} — {m.market_segment}</div></div>)}</div></div>;}
function ResearchersView({researchers}){const[search,setSearch]=useState("");const[expanded,setExpanded]=useState(null);const filtered=researchers.filter(r=>{if(!search)return true;const s=search.toLowerCase();return(r.name||"").toLowerCase().includes(s)||(r.expertise_area||"").toLowerCase().includes(s)||(r.country||"").toLowerCase().includes(s)});const sorted=[...filtered].sort((a,b)=>(b.h_index||0)-(a.h_index||0));return<div><input type="text" placeholder="Search name, expertise, or country..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:"100%",marginBottom:12,...S.input}}/><p style={S.sub}>{sorted.length} researchers · Sorted by h-index</p><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:8}}>{sorted.slice(0,60).map(r=><div key={r.id} onClick={()=>setExpanded(expanded===r.id?null:r.id)} style={{...S.card,padding:14,cursor:"pointer",border:expanded===r.id?"2px solid #85B7EB":"1px solid #e8e6e1"}}><div style={{fontSize:13,fontWeight:600,color:"#2c2c2a"}}>{r.name}</div><div style={{fontSize:10,color:"#888"}}>{(r.expertise_area||"").slice(0,60)}</div><div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:4}}>{r.country&&<Pill color="#0C447C" bg="#E6F1FB">{r.country}</Pill>}{r.h_index&&<Pill color="#3C3489" bg="#EEEDFE">h:{r.h_index}</Pill>}</div></div>)}</div></div>;}
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
      .select("id,species_id,title,authors,doi,year,journal,open_access,primary_topic,relevance_score,cited_by_count,source,abstract,pubmed_id,openalex_id,category,species(accepted_name)")
      .order("year", { ascending:false }).range(from, from+pageSize-1);
    if (error || !data || data.length === 0) break;
    allPubs = [...allPubs, ...data];
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return allPubs;
}

/* ════════════════════════════════════════════════════════
   MAIN APP — ORCHESTRATION ONLY
════════════════════════════════════════════════════════ */
export default function Home() {
  const [user,             setUser]             = useState(null);
  const [view,             setView]             = useState("home");
  const [exp,              setExp]              = useState(null);
  const [side,             setSide]             = useState(true);
  const [loading,          setLoading]          = useState(true);
  const [dbOk,             setDbOk]             = useState(false);
  const [species,          setSpecies]          = useState([]);
  const [metabolites,      setMetabolites]      = useState([]);
  const [markets,          setMarkets]          = useState([]);
  const [institutions,     setInstitutions]     = useState([]);
  const [sources,          setSources]          = useState([]);
  const [publications,     setPublications]     = useState([]);
  const [researchers,      setResearchers]      = useState([]);
  const [programs,         setPrograms]         = useState([]);
  const [detailSpecies,    setDetailSpecies]    = useState(null);
  const [startProgramSp,   setStartProgramSp]   = useState(null);

  useEffect(() => {
    async function loadAll() {
      try {
        const [sp,mt,mk,inst,src,res,prog] = await Promise.all([
          supabase.from("species").select("*").order("composite_score",{ascending:false}),
          supabase.from("metabolites").select("*, species(accepted_name)"),
          supabase.from("market_intelligence").select("*, species(accepted_name)"),
          supabase.from("institutions").select("*").order("priority"),
          supabase.from("data_sources").select("*").order("freshness_score",{ascending:false}),
          supabase.from("researchers").select("*").order("h_index",{ascending:false,nullsFirst:false}),
          supabase.from("programs").select("*, species(accepted_name,iucn_status,thumbnail_url)").order("priority_score",{ascending:false}),
        ]);
        const pub = await fetchAllPublications();
        if (sp.data)   setSpecies(sp.data);
        if (mt.data)   setMetabolites(mt.data);
        if (mk.data)   setMarkets(mk.data);
        if (inst.data) setInstitutions(inst.data);
        if (src.data)  setSources(src.data);
        if (res.data)  setResearchers(res.data);
        if (prog.data) setPrograms(prog.data);
        setPublications(pub);
        setDbOk(true);
      } catch (e) {
        setDbOk(false);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  if (!user)    return <LoginScreen onLogin={setUser} />;
  if (loading)  return <Loading />;

  const role      = ROLES[user.role];
  const threatened = species.filter(s => ["CR","EN","VU"].includes(s.iucn_status)).length;

  const navItems = [
    { key:"home",        label:"Home",        icon:"🏠" },
    { key:"programs",    label:"Programs",    icon:"📋" },
    { key:"species",     label:"Species",     icon:"🌿" },
    { key:"metabolites", label:"Metabolites", icon:"🧪" },
    { key:"market",      label:"Market",      icon:"💰" },
    { key:"publications",label:"Publications",icon:"📚" },
    { key:"researchers", label:"Researchers", icon:"👨‍🔬" },
    { key:"partners",    label:"Institutions",icon:"🏛" },
    { key:"portfolio",   label:"Portfolio",   icon:"📊" },
    { key:"sources",     label:"Sources",     icon:"🔗" },
    ...(user.role === "admin" ? [{ key:"admin", label:"Admin", icon:"⚙️" }] : []),
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
            <div><strong style={{ color:"#2c2c2a" }}>{publications.length}</strong> pubs · <strong style={{ color:"#2c2c2a" }}>{metabolites.length}</strong> cpds</div>
          </div>
        </div>
        <div style={{ padding:14, borderTop:"1px solid #e8e6e1" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
            <div style={{ width:26, height:26, borderRadius:6, background:role.color, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ color:"#fff", fontSize:10, fontWeight:600 }}>{role.ic}</span>
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:"#2c2c2a" }}>{user.name}</div>
              <div style={{ fontSize:8, color:"#b4b2a9" }}>{role.label}</div>
            </div>
          </div>
          <a href="/upload-admin" style={{ display:"block", textAlign:"center", padding:"6px 0", fontSize:9, color:"#1D9E75", textDecoration:"none", border:"1px solid #1D9E75", borderRadius:6, marginBottom:6, fontWeight:600 }}>📊 Excel Upload</a>
          <button onClick={() => { setUser(null); setView("home"); }} style={{ width:"100%", padding:"5px 0", fontSize:9, color:"#888", background:"none", border:"1px solid #e8e6e1", borderRadius:6, cursor:"pointer" }}>Logout</button>
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ flex:1, minWidth:0, padding:"16px 20px 28px", overflow:"auto" }}>
        <button onClick={() => setSide(!side)} style={{ fontSize:16, background:"none", border:"none", cursor:"pointer", color:"#888", marginBottom:10, padding:0 }}>
          {side?"◀":"▶"}
        </button>

        {/* Top metrics bar */}
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

        {/* ── View routing ── */}
        {view === "home"         && <GEOCONHome species={species} publications={publications} metabolites={metabolites} researchers={researchers} programs={programs} user={user} setView={setView} onSpeciesClick={setDetailSpecies} onStartProgram={sp=>{setStartProgramSp(sp);}} />}
        {view === "programs"     && <ProgramsView species={species} user={user} />}
        {view === "species"      && <SpeciesModule species={species} exp={exp} setExp={setExp} onSpeciesClick={setDetailSpecies} />}
        {view === "metabolites"  && <MetaboliteExplorer metabolites={metabolites} />}
        {view === "market"       && <MarketView markets={markets} />}
        {view === "publications" && <PublicationsView publications={publications} />}
        {view === "researchers"  && <ResearchersView researchers={researchers} />}
        {view === "communities" && <CommunitiesView species={species} researchers={researchers} />}
        {view === "partners"     && <PartnerView institutions={institutions} />}
        {view === "portfolio"    && <PortfolioView species={species} />}
        {view === "sources"      && <SourcesPanel sources={sources} />}
        {view === "admin" && user.role === "admin" && <AdminPanel species={species} programs={programs} onDataChange={() => window.location.reload()} />}

        <div style={{ marginTop:32, paddingTop:10, borderTop:"1px solid #e8e6e1", display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:4, fontSize:8, color:"#b4b2a9" }}>
          <span>GEOCON ATLAS v3.0 · {species.length} species · {programs.length} programs · {publications.length} pubs</span>
          <span>Venn BioVentures OÜ</span>
        </div>
      </div>

      {/* ── Overlays ── */}
      {detailSpecies && (
        <SpeciesDetailPanel
          species={detailSpecies}
          onClose={() => setDetailSpecies(null)}
          onStartProgram={sp => { setStartProgramSp(sp); setDetailSpecies(null); }}
        />
      )}
      {startProgramSp && (
        <StartProgramModal
          species={startProgramSp}
          onClose={() => setStartProgramSp(null)}
          onSuccess={() => { setStartProgramSp(null); window.location.reload(); }}
        />
      )}
    </div>
  );
}
