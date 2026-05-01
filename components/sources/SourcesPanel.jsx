"use client";
import { S } from "../../lib/constants";
import { freshC } from "../../lib/helpers";
import { Dot, MiniBar } from "../shared";

export default function SourcesPanel({sources}){
  return<div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:8}}>
      {sources.map(src=>
        <div key={src.id} style={{...S.card,padding:"10px 12px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
            <span style={{fontSize:12,fontWeight:600,color:"#2c2c2a"}}>{src.source_name}</span>
            <div style={{display:"flex",alignItems:"center",gap:3}}>
              <Dot color={freshC(src.freshness_score||0)}/>
              <span style={{fontSize:10,fontWeight:600,color:freshC(src.freshness_score||0)}}>{Math.round((src.freshness_score||0)*100)}%</span>
            </div>
          </div>
          <div style={S.sub}>{src.data_domain} · {src.update_frequency}</div>
          <MiniBar value={(src.freshness_score||0)*100} color={freshC(src.freshness_score||0)} h={3}/>
        </div>
      )}
    </div>
  </div>;
}
