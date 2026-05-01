"use client";
import { useState } from "react";
import { S, FAMILY_COLORS, DEF_FAM } from "../../lib/constants";
import { iucnC, iucnBg, flag } from "../../lib/helpers";

export default function SpeciesModule({species,programs,programSpecies,onSpeciesClick,onStartProgram,onOpenProgram}){
  const[selectedFamily,setSelectedFamily]=useState(null);
  const[selectedGenus,setSelectedGenus]=useState(null);
  const[search,setSearch]=useState("");
  const[fC,setFC]=useState("all");
  const[sortBy,setSortBy]=useState("score");
  const[filters,setFilters]=useState({opportunity:[], risk:[], program:[]});

  const speciesProgramsMap = (() => {
    const m = new Map();
    (programs||[]).forEach(p => {
      if (p.species_id) {
        if (!m.has(p.species_id)) m.set(p.species_id, new Set());
        m.get(p.species_id).add(p.id);
      }
    });
    (programSpecies||[]).forEach(ps => {
      if (!ps.species_id) return;
      if (!m.has(ps.species_id)) m.set(ps.species_id, new Set());
      m.get(ps.species_id).add(ps.program_id);
    });
    return m;
  })();
  const speciesHasProgram = (sp) => speciesProgramsMap.has(sp.id) && speciesProgramsMap.get(sp.id).size > 0;
  const speciesProgramIds = (sp) => Array.from(speciesProgramsMap.get(sp.id) || []);

  const FAMILY_ORDER=["Asparagaceae","Amaryllidaceae","Orchidaceae","Araceae","Liliaceae","Iridaceae","Ranunculaceae","Primulaceae","Colchicaceae","Gentianaceae","Paeoniaceae","Nymphaeaceae","Geraniaceae","Tecophilaeaceae","Alstroemeriaceae"];
  const families=[...new Set(species.map(s=>s.family).filter(Boolean))].sort((a,b)=>{const ai=FAMILY_ORDER.indexOf(a),bi=FAMILY_ORDER.indexOf(b);return(ai===-1?99:ai)-(bi===-1?99:bi);});
  const countries=[...new Set(species.map(s=>s.country_focus).filter(Boolean))];

  const familySpecies = selectedFamily ? species.filter(s=>s.family===selectedFamily) : [];
  const genera = [...new Set(familySpecies.map(s=>s.genus).filter(Boolean))].sort();
  const hasGenera = genera.length > 1;

  function applyFiltersAndSort(list){
    let result = [...list];
    if (filters.opportunity.includes("highEconomic"))    result = result.filter(sp => (sp.score_venture||0) >= 60);
    if (filters.opportunity.includes("highScientific"))  result = result.filter(sp => (sp.score_scientific||0) >= 60);
    if (filters.risk.includes("missingPropagation")) {
      result = result.filter(sp => {
        const tc = (sp.tc_status||"").toLowerCase();
        return !sp.tc_status || tc.includes("early") || tc.includes("missing") || tc.includes("none");
      });
    }
    if (filters.risk.includes("dataPoor"))               result = result.filter(sp => (sp.score_scientific||0) < 40);
    if (filters.program.includes("noProgram"))           result = result.filter(sp => !speciesHasProgram(sp));
    if (filters.program.includes("activeProgram"))       result = result.filter(sp => speciesHasProgram(sp));
    if (sortBy === "score")        result.sort((a,b) => (b.composite_score||0) - (a.composite_score||0));
    else if (sortBy === "scientific") result.sort((a,b) => (b.score_scientific||0) - (a.score_scientific||0));
    else if (sortBy === "economic")   result.sort((a,b) => (b.score_venture||0) - (a.score_venture||0));
    return result;
  }

  const baseList = selectedGenus
    ? species.filter(s=>s.genus===selectedGenus && (!search||(s.accepted_name||"").toLowerCase().includes(search.toLowerCase())) && (fC==="all"||s.country_focus===fC))
    : (!hasGenera && selectedFamily)
      ? species.filter(s=>s.family===selectedFamily && (!search||(s.accepted_name||"").toLowerCase().includes(search.toLowerCase())) && (fC==="all"||s.country_focus===fC))
      : [];
  const genusSpecies = applyFiltersAndSort(baseList);

  const toggleFilter = (group, value) => {
    setFilters(prev => ({...prev, [group]: prev[group].includes(value) ? prev[group].filter(v => v !== value) : [...prev[group], value]}));
  };
  const removeFilter = (group, value) => setFilters(prev => ({...prev, [group]: prev[group].filter(v => v !== value)}));
  const filterCount = filters.opportunity.length + filters.risk.length + filters.program.length;
  const FILTER_LABELS = {highEconomic:"High Economic",highScientific:"High Scientific",missingPropagation:"Missing Propagation",dataPoor:"Data Poor",noProgram:"No Program",activeProgram:"Active Program"};

  function FamilyCard({family}){
    const members=species.filter(s=>s.family===family);
    const familyProgramIds = new Set();
    members.forEach(m => speciesProgramIds(m).forEach(pid => familyProgramIds.add(pid)));
    const familyPrograms = (programs||[]).filter(p => familyProgramIds.has(p.id));
    const activePrograms = familyPrograms.filter(p => p.status === "Active");
    const withPhoto=members.find(s=>s.thumbnail_url);
    const c=FAMILY_COLORS[family]||DEF_FAM;
    const threatened=members.filter(s=>["CR","EN","VU"].includes(s.iucn_status)).length;
    return<div onClick={()=>{setSelectedFamily(family);setSelectedGenus(null);setSearch("");}} style={{background:"#fff",border:`1px solid ${selectedFamily===family?c.border:"#e8e6e1"}`,borderRadius:14,overflow:"hidden",cursor:"pointer",transition:"all 0.2s",position:"relative"}} onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"} onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
      {familyPrograms.length > 0 && (
        <div style={{position:"absolute",top:6,left:6,zIndex:2,fontSize:9,padding:"2px 7px",borderRadius:99,background:activePrograms.length>0?"rgba(13,110,86,0.92)":"rgba(60,60,60,0.85)",color:"#fff",fontWeight:700,display:"flex",alignItems:"center",gap:3,boxShadow:"0 1px 3px rgba(0,0,0,0.25)"}}>
          <span style={{fontSize:8}}>{activePrograms.length>0?"●":"○"}</span>
          {familyPrograms.length} program{familyPrograms.length>1?"s":""}
        </div>
      )}
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
    const genusProgramIds = new Set();
    members.forEach(m => speciesProgramIds(m).forEach(pid => genusProgramIds.add(pid)));
    const genusPrograms = (programs||[]).filter(p => genusProgramIds.has(p.id));
    const activePrograms = genusPrograms.filter(p => p.status === "Active");
    const withPhoto=members.find(s=>s.thumbnail_url);
    const c=FAMILY_COLORS[selectedFamily]||DEF_FAM;
    const threatened=members.filter(s=>["CR","EN","VU"].includes(s.iucn_status)).length;
    return<div onClick={()=>{setSelectedGenus(genus);setSearch("");}} style={{background:"#fff",border:`1px solid ${selectedGenus===genus?c.border:"#e8e6e1"}`,borderRadius:12,overflow:"hidden",cursor:"pointer",transition:"all 0.2s",position:"relative"}} onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"} onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
      {genusPrograms.length > 0 && (
        <div style={{position:"absolute",top:5,left:5,zIndex:2,fontSize:8,padding:"1px 6px",borderRadius:99,background:activePrograms.length>0?"rgba(13,110,86,0.92)":"rgba(60,60,60,0.85)",color:"#fff",fontWeight:700,display:"flex",alignItems:"center",gap:3,boxShadow:"0 1px 2px rgba(0,0,0,0.25)"}}>
          <span style={{fontSize:7}}>{activePrograms.length>0?"●":"○"}</span>
          {genusPrograms.length}
        </div>
      )}
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
    const linkedProgramIds = speciesProgramIds(sp);
    const linkedPrograms = (programs||[]).filter(p => linkedProgramIds.includes(p.id));
    const linkedProgram = linkedPrograms[0];

    const gaps = [];
    const tc = (sp.tc_status||"").toLowerCase();
    if (!sp.tc_status || tc.includes("early") || tc.includes("none") || tc.includes("missing")) gaps.push({key:"prop", concept:"propagation", label:"Propagation gap (likely)", icon:"❌"});
    else if (tc.includes("partial") || tc.includes("research")) gaps.push({key:"prop", concept:"propagation", label:"Propagation gap (partial)", icon:"⚠️"});
    if (!sp.score_scientific || sp.score_scientific < 40) gaps.push({key:"met", concept:"metabolite", label:"Metabolite gap (likely)", icon:"❌"});
    else if (sp.score_scientific < 60) gaps.push({key:"met", concept:"metabolite", label:"Metabolite gap (partial)", icon:"⚠️"});
    if (!sp.current_decision || sp.current_decision === "Hold" || sp.current_decision === "Block") gaps.push({key:"gov", concept:"governance", label:"Governance unclear", icon:"❓"});
    if (!sp.score_venture || sp.score_venture < 40) gaps.push({key:"com", concept:"commercial", label:"Commercial signal weak", icon:"⚠️"});
    const topGaps = gaps.slice(0, 3);

    const idStr = String(sp.id||sp.accepted_name||"");
    let h = 0; for (let i=0;i<idStr.length;i++) h = ((h<<5)-h+idStr.charCodeAt(i))|0;
    const rot = Math.abs(h);
    const pick = (arr) => arr[rot % arr.length];

    let sentence = "";
    if (sp.recommended_pathway) {
      const pathway = sp.recommended_pathway;
      const critGap = gaps.find(g=>g.icon==="❌");
      if (critGap) sentence = pick([`${pathway} candidate lacking a validated ${critGap.concept} protocol`,`${pathway} candidate constrained by ${critGap.concept} gap`,`${pathway} candidate — ${critGap.concept} protocol still missing`,`${pathway} candidate, ${critGap.concept} barrier unresolved`]);
      else if (gaps.length>0) sentence = pick([`${pathway} candidate with partial ${gaps[0].concept} evidence`,`${pathway} candidate, ${gaps[0].concept} evidence still incomplete`,`${pathway} candidate — ${gaps[0].concept} signal partially supported`]);
      else sentence = pick([`${pathway} candidate ready for program initiation`,`${pathway}-ready candidate, no major technical barriers`,`Strong ${pathway} candidate ready to advance`,`Viable ${pathway} candidate, ready for execution`]);
    } else if (gaps.find(g=>g.key==="prop" && g.icon==="❌")) sentence = pick(["Promising candidate without a validated propagation protocol","Promising species, propagation pathway still unresolved","Strong potential held back by missing propagation work"]);
    else if (gaps.find(g=>g.key==="met" && g.icon==="⚠️")) sentence = pick(["Promising metabolite profile with partial evidence","Interesting chemistry, evidence base still building","Metabolite signals visible, full picture not yet established"]);
    else if (!linkedProgram && (sp.composite_score||0) >= 60) sentence = pick(["Strong candidate ready for program initiation","High-priority species ready to enter an active program","Solid candidate waiting for a program to anchor it"]);
    else if ((sp.composite_score||0) >= 50) sentence = pick(["Balanced GEOCON candidate worth a closer look","Moderate candidate with mixed signals — worth review","Stable GEOCON candidate, no urgent action yet"]);
    else sentence = pick(["Low-priority candidate at this stage","Limited signals — keep on watchlist","Background candidate, monitoring only"]);
    if (sentence.length > 120) sentence = sentence.slice(0,117) + "...";

    return <div onClick={()=>onSpeciesClick(sp)} style={{display:"flex",alignItems:"stretch",gap:0,background:"#fff",borderRadius:10,border:"1px solid #e8e6e1",borderLeft:`4px solid ${c.dot}`,cursor:"pointer",overflow:"hidden",transition:"all 0.15s"}} onMouseEnter={e=>{e.currentTarget.style.background="#fcfbf9";e.currentTarget.style.transform="translateY(-1px)";e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,0.06)";}} onMouseLeave={e=>{e.currentTarget.style.background="#fff";e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}>
      <div style={{width:64,minHeight:64,flexShrink:0,background:c.bg,position:"relative"}}>{sp.thumbnail_url?<img src={sp.thumbnail_url} alt={sp.accepted_name} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.parentElement.style.background=c.bg}/>:<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:22}}>🌿</span></div>}</div>

      <div style={{flex:1,minWidth:0,padding:"10px 14px",display:"flex",flexDirection:"column",gap:6}}>
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

        <div style={{fontSize:11,color:"#5f5e5a",lineHeight:1.4}}>→ {sentence}</div>

        {linkedProgram&&<div style={{fontSize:10,color:"#085041",display:"flex",alignItems:"center",gap:4}}>
          <span style={{color:"#888"}}>Linked program:</span>
          <span style={{fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{linkedProgram.program_name}</span>
        </div>}

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

  const Breadcrumb = () => <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:14,fontSize:11,color:"#888",flexWrap:"wrap"}}>
    <button onClick={()=>{setSelectedFamily(null);setSelectedGenus(null);setSearch("");}} style={{background:"none",border:"none",cursor:"pointer",color:"#1D9E75",fontWeight:600,fontSize:11,padding:0}}>Families</button>
    {selectedFamily&&<><span>›</span>
    <button onClick={()=>{setSelectedGenus(null);setSearch("");}} style={{background:"none",border:"none",cursor:"pointer",color:selectedGenus?"#1D9E75":"#2c2c2a",fontWeight:600,fontSize:11,padding:0}}>{selectedFamily}</button></>}
    {selectedGenus&&<><span>›</span><span style={{color:"#2c2c2a",fontWeight:600,fontStyle:"italic"}}>{selectedGenus}</span></>}
  </div>;

  return<div>
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

    {selectedFamily && <Breadcrumb/>}

    {!selectedFamily&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:10}}>{families.map(f=><FamilyCard key={f} family={f}/>)}</div>}

    {selectedFamily&&!selectedGenus&&hasGenera&&(
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:10}}>
        {genera.map(g=><GenusCard key={g} genus={g}/>)}
      </div>
    )}

    {(selectedGenus||(selectedFamily&&!hasGenera))&&<>
      <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>
        <input type="text" placeholder="Search species..." value={search} onChange={e=>setSearch(e.target.value)} style={{flex:"1 1 160px",...S.input}}/>
        <select value={fC} onChange={e=>setFC(e.target.value)} style={S.input}><option value="all">All countries</option>{countries.map(c=><option key={c} value={c}>{c==="TR"?"Türkiye":"Chile"}</option>)}</select>
      </div>

      <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:10,color:"#888",textTransform:"uppercase",letterSpacing:0.5,fontWeight:600,marginRight:2}}>Sort</span>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{...S.input,fontSize:11,padding:"5px 8px"}}>
          <option value="score">Composite score</option>
          <option value="scientific">Scientific score</option>
          <option value="economic">Economic score</option>
        </select>

        <span style={{fontSize:10,color:"#ccc",margin:"0 2px"}}>·</span>

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
