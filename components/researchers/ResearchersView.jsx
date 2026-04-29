
"use client";
import { useState } from "react";
import { S } from "../../lib/constants";
import { Pill } from "../shared";

export default function ResearchersView({researchers}){
  const[search,setSearch]=useState("");
  const[expanded,setExpanded]=useState(null);
  const[filter,setFilter]=useState("relevant");
  const[mode,setMode]=useState("active");
  
  const priorityOrder = {high:0, medium:1, candidate:2, inactive:3};
  
  // GEOCON aktif = bir programda fiilen üye (program_members'tan beslenir, app/page.js'te annotate edilir)
  // Eski member_status='active_member' alanı geriye uyumluluk için fallback
  const isActiveResearcher = r => r.is_geocon_active === true || r.member_status === "active_member";
  const activeMembers=researchers.filter(isActiveResearcher);
  const visibleResearchers=mode==="active"?activeMembers:researchers;
  
  const filtered=visibleResearchers.filter(r=>{
    if(mode==="all"){
      if(filter==="relevant" && (r.priority==="inactive" || (!r.priority && r.collaboration_fit==="Not relevant"))) return false;
      if(filter==="high" && r.priority!=="high") return false;
    }
    if(!search)return true;
    const s=search.toLowerCase();
    return(r.name||"").toLowerCase().includes(s)||(r.expertise_area||"").toLowerCase().includes(s)||(r.country||"").toLowerCase().includes(s);
  });
  
  const sorted=[...filtered].sort((a,b)=>{
    // Active members first
    const aActive = isActiveResearcher(a), bActive = isActiveResearcher(b);
    if(aActive && !bActive)return -1;
    if(bActive && !aActive)return 1;
    const pa=priorityOrder[a.priority]??2, pb=priorityOrder[b.priority]??2;
    if(pa!==pb)return pa-pb;
    return(b.h_index||0)-(a.h_index||0);
  });
  
  const priorityColors={high:{bg:"#E1F5EE",color:"#085041"},medium:{bg:"#E6F1FB",color:"#0C447C"},candidate:{bg:"#FAEEDA",color:"#633806"},inactive:{bg:"#f4f3ef",color:"#888"}};
  
  return<div>
    {/* Mode toggle bar */}
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,padding:"10px 14px",background:mode==="active"?"#E1F5EE":"#f4f3ef",borderRadius:10,border:`1px solid ${mode==="active"?"#1D9E7544":"#e8e6e1"}`}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:18}}>{mode==="active"?"🟢":"📋"}</span>
        <div>
          <div style={{fontSize:12,fontWeight:700,color:mode==="active"?"#085041":"#2c2c2a"}}>{mode==="active"?"Active members":"Public record"}</div>
          <div style={{fontSize:10,color:"#888"}}>{mode==="active"?`${activeMembers.length} active members of the GEOCON network`:`${researchers.length} researchers including external public-record entries`}</div>
        </div>
      </div>
      <div style={{display:"flex",gap:4,background:"#fff",padding:3,borderRadius:7,border:"1px solid #e8e6e1"}}>
        <button onClick={()=>setMode("active")} style={{padding:"5px 12px",border:"none",borderRadius:5,cursor:"pointer",fontSize:11,fontWeight:600,background:mode==="active"?"#1D9E75":"transparent",color:mode==="active"?"#fff":"#888"}}>🟢 Active ({activeMembers.length})</button>
        <button onClick={()=>setMode("all")} style={{padding:"5px 12px",border:"none",borderRadius:5,cursor:"pointer",fontSize:11,fontWeight:600,background:mode==="all"?"#888":"transparent",color:mode==="all"?"#fff":"#888"}}>📋 All ({researchers.length})</button>
      </div>
    </div>
    {mode==="active"&&activeMembers.length===0&&<div style={{textAlign:"center",padding:40,color:"#999",background:"#fcfbf9",borderRadius:10}}><div style={{fontSize:32,marginBottom:8}}>👥</div><div style={{fontSize:13,color:"#5f5e5a"}}>No active members yet</div><div style={{fontSize:11,marginTop:4}}>Switch to Public record to browse all researchers</div></div>}
    {(mode!=="active"||activeMembers.length>0)&&<>
    <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
      <input type="text" placeholder="Search name, expertise, country..." value={search} onChange={e=>setSearch(e.target.value)} style={{flex:"1 1 200px",...S.input}}/>
      {mode==="all"&&<div style={{display:"flex",gap:4}}>
        {[{k:"relevant",l:"Relevant"},
          {k:"high",l:"Core only"},
          {k:"all",l:"All"}
        ].map(f=><button key={f.k} onClick={()=>setFilter(f.k)} style={{padding:"7px 12px",border:"none",borderRadius:7,cursor:"pointer",fontSize:11,background:filter===f.k?"#1D9E75":"#f4f3ef",color:filter===f.k?"#fff":"#888",fontWeight:filter===f.k?600:400}}>{f.l}</button>)}
      </div>}
    </div>
    <p style={{...S.sub,marginBottom:12}}>{sorted.length} researchers · {mode==="active"?"Network active members":(filter==="relevant"?"Geophyte-relevant only":filter==="high"?"Core specialists only":"All researchers")}</p>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:8}}>
      {sorted.slice(0,80).map(r=>{
        const pc=priorityColors[r.priority]||{bg:"#f4f3ef",color:"#888"};
        const isActive=isActiveResearcher(r);
        return<div key={r.id} onClick={()=>setExpanded(expanded===r.id?null:r.id)} style={{...S.card,padding:14,cursor:"pointer",border:expanded===r.id?"2px solid #85B7EB":isActive?"1px solid #1D9E75":"1px solid #e8e6e1",borderLeft:isActive?"4px solid #1D9E75":"1px solid #e8e6e1",opacity:mode==="all"&&!isActive?0.78:1}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                {isActive&&<span style={{fontSize:9,padding:"1px 6px",borderRadius:99,background:"#E1F5EE",color:"#085041",fontWeight:700}}>🟢 ACTIVE</span>}
                <div style={{fontSize:13,fontWeight:600,color:"#2c2c2a"}}>{r.name}</div>
              </div>
              {r.institution&&<div style={{fontSize:10,color:"#888",fontStyle:"italic"}}>{r.institution}</div>}
            </div>
            {r.priority&&<span style={{fontSize:9,padding:"2px 7px",borderRadius:99,background:pc.bg,color:pc.color,fontWeight:600,flexShrink:0,marginLeft:6,textTransform:"capitalize"}}>{r.priority}</span>}
          </div>
          <div style={{fontSize:10,color:"#888",marginBottom:6}}>{(r.expertise_area||"").slice(0,70)}</div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {r.country&&<Pill color="#0C447C" bg="#E6F1FB">{r.country}</Pill>}
            {r.h_index&&<Pill color="#3C3489" bg="#EEEDFE">h:{r.h_index}</Pill>}
            {r.collaboration_fit&&<Pill color="#085041" bg="#E1F5EE">{r.collaboration_fit}</Pill>}
          </div>
          {expanded===r.id&&isActive&&r.notes&&<div style={{marginTop:10,paddingTop:10,borderTop:"1px solid #ece9e2",fontSize:11,color:"#5f5e5a",lineHeight:1.5}}>{r.notes}</div>}
        </div>;
      })}
    </div>
    </>}
  </div>;
}
