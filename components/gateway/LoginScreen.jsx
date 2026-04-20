"use client";
import { useState, useEffect } from "react";
import { ROLES, S } from "../../lib/constants";
import { Dot } from "../shared";

export default function LoginScreen({ onLogin }) {
  const [sel, setSel]     = useState("researcher");
  const [ready, setReady] = useState(false);
  useEffect(() => { setTimeout(() => setReady(true), 100); }, []);
  const selected = ROLES[sel];

  const valueProps = [
    { title:"Prioritize species",    desc:"Identify which species matter most across conservation need, scientific evidence, and development potential." },
    { title:"Track program progress",desc:"Follow how species move through modules, gates, and operational pathways." },
    { title:"Coordinate action",     desc:"Align research, propagation, governance, and venture logic in one environment." },
  ];
  const inside = [
    { title:"ATLAS",       sub:"Species intelligence",    desc:"Scientific evidence, literature, metabolites, researcher signals, and prioritization." },
    { title:"Programs",    sub:"Active pathways",         desc:"Track how species become real programs across conservation, propagation, discovery, and venture routes." },
    { title:"Communities", sub:"People and institutions", desc:"Connect researchers, labs, partners, and collaboration clusters around species and programs." },
    { title:"Governance",  sub:"Decision and legitimacy", desc:"ABS, conservation ethics, policy alignment, and decision records." },
  ];

  return (
    <div style={{ minHeight:"100vh", padding:"32px 20px", background:"#f8f7f4" }}>
      <div style={{ maxWidth:1180, margin:"0 auto", opacity:ready?1:0, transform:ready?"translateY(0)":"translateY(16px)", transition:"all 0.6s ease" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1.15fr 0.85fr", gap:20, alignItems:"stretch" }}>

          {/* Left — brand + value props */}
          <div style={{ ...S.card, padding:28, display:"flex", flexDirection:"column", justifyContent:"space-between", minHeight:520 }}>
            <div>
              <div style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:62, height:62, borderRadius:16, background:"linear-gradient(145deg,#085041,#1D9E75)", marginBottom:18 }}>
                <span style={{ color:"#fff", fontSize:28, fontWeight:700, fontFamily:"Georgia,serif" }}>G</span>
              </div>
              <div style={{ fontSize:11, color:"#b4b2a9", letterSpacing:1.4, textTransform:"uppercase", marginBottom:12 }}>Powered by Venn BioVentures</div>
              <h1 style={{ fontSize:38, lineHeight:1.05, fontWeight:700, letterSpacing:-1.2, color:"#2c2c2a", margin:"0 0 12px", fontFamily:"Georgia,serif" }}>GEOCON</h1>
              <div style={{ fontSize:20, lineHeight:1.25, color:"#3b3a36", marginBottom:14, maxWidth:620 }}>Species intelligence, program progression, and platform-based conservation strategy.</div>
              <p style={{ fontSize:14, color:"#6f6d66", lineHeight:1.75, maxWidth:700, margin:0 }}>GEOCON is a platform for moving high-value and high-importance plant species from evidence to action across conservation, research, propagation, and venture development.</p>
            </div>
            <div>
              <div style={{ fontSize:11, color:"#b4b2a9", margin:"0 0 12px", letterSpacing:0.6, textTransform:"uppercase" }}>What GEOCON helps you do</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,minmax(0,1fr))", gap:12 }}>
                {valueProps.map(v => (
                  <div key={v.title} style={{ padding:14, border:"1px solid #ece9e2", borderRadius:12, background:"#fcfbf9" }}>
                    <div style={{ fontSize:13, fontWeight:600, color:"#2c2c2a", marginBottom:6 }}>{v.title}</div>
                    <div style={{ fontSize:11, color:"#7d7a72", lineHeight:1.6 }}>{v.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right — role selector + inside GEOCON */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div style={{ ...S.card, padding:"22px 22px 18px" }}>
              <div style={{ fontSize:11, color:"#b4b2a9", margin:"0 0 8px", letterSpacing:0.6, textTransform:"uppercase" }}>Choose your lens</div>
              <div style={{ fontSize:12, color:"#7d7a72", lineHeight:1.6, marginBottom:14 }}>Your role shapes how GEOCON highlights priorities, decisions, and actions.</div>
              <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                {Object.entries(ROLES).map(([k,r]) => (
                  <button key={k} onClick={() => setSel(k)} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 14px", border:sel===k?`2px solid ${r.color}`:"1px solid #e8e6e1", borderRadius:11, background:sel===k?r.accent:"#fff", cursor:"pointer", transition:"all 0.15s", textAlign:"left" }}>
                    <div style={{ width:34, height:34, borderRadius:8, background:r.color, display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <span style={{ color:"#fff", fontSize:13, fontWeight:600 }}>{r.ic}</span>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:"#2c2c2a" }}>{r.label}</div>
                      <div style={{ fontSize:10, color:"#9f9c93" }}>{r.desc}</div>
                    </div>
                    {sel===k && <Dot color={r.color} size={8} />}
                  </button>
                ))}
              </div>
              <button onClick={() => onLogin({ name:sel==="admin"?"Alpaslan":selected.label, role:sel })} style={{ width:"100%", padding:"13px 0", border:"none", borderRadius:11, marginTop:16, background:selected.color, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>
                Enter GEOCON
              </button>
              <div style={{ fontSize:10, color:"#a6a39a", marginTop:8, textAlign:"center" }}>You will enter the GEOCON home environment with views tailored to your role.</div>
            </div>

            <div style={{ ...S.card, padding:22 }}>
              <div style={{ fontSize:11, color:"#b4b2a9", margin:"0 0 12px", letterSpacing:0.6, textTransform:"uppercase" }}>Inside GEOCON</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                {inside.map(item => (
                  <div key={item.title} style={{ padding:12, borderRadius:12, background:"#fcfbf9", border:"1px solid #ece9e2" }}>
                    <div style={{ fontSize:12, fontWeight:700, color:"#2c2c2a", marginBottom:2 }}>{item.title}</div>
                    <div style={{ fontSize:10, color:"#1D9E75", fontWeight:600, marginBottom:6 }}>{item.sub}</div>
                    <div style={{ fontSize:10, color:"#7d7a72", lineHeight:1.55 }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display:"flex", justifyContent:"space-between", gap:10, flexWrap:"wrap", padding:"14px 6px 0", fontSize:10, color:"#a6a39a" }}>
          <span>Tracked species intelligence</span>
          <span>Program-based progression</span>
          <span>Role-sensitive entry</span>
          <span>Built within Venn BioVentures</span>
        </div>
      </div>
    </div>
  );
}
