"use client";
import { S } from "../../lib/constants";

export function Pill({ children, color, bg }) {
  return <span style={S.pill(color, bg)}>{children}</span>;
}

export function Dot({ color, size = 6 }) {
  return <span style={{ display:"inline-block", width:size, height:size, borderRadius:"50%", background:color, flexShrink:0 }} />;
}

export function MiniBar({ value, max = 100, color, h = 5 }) {
  return (
    <div style={{ height:h, background:"#eae8e3", borderRadius:h/2, overflow:"hidden", flex:1 }}>
      <div style={{ height:"100%", width:`${(value/max)*100}%`, background:color, borderRadius:h/2, transition:"width 0.6s ease" }} />
    </div>
  );
}

export function Loading() {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:60, color:"#999", fontSize:13 }}>
      Loading data from Supabase...
    </div>
  );
}

export function RadarChart({ scores, size = 100 }) {
  if (!scores) return null;
  const keys = ["conservation","science","production","governance","venture"];
  const labels = { conservation:"URGN", science:"MATR", production:"VALU", governance:"GOV", venture:"VENT" };
  const vals = keys.map(k => scores[k] || 0);
  const n = keys.length, cx = size/2, cy = size/2, r = size*0.36;
  const ang = i => (Math.PI*2*i)/n - Math.PI/2;
  const pt  = (i,v) => { const a=ang(i), d=(v/100)*r; return [cx+d*Math.cos(a), cy+d*Math.sin(a)]; };
  const cols = { conservation:"#E24B4A", science:"#534AB7", production:"#1D9E75", governance:"#D85A30", venture:"#185FA5" };
  const dp   = keys.map((k,i) => pt(i, vals[i]));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {[25,50,75,100].map(lv => {
        const pts = keys.map((_,i) => pt(i,lv)).map(p=>`${p[0]},${p[1]}`).join(" ");
        return <polygon key={lv} points={pts} fill="none" stroke="#e8e6e1" strokeWidth="0.5" />;
      })}
      {keys.map((_,i) => { const [ex,ey]=pt(i,100); return <line key={i} x1={cx} y1={cy} x2={ex} y2={ey} stroke="#e8e6e1" strokeWidth="0.5" />; })}
      <polygon points={dp.map(p=>`${p[0]},${p[1]}`).join(" ")} fill="rgba(29,158,117,0.12)" stroke="#1D9E75" strokeWidth="1.5" />
      {keys.map((k,i) => { const [px,py]=pt(i,vals[i]); return <circle key={k} cx={px} cy={py} r={2.5} fill={cols[k]} />; })}
      {keys.map((k,i) => { const [lx,ly]=pt(i,118); return <text key={k} x={lx} y={ly} textAnchor="middle" dominantBaseline="central" style={{fontSize:8,fill:"#999"}}>{labels[k]}</text>; })}
    </svg>
  );
}
