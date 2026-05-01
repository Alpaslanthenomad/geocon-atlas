"use client";
import { FAMILY_COLORS, DEF_FAM } from "../../lib/constants";
import { iucnC, iucnBg, flag } from "../../lib/helpers";

export default function FamilySpeciesCard({sp,onClick,programCount=0,activeCount=0}){
  const c=FAMILY_COLORS[sp.family]||DEF_FAM;
  return<div onClick={onClick} style={{background:"#fff",border:"0.5px solid #e8e6e1",borderLeft:`3px solid ${c.dot}`,borderRadius:10,cursor:"pointer",overflow:"hidden",position:"relative"}} onMouseEnter={e=>e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,0.08)"} onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
    {programCount>0&&<div style={{position:"absolute",top:5,right:5,zIndex:2,fontSize:8,padding:"1px 6px",borderRadius:99,background:activeCount>0?"rgba(13,110,86,0.95)":"rgba(60,60,60,0.85)",color:"#fff",fontWeight:700,display:"flex",alignItems:"center",gap:3,boxShadow:"0 1px 2px rgba(0,0,0,0.2)"}}><span style={{fontSize:7}}>{activeCount>0?"●":"○"}</span>{programCount}</div>}
    {sp.thumbnail_url&&<div style={{height:80,overflow:"hidden"}}><img src={sp.thumbnail_url} alt={sp.accepted_name} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.parentElement.style.display="none"}/></div>}
    <div style={{padding:"8px 12px 10px"}}>
      <p style={{margin:"0 0 4px",fontSize:12,fontStyle:"italic",fontWeight:600,color:"#2c2c2a"}}>{sp.accepted_name}</p>
      {sp.common_name&&<p style={{margin:"0 0 4px",fontSize:10,color:"#888"}}>{sp.common_name}</p>}
      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
        {sp.iucn_status&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:99,background:iucnBg(sp.iucn_status),color:iucnC(sp.iucn_status),border:"0.5px solid currentColor"}}>IUCN: {sp.iucn_status}</span>}
        {sp.country_focus&&<span style={{fontSize:10,color:"#b4b2a9"}}>{flag(sp.country_focus)}</span>}
      </div>
    </div>
  </div>;
}
