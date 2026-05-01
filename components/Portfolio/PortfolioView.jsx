"use client";
import { S } from "../../lib/constants";
import { iucnC } from "../../lib/helpers";

export default function PortfolioView({species}){
  return<div>
    <p style={S.sub}>Composite vs. urgency — bubble = value score</p>
    <div style={{position:"relative",width:"100%",height:320,background:"#fff",borderRadius:14,border:"1px solid #e8e6e1",overflow:"hidden",marginTop:8}}>
      {species.map(sp=>{
        const c=sp.composite_score||50,con=sp.score_conservation||50,v=sp.score_venture||50;
        const x=((c-40)/50)*82+9,y=100-((con-20)/80)*88,sz=16+(v/100)*28;
        return<div key={sp.id} title={`${sp.accepted_name}\nComp:${c}`} style={{position:"absolute",left:`${x}%`,top:`${y}%`,width:sz,height:sz,borderRadius:"50%",background:iucnC(sp.iucn_status),opacity:0.75,transform:"translate(-50%,-50%)",border:"2px solid #fff",cursor:"default"}}/>
      })}
    </div>
  </div>;
}
