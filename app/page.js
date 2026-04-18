"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

const ROLES={admin:{label:"Admin",desc:"Full platform access",ic:"A",color:"#534AB7",accent:"#EEEDFE"},researcher:{label:"Researcher",desc:"Species, conservation & science",ic:"R",color:"#1D9E75",accent:"#E1F5EE"},venture_builder:{label:"Venture Builder",desc:"Strategic pathways & venture readiness",ic:"V",color:"#D85A30",accent:"#FAECE7"},producer:{label:"Producer",desc:"Production & compliance",ic:"P",color:"#639922",accent:"#EAF3DE"},policymaker:{label:"Policymaker",desc:"Conservation & regulatory",ic:"K",color:"#185FA5",accent:"#E6F1FB"}};
const FAMILY_COLORS={Liliaceae:{bg:"#EAF3DE",border:"#639922",text:"#27500A",dot:"#639922"},Amaryllidaceae:{bg:"#E6F1FB",border:"#378ADD",text:"#0C447C",dot:"#378ADD"},Asparagaceae:{bg:"#E1F5EE",border:"#1D9E75",text:"#085041",dot:"#1D9E75"},Iridaceae:{bg:"#EEEDFE",border:"#7F77DD",text:"#3C3489",dot:"#7F77DD"},Orchidaceae:{bg:"#FBEAF0",border:"#D4537E",text:"#72243E",dot:"#D4537E"},Araceae:{bg:"#FAECE7",border:"#D85A30",text:"#712B13",dot:"#D85A30"},Colchicaceae:{bg:"#FAEEDA",border:"#BA7517",text:"#633806",dot:"#BA7517"},Primulaceae:{bg:"#FCEBEB",border:"#E24B4A",text:"#791F1F",dot:"#E24B4A"},Ranunculaceae:{bg:"#F1EFE8",border:"#5F5E5A",text:"#2C2C2A",dot:"#5F5E5A"},Gentianaceae:{bg:"#E1F5EE",border:"#0F6E56",text:"#04342C",dot:"#0F6E56"},Paeoniaceae:{bg:"#FBEAF0",border:"#993556",text:"#4B1528",dot:"#993556"},Nymphaeaceae:{bg:"#E6F1FB",border:"#185FA5",text:"#042C53",dot:"#185FA5"},Geraniaceae:{bg:"#FAEEDA",border:"#854F0B",text:"#412402",dot:"#854F0B"},Tecophilaeaceae:{bg:"#EEEDFE",border:"#534AB7",text:"#26215C",dot:"#534AB7"},Alstroemeriaceae:{bg:"#EAF3DE",border:"#3B6D11",text:"#173404",dot:"#3B6D11"}};
const DEF_FAM={bg:"#F1EFE8",border:"#888780",text:"#2C2C2A",dot:"#888780"};
const S={card:{background:"#fff",borderRadius:14,border:"1px solid #e8e6e1",overflow:"hidden"},pill:(c,bg)=>({display:"inline-flex",alignItems:"center",padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:500,color:c,background:bg,whiteSpace:"nowrap",lineHeight:1.6}),metric:{background:"#f4f3ef",padding:"8px 12px",borderRadius:8},mLabel:{fontSize:9,color:"#999",letterSpacing:0.4,textTransform:"uppercase",marginBottom:2},mVal:(c)=>({fontSize:20,fontWeight:700,color:c||"#2c2c2a",fontFamily:"Georgia,serif"}),sub:{fontSize:10,color:"#999"},input:{padding:"8px 12px",border:"1px solid #e8e6e1",borderRadius:8,fontSize:12,background:"#fff",outline:"none",color:"#2c2c2a"}};
const iucnC=s=>({CR:"#A32D2D",EN:"#854F0B",VU:"#BA7517",NT:"#3B6D11",LC:"#0F6E56"}[s]||"#888");
const iucnBg=s=>({CR:"#FCEBEB",EN:"#FAEEDA",VU:"#FFF3CD",NT:"#EAF3DE",LC:"#E1F5EE"}[s]||"#f1efe8");
const decC=d=>({Accelerate:"#0F6E56","Urgent Conserve":"#A32D2D",Develop:"#185FA5",Scale:"#3B6D11",Monitor:"#888"}[d]||"#888");
const decBg=d=>({Accelerate:"#E1F5EE","Urgent Conserve":"#FCEBEB",Develop:"#E6F1FB",Scale:"#EAF3DE",Monitor:"#f1efe8"}[d]||"#f1efe8");
const freshC=v=>v>0.85?"#0F6E56":v>0.65?"#BA7517":"#A32D2D";
const flag=c=>c==="TR"?"🇹🇷":c==="CL"?"🇨🇱":"🌍";
function Pill({children,color,bg}){return<span style={S.pill(color,bg)}>{children}</span>}
function Dot({color,size=6}){return<span style={{display:"inline-block",width:size,height:size,borderRadius:"50%",background:color,flexShrink:0}}/>}
function MiniBar({value,max=100,color,h=5}){return<div style={{height:h,background:"#eae8e3",borderRadius:h/2,overflow:"hidden",flex:1}}><div style={{height:"100%",width:`${(value/max)*100}%`,background:color,borderRadius:h/2,transition:"width 0.6s ease"}}/></div>}
function Loading(){return<div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:60,color:"#999",fontSize:13}}>Loading data from Supabase...</div>}
function RadarChart({scores,size=100}){if(!scores)return null;const keys=["conservation","science","production","governance","venture"];const vals=keys.map(k=>scores[k]||0);const n=keys.length,cx=size/2,cy=size/2,r=size*0.36;const ang=i=>(Math.PI*2*i)/n-Math.PI/2;const pt=(i,v)=>{const a=ang(i),d=(v/100)*r;return[cx+d*Math.cos(a),cy+d*Math.sin(a)]};const cols={conservation:"#E24B4A",science:"#534AB7",production:"#1D9E75",governance:"#D85A30",venture:"#185FA5"};const dp=keys.map((k,i)=>pt(i,vals[i]));return<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>{[25,50,75,100].map(lv=>{const pts=keys.map((_,i)=>pt(i,lv)).map(p=>`${p[0]},${p[1]}`).join(" ");return<polygon key={lv} points={pts} fill="none" stroke="#e8e6e1" strokeWidth="0.5"/>})}{keys.map((_,i)=>{const[ex,ey]=pt(i,100);return<line key={i} x1={cx} y1={cy} x2={ex} y2={ey} stroke="#e8e6e1" strokeWidth="0.5"/>})}<polygon points={dp.map(p=>`${p[0]},${p[1]}`).join(" ")} fill="rgba(29,158,117,0.12)" stroke="#1D9E75" strokeWidth="1.5"/>{keys.map((k,i)=>{const[px,py]=pt(i,vals[i]);return<circle key={k} cx={px} cy={py} r={2.5} fill={cols[k]}/>})}{keys.map((k,i)=>{const[lx,ly]=pt(i,118);return<text key={k} x={lx} y={ly} textAnchor="middle" dominantBaseline="central" style={{fontSize:8,fill:"#999"}}>{k.slice(0,4).toUpperCase()}</text>})}</svg>}

/* ─── LOGIN ─── */
function LoginScreen({onLogin}){const[sel,setSel]=useState("researcher");const[ready,setReady]=useState(false);useEffect(()=>{setTimeout(()=>setReady(true),100)},[]);return<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24,background:"#f8f7f4"}}><div style={{width:"100%",maxWidth:440,opacity:ready?1:0,transform:ready?"translateY(0)":"translateY(16px)",transition:"all 0.6s ease"}}><div style={{textAlign:"center",marginBottom:32}}><div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:60,height:60,borderRadius:16,background:"linear-gradient(145deg,#085041,#1D9E75)",marginBottom:14,boxShadow:"0 6px 24px rgba(8,80,65,0.25)"}}><span style={{color:"#fff",fontSize:26,fontWeight:700,fontFamily:"Georgia,serif"}}>A</span></div><h1 style={{fontSize:28,fontWeight:700,letterSpacing:-1,color:"#2c2c2a",margin:"0 0 4px",fontFamily:"Georgia,serif"}}>GEOCON</h1><p style={{fontSize:13,color:"#888",margin:0}}>Species intelligence, program progression, and platform-based conservation strategy</p><p style={{fontSize:10,color:"#b4b2a9",margin:"6px 0 0",letterSpacing:1}}>PLATFORM BY VENN BIOVENTURES</p></div><div style={{...S.card,padding:"24px 24px 20px"}}><p style={{fontSize:11,color:"#b4b2a9",margin:"0 0 14px",letterSpacing:0.5,textTransform:"uppercase"}}>Choose your lens</p><div style={{display:"flex",flexDirection:"column",gap:6}}>{Object.entries(ROLES).map(([k,r])=><button key={k} onClick={()=>setSel(k)} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",border:sel===k?`2px solid ${r.color}`:"1px solid #e8e6e1",borderRadius:10,background:sel===k?r.accent:"#fff",cursor:"pointer",transition:"all 0.15s",textAlign:"left"}}><div style={{width:34,height:34,borderRadius:8,background:r.color,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:"#fff",fontSize:14,fontWeight:600}}>{r.ic}</span></div><div style={{flex:1}}><div style={{fontSize:13,fontWeight:500,color:"#2c2c2a"}}>{r.label}</div><div style={{fontSize:10,color:"#b4b2a9"}}>{r.desc}</div></div>{sel===k&&<Dot color={r.color} size={8}/>}</button>)}</div><button onClick={()=>onLogin({name:sel==="admin"?"Alpaslan":ROLES[sel].label,role:sel})} style={{width:"100%",padding:"12px 0",border:"none",borderRadius:10,marginTop:18,background:ROLES[sel].color,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer"}} onMouseEnter={e=>e.target.style.opacity="0.9"} onMouseLeave={e=>e.target.style.opacity="1"}>Enter GEOCON as {ROLES[sel].label}</button></div><div style={{marginTop:18,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:10,color:"#8d8a80"}}><div style={{padding:"8px 10px",background:"#fff",border:"1px solid #e8e6e1",borderRadius:8}}>ATLAS · Species intelligence</div><div style={{padding:"8px 10px",background:"#fff",border:"1px solid #e8e6e1",borderRadius:8}}>Programs · Active pathways</div><div style={{padding:"8px 10px",background:"#fff",border:"1px solid #e8e6e1",borderRadius:8}}>Communities · People & institutions</div><div style={{padding:"8px 10px",background:"#fff",border:"1px solid #e8e6e1",borderRadius:8}}>Governance · Decision layer</div></div></div></div>}

/* ─── HELPERS ─── */
function riskColor(v){return v==="high"?"#A32D2D":v==="medium"?"#BA7517":v==="low"?"#0F6E56":"#888"}
function riskBg(v){return v==="high"?"#FCEBEB":v==="medium"?"#FAEEDA":v==="low"?"#E1F5EE":"#f1efe8"}
function shade(v){return typeof v==="number"?Math.round(v):v}

/* ─── SPECIES DETAIL PANEL ─── */
function SpeciesDetailPanel({species,onClose}){
  const[pubs,setPubs]=useState([]);
  const[mets,setMets]=useState([]);
  const[cons,setCons]=useState([]);
  const[gov,setGov]=useState(null);
  const[prop,setProp]=useState([]);
  const[comm,setComm]=useState([]);
  const[locs,setLocs]=useState([]);
  const[loading,setLoading]=useState(true);
  const[tab,setTab]=useState("pubs");

  useEffect(()=>{
    if(!species)return;
    setLoading(true);setPubs([]);setMets([]);setCons([]);setGov(null);setProp([]);setComm([]);setLocs([]);setTab("pubs");
    Promise.all([
      supabase.from("publications").select("id,title,authors,year,journal,doi,open_access,source,abstract").eq("species_id",species.id).order("year",{ascending:false}).limit(50),
      supabase.from("metabolites").select("id,compound_name,compound_class,reported_activity,activity_category,evidence,confidence,therapeutic_area,plant_organ").eq("species_id",species.id).order("confidence",{ascending:false}),
      supabase.from("conservation").select("*").eq("species_id",species.id),
      supabase.from("governance").select("*").eq("species_id",species.id).maybeSingle(),
      supabase.from("propagation").select("*").eq("species_id",species.id),
      supabase.from("commercial").select("*").eq("species_id",species.id),
      supabase.from("locations").select("*").eq("species_id",species.id),
    ]).then(([pubR,metR,conR,govR,propR,commR,locR])=>{
      setPubs(pubR.data||[]);
      setMets(metR.data||[]);
      setCons(conR.data||[]);
      setGov(govR.data||null);
      setProp(propR.data||[]);
      setComm(commR.data||[]);
      setLocs(locR.data||[]);
    }).finally(()=>setLoading(false));
  },[species]);

  if(!species)return null;
  const fam=FAMILY_COLORS[species.family]||DEF_FAM;
  const status=species.iucn_status||species.current_status||"NE";
  const score=Math.round(species.composite_score||0);
  const radar={conservation:species.conservation_score||55,science:species.research_score||species.science_score||50,production:species.production_score||species.tc_score||45,governance:species.governance_score||40,venture:species.venture_score||species.commercial_score||50};

  return (
    <div style={{position:"fixed",inset:0,zIndex:60,display:"flex",justifyContent:"flex-end"}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(44,44,42,0.32)"}}/>
      <div style={{position:"relative",width:"min(980px,92vw)",height:"100%",background:"#fff",boxShadow:"-16px 0 40px rgba(0,0,0,0.16)",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"18px 20px 14px",borderBottom:"1px solid #ece9e3",background:"#fcfbf9"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:16}}>
            <div style={{minWidth:0}}>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
                <Pill color={fam.text} bg={fam.bg}>{species.family||"Unassigned family"}</Pill>
                <Pill color={iucnC(status)} bg={iucnBg(status)}>{status}</Pill>
                {species.country_focus&&<Pill color="#5f5e5a" bg="#f1efe8">{flag(species.country_focus)} {species.country_focus}</Pill>}
                {species.current_decision&&<Pill color={decC(species.current_decision)} bg={decBg(species.current_decision)}>{species.current_decision}</Pill>}
              </div>
              <div style={{fontSize:28,fontWeight:700,color:"#2c2c2a",fontFamily:"Georgia,serif",lineHeight:1.12}}>
                {species.accepted_name||species.scientific_name||species.species_name}
              </div>
              <div style={{display:"flex",gap:16,flexWrap:"wrap",marginTop:8,fontSize:12,color:"#6d6b65"}}>
                {species.common_name&&<span>{species.common_name}</span>}
                {species.genus&&<span>Genus: <strong style={{color:"#2c2c2a"}}>{species.genus}</strong></span>}
                <span>Composite Score: <strong style={{color:"#2c2c2a"}}>{score}</strong></span>
              </div>
            </div>

            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{textAlign:"center"}}>
                <RadarChart scores={radar} size={100}/>
                <div style={{fontSize:10,color:"#999",marginTop:4}}>species profile</div>
              </div>
              <button onClick={onClose} style={{width:36,height:36,borderRadius:10,border:"1px solid #e8e6e1",background:"#fff",cursor:"pointer",fontSize:18,color:"#777"}}>×</button>
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:10,marginTop:16}}>
            <div style={S.metric}><div style={S.mLabel}>Publications</div><div style={S.mVal("#534AB7")}>{pubs.length}</div></div>
            <div style={S.metric}><div style={S.mLabel}>Metabolites</div><div style={S.mVal("#1D9E75")}>{mets.length}</div></div>
            <div style={S.metric}><div style={S.mLabel}>Conservation entries</div><div style={S.mVal("#E24B4A")}>{cons.length}</div></div>
            <div style={S.metric}><div style={S.mLabel}>Propagation protocols</div><div style={S.mVal("#D85A30")}>{prop.length}</div></div>
          </div>
        </div>

        <div style={{display:"flex",gap:8,padding:"10px 20px",borderBottom:"1px solid #ece9e3",background:"#fff",flexWrap:"wrap"}}>
          {[
            ["pubs","Publications"],
            ["mets","Metabolites"],
            ["cons","Conservation"],
            ["gov","Governance"],
            ["prop","Propagation"],
            ["comm","Commercial"],
            ["info","Details"]
          ].map(([k,l])=><button key={k} onClick={()=>setTab(k)} style={{padding:"8px 12px",border:"1px solid #e8e6e1",borderRadius:999,background:tab===k?"#EEEDFE":"#fff",color:tab===k?"#3C3489":"#2c2c2a",fontSize:12,fontWeight:600,cursor:"pointer"}}>{l}</button>)}
        </div>

        <div style={{flex:1,overflowY:"auto",padding:"18px 20px"}}>
          {loading?<Loading/>:<>
            {tab==="pubs"&&<div>
              {pubs.length===0?<div style={{textAlign:"center",padding:32,color:"#999",fontSize:13}}>No publications linked yet</div>:pubs.map(p=><div key={p.id} style={{marginBottom:12,padding:"12px 14px",background:"#f8f7f4",borderRadius:8}}>
                <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"flex-start"}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600,color:"#2c2c2a",marginBottom:4,lineHeight:1.35}}>{p.title}</div>
                    <div style={{fontSize:10,color:"#8d8a80",marginBottom:6}}>{p.authors} {p.journal?`· ${p.journal}`:""} {p.year?`· ${p.year}`:""}</div>
                    {p.abstract&&<div style={{fontSize:11,color:"#5f5e5a",lineHeight:1.55}}>{p.abstract.slice(0,260)}{p.abstract.length>260?"…":""}</div>}
                  </div>
                  <div style={{display:"flex",gap:6,flexDirection:"column",alignItems:"flex-end",flexShrink:0}}>
                    {p.source&&<Pill color="#185FA5" bg="#E6F1FB">{p.source}</Pill>}
                    {p.open_access&&<Pill color="#0F6E56" bg="#E1F5EE">OA</Pill>}
                  </div>
                </div>
                {p.doi&&<a href={`https://doi.org/${p.doi}`} target="_blank" rel="noopener noreferrer" style={{fontSize:10,color:"#185FA5",display:"inline-block",marginTop:6}}>DOI →</a>}
              </div>)}
            </div>}

            {tab==="mets"&&<div>
              {mets.length===0?<div style={{textAlign:"center",padding:32,color:"#999",fontSize:13}}>No metabolites linked yet</div>:mets.map(m=><div key={m.id} style={{marginBottom:12,padding:"12px 14px",background:"#f8f7f4",borderRadius:8}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:"#2c2c2a"}}>{m.compound_name}</div>
                    <div style={{fontSize:10,color:"#8d8a80",marginTop:3}}>{m.compound_class||"Unknown class"} {m.plant_organ?`· ${m.plant_organ}`:""}</div>
                  </div>
                  {m.confidence!=null&&<Pill color={m.confidence>0.75?"#0F6E56":m.confidence>0.5?"#BA7517":"#A32D2D"} bg={m.confidence>0.75?"#E1F5EE":m.confidence>0.5?"#FAEEDA":"#FCEBEB"}>{Math.round(m.confidence*100)}%</Pill>}
                </div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:8}}>
                  {m.activity_category&&<Pill color="#72243E" bg="#FBEAF0">{m.activity_category}</Pill>}
                  {m.therapeutic_area&&<Pill color="#3C3489" bg="#EEEDFE">{m.therapeutic_area}</Pill>}
                  {m.evidence&&<Pill color="#5f5e5a" bg="#f1efe8">{m.evidence}</Pill>}
                </div>
                {m.reported_activity&&<div style={{fontSize:11,color:"#5f5e5a",lineHeight:1.55,marginTop:8}}>{m.reported_activity}</div>}
              </div>)}
            </div>}

            {tab==="cons"&&<div>
              {cons.length===0?<div style={{textAlign:"center",padding:32}}>
                <p style={{color:"#999",fontSize:13,marginBottom:8}}>No conservation assessments yet</p>
                <p style={{color:"#b4b2a9",fontSize:11}}>Run harvest/iucn or add manual entries in Supabase → conservation table</p>
              </div>:<div style={{display:"flex",flexDirection:"column",gap:10}}>
                {cons.map(a=><div key={a.id} style={{padding:"12px 14px",background:"#f8f7f4",borderRadius:8,borderLeft:"3px solid #E24B4A"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                    <div style={{fontSize:13,fontWeight:600,color:"#2c2c2a"}}>{a.source}</div>
                    {a.status_interpreted&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:99,background:iucnBg(a.status_interpreted),color:iucnC(a.status_interpreted)}}>{a.status_interpreted}</span>}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px 12px",fontSize:11}}>
                    {a.assessment_year&&<div><span style={{color:"#b4b2a9",fontSize:9,textTransform:"uppercase"}}>Year</span><div style={{color:"#2c2c2a",fontWeight:500}}>{a.assessment_year}</div></div>}
                    {a.trend&&<div><span style={{color:"#b4b2a9",fontSize:9,textTransform:"uppercase"}}>Trend</span><div style={{color:"#2c2c2a",fontWeight:500}}>{a.trend}</div></div>}
                    {a.scope&&<div><span style={{color:"#b4b2a9",fontSize:9,textTransform:"uppercase"}}>Scope</span><div style={{color:"#2c2c2a",fontWeight:500}}>{a.scope}</div></div>}
                    {a.confidence&&<div><span style={{color:"#b4b2a9",fontSize:9,textTransform:"uppercase"}}>Confidence</span><div style={{color:"#2c2c2a",fontWeight:500}}>{Math.round(a.confidence*100)}%</div></div>}
                  </div>
                  {a.citation_or_url&&<a href={a.citation_or_url} target="_blank" rel="noopener noreferrer" style={{fontSize:10,color:"#185FA5",display:"block",marginTop:6}}>Source →</a>}
                  {a.notes&&<div style={{fontSize:10,color:"#5f5e5a",marginTop:6,lineHeight:1.5}}>{a.notes}</div>}
                </div>)}
              </div>}
            </div>}

            {tab==="gov"&&<div>
              {!gov?<div style={{textAlign:"center",padding:32}}>
                <p style={{color:"#999",fontSize:13,marginBottom:8}}>No governance data yet</p>
                <p style={{color:"#b4b2a9",fontSize:11}}>Add data via Supabase → governance table</p>
              </div>:<div style={{display:"flex",flexDirection:"column",gap:10}}>
                <div style={{padding:"14px 16px",background:"#f8f7f4",borderRadius:8,borderLeft:"3px solid #D85A30"}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px 16px"}}>
                    {[
                      {l:"Access regime",v:gov.access_regime},
                      {l:"ABS/Nagoya risk",v:gov.abs_nagoya_risk,colored:true},
                      {l:"Collection sensitivity",v:gov.collection_sensitivity,colored:true},
                      {l:"Public visibility",v:gov.public_visibility_level},
                      {l:"Local partner needed",v:gov.local_partner_needed?"Yes":"No"},
                    ].map(({l,v,colored})=>v?<div key={l}>
                      <div style={{fontSize:9,color:"#b4b2a9",textTransform:"uppercase",letterSpacing:0.4,marginBottom:3}}>{l}</div>
                      {colored?<span style={{fontSize:11,padding:"2px 8px",borderRadius:99,background:riskBg(v),color:riskColor(v),fontWeight:600}}>{v}</span>
                      :<div style={{fontSize:12,color:"#2c2c2a",fontWeight:500}}>{v}</div>}
                    </div>:null)}
                  </div>
                </div>
                {gov.permit_notes&&<div style={{padding:"10px 14px",background:"#FAEEDA",borderRadius:8,fontSize:11,color:"#633806",lineHeight:1.6}}>
                  <strong>Permit notes: </strong>{gov.permit_notes}
                </div>}
                {gov.notes&&<div style={{padding:"10px 14px",background:"#f8f7f4",borderRadius:8,fontSize:11,color:"#5f5e5a",lineHeight:1.6}}>{gov.notes}</div>}
              </div>}
            </div>}

            {tab==="prop"&&<div>
              {prop.length===0?<div style={{textAlign:"center",padding:32}}>
                <p style={{color:"#999",fontSize:13,marginBottom:8}}>No propagation protocols yet</p>
                <p style={{color:"#b4b2a9",fontSize:11}}>Add data via Supabase → propagation table</p>
              </div>:prop.map(p=><div key={p.id} style={{marginBottom:12,padding:"12px 14px",background:"#f8f7f4",borderRadius:8,borderLeft:"3px solid #1D9E75"}}>
                <div style={{fontSize:13,fontWeight:600,color:"#2c2c2a",marginBottom:8}}>{p.protocol_type}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px 16px",fontSize:11}}>
                  {p.explant&&<div><span style={{color:"#b4b2a9",fontSize:9,textTransform:"uppercase"}}>Explant</span><div style={{color:"#2c2c2a",fontWeight:500}}>{p.explant}</div></div>}
                  {p.medium_or_condition&&<div><span style={{color:"#b4b2a9",fontSize:9,textTransform:"uppercase"}}>Medium</span><div style={{color:"#2c2c2a",fontWeight:500}}>{p.medium_or_condition}</div></div>}
                  {p.success_rate&&<div><span style={{color:"#b4b2a9",fontSize:9,textTransform:"uppercase"}}>Success rate</span><div style={{color:"#1D9E75",fontWeight:700}}>{p.success_rate}%</div></div>}
                  {p.confidence&&<div><span style={{color:"#b4b2a9",fontSize:9,textTransform:"uppercase"}}>Confidence</span><div style={{color:"#2c2c2a",fontWeight:500}}>{Math.round(p.confidence*100)}%</div></div>}
                </div>
                <div style={{display:"flex",gap:6,marginTop:10,flexWrap:"wrap"}}>
                  {[{l:"Ex situ",v:p.ex_situ_fit},{l:"Greenhouse",v:p.greenhouse_fit},{l:"Field",v:p.field_transferability}].map(({l,v})=>v&&v!=="under_review"?<span key={l} style={{fontSize:10,padding:"2px 8px",borderRadius:99,background:"#E1F5EE",color:"#085041"}}>{l}: {v}</span>:<span key={l} style={{fontSize:10,padding:"2px 8px",borderRadius:99,background:"#f4f3ef",color:"#888"}}>{l}: {v||"—"}</span>)}
                </div>
                {p.notes&&<div style={{fontSize:10,color:"#5f5e5a",marginTop:8,lineHeight:1.5}}>{p.notes}</div>}
              </div>)}
            </div>}

            {tab==="comm"&&<div>
              {comm.length===0?<div style={{textAlign:"center",padding:32}}>
                <p style={{color:"#999",fontSize:13,marginBottom:8}}>No commercial hypotheses yet</p>
                <p style={{color:"#b4b2a9",fontSize:11}}>Add data via Supabase → commercial table</p>
              </div>:comm.map(h=><div key={h.id} style={{marginBottom:12,padding:"12px 14px",background:"#f8f7f4",borderRadius:8,borderLeft:"3px solid #185FA5"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                  <div style={{fontSize:13,fontWeight:600,color:"#2c2c2a"}}>{h.application_area}</div>
                  {h.status&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:99,background:h.status==="monitor"?"#FAEEDA":"#E1F5EE",color:h.status==="monitor"?"#633806":"#085041"}}>{h.status}</span>}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px 12px",fontSize:11,marginBottom:8}}>
                  {h.market_type&&<div><span style={{color:"#b4b2a9",fontSize:9,textTransform:"uppercase"}}>Market type</span><div style={{color:"#2c2c2a",fontWeight:500}}>{h.market_type}</div></div>}
                  {h.venture_fit&&<div><span style={{color:"#b4b2a9",fontSize:9,textTransform:"uppercase"}}>Venture fit</span><div style={{color:"#185FA5",fontWeight:600}}>{h.venture_fit}</div></div>}
                </div>
                {h.justification&&<div style={{fontSize:11,color:"#5f5e5a",lineHeight:1.6,marginBottom:6}}>{h.justification}</div>}
                {h.notes&&<div style={{fontSize:10,color:"#b4b2a9",lineHeight:1.5}}>{h.notes}</div>}
              </div>)}
            </div>}

            {tab==="info"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px 16px"}}>
              {[{l:"ID",v:species.id},{l:"Atlas ID",v:species.atlas_id},{l:"Genus",v:species.genus},{l:"Family",v:species.family},{l:"Geophyte type",v:species.geophyte_type},{l:"Region",v:species.region},{l:"Habitat",v:species.habitat},{l:"Country",v:species.country_focus},{l:"Endemicity",v:species.endemicity_flag?"Endemic":null},{l:"TC status",v:species.tc_status},{l:"Decision",v:species.current_decision||species.decision},{l:"Spin-off",v:species.spinoff_link},{l:"Market area",v:species.market_area},{l:"Market size",v:species.market_size},{l:"Last verified",v:species.last_verified}].map(({l,v})=>v?<div key={l}><div style={{fontSize:9,color:"#b4b2a9",textTransform:"uppercase",letterSpacing:0.4}}>{l}</div><div style={{fontSize:12,color:"#2c2c2a",fontWeight:500}}>{v}</div></div>:null)}
              {(species.decision_rationale)&&<div style={{gridColumn:"1 / -1",marginTop:4}}><div style={{fontSize:9,color:"#b4b2a9",textTransform:"uppercase",letterSpacing:0.4,marginBottom:4}}>Decision rationale</div><div style={{fontSize:11,color:"#5f5e5a",lineHeight:1.5}}>{species.decision_rationale}</div></div>}
              {locs.length>0&&<div style={{gridColumn:"1 / -1",marginTop:8}}>
                <div style={{fontSize:9,color:"#b4b2a9",textTransform:"uppercase",letterSpacing:0.4,marginBottom:8}}>Locations ({locs.length})</div>
                {locs.map(l=><div key={l.id} style={{padding:"8px 10px",background:"#f8f7f4",borderRadius:6,marginBottom:6,fontSize:11}}>
                  <div style={{fontWeight:600,color:"#2c2c2a",marginBottom:3}}>{l.country}{l.region?` — ${l.region}`:""}</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {l.habitat&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:99,background:"#E1F5EE",color:"#085041"}}>{l.habitat}</span>}
                    {l.sensitivity_level&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:99,background:riskBg(l.sensitivity_level),color:riskColor(l.sensitivity_level)}}>{l.sensitivity_level}</span>}
                    {l.elevation_m&&<span style={{fontSize:10,color:"#888"}}>{l.elevation_m}m</span>}
                  </div>
                </div>)}
              </div>}
            </div>}
          </>}
        </div>
      </div>
    </div>
  );
}

/* ─── DASHBOARD / HOME ─── */
function GeoconHome({species,publications,researchers,programs,setView}){
  const threatened=species.filter(s=>["CR","EN","VU"].includes(s.iucn_status)).length;
  const forge=programs.filter(p=>p.current_module==="Forge").length;
  const venture=programs.filter(p=>p.program_type==="Venture Formation"||p.current_gate==="Venture").length;
  const blocked=programs.filter(p=>p.status==="Blocked").length;

  const priorityItems=[
    `${blocked} blocked programs require review`,
    `${forge} programs are currently in Forge`,
    `${venture} programs are nearing venture logic`,
    `${threatened} threatened species need coordinated action`,
  ];

  const storyFeed=[
    {
      title:"Imperial Fritillaria Rescue Program",
      summary:"Two new evidence-linked publications increased propagation confidence, but protocol maturity remains incomplete.",
      tag:"Forge review"
    },
    {
      title:"Cyclamen Propagation Platform",
      summary:"Program scope is clear, but ex situ transfer logic still needs a formal validation gate.",
      tag:"Validation needed"
    },
    {
      title:"Endemic Orchid Conservation Pathway",
      summary:"Governance-sensitive workflow emerging; ABS and collection sensitivity should be reviewed before deployment.",
      tag:"Governance watch"
    },
  ];

  const featured=(species||[]).slice(0,4);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{...S.card,padding:20,border:"1px solid #e8e6e1"}}>
        <div style={{fontSize:11,color:"#8d8a80",letterSpacing:1.2,textTransform:"uppercase",marginBottom:8}}>
          GEOCON Home
        </div>
        <div style={{fontSize:28,fontWeight:700,fontFamily:"Georgia,serif",color:"#2c2c2a",marginBottom:8}}>
          Program intelligence dashboard
        </div>
        <div style={{fontSize:13,color:"#5f5e5a",maxWidth:760,lineHeight:1.65}}>
          GEOCON moves species from evidence to action across conservation, propagation, research, governance, and venture development.
          ATLAS remains the intelligence layer; programs are the active execution layer.
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1.1fr 1fr",gap:16}}>
        <div style={{...S.card,padding:16}}>
          <div style={{fontSize:12,fontWeight:700,color:"#2c2c2a",marginBottom:10}}>What needs attention now</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {priorityItems.map((t,i)=>(
              <div key={i} style={{padding:"10px 12px",background:"#f8f7f4",borderRadius:10,fontSize:12,color:"#2c2c2a"}}>
                {t}
              </div>
            ))}
          </div>
        </div>

        <div style={{...S.card,padding:16}}>
          <div style={{fontSize:12,fontWeight:700,color:"#2c2c2a",marginBottom:10}}>Program story feed</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {storyFeed.map((s,i)=>(
              <div key={i} style={{padding:"10px 12px",background:"#f8f7f4",borderRadius:10}}>
                <div style={{display:"flex",justifyContent:"space-between",gap:8,marginBottom:4}}>
                  <div style={{fontSize:12,fontWeight:600,color:"#2c2c2a"}}>{s.title}</div>
                  <Pill color="#085041" bg="#E1F5EE">{s.tag}</Pill>
                </div>
                <div style={{fontSize:11,color:"#5f5e5a",lineHeight:1.55}}>{s.summary}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{...S.card,padding:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{fontSize:12,fontWeight:700,color:"#2c2c2a"}}>Active programs</div>
          <button
            onClick={()=>setView("programs")}
            style={{padding:"7px 10px",border:"1px solid #1D9E75",borderRadius:8,background:"#fff",color:"#1D9E75",fontSize:11,fontWeight:600,cursor:"pointer"}}
          >
            Open Programs
          </button>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:12}}>
          {programs.slice(0,3).map(p=>(
            <div key={p.id} style={{padding:14,border:"1px solid #e8e6e1",borderRadius:12,background:"#fff"}}>
              <div style={{display:"flex",justifyContent:"space-between",gap:8,marginBottom:8}}>
                <div style={{fontSize:13,fontWeight:700,color:"#2c2c2a"}}>{p.program_name}</div>
                <Pill color="#185FA5" bg="#E6F1FB">{p.current_module}</Pill>
              </div>
              <div style={{fontSize:11,color:"#8d8a80",marginBottom:8}}>
                {p.program_type} · {p.current_gate}
              </div>
              <div style={{fontSize:11,color:"#5f5e5a",lineHeight:1.55,marginBottom:10}}>
                {p.primary_blocker}
              </div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#8d8a80"}}>
                <span>Readiness {p.readiness_score}</span>
                <span>{p.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"0.9fr 1.1fr",gap:16}}>
        <div style={{...S.card,padding:16}}>
          <div style={{fontSize:12,fontWeight:700,color:"#2c2c2a",marginBottom:12}}>Module map</div>
          {[
            ["Origin", programs.filter(p=>p.current_module==="Origin").length, "#534AB7"],
            ["Forge", programs.filter(p=>p.current_module==="Forge").length, "#1D9E75"],
            ["Mesh", programs.filter(p=>p.current_module==="Mesh").length, "#185FA5"],
            ["Exchange", programs.filter(p=>p.current_module==="Exchange").length, "#D85A30"],
            ["Accord", programs.filter(p=>p.current_module==="Accord").length, "#72243E"],
          ].map(([label,count,color])=>(
            <div key={label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid #efede8"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <Dot color={color} size={9}/>
                <span style={{fontSize:12,color:"#2c2c2a",fontWeight:600}}>{label}</span>
              </div>
              <span style={{fontSize:12,color:"#8d8a80"}}>{count}</span>
            </div>
          ))}
        </div>

        <div style={{...S.card,padding:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{fontSize:12,fontWeight:700,color:"#2c2c2a"}}>Featured species</div>
            <button
              onClick={()=>setView("species")}
              style={{padding:"7px 10px",border:"1px solid #185FA5",borderRadius:8,background:"#fff",color:"#185FA5",fontSize:11,fontWeight:600,cursor:"pointer"}}
            >
              Open ATLAS
            </button>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:10}}>
            {featured.map(s=>(
              <div key={s.id} style={{padding:12,border:"1px solid #e8e6e1",borderRadius:12,background:"#fff"}}>
                <div style={{fontSize:12,fontWeight:700,color:"#2c2c2a",marginBottom:4}}>
                  {s.accepted_name}
                </div>
                <div style={{fontSize:10,color:"#8d8a80",marginBottom:8}}>
                  {s.family || "Family not assigned"}
                </div>
                <div style={{fontSize:10,color:"#5f5e5a",lineHeight:1.55}}>
                  Composite score {Math.round(s.composite_score || 0)} · {s.iucn_status || "NE"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{...S.card,padding:16}}>
        <div style={{fontSize:12,fontWeight:700,color:"#2c2c2a",marginBottom:8}}>Ask GEOCON</div>
        <div style={{fontSize:11,color:"#5f5e5a",marginBottom:10}}>
          Start turning evidence into coordinated action.
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
          {[
            "Which programs are blocked in Forge?",
            "Which species need governance review?",
            "Which programs are closest to venture readiness?"
          ].map((q,i)=>(
            <div key={i} style={{padding:"8px 10px",border:"1px solid #e8e6e1",borderRadius:999,background:"#fff",fontSize:11,color:"#2c2c2a"}}>
              {q}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── PROGRAMS ─── */
function ProgramsView({programs}){
  const [typeFilter,setTypeFilter]=useState("all");
  const [statusFilter,setStatusFilter]=useState("all");
  const [moduleFilter,setModuleFilter]=useState("all");
  const [search,setSearch]=useState("");

  const filtered=programs.filter(
    p =>
      (typeFilter==="all"||p.program_type===typeFilter) &&
      (statusFilter==="all"||p.status===statusFilter) &&
      (moduleFilter==="all"||p.current_module===moduleFilter) &&
      (`${p.program_name} ${p.species_name} ${p.program_type}`.toLowerCase().includes(search.toLowerCase()))
  );

  const opts=(arr,key)=>[...new Set(arr.map(x=>x[key]).filter(Boolean))];

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",gap:16,marginBottom:16,flexWrap:"wrap"}}>
        <div>
          <div style={{fontSize:11,color:"#8d8a80",letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>GEOCON</div>
          <div style={{fontSize:28,fontWeight:700,fontFamily:"Georgia,serif",color:"#2c2c2a"}}>Programs</div>
          <div style={{fontSize:12,color:"#5f5e5a",marginTop:4}}>
            Programs translate species intelligence into active, trackable pathways.
          </div>
        </div>

        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search programs" style={{...S.input,minWidth:180}}/>
          <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} style={S.input}>
            <option value="all">All types</option>
            {opts(programs,"program_type").map(v=><option key={v}>{v}</option>)}
          </select>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={S.input}>
            <option value="all">All status</option>
            {opts(programs,"status").map(v=><option key={v}>{v}</option>)}
          </select>
          <select value={moduleFilter} onChange={e=>setModuleFilter(e.target.value)} style={S.input}>
            <option value="all">All modules</option>
            {opts(programs,"current_module").map(v=><option key={v}>{v}</option>)}
          </select>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:14}}>
        {filtered.map(p=>(
          <div key={p.id} style={{...S.card,padding:16}}>
            <div style={{display:"flex",justifyContent:"space-between",gap:8,marginBottom:8}}>
              <div style={{fontSize:14,fontWeight:700,color:"#2c2c2a"}}>{p.program_name}</div>
              <Pill color="#085041" bg="#E1F5EE">{p.status}</Pill>
            </div>

            <div style={{fontSize:11,color:"#8d8a80",marginBottom:10}}>
              {p.species_name} · {p.program_type}
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px 12px",marginBottom:10}}>
              <div>
                <div style={S.mLabel}>Module</div>
                <div style={{fontSize:12,fontWeight:600,color:"#2c2c2a"}}>{p.current_module}</div>
              </div>
              <div>
                <div style={S.mLabel}>Gate</div>
                <div style={{fontSize:12,fontWeight:600,color:"#2c2c2a"}}>{p.current_gate}</div>
              </div>
              <div>
                <div style={S.mLabel}>Readiness</div>
                <div style={{fontSize:12,fontWeight:600,color:"#1D9E75"}}>{p.readiness_score}</div>
              </div>
              <div>
                <div style={S.mLabel}>Confidence</div>
                <div style={{fontSize:12,fontWeight:600,color:"#185FA5"}}>{p.confidence_score}</div>
              </div>
            </div>

            <div style={{fontSize:11,color:"#5f5e5a",lineHeight:1.55,marginBottom:10}}>
              <strong style={{color:"#2c2c2a"}}>Next action:</strong> {p.next_action}
            </div>

            <div style={{fontSize:11,color:"#5f5e5a",lineHeight:1.55}}>
              <strong style={{color:"#2c2c2a"}}>Blocker:</strong> {p.primary_blocker}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── SPECIES ─── */
function SpeciesCard({s,onClick}){
  const fam=FAMILY_COLORS[s.family]||DEF_FAM,st=s.iucn_status||"NE",d=s.current_decision||s.decision||"Monitor";
  return <div style={{...S.card,padding:14,position:"relative",cursor:"pointer"}} onClick={onClick}>
    <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:fam.border}}/>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",gap:8,marginBottom:10}}>
      <div style={{minWidth:0}}>
        <div style={{fontSize:14,fontWeight:700,color:"#2c2c2a",lineHeight:1.25}}>{s.accepted_name}</div>
        <div style={{fontSize:11,color:"#77756e",marginTop:3}}>{s.family||"Unassigned family"} {s.common_name?`· ${s.common_name}`:""}</div>
      </div>
      <Pill color={iucnC(st)} bg={iucnBg(st)}>{st}</Pill>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
      <div>
        <div style={S.mLabel}>Composite</div>
        <div style={{fontSize:22,fontWeight:700,color:"#2c2c2a",fontFamily:"Georgia,serif"}}>{Math.round(s.composite_score||0)}</div>
      </div>
      <div style={{display:"flex",justifyContent:"flex-end"}}><RadarChart scores={{conservation:s.conservation_score||55,science:s.research_score||50,production:s.production_score||45,governance:s.governance_score||40,venture:s.venture_score||50}} size={82}/></div>
    </div>

    <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
      {s.country_focus&&<Pill color="#5f5e5a" bg="#f1efe8">{flag(s.country_focus)} {s.country_focus}</Pill>}
      <Pill color={decC(d)} bg={decBg(d)}>{d}</Pill>
      {s.tc_status&&<Pill color="#185FA5" bg="#E6F1FB">{s.tc_status}</Pill>}
    </div>

    <div style={{display:"grid",gap:8}}>
      {[
        ["Conservation",s.conservation_score||55,"#E24B4A"],
        ["Science",s.research_score||50,"#534AB7"],
        ["Production",s.production_score||45,"#1D9E75"],
        ["Governance",s.governance_score||40,"#D85A30"],
        ["Venture",s.venture_score||50,"#185FA5"],
      ].map(([label,val,color])=><div key={label}>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#77756e",marginBottom:3}}><span>{label}</span><span>{Math.round(val)}</span></div>
        <MiniBar value={val} color={color}/>
      </div>)}
    </div>

    {s.decision_rationale&&<div style={{marginTop:12,fontSize:10,color:"#77756e",lineHeight:1.5,background:"#f8f7f4",padding:10,borderRadius:8}}>{s.decision_rationale.slice(0,120)}{s.decision_rationale.length>120?"…":""}</div>}
  </div>
}

function FamilyView({species,onSpeciesClick}) {
  const [search,setSearch]=useState("");
  const [familyFilter,setFamilyFilter]=useState("all");

  const grouped=species.reduce((acc,s)=>{
    const fam=s.family||"Unassigned";
    if(!acc[fam]) acc[fam]=[];
    acc[fam].push(s);
    return acc;
  },{});

  const families=Object.keys(grouped).sort();
  const filteredFamilies=families.filter(f=>{
    const matchesFamily=familyFilter==="all"||f===familyFilter;
    const hasMatchingSpecies=grouped[f].some(s=>(s.accepted_name||"").toLowerCase().includes(search.toLowerCase()));
    return matchesFamily&&hasMatchingSpecies;
  });

  return (
    <div>
      <div style={{display:"flex",gap:12,marginBottom:20,alignItems:"center",flexWrap:"wrap"}}>
        <input type="text" placeholder="Search species..." value={search} onChange={(e)=>setSearch(e.target.value)} style={{...S.input,minWidth:200}}/>
        <select value={familyFilter} onChange={(e)=>setFamilyFilter(e.target.value)} style={S.input}>
          <option value="all">All Families</option>
          {families.map(f=><option key={f} value={f}>{f}</option>)}
        </select>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:24}}>
        {filteredFamilies.map(fam=>{
          const famColor=FAMILY_COLORS[fam]||DEF_FAM;
          const famSpecies=grouped[fam].filter(s=>(s.accepted_name||"").toLowerCase().includes(search.toLowerCase()));
          return (
            <div key={fam} style={{...S.card,padding:20}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16,paddingBottom:12,borderBottom:"1px solid #efede8"}}>
                <Dot color={famColor.dot} size={12}/>
                <h3 style={{fontSize:20,fontWeight:700,color:famColor.text,fontFamily:"Georgia,serif",margin:0}}>{fam}</h3>
                <Pill color={famColor.text} bg={famColor.bg}>{famSpecies.length} species</Pill>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:14}}>
                {famSpecies.map(s=><SpeciesCard key={s.id} s={s} onClick={()=>onSpeciesClick(s)}/>)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SpeciesModule({species,exp,setExp,onSpeciesClick}){
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,marginBottom:18,flexWrap:"wrap"}}>
        <div>
          <div style={{fontSize:11,color:"#8d8a80",letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>ATLAS</div>
          <div style={{fontSize:28,fontWeight:700,fontFamily:"Georgia,serif",color:"#2c2c2a"}}>Species</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setExp("score")} style={{padding:"8px 12px",border:"1px solid #e8e6e1",borderRadius:8,background:exp!=="family"?"#EEEDFE":"#fff",color:exp!=="family"?"#3C3489":"#2c2c2a",cursor:"pointer",fontSize:12,fontWeight:600}}>Score View</button>
          <button onClick={()=>setExp("family")} style={{padding:"8px 12px",border:"1px solid #e8e6e1",borderRadius:8,background:exp==="family"?"#EEEDFE":"#fff",color:exp==="family"?"#3C3489":"#2c2c2a",cursor:"pointer",fontSize:12,fontWeight:600}}>Family View</button>
        </div>
      </div>

      {exp==="family"
        ? <FamilyView species={species} onSpeciesClick={onSpeciesClick}/>
        : <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:14}}>
            {species.map(s=><SpeciesCard key={s.id} s={s} onClick={()=>onSpeciesClick(s)}/>)}
          </div>
      }
    </div>
  );
}

/* ─── METABOLITES ─── */
function MetaboliteExplorer({metabolites}){return<div><div style={{fontSize:28,fontWeight:700,fontFamily:"Georgia,serif",marginBottom:16,color:"#2c2c2a"}}>Metabolites</div><div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:14}}>{metabolites.map(m=><div key={m.id} style={{...S.card,padding:14}}><div style={{fontSize:13,fontWeight:700,color:"#2c2c2a"}}>{m.compound_name}</div><div style={{fontSize:11,color:"#77756e",marginTop:4}}>{m.compound_class||"Unknown class"}</div><div style={{fontSize:10,color:"#999",marginTop:8}}>{m.species?.accepted_name||"Unlinked species"}</div>{m.reported_activity&&<div style={{marginTop:10,fontSize:11,color:"#5f5e5a",lineHeight:1.5}}>{m.reported_activity}</div>}</div>)}</div></div>}

/* ─── MARKET ─── */
function MarketView({markets}){return<div><div style={{fontSize:28,fontWeight:700,fontFamily:"Georgia,serif",marginBottom:16,color:"#2c2c2a"}}>Market</div><div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:14}}>{markets.map(m=><div key={m.id} style={{...S.card,padding:14}}><div style={{fontSize:13,fontWeight:700,color:"#2c2c2a"}}>{m.application_area||"Market signal"}</div><div style={{fontSize:11,color:"#77756e",marginTop:4}}>{m.species?.accepted_name||"Unknown species"}</div>{m.justification&&<div style={{marginTop:10,fontSize:11,color:"#5f5e5a",lineHeight:1.5}}>{m.justification}</div>}</div>)}</div></div>}

/* ─── PUBLICATIONS ─── */
async function fetchAllPublications(pageSize=1000){
  let all=[],from=0,done=false;
  while(!done){
    const {data,error}=await supabase.from("publications").select("*").order("year",{ascending:false,nullsFirst:false}).range(from,from+pageSize-1);
    if(error) throw error;
    if(data&&data.length){all=[...all,...data];from+=pageSize;} else done=true;
    if(!data||data.length<pageSize) done=true;
  }
  return all;
}

function PublicationsView({publications}) {
  const [search,setSearch]=useState("");
  const [expanded,setExpanded]=useState(null);
  const [page,setPage]=useState(0);
  const [sourceFilter,setSourceFilter]=useState("all");
  const [yearFilter,setYearFilter]=useState("all");
  const PAGE_SIZE=20;
  const norm=s=>String(s||"").toLowerCase();

  const years=[...new Set(publications.map(p=>p.year).filter(Boolean))].sort((a,b)=>b-a);
  const sources=[...new Set(publications.map(p=>p.source).filter(Boolean))].sort();

  const filtered=publications.filter(p=>{
    const q=norm(search);
    const matchesSearch=!q||norm(p.title).includes(q)||norm(p.authors).includes(q)||norm(p.journal).includes(q)||norm(p.abstract).includes(q);
    const matchesSource=sourceFilter==="all"||p.source===sourceFilter;
    const matchesYear=yearFilter==="all"||String(p.year)===String(yearFilter);
    return matchesSearch&&matchesSource&&matchesYear;
  });

  const pageCount=Math.ceil(filtered.length/PAGE_SIZE)||1;
  const safePage=Math.min(page,pageCount-1);
  const visible=filtered.slice(safePage*PAGE_SIZE,safePage*PAGE_SIZE+PAGE_SIZE);

  useEffect(()=>{setPage(0)},[search,sourceFilter,yearFilter]);

  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",gap:16,marginBottom:16,flexWrap:"wrap"}}>
      <div>
        <div style={{fontSize:11,color:"#8d8a80",letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>ATLAS</div>
        <div style={{fontSize:28,fontWeight:700,fontFamily:"Georgia,serif",color:"#2c2c2a"}}>Publications</div>
        <div style={{fontSize:12,color:"#5f5e5a",marginTop:4}}>
          {filtered.length.toLocaleString()} results · page {safePage+1} / {pageCount}
        </div>
      </div>

      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search title, authors, abstract" style={{...S.input,minWidth:220}}/>
        <select value={sourceFilter} onChange={e=>setSourceFilter(e.target.value)} style={S.input}>
          <option value="all">All sources</option>
          {sources.map(s=><option key={s}>{s}</option>)}
        </select>
        <select value={yearFilter} onChange={e=>setYearFilter(e.target.value)} style={S.input}>
          <option value="all">All years</option>
          {years.map(y=><option key={y}>{y}</option>)}
        </select>
      </div>
    </div>

    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      {visible.map(p=><div key={p.id} style={{...S.card,padding:14}}>
        <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"flex-start"}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:14,fontWeight:700,color:"#2c2c2a",lineHeight:1.35}}>{p.title}</div>
            <div style={{fontSize:11,color:"#77756e",marginTop:4}}>
              {p.authors||"Unknown authors"} {p.journal?`· ${p.journal}`:""} {p.year?`· ${p.year}`:""}
            </div>
            {p.abstract&&<div style={{fontSize:11,color:"#5f5e5a",lineHeight:1.6,marginTop:8}}>
              {(expanded===p.id?p.abstract:p.abstract.slice(0,320))}{p.abstract.length>320&&expanded!==p.id?"…":""}
            </div>}
            {p.abstract&&p.abstract.length>320&&<button onClick={()=>setExpanded(expanded===p.id?null:p.id)} style={{marginTop:8,padding:0,border:"none",background:"transparent",cursor:"pointer",fontSize:11,fontWeight:700,color:"#185FA5"}}>
              {expanded===p.id?"Show less":"Read more"}
            </button>}
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end"}}>
            {p.source&&<Pill color="#185FA5" bg="#E6F1FB">{p.source}</Pill>}
            {p.open_access&&<Pill color="#0F6E56" bg="#E1F5EE">OA</Pill>}
          </div>
        </div>
        {p.doi&&<a href={`https://doi.org/${p.doi}`} target="_blank" rel="noopener noreferrer" style={{display:"inline-block",marginTop:8,fontSize:10,color:"#185FA5"}}>DOI →</a>}
      </div>)}
    </div>

    <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:8,marginTop:18}}>
      <button onClick={()=>setPage(0)} disabled={safePage===0} style={{...S.input,cursor:"pointer"}}>«</button>
      <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={safePage===0} style={{...S.input,cursor:"pointer"}}>‹</button>
      <div style={{fontSize:12,color:"#5f5e5a"}}>{safePage+1} / {pageCount}</div>
      <button onClick={()=>setPage(p=>Math.min(pageCount-1,p+1))} disabled={safePage>=pageCount-1} style={{...S.input,cursor:"pointer"}}>›</button>
      <button onClick={()=>setPage(pageCount-1)} disabled={safePage>=pageCount-1} style={{...S.input,cursor:"pointer"}}>»</button>
    </div>
  </div>;
}

/* ─── RESEARCHERS ─── */
function ResearchersView({researchers}){return<div><div style={{fontSize:28,fontWeight:700,fontFamily:"Georgia,serif",marginBottom:16,color:"#2c2c2a"}}>Researchers</div><div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:14}}>{researchers.map(r=><div key={r.id} style={{...S.card,padding:14}}><div style={{fontSize:13,fontWeight:700,color:"#2c2c2a"}}>{r.full_name||r.name}</div><div style={{fontSize:11,color:"#77756e",marginTop:4}}>{r.institution||"Unknown institution"}</div>{r.h_index!=null&&<div style={{marginTop:10,fontSize:11,color:"#185FA5",fontWeight:700}}>h-index {r.h_index}</div>}</div>)}</div></div>}

/* ─── INSTITUTIONS ─── */
function InstitutionExplorer({institutions}){return<div><div style={{fontSize:28,fontWeight:700,fontFamily:"Georgia,serif",marginBottom:16,color:"#2c2c2a"}}>Institutions</div><div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:14}}>{institutions.map(i=><div key={i.id} style={{...S.card,padding:14}}><div style={{fontSize:13,fontWeight:700,color:"#2c2c2a"}}>{i.name}</div><div style={{fontSize:11,color:"#77756e",marginTop:4}}>{i.country||"Unknown country"}</div></div>)}</div></div>}

/* ─── PORTFOLIO ─── */
function Portfolio({species}){const threatened=species.filter(s=>["CR","EN","VU"].includes(s.iucn_status)).length;const avg=Math.round(species.reduce((a,b)=>a+(b.composite_score||0),0)/(species.length||1));return<div><div style={{fontSize:28,fontWeight:700,fontFamily:"Georgia,serif",marginBottom:16,color:"#2c2c2a"}}>Portfolio</div><div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:14}}><div style={{...S.card,padding:18}}><div style={S.mLabel}>Tracked species</div><div style={S.mVal("#534AB7")}>{species.length}</div></div><div style={{...S.card,padding:18}}><div style={S.mLabel}>Threatened</div><div style={S.mVal("#E24B4A")}>{threatened}</div></div><div style={{...S.card,padding:18}}><div style={S.mLabel}>Average score</div><div style={S.mVal("#1D9E75")}>{avg}</div></div></div></div>}

/* ─── SOURCES ─── */
function SourceMonitoring({sources}){return<div><div style={{fontSize:28,fontWeight:700,fontFamily:"Georgia,serif",marginBottom:16,color:"#2c2c2a"}}>Sources</div><div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:14}}>{sources.map(s=><div key={s.id} style={{...S.card,padding:14}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><div style={{fontSize:13,fontWeight:700,color:"#2c2c2a"}}>{s.source_name||s.name}</div>{s.freshness_score!=null&&<Dot color={freshC(s.freshness_score)} size={9}/>}</div><div style={{fontSize:11,color:"#77756e"}}>{s.source_type||"Unknown source"}</div>{s.freshness_score!=null&&<div style={{marginTop:10}}><MiniBar value={(s.freshness_score||0)*100} color={freshC(s.freshness_score)}/></div>}</div>)}</div></div>}

/* ─── ADMIN ─── */
function AdminView({species,pubs,researchers}){return<div><div style={{fontSize:28,fontWeight:700,fontFamily:"Georgia,serif",marginBottom:16,color:"#2c2c2a"}}>Admin</div><div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:14}}><div style={{...S.card,padding:18}}><div style={S.mLabel}>Species</div><div style={S.mVal("#534AB7")}>{species.length}</div></div><div style={{...S.card,padding:18}}><div style={S.mLabel}>Publications</div><div style={S.mVal("#185FA5")}>{pubs.length}</div></div><div style={{...S.card,padding:18}}><div style={S.mLabel}>Researchers</div><div style={S.mVal("#1D9E75")}>{researchers.length}</div></div></div></div>}

/* ─── APP ─── */
export default function Home(){
  const[user,setUser]=useState(null);
  const[view,setView]=useState("home");
  const[exp,setExp]=useState(null);
  const[side,setSide]=useState(true);
  const[loading,setLoading]=useState(true);
  const[dbOk,setDbOk]=useState(false);

  const[species,setSpecies]=useState([]);
  const[metabolites,setMetabolites]=useState([]);
  const[markets,setMarkets]=useState([]);
  const[institutions,setInstitutions]=useState([]);
  const[sources,setSources]=useState([]);
  const[publications,setPublications]=useState([]);
  const[researchers,setResearchers]=useState([]);
  const[detailSpecies,setDetailSpecies]=useState(null);

  const samplePrograms=[
    {
      id:"PRG-001",
      program_name:"Imperial Fritillaria Rescue Program",
      species_name:"Fritillaria imperialis",
      program_type:"Conservation Rescue",
      status:"Active",
      current_module:"Forge",
      current_gate:"Validation",
      readiness_score:58,
      confidence_score:66,
      next_action:"Protocol validation review",
      primary_blocker:"Insufficient ex situ protocol confidence"
    },
    {
      id:"PRG-002",
      program_name:"Cyclamen Propagation Platform",
      species_name:"Cyclamen hederifolium",
      program_type:"Propagation Program",
      status:"Active",
      current_module:"Forge",
      current_gate:"Protocol",
      readiness_score:63,
      confidence_score:71,
      next_action:"Consolidate propagation workflow",
      primary_blocker:"Transferability to scaled systems is not yet clear"
    },
    {
      id:"PRG-003",
      program_name:"Sternbergia Metabolite Discovery",
      species_name:"Sternbergia lutea",
      program_type:"Metabolite Discovery",
      status:"Draft",
      current_module:"Origin",
      current_gate:"Selection",
      readiness_score:39,
      confidence_score:54,
      next_action:"Expand evidence review and define compound targets",
      primary_blocker:"Weak metabolite validation depth"
    },
    {
      id:"PRG-004",
      program_name:"Endemic Orchid Conservation Pathway",
      species_name:"Ophrys apifera",
      program_type:"Conservation Rescue",
      status:"Blocked",
      current_module:"Accord",
      current_gate:"Governance",
      readiness_score:42,
      confidence_score:61,
      next_action:"Clarify governance and collection pathway",
      primary_blocker:"ABS and collection sensitivity are unresolved"
    },
    {
      id:"PRG-005",
      program_name:"Tulipa Premium Ornamental Line",
      species_name:"Tulipa orphanidea",
      program_type:"Premium Ornamental",
      status:"Active",
      current_module:"Exchange",
      current_gate:"Venture",
      readiness_score:74,
      confidence_score:69,
      next_action:"Define premium market route and pilot partners",
      primary_blocker:"Commercial route remains hypothesis-led"
    },
  ];

  useEffect(()=>{
    async function f(){
      try{
        const[sp,mt,mk,inst,src,res]=await Promise.all([
          supabase.from("species").select("*").order("composite_score",{ascending:false}),
          supabase.from("metabolites").select("*, species(accepted_name)"),
          supabase.from("market_intelligence").select("*, species(accepted_name)"),
          supabase.from("institutions").select("*").order("priority"),
          supabase.from("data_sources").select("*").order("freshness_score",{ascending:false}),
          supabase.from("researchers").select("*").order("h_index",{ascending:false,nullsFirst:false})
        ]);

        const pub=await fetchAllPublications();

        if(sp.data)setSpecies(sp.data);
        if(mt.data)setMetabolites(mt.data);
        if(mk.data)setMarkets(mk.data);
        if(inst.data)setInstitutions(inst.data);
        if(src.data)setSources(src.data);
        if(res.data)setResearchers(res.data);

        setPublications(pub);
        setDbOk(true);
      }catch(e){
        setDbOk(false);
      }finally{
        setLoading(false);
      }
    }
    f();
  },[]);

  if(!user)return <LoginScreen onLogin={setUser}/>;
  if(loading)return <Loading/>;

  const role=ROLES[user.role];
  const threatened=species.filter(s=>["CR","EN","VU"].includes(s.iucn_status)).length;

  const navItems=[
    {key:"home",label:"Home",icon:"🏠"},
    {key:"programs",label:"Programs",icon:"🧭"},
    {key:"species",label:"Species",icon:"🌿"},
    {key:"metabolites",label:"Metabolites",icon:"🧪"},
    {key:"market",label:"Market",icon:"💰"},
    {key:"publications",label:"Publications",icon:"📚"},
    {key:"researchers",label:"Researchers",icon:"👨‍🔬"},
    {key:"partners",label:"Institutions",icon:"🏛"},
    {key:"portfolio",label:"Portfolio",icon:"📊"},
    {key:"sources",label:"Sources",icon:"🔗"},
    ...(user.role==="admin"?[{key:"admin",label:"Admin",icon:"⚙️"}]:[])
  ];

  return (
    <div style={{display:"flex",minHeight:"100vh",background:"#f8f7f4"}}>
      <div style={{width:side?220:0,flexShrink:0,overflow:"hidden",background:"#fff",borderRight:"1px solid #e8e6e1",transition:"width 0.25s ease",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"18px 14px 14px",flex:1,overflow:"hidden"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:20}}>
            <div style={{width:32,height:32,borderRadius:8,background:"linear-gradient(145deg,#085041,#1D9E75)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{color:"#fff",fontSize:14,fontWeight:700,fontFamily:"Georgia,serif"}}>A</span>
            </div>
            <div>
              <div style={{fontSize:14,fontWeight:700,letterSpacing:-0.5,color:"#2c2c2a",fontFamily:"Georgia,serif"}}>GEOCON</div>
              <div style={{fontSize:7,color:"#b4b2a9",letterSpacing:1.5,textTransform:"uppercase"}}>ATLAS + PROGRAMS</div>
            </div>
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {navItems.map(it=>(
              <button
                key={it.key}
                onClick={()=>setView(it.key)}
                style={{
                  display:"flex",
                  alignItems:"center",
                  gap:10,
                  padding:"10px 12px",
                  border:"none",
                  borderRadius:10,
                  background:view===it.key?"#EEEDFE":"transparent",
                  color:view===it.key?"#3C3489":"#2c2c2a",
                  cursor:"pointer",
                  textAlign:"left",
                  fontSize:13,
                  fontWeight:view===it.key?700:500
                }}
              >
                <span>{it.icon}</span>
                <span>{it.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{padding:14,borderTop:"1px solid #efede8"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:10,background:role.accent}}>
            <div style={{width:30,height:30,borderRadius:8,background:role.color,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{color:"#fff",fontSize:13,fontWeight:700}}>{role.ic}</span>
            </div>
            <div style={{minWidth:0}}>
              <div style={{fontSize:12,fontWeight:700,color:"#2c2c2a"}}>{role.label}</div>
              <div style={{fontSize:10,color:"#77756e",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                {user.name}
              </div>
            </div>
          </div>

          <button
            onClick={()=>{setUser(null);setView("home");}}
            style={{marginTop:10,width:"100%",padding:"9px 10px",border:"1px solid #e8e6e1",borderRadius:10,background:"#fff",cursor:"pointer",fontSize:12,fontWeight:600,color:"#5f5e5a"}}
          >
            Exit
          </button>
        </div>
      </div>

      <div style={{flex:1,minWidth:0}}>
        <div style={{height:58,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 18px",borderBottom:"1px solid #e8e6e1",background:"rgba(248,247,244,0.92)",backdropFilter:"blur(8px)",position:"sticky",top:0,zIndex:10}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <button
              onClick={()=>setSide(!side)}
              style={{width:34,height:34,borderRadius:10,border:"1px solid #e8e6e1",background:"#fff",cursor:"pointer"}}
            >
              ☰
            </button>
            <div>
              <div style={{fontSize:15,fontWeight:700,color:"#2c2c2a",fontFamily:"Georgia,serif"}}>
                {view==="home"?"GEOCON Home":navItems.find(n=>n.key===view)?.label||"GEOCON"}
              </div>
             
