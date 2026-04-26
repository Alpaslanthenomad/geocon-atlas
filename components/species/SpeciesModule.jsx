"use client";
import { useState } from "react";
import { FAMILY_COLORS, DEF_FAM, S } from "../../lib/constants";
import { iucnC, iucnBg, flag, decBg, decC } from "../../lib/helpers";
function SpeciesModule({species,onSpeciesClick}){
  const[exp,setExp]=useState(null);
  const[selectedFamily,setSelectedFamily]=useState(null);const[search,setSearch]=useState("");const[fC,setFC]=useState("all");
  const FAMILY_ORDER=["Asparagaceae","Amaryllidaceae","Orchidaceae","Araceae","Liliaceae","Iridaceae","Ranunculaceae","Primulaceae","Colchicaceae","Gentianaceae","Paeoniaceae","Nymphaeaceae","Geraniaceae","Tecophilaeaceae","Alstroemeriaceae"];
  const families=[...new Set(species.map(s=>s.family).filter(Boolean))].sort((a,b)=>{const ai=FAMILY_ORDER.indexOf(a),bi=FAMILY_ORDER.indexOf(b);return(ai===-1?99:ai)-(bi===-1?99:bi);});
  const countries=[...new Set(species.map(s=>s.country_focus).filter(Boolean))];
  const familySpecies=selectedFamily?species.filter(s=>s.family===selectedFamily&&(!search||(s.accepted_name||"").toLowerCase().includes(search.toLowerCase()))&&(fC==="all"||s.country_focus===fC)):[];
  function FamilyCard({family}){const members=species.filter(s=>s.family===family);const withPhoto=members.find(s=>s.thumbnail_url);const c=FAMILY_COLORS[family]||DEF_FAM;const threatened=members.filter(s=>["CR","EN","VU"].includes(s.iucn_status)).length;return<div onClick={()=>setSelectedFamily(family)} style={{background:"#fff",border:`1px solid ${selectedFamily===family?c.border:"#e8e6e1"}`,borderRadius:14,overflow:"hidden",cursor:"pointer",transition:"all 0.2s"}} onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"} onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}><div style={{height:90,overflow:"hidden",position:"relative",background:c.bg}}>{withPhoto?<img src={withPhoto.thumbnail_url} alt={family} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>:<div style={{width:"100%",height:"100%",background:c.bg,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:28,opacity:0.5}}>🌿</span></div>}<div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,transparent 40%,rgba(0,0,0,0.55))"}}/><div style={{position:"absolute",bottom:6,left:8,right:8,display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}><span style={{fontSize:10,fontWeight:600,color:"#fff",textShadow:"0 1px 2px rgba(0,0,0,0.8)",lineHeight:1.3}}>{family}</span>{threatened>0&&<span style={{fontSize:8,padding:"1px 5px",borderRadius:99,background:"rgba(162,45,45,0.85)",color:"#fff"}}>{threatened}⚠</span>}</div></div><div style={{padding:"7px 10px",display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:11,color:"#5f5e5a"}}>{members.length} species</span><div style={{display:"flex",gap:2}}>{["CR","EN","VU"].map(s=>{const n=members.filter(m=>m.iucn_status===s).length;return n>0?<span key={s} style={{fontSize:8,padding:"1px 4px",borderRadius:99,background:iucnBg(s),color:iucnC(s)}}>{s}:{n}</span>:null;})}</div></div></div>;}
  function SpeciesRow({sp}){const c=FAMILY_COLORS[sp.family]||DEF_FAM;return<div onClick={()=>onSpeciesClick(sp)} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:"#fff",borderRadius:8,border:"1px solid #e8e6e1",cursor:"pointer",transition:"background 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background="#f8f7f4"} onMouseLeave={e=>e.currentTarget.style.background="#fff"}><div style={{width:44,height:44,borderRadius:8,overflow:"hidden",flexShrink:0,background:c.bg}}>{sp.thumbnail_url?<img src={sp.thumbnail_url} alt={sp.accepted_name} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.parentElement.style.background=c.bg}/>:<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:18}}>🌿</span></div>}</div><div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:600,fontStyle:"italic",color:"#2c2c2a",fontFamily:"Georgia,serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sp.accepted_name}</div><div style={{fontSize:10,color:"#b4b2a9",marginTop:1}}>{sp.geophyte_type||"—"} · {sp.region||sp.country_focus||"—"}</div></div><div style={{display:"flex",gap:5,alignItems:"center",flexShrink:0}}>{sp.iucn_status&&<span style={{fontSize:9,padding:"2px 6px",borderRadius:99,background:iucnBg(sp.iucn_status),color:iucnC(sp.iucn_status)}}>{sp.iucn_status}</span>}{sp.decision&&<span style={{fontSize:9,padding:"2px 6px",borderRadius:99,background:decBg(sp.decision),color:decC(sp.decision)}}>{sp.decision}</span>}{sp.composite_score?<span style={{fontSize:12,fontWeight:700,color:"#1D9E75",minWidth:22,textAlign:"right"}}>{sp.composite_score}</span>:null}<span style={{color:"#b4b2a9",fontSize:14}}>›</span></div></div>;}
  return<div>
    {!selectedFamily?<>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
        <div><div style={{fontSize:16,fontWeight:700,color:"#2c2c2a",fontFamily:"Georgia,serif"}}>Species Families</div><div style={{fontSize:11,color:"#888",marginTop:2}}>{species.length} species · {families.length} families · select a family to explore</div></div>
        <div style={{display:"flex",gap:6}}>{[{l:"Total",v:species.length,c:"#1D9E75"},{l:"Threatened",v:species.filter(s=>["CR","EN","VU"].includes(s.iucn_status)).length,c:"#E24B4A"},{l:"TR",v:species.filter(s=>s.country_focus==="TR").length,c:"#185FA5"},{l:"CL",v:species.filter(s=>s.country_focus==="CL").length,c:"#D85A30"}].map(s=><div key={s.l} style={{textAlign:"center",padding:"5px 10px",background:"#f4f3ef",borderRadius:8}}><div style={{fontSize:14,fontWeight:700,color:s.c}}>{s.v}</div><div style={{fontSize:9,color:"#999"}}>{s.l}</div></div>)}</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:10}}>{families.map(f=><FamilyCard key={f} family={f}/>)}</div>
    </>:<>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
        <button onClick={()=>{setSelectedFamily(null);setSearch("");setFC("all");}} style={{padding:"6px 12px",border:"1px solid #e8e6e1",borderRadius:7,background:"#fff",cursor:"pointer",fontSize:11,color:"#888"}}>← Families</button>
        <div style={{flex:1}}><div style={{fontSize:15,fontWeight:700,color:"#2c2c2a",fontFamily:"Georgia,serif"}}>{selectedFamily}</div><div style={{fontSize:11,color:"#888"}}>{familySpecies.length} species</div></div>
      </div>
      <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
        <input type="text" placeholder="Search species..." value={search} onChange={e=>setSearch(e.target.value)} style={{flex:"1 1 160px",...S.input}}/>
        <select value={fC} onChange={e=>setFC(e.target.value)} style={S.input}><option value="all">All countries</option>{countries.map(c=><option key={c} value={c}>{c==="TR"?"Türkiye":"Chile"}</option>)}</select>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>{familySpecies.length===0?<div style={{textAlign:"center",padding:40,color:"#999",fontSize:13}}>No species found</div>:familySpecies.map(sp=><SpeciesRow key={sp.id} sp={sp}/>)}</div>
    </>}
  </div>;
}

/* ── Metabolite Explorer ── */

export default SpeciesModule;
