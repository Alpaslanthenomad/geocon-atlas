"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { FAMILY_COLORS, DEF_FAM } from "../../lib/constants";
import { iucnC, iucnBg, flag, decC, decBg, riskColor, riskBg } from "../../lib/helpers";

export default function SpeciesDetailPanel({species,programs,metabolitePublications=[],onClose,onStartProgram,onOpenProgram,onOpenResearcher,breadcrumbBack}){
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

      <div style={{background:"linear-gradient(150deg,#0a4a3e 0%,#1a8a68 65%,#3eaf85 100%)",flexShrink:0}}>
        <div style={{padding:"16px 24px 0"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
            <button onClick={onClose} style={{background:"rgba(255,255,255,0.15)",border:"none",borderRadius:6,padding:"5px 12px",color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer"}}>{breadcrumbBack?`← ${breadcrumbBack}`:"← Back"}</button>
            <span style={{fontSize:11,color:"rgba(255,255,255,0.6)"}}>{species.family} › {species.genus} › {species.accepted_name}</span>
          </div>
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
            <div style={{display:"flex",gap:6,flexShrink:0}}>
              {[{l:"Conservation",v:species.score_conservation},{l:"Scientific",v:species.score_scientific},{l:"Economic",v:species.score_venture},{l:"Feasibility",v:species.score_feasibility}].map(({l,v})=><div key={l} style={{background:"rgba(255,255,255,0.08)",borderRadius:8,padding:"10px 12px",textAlign:"center",border:"1px solid rgba(255,255,255,0.14)",minWidth:78}}>
                <div style={{fontSize:28,fontWeight:600,color:v?"#fff":"rgba(255,255,255,0.35)",fontFamily:'ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace',lineHeight:1,letterSpacing:-0.5}}>{v||"—"}</div>
                <div style={{fontSize:9,color:"rgba(255,255,255,0.65)",marginTop:6,textTransform:"uppercase",letterSpacing:0.6,fontWeight:600}}>{l}</div>
              </div>)}
            </div>
          </div>
          <div style={{display:"flex",overflowX:"auto",gap:2}}>
            {TABS.map(t=><button key={t.k} onClick={()=>setTab(t.k)} style={{flexShrink:0,padding:"10px 18px",border:"none",borderBottom:tab===t.k?"2px solid #fff":"2px solid transparent",background:"none",cursor:"pointer",fontSize:13,fontWeight:tab===t.k?600:400,color:tab===t.k?"#fff":"rgba(255,255,255,0.55)",whiteSpace:"nowrap",letterSpacing:0.2}}>{t.l}</button>)}
          </div>
        </div>
      </div>

      <div style={{flex:1,display:"grid",gridTemplateColumns:"220px 1fr",overflow:"hidden"}}>

        <div style={{borderRight:"1px solid #e8e6e1",padding:"16px",background:"#fff",overflowY:"auto"}}>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:9,color:"#b4b2a9",textTransform:"uppercase",letterSpacing:0.6,fontWeight:600,marginBottom:8}}>Species info</div>
            {[{l:"Genus",v:species.genus},{l:"Family",v:species.family},{l:"Type",v:species.geophyte_type},{l:"Region",v:species.region},{l:"Country",v:species.country_focus},{l:"Habitat",v:species.habitat},{l:"TC status",v:species.tc_status},{l:"Market",v:species.market_area}].map(({l,v})=>v?<div key={l} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"0.5px solid #f4f3ef",fontSize:11}}>
              <span style={{color:"#888"}}>{l}</span>
              <span style={{fontWeight:500,color:"#2c2c2a",textAlign:"right",maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={v}>{v}</span>
            </div>:null)}
          </div>
          <div style={{marginBottom:14,paddingTop:12,borderTop:"0.5px solid #e8e6e1"}}>
            <div style={{fontSize:9,color:"#b4b2a9",textTransform:"uppercase",letterSpacing:0.6,fontWeight:600,marginBottom:8}}>Data trust</div>
            {[{l:"Confidence",v:species.confidence?`${species.confidence}%`:null,colored:true},{l:"Last verified",v:species.last_verified},{l:"Module",v:species.geocon_module}].map(({l,v,colored})=>v?<div key={l} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"0.5px solid #f4f3ef",fontSize:11}}>
              <span style={{color:"#888"}}>{l}</span>
              <span style={{fontWeight:500,color:colored?"#1D9E75":"#2c2c2a"}}>{v}</span>
            </div>:null)}
          </div>
          <div style={{paddingTop:12,borderTop:"0.5px solid #e8e6e1"}}>
            <div style={{fontSize:9,color:"#b4b2a9",textTransform:"uppercase",letterSpacing:0.6,fontWeight:600,marginBottom:8}}>Linked data</div>
            {[{l:"Publications",v:pubs.length,c:"#185FA5"},{l:"Metabolites",v:mets.length,c:"#534AB7"},{l:"Locations",v:locs.length,c:"#1D9E75"},{l:"Propagation",v:prop.length,c:"#639922"},{l:"Commercial",v:comm.length,c:"#D85A30"}].map(({l,v,c})=><div key={l} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"0.5px solid #f4f3ef",fontSize:11}}>
              <span style={{color:"#888"}}>{l}</span>
              <span style={{fontWeight:600,color:v>0?c:"#b4b2a9"}}>{v}</span>
            </div>)}
          </div>
        </div>

        <div style={{overflowY:"auto",padding:"20px 24px",background:"#f8f7f4"}}>
          {loading?<div style={{textAlign:"center",padding:60,color:"#999",fontSize:13}}>Loading...</div>:<>

            {tab==="decision"&&(()=>{
              const gaps = [
                {key:"propagation",label:"Propagation Protocol",status:prop.length===0?"missing":prop.some(p=>p.success_rate>=70)?"ok":"weak",icon:prop.length===0?"❌":prop.some(p=>p.success_rate>=70)?"✅":"⚠️",detail:prop.length===0?"Missing":prop.some(p=>p.success_rate>=70)?"Available":"Partial",color:prop.length===0?"#A32D2D":prop.some(p=>p.success_rate>=70)?"#1D9E75":"#BA7517"},
                {key:"metabolite",label:"Metabolite Evidence",status:mets.length===0?"missing":mets.length<5?"weak":"ok",icon:mets.length===0?"❌":mets.length<5?"⚠️":"✅",detail:mets.length===0?"Missing":mets.length<5?"Partial":"Available",color:mets.length===0?"#A32D2D":mets.length<5?"#BA7517":"#1D9E75"},
                {key:"field_data",label:"Field Data",status:locs.length===0?"missing":"ok",icon:locs.length===0?"❌":"✅",detail:locs.length===0?"Missing":"Available",color:locs.length===0?"#A32D2D":"#1D9E75"},
                {key:"commercial",label:"Commercial Hypothesis",status:comm.length===0?"missing":"ok",icon:comm.length===0?"⚠️":"✅",detail:comm.length===0?"Emerging":"Available",color:comm.length===0?"#BA7517":"#1D9E75"},
                {key:"governance",label:"Governance Readiness",status:!gov?"missing":(gov.abs_nagoya_risk==="high"||gov.collection_sensitivity==="high")?"blocked":"ok",icon:!gov?"❓":(gov.abs_nagoya_risk==="high"||gov.collection_sensitivity==="high")?"❌":"✅",detail:!gov?"Unknown":(gov.abs_nagoya_risk==="high"||gov.collection_sensitivity==="high")?"Blocked":"Available",color:!gov?"#888":(gov.abs_nagoya_risk==="high"||gov.collection_sensitivity==="high")?"#A32D2D":"#1D9E75"},
              ];
              const actionList = [];
              if (species.next_action) actionList.push(species.next_action);
              gaps.filter(g=>g.status==="missing"||g.status==="critical"||g.status==="blocked").slice(0,3).forEach(g=>{
                const action = {propagation:"Initiate propagation feasibility trial — explore in vitro / seed-based methods",metabolite:"Validate metabolite presence — phytochemical screening + literature review",field_data:"Collect field samples — GPS coordinates, habitat data, population estimates",commercial:"Define commercial hypothesis — market segment, value chain, target product",governance:"Resolve ABS/Nagoya governance — partner agreements, collection permits"}[g.key];
                if (action && !actionList.includes(action)) actionList.push(action);
              });
              if (actionList.length === 0 && species.recommended_pathway) actionList.push(species.recommended_pathway);
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
              const linkedProgram = (programs||[]).find(p => p.species_id === species.id);
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
                <div style={{padding:"12px 16px",background:"#fcfbf9",borderRadius:10,border:"1px solid #e8e6e1",borderLeft:"3px solid #888"}}>
                  <div style={{fontSize:11,color:"#5f5e5a",lineHeight:1.5}}>
                    <strong style={{color:"#2c2c2a"}}>This species is an input.</strong> Execution happens through programs.
                  </div>
                </div>

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

                <div style={{background:"#fff",borderRadius:14,border:"1px solid #e8e6e1",padding:"14px 18px"}}>
                  <div style={{fontSize:10,color:"#888",textTransform:"uppercase",letterSpacing:1,fontWeight:700,marginBottom:8}}>Why this species matters</div>
                  <div style={{padding:"10px 14px",background:"#f8f7f4",borderRadius:10,borderLeft:"3px solid #1D9E75"}}>
                    <div style={{fontSize:13,color:"#2c2c2a",lineHeight:1.6,fontWeight:500}}>→ {whySummary}</div>
                  </div>
                </div>

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

                <div style={{background:"#fff",borderRadius:14,border:"1px solid #e8e6e1",padding:"16px 18px"}}>
                  <div style={{fontSize:10,color:"#888",textTransform:"uppercase",letterSpacing:1,fontWeight:700,marginBottom:12}}>Key insights</div>
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {insights.slice(0,4).map((ins,i)=><div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",padding:"8px 0"}}>
                      <span style={{fontSize:12,color:"#888",flexShrink:0,fontWeight:700}}>—</span>
                      <span style={{fontSize:12,color:"#2c2c2a",lineHeight:1.5}}>{ins}</span>
                    </div>)}
                  </div>
                </div>

                <div style={{padding:"12px 16px",background:"#f8f7f4",borderRadius:10,border:"1px solid #e8e6e1",fontSize:11,color:"#888",textAlign:"center"}}>
                  Supporting knowledge available in tabs above: <strong style={{color:"#5f5e5a"}}>Story · Publications ({pubs.length}) · Metabolites ({mets.length}) · Conservation · Governance · Propagation · Commercial · Details</strong>
                </div>
              </div>;
            })()}

            {tab==="story"&&<div style={{display:"flex",flexDirection:"column",gap:12}}>
              {!story?<div style={{textAlign:"center",padding:60,background:"#fff",borderRadius:14,border:"1px solid #e8e6e1"}}>
                <div style={{fontSize:32,marginBottom:12}}>📖</div>
                <div style={{fontSize:14,fontWeight:600,color:"#2c2c2a",marginBottom:8}}>No story yet</div>
                <div style={{fontSize:12,color:"#888",lineHeight:1.6}}>An admin needs to generate the GEOCON story for this species.</div>
              </div>:<>
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

            {tab==="pubs"&&<div>{pubs.length===0?<div style={{textAlign:"center",padding:40,color:"#999",fontSize:13,background:"#fff",borderRadius:12,border:"1px solid #e8e6e1"}}>No publications found</div>:<div style={{display:"flex",flexDirection:"column",gap:8}}>{pubs.map(p=><div key={p.id} style={{padding:"12px 14px",background:"#fff",borderRadius:10,border:"1px solid #e8e6e1",borderLeft:"3px solid #378ADD"}}><div style={{fontSize:12,fontWeight:600,color:"#2c2c2a",lineHeight:1.4,marginBottom:4}}>{p.doi?<a href={p.doi} target="_blank" rel="noopener noreferrer" style={{color:"#185FA5",textDecoration:"none"}}>{(p.title||"").slice(0,120)}{(p.title||"").length>120?"...":""}</a>:(p.title||"").slice(0,120)}</div><div style={{fontSize:10,color:"#888",marginBottom:6}}>{(p.authors||"").slice(0,80)}{(p.authors||"").length>80?"...":""}</div><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{p.year&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:99,background:"#E6F1FB",color:"#0C447C"}}>{p.year}</span>}{p.journal&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:99,background:"#EEEDFE",color:"#3C3489"}}>{p.journal.slice(0,30)}</span>}{p.open_access&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:99,background:"#E1F5EE",color:"#085041"}}>OA</span>}</div>{p.abstract&&<div style={{fontSize:10,color:"#5f5e5a",marginTop:6,lineHeight:1.5}}>{p.abstract.slice(0,250)}...</div>}</div>)}</div>}</div>}

            {tab==="mets"&&(()=>{
              if(mets.length===0)return<div style={{textAlign:"center",padding:40,color:"#999",fontSize:13,background:"#fff",borderRadius:12,border:"1px solid #e8e6e1"}}>No metabolites yet</div>;
              const linksByMet={};
              for(const link of metabolitePublications){
                if(!linksByMet[link.metabolite_id])linksByMet[link.metabolite_id]=[];
                linksByMet[link.metabolite_id].push(link);
              }
              const classCounts={};
              for(const m of mets){const c=m.compound_class||"Unidentified";classCounts[c]=(classCounts[c]||0)+1;}
              const classOrder=Object.entries(classCounts).sort((a,b)=>b[1]-a[1]);
              const classColor=(c)=>({"Alkaloid":"#534AB7","Flavonoid":"#BA7517","Phenolic acid":"#854F0B","Phytohormone":"#0F6E56","Saponin/Glycoside":"#993556","Carotenoid":"#D85A30","Stilbene":"#A32D2D","Fatty acid":"#185FA5","Amino acid":"#185FA5","Tuliposide":"#3C3489","Steroid":"#639922","Unidentified":"#b4b2a9"}[c]||"#888780");
              return<div>
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

            {tab==="cons"&&<div>{cons.length===0?<div style={{textAlign:"center",padding:40,color:"#999",fontSize:13,background:"#fff",borderRadius:12,border:"1px solid #e8e6e1"}}>No conservation assessments yet</div>:cons.map(a=><div key={a.id} style={{marginBottom:10,padding:"14px 16px",background:"#fff",borderRadius:10,border:"1px solid #e8e6e1",borderLeft:"3px solid #E24B4A"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}><div style={{fontSize:13,fontWeight:600,color:"#2c2c2a"}}>{a.source}</div>{a.status_interpreted&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:99,background:iucnBg(a.status_interpreted),color:iucnC(a.status_interpreted)}}>{a.status_interpreted}</span>}</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px 12px",fontSize:11}}>{a.assessment_year&&<div><span style={{color:"#b4b2a9",fontSize:9,textTransform:"uppercase"}}>Year</span><div style={{color:"#2c2c2a",fontWeight:500}}>{a.assessment_year}</div></div>}{a.trend&&<div><span style={{color:"#b4b2a9",fontSize:9,textTransform:"uppercase"}}>Trend</span><div style={{color:"#2c2c2a",fontWeight:500}}>{a.trend}</div></div>}</div>{a.notes&&<div style={{fontSize:11,color:"#5f5e5a",marginTop:8,lineHeight:1.5}}>{a.notes}</div>}</div>)}</div>}

            {tab==="gov"&&<div>{!gov?<div style={{textAlign:"center",padding:40,color:"#999",fontSize:13,background:"#fff",borderRadius:12,border:"1px solid #e8e6e1"}}>No governance data yet</div>:<div style={{display:"flex",flexDirection:"column",gap:10}}><div style={{padding:"16px",background:"#fff",borderRadius:10,border:"1px solid #e8e6e1",borderLeft:"3px solid #D85A30"}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px 16px"}}>{[{l:"Access regime",v:gov.access_regime},{l:"ABS/Nagoya risk",v:gov.abs_nagoya_risk,colored:true},{l:"Collection sensitivity",v:gov.collection_sensitivity,colored:true},{l:"Public visibility",v:gov.public_visibility_level}].map(({l,v,colored})=>v?<div key={l}><div style={{fontSize:9,color:"#b4b2a9",textTransform:"uppercase",letterSpacing:0.4,marginBottom:3}}>{l}</div>{colored?<span style={{fontSize:11,padding:"2px 8px",borderRadius:99,background:riskBg(v),color:riskColor(v),fontWeight:600}}>{v}</span>:<div style={{fontSize:12,color:"#2c2c2a",fontWeight:500}}>{v}</div>}</div>:null)}</div></div>{gov.notes&&<div style={{padding:"12px 14px",background:"#fff",borderRadius:10,border:"1px solid #e8e6e1",fontSize:11,color:"#5f5e5a",lineHeight:1.6}}>{gov.notes}</div>}</div>}</div>}

            {tab==="prop"&&<div>{prop.length===0?<div style={{textAlign:"center",padding:40,color:"#999",fontSize:13,background:"#fff",borderRadius:12,border:"1px solid #e8e6e1"}}>No propagation protocols yet</div>:prop.map(p=><div key={p.id} style={{marginBottom:10,padding:"14px 16px",background:"#fff",borderRadius:10,border:"1px solid #e8e6e1",borderLeft:"3px solid #1D9E75"}}><div style={{fontSize:13,fontWeight:600,color:"#2c2c2a",marginBottom:10}}>{p.protocol_type}</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px 16px",fontSize:11}}>{p.explant&&<div><span style={{color:"#b4b2a9",fontSize:9,textTransform:"uppercase"}}>Explant</span><div style={{color:"#2c2c2a",fontWeight:500}}>{p.explant}</div></div>}{p.medium_or_condition&&<div><span style={{color:"#b4b2a9",fontSize:9,textTransform:"uppercase"}}>Medium</span><div style={{color:"#2c2c2a",fontWeight:500}}>{p.medium_or_condition}</div></div>}{p.success_rate&&<div><span style={{color:"#b4b2a9",fontSize:9,textTransform:"uppercase"}}>Success rate</span><div style={{color:"#1D9E75",fontWeight:700}}>{p.success_rate}%</div></div>}</div>{p.notes&&<div style={{fontSize:11,color:"#5f5e5a",marginTop:8,lineHeight:1.5}}>{p.notes}</div>}</div>)}</div>}

            {tab==="comm"&&<div>{comm.length===0?<div style={{textAlign:"center",padding:40,color:"#999",fontSize:13,background:"#fff",borderRadius:12,border:"1px solid #e8e6e1"}}>No commercial hypotheses yet</div>:comm.map(h=><div key={h.id} style={{marginBottom:10,padding:"14px 16px",background:"#fff",borderRadius:10,border:"1px solid #e8e6e1",borderLeft:"3px solid #185FA5"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}><div style={{fontSize:13,fontWeight:600,color:"#2c2c2a"}}>{h.application_area}</div>{h.status&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:99,background:h.status==="monitor"?"#FAEEDA":"#E1F5EE",color:h.status==="monitor"?"#633806":"#085041"}}>{h.status}</span>}</div>{h.justification&&<div style={{fontSize:11,color:"#5f5e5a",lineHeight:1.6}}>{h.justification}</div>}</div>)}</div>}

            {tab==="linked"&&(()=>{
              const researcherMap = new Map();
              pubs.forEach(p=>{
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

                <div style={{background:"#fff",borderRadius:12,border:"1px solid #e8e6e1",padding:"16px 18px"}}>
                  <div style={{fontSize:9,color:"#b4b2a9",textTransform:"uppercase",letterSpacing:0.6,fontWeight:600,marginBottom:12}}>Data sources</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:8}}>
                    {sourceCounts.map(({l,v,c})=><div key={l} style={{padding:"10px 12px",background:"#fcfbf9",borderRadius:8,border:"1px solid #f4f3ef"}}>
                      <div style={{fontSize:18,fontWeight:700,color:c,lineHeight:1}}>{v}</div>
                      <div style={{fontSize:10,color:"#888",marginTop:4,textTransform:"uppercase",letterSpacing:0.3}}>{l}</div>
                    </div>)}
                  </div>
                </div>

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
