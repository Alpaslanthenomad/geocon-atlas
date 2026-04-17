"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

const ROLES={admin:{label:"Admin",desc:"Full platform access",ic:"A",color:"#534AB7",accent:"#EEEDFE"},researcher:{label:"Researcher",desc:"Species, conservation & science",ic:"R",color:"#1D9E75",accent:"#E1F5EE"},investor:{label:"Investor",desc:"Commercial, market & scoring",ic:"I",color:"#D85A30",accent:"#FAECE7"},producer:{label:"Producer",desc:"Production & compliance",ic:"P",color:"#639922",accent:"#EAF3DE"},policymaker:{label:"Policymaker",desc:"Conservation & regulatory",ic:"K",color:"#185FA5",accent:"#E6F1FB"}};
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
function LoginScreen({onLogin}){const[sel,setSel]=useState("admin");const[ready,setReady]=useState(false);useEffect(()=>{setTimeout(()=>setReady(true),100)},[]);return<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24,background:"#f8f7f4"}}><div style={{width:"100%",maxWidth:440,opacity:ready?1:0,transform:ready?"translateY(0)":"translateY(16px)",transition:"all 0.6s ease"}}><div style={{textAlign:"center",marginBottom:32}}><div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:60,height:60,borderRadius:16,background:"linear-gradient(145deg,#085041,#1D9E75)",marginBottom:14,boxShadow:"0 6px 24px rgba(8,80,65,0.25)"}}><span style={{color:"#fff",fontSize:26,fontWeight:700,fontFamily:"Georgia,serif"}}>A</span></div><h1 style={{fontSize:28,fontWeight:700,letterSpacing:-1,color:"#2c2c2a",margin:"0 0 4px",fontFamily:"Georgia,serif"}}>GEOCON <span style={{fontWeight:400,letterSpacing:3,fontSize:22}}>ATLAS</span></h1><p style={{fontSize:13,color:"#888",margin:0}}>Global geophyte intelligence platform</p><p style={{fontSize:10,color:"#b4b2a9",margin:"6px 0 0",letterSpacing:1}}>POWERED BY VENN BIOVENTURES</p></div><div style={{...S.card,padding:"24px 24px 20px"}}><p style={{fontSize:11,color:"#b4b2a9",margin:"0 0 14px",letterSpacing:0.5,textTransform:"uppercase"}}>Select your role</p><div style={{display:"flex",flexDirection:"column",gap:6}}>{Object.entries(ROLES).map(([k,r])=><button key={k} onClick={()=>setSel(k)} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",border:sel===k?`2px solid ${r.color}`:"1px solid #e8e6e1",borderRadius:10,background:sel===k?r.accent:"#fff",cursor:"pointer",transition:"all 0.15s",textAlign:"left"}}><div style={{width:34,height:34,borderRadius:8,background:r.color,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:"#fff",fontSize:14,fontWeight:600}}>{r.ic}</span></div><div style={{flex:1}}><div style={{fontSize:13,fontWeight:500,color:"#2c2c2a"}}>{r.label}</div><div style={{fontSize:10,color:"#b4b2a9"}}>{r.desc}</div></div>{sel===k&&<Dot color={r.color} size={8}/>}</button>)}</div><button onClick={()=>onLogin({name:sel==="admin"?"Alpaslan":ROLES[sel].label,role:sel})} style={{width:"100%",padding:"12px 0",border:"none",borderRadius:10,marginTop:18,background:ROLES[sel].color,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer"}} onMouseEnter={e=>e.target.style.opacity="0.9"} onMouseLeave={e=>e.target.style.opacity="1"}>Enter as {ROLES[sel].label}</button></div><div style={{display:"flex",justifyContent:"center",gap:20,marginTop:20,fontSize:10,color:"#b4b2a9"}}><span>Live database</span><span>8 modules</span><span>v2.5</span></div></div></div>}

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
      setPubs(pubR.data||[]);setMets(metR.data||[]);setCons(conR.data||[]);
      setGov(govR.data||null);setProp(propR.data||[]);setComm(commR.data||[]);setLocs(locR.data||[]);
      setLoading(false);
    });
  },[species?.id]);

  if(!species)return null;
  const c=FAMILY_COLORS[species.family]||DEF_FAM;

  const TABS=[
    {k:"pubs",l:`Publications (${pubs.length})`},
    {k:"mets",l:`Metabolites (${mets.length})`},
    {k:"cons",l:"Conservation"},
    {k:"gov",l:"Governance"},
    {k:"prop",l:"Propagation"},
    {k:"comm",l:"Commercial"},
    {k:"info",l:"Details"},
  ];

  const riskColor=r=>({high:"#A32D2D",medium:"#BA7517",low:"#0F6E56"}[r?.toLowerCase()]||"#888");
  const riskBg=r=>({high:"#FCEBEB",medium:"#FAEEDA",low:"#E1F5EE"}[r?.toLowerCase()]||"#f4f3ef");

  return<>
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.3)",zIndex:100}}/>
    <div style={{position:"fixed",top:0,right:0,bottom:0,width:540,background:"#fff",zIndex:101,display:"flex",flexDirection:"column",boxShadow:"-4px 0 24px rgba(0,0,0,0.12)"}}>
      {/* Header */}
      <div style={{flexShrink:0}}>
        {species.photo_url&&<div style={{height:200,overflow:"hidden",position:"relative"}}>
          <img src={species.photo_url} alt={species.accepted_name} style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center top"}} onError={e=>e.target.parentElement.style.display="none"}/>
          <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,transparent 30%,rgba(0,0,0,0.7))"}}/>
          <div style={{position:"absolute",bottom:12,left:16,right:40}}>
            <div style={{fontSize:9,color:"rgba(255,255,255,0.7)",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>{species.family}</div>
            <div style={{fontSize:20,fontWeight:700,fontStyle:"italic",color:"#fff",fontFamily:"Georgia,serif",lineHeight:1.2}}>{species.accepted_name}</div>
            {species.common_name&&<div style={{fontSize:12,color:"rgba(255,255,255,0.8)",marginTop:2}}>{species.common_name}</div>}
          </div>
          <button onClick={onClose} style={{position:"absolute",top:10,right:10,background:"rgba(0,0,0,0.4)",border:"none",borderRadius:"50%",width:28,height:28,cursor:"pointer",color:"#fff",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
          {species.photo_credit&&<div style={{position:"absolute",bottom:4,right:8,fontSize:8,color:"rgba(255,255,255,0.5)"}}>{species.photo_credit}</div>}
        </div>}
        <div style={{padding:"16px 20px",borderBottom:"1px solid #e8e6e1",background:c.bg}}>
          {!species.photo_url&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div style={{flex:1}}>
              <div style={{fontSize:9,color:c.text,opacity:0.7,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>{species.family}</div>
              <div style={{fontSize:18,fontWeight:700,fontStyle:"italic",color:"#2c2c2a",fontFamily:"Georgia,serif",lineHeight:1.3}}>{species.accepted_name}</div>
              {species.common_name&&<div style={{fontSize:12,color:"#888",marginTop:2}}>{species.common_name}</div>}
            </div>
            <button onClick={onClose} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#888",padding:"0 0 0 12px",lineHeight:1}}>✕</button>
          </div>}
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:species.photo_url?0:10}}>
            {species.iucn_status&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:99,background:iucnBg(species.iucn_status),color:iucnC(species.iucn_status),border:"0.5px solid currentColor"}}>IUCN: {species.iucn_status}</span>}
            {species.family&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:99,background:c.bg,color:c.text,border:`0.5px solid ${c.border}`}}>{species.family}</span>}
            {species.geophyte_type&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:99,background:"#f4f3ef",color:"#5f5e5a"}}>{species.geophyte_type}</span>}
            {species.country_focus&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:99,background:"#f4f3ef",color:"#5f5e5a"}}>{flag(species.country_focus)}</span>}
          </div>
        </div>
      </div>
      {/* Scores */}
      {(species.composite_score||species.score_conservation)&&<div style={{padding:"10px 20px",borderBottom:"1px solid #e8e6e1",display:"flex",gap:6,flexShrink:0}}>
        {[{l:"Composite",v:species.composite_score,c:"#1D9E75"},{l:"Conservation",v:species.score_conservation,c:"#E24B4A"},{l:"Venture",v:species.score_venture,c:"#185FA5"},{l:"TRL",v:species.trl_level,c:"#534AB7"}].map(m=>m.v?<div key={m.l} style={{flex:1,background:"#f4f3ef",borderRadius:8,padding:"6px 8px",textAlign:"center"}}><div style={{fontSize:8,color:"#999",textTransform:"uppercase",marginBottom:2}}>{m.l}</div><div style={{fontSize:16,fontWeight:700,color:m.c}}>{m.v}</div></div>:null)}
      </div>}
      {/* Tabs — scrollable */}
      <div style={{display:"flex",borderBottom:"1px solid #e8e6e1",flexShrink:0,overflowX:"auto"}}>
        {TABS.map(t=><button key={t.k} onClick={()=>setTab(t.k)} style={{flexShrink:0,padding:"10px 12px",border:"none",borderBottom:tab===t.k?"2px solid #1D9E75":"2px solid transparent",background:"none",cursor:"pointer",fontSize:11,fontWeight:tab===t.k?600:400,color:tab===t.k?"#1D9E75":"#888",whiteSpace:"nowrap"}}>{t.l}</button>)}
      </div>
      {/* Content */}
      <div style={{flex:1,overflowY:"auto",padding:"14px 20px"}}>
        {loading?<div style={{textAlign:"center",padding:40,color:"#999",fontSize:13}}>Loading...</div>:<>

          {/* PUBLICATIONS */}
          {tab==="pubs"&&<div>
            {pubs.length===0?<p style={{color:"#999",fontSize:13,textAlign:"center",padding:20}}>No publications found</p>:
            pubs.map(p=><div key={p.id} style={{marginBottom:10,padding:"10px 12px",background:"#f8f7f4",borderRadius:8,borderLeft:"3px solid #378ADD"}}>
              <div style={{fontSize:12,fontWeight:600,color:"#2c2c2a",lineHeight:1.4,marginBottom:4}}>
                {p.doi?<a href={p.doi} target="_blank" rel="noopener noreferrer" style={{color:"#185FA5",textDecoration:"none"}}>{(p.title||"").slice(0,100)}{(p.title||"").length>100?"...":""}</a>:(p.title||"").slice(0,100)}
              </div>
              <div style={{fontSize:10,color:"#888",marginBottom:4}}>{(p.authors||"").slice(0,60)}{(p.authors||"").length>60?"...":""}</div>
              <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                {p.year&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:99,background:"#E6F1FB",color:"#0C447C"}}>{p.year}</span>}
                {p.journal&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:99,background:"#EEEDFE",color:"#3C3489"}}>{p.journal.slice(0,25)}</span>}
                {p.source&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:99,background:"#FAECE7",color:"#712B13"}}>{p.source}</span>}
                {p.open_access&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:99,background:"#E1F5EE",color:"#085041"}}>OA</span>}
              </div>
              {p.abstract&&<div style={{fontSize:10,color:"#5f5e5a",marginTop:6,lineHeight:1.5}}>{p.abstract.slice(0,200)}...</div>}
            </div>)}
          </div>}

          {/* METABOLITES */}
          {tab==="mets"&&<div>
            {mets.length===0?<p style={{color:"#999",fontSize:13,textAlign:"center",padding:20}}>No metabolites yet — enrich cron will populate this</p>:
            mets.map(m=><div key={m.id} style={{marginBottom:10,padding:"10px 12px",background:"#f8f7f4",borderRadius:8,borderLeft:"3px solid #534AB7"}}>
              <div style={{fontSize:13,fontWeight:600,color:"#2c2c2a",marginBottom:4}}>{m.compound_name}</div>
              {m.reported_activity&&<div style={{fontSize:11,color:"#5f5e5a",marginBottom:6}}>{m.reported_activity}</div>}
              <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                {m.compound_class&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:99,background:"#EEEDFE",color:"#3C3489"}}>{m.compound_class}</span>}
                {m.activity_category&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:99,background:"#E1F5EE",color:"#085041"}}>{m.activity_category}</span>}
                {m.evidence&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:99,background:"#FAEEDA",color:"#633806"}}>{m.evidence}</span>}
                {m.therapeutic_area&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:99,background:"#FCEBEB",color:"#791F1F"}}>{m.therapeutic_area}</span>}
                {m.confidence&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:99,background:"#f4f3ef",color:"#5f5e5a"}}>Conf: {Math.round(m.confidence*100)}%</span>}
              </div>
            </div>)}
          </div>}

          {/* CONSERVATION */}
          {tab==="cons"&&<div>
            {cons.length===0?<div style={{textAlign:"center",padding:32}}>
              <p style={{color:"#999",fontSize:13,marginBottom:8}}>No conservation assessments yet</p>
              <p style={{color:"#b4b2a9",fontSize:11}}>Add data via Supabase → conservation table</p>
            </div>:cons.map(a=><div key={a.id} style={{marginBottom:12,padding:"12px 14px",background:"#f8f7f4",borderRadius:8,borderLeft:"3px solid #E24B4A"}}>
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

          {/* GOVERNANCE */}
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

          {/* PROPAGATION */}
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

          {/* COMMERCIAL */}
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

          {/* DETAILS */}
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
  </>;
}

/* ─── SPECIES CARD (score view) ─── */
function SpeciesCard({sp,expanded,onToggle,onDetailClick}){
  const sc={conservation:"#E24B4A",science:"#534AB7",production:"#1D9E75",governance:"#D85A30",venture:"#185FA5"};
  const scores={conservation:sp.score_conservation,science:sp.score_science,production:sp.score_production,governance:sp.score_governance,venture:sp.score_venture};
  return<div onClick={onToggle} style={{...S.card,cursor:"pointer",border:expanded?"2px solid #85B7EB":"1px solid #e8e6e1",transition:"all 0.2s",overflow:"hidden"}}>
    <div style={{height:3,background:`linear-gradient(90deg,${iucnC(sp.iucn_status)}88,${decC(sp.decision)}88)`}}/>
    {sp.thumbnail_url&&<div style={{height:100,overflow:"hidden",position:"relative"}}>
      <img src={sp.thumbnail_url} alt={sp.accepted_name} style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center"}} onError={e=>e.target.style.display="none"}/>
      <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,transparent 40%,rgba(0,0,0,0.5))"}}/>
      <div style={{position:"absolute",bottom:6,left:10,right:10,display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
        <span style={{fontSize:12,fontWeight:600,fontStyle:"italic",color:"#fff",fontFamily:"Georgia,serif",textShadow:"0 1px 3px rgba(0,0,0,0.8)"}}>{sp.accepted_name}</span>
        <div style={{display:"flex",flexDirection:"column",gap:2,alignItems:"flex-end"}}>
          <Pill color={iucnC(sp.iucn_status)} bg={iucnBg(sp.iucn_status)}>{sp.iucn_status||"NE"}</Pill>
          <Pill color={decC(sp.decision)} bg={decBg(sp.decision)}>{sp.decision}</Pill>
        </div>
      </div>
    </div>}
    <div style={{padding:"12px 14px 10px"}}>
      {!sp.thumbnail_url&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:6,marginBottom:8}}>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <span style={{fontSize:13}}>{flag(sp.country_focus)}</span>
            <span style={{fontSize:13,fontWeight:600,fontStyle:"italic",color:"#2c2c2a",fontFamily:"Georgia,serif"}}>{sp.accepted_name}</span>
          </div>
          <div style={{fontSize:9,color:"#b4b2a9",marginTop:1}}>{sp.family} · {sp.geophyte_type} · {sp.region}</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:2}}>
          <Pill color={iucnC(sp.iucn_status)} bg={iucnBg(sp.iucn_status)}>{sp.iucn_status||"NE"}</Pill>
          <Pill color={decC(sp.decision)} bg={decBg(sp.decision)}>{sp.decision}</Pill>
        </div>
      </div>}
      {sp.thumbnail_url&&<div style={{fontSize:9,color:"#b4b2a9",marginBottom:6}}>{sp.family} · {sp.geophyte_type} · {sp.region}</div>}
      <div style={{display:"flex",gap:10,alignItems:"center"}}>
        <div style={{flex:1}}>{Object.entries(scores).map(([k,v])=><div key={k} style={{display:"flex",alignItems:"center",gap:5,marginBottom:3}}><span style={{fontSize:8,color:"#b4b2a9",width:32,textAlign:"right"}}>{k.slice(0,5)}</span><MiniBar value={v||0} color={sc[k]} h={4}/><span style={{fontSize:8,fontWeight:600,color:"#5f5e5a",width:16,textAlign:"right"}}>{v||0}</span></div>)}</div>
        <RadarChart scores={scores} size={85}/>
      </div>
      <div style={{display:"flex",gap:4,marginTop:8}}>{[{l:"Comp.",v:sp.composite_score},{l:"TRL",v:sp.trl_level},{l:"Conf.",v:`${sp.confidence||0}%`}].map(m=><div key={m.l} style={{flex:1,...S.metric,textAlign:"center",padding:"4px 6px"}}><div style={{fontSize:7,color:"#999",textTransform:"uppercase"}}>{m.l}</div><div style={{fontSize:13,fontWeight:700,color:"#2c2c2a"}}>{m.v}</div></div>)}</div>
    </div>
    {expanded&&<div style={{padding:"0 14px 14px",borderTop:"1px solid #e8e6e1",paddingTop:12}}>
      <p style={{fontSize:11,color:"#5f5e5a",margin:"0 0 8px",lineHeight:1.5}}>{sp.decision_rationale}</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px 14px",fontSize:10}}>{[{l:"Spin-off",v:sp.spinoff_link},{l:"Market",v:`${sp.market_area} (${sp.market_size})`},{l:"Habitat",v:sp.habitat},{l:"TC",v:sp.tc_status}].map(({l,v})=><div key={l}><span style={{color:"#b4b2a9",fontSize:9}}>{l}</span><div style={{color:"#2c2c2a",fontWeight:500}}>{v||"—"}</div></div>)}</div>
      <button onClick={e=>{e.stopPropagation();onDetailClick&&onDetailClick();}} style={{marginTop:10,fontSize:11,padding:"5px 14px",border:"1px solid #1D9E75",borderRadius:6,background:"none",color:"#1D9E75",cursor:"pointer",fontWeight:500}}>Yayınlar & Metabolitler →</button>
      {sp.photo_credit&&<div style={{fontSize:8,color:"#b4b2a9",marginTop:4}}>{sp.photo_credit}</div>}
      <div style={{fontSize:8,color:"#b4b2a9",marginTop:2}}>Verified: {sp.last_verified} · {sp.id}</div>
    </div>}
  </div>
}

/* ─── FAMILY SPECIES CARD ─── */
function FamilySpeciesCard({sp,onClick}){
  const c=FAMILY_COLORS[sp.family]||DEF_FAM;
  return<div onClick={onClick} style={{background:"#fff",border:"0.5px solid #e8e6e1",borderLeft:`3px solid ${c.dot}`,borderRadius:10,cursor:"pointer",transition:"box-shadow 0.15s",overflow:"hidden"}} onMouseEnter={e=>e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,0.08)"} onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
    {sp.thumbnail_url&&<div style={{height:80,overflow:"hidden",position:"relative"}}>
      <img src={sp.thumbnail_url} alt={sp.accepted_name} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.parentElement.style.display="none"}/>
      <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,transparent 30%,rgba(0,0,0,0.4))"}}/>
    </div>}
    <div style={{padding:"8px 12px 10px"}}>
      <p style={{margin:"0 0 4px",fontSize:12,fontStyle:"italic",fontWeight:600,color:"#2c2c2a"}}>{sp.accepted_name}</p>
      {sp.common_name&&<p style={{margin:"0 0 4px",fontSize:10,color:"#888"}}>{sp.common_name}</p>}
      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
        {sp.iucn_status&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:99,background:iucnBg(sp.iucn_status),color:iucnC(sp.iucn_status),border:"0.5px solid currentColor"}}>IUCN: {sp.iucn_status}</span>}
        {sp.country_focus&&<span style={{fontSize:10,color:"#b4b2a9"}}>{flag(sp.country_focus)}</span>}
      </div>
    </div>
  </div>
}

/* ─── FAMILY GROUP ─── */
function FamilyGroup({family,species,defaultOpen,onSpeciesClick}){const[open,setOpen]=useState(defaultOpen);const c=FAMILY_COLORS[family]||DEF_FAM;return<div style={{marginBottom:10}}><button onClick={()=>setOpen(!open)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",background:c.bg,border:`0.5px solid ${c.border}`,borderRadius:open?"10px 10px 0 0":"10px",padding:"9px 14px",cursor:"pointer"}}><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{width:8,height:8,borderRadius:"50%",background:c.dot,display:"inline-block",flexShrink:0}}/><span style={{fontSize:13,fontWeight:600,color:c.text}}>{family}</span></div><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:11,color:c.text,opacity:0.7}}>{species.length} tür</span><span style={{fontSize:11,color:c.text,opacity:0.5}}>{open?"▲":"▼"}</span></div></button>{open&&<div style={{border:`0.5px solid ${c.border}`,borderTop:"none",borderRadius:"0 0 10px 10px",padding:10,display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:8,background:"#f8f7f4"}}>{species.map(s=><FamilySpeciesCard key={s.id} sp={s} onClick={()=>onSpeciesClick(s)}/>)}</div>}</div>}

/* ─── SPECIES MODULE ─── */
function SpeciesModule({species,exp,setExp,onSpeciesClick}){
  const[selectedFamily,setSelectedFamily]=useState(null);
  const[search,setSearch]=useState("");
  const[fC,setFC]=useState("all");

  const FAMILY_ORDER=["Asparagaceae","Amaryllidaceae","Orchidaceae","Araceae","Liliaceae","Iridaceae","Ranunculaceae","Primulaceae","Colchicaceae","Gentianaceae","Paeoniaceae","Nymphaeaceae","Geraniaceae","Tecophilaeaceae","Alstroemeriaceae"];
  const families=[...new Set(species.map(s=>s.family).filter(Boolean))].sort((a,b)=>{const ai=FAMILY_ORDER.indexOf(a),bi=FAMILY_ORDER.indexOf(b);return(ai===-1?99:ai)-(bi===-1?99:bi);});
  const countries=[...new Set(species.map(s=>s.country_focus).filter(Boolean))];

  const familySpecies=selectedFamily?species.filter(s=>s.family===selectedFamily&&(!search||(s.accepted_name||"").toLowerCase().includes(search.toLowerCase()))&&(fC==="all"||s.country_focus===fC)):[];

  function FamilyCard({family}){
    const members=species.filter(s=>s.family===family);
    const withPhoto=members.find(s=>s.thumbnail_url);
    const c=FAMILY_COLORS[family]||DEF_FAM;
    const threatened=members.filter(s=>["CR","EN","VU"].includes(s.iucn_status)).length;
    return<div onClick={()=>setSelectedFamily(family)} style={{background:"#fff",border:`1px solid ${selectedFamily===family?c.border:"#e8e6e1"}`,borderRadius:14,overflow:"hidden",cursor:"pointer",transition:"all 0.2s",boxShadow:selectedFamily===family?"0 0 0 2px "+c.border:"none"}} onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"} onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
      <div style={{height:90,overflow:"hidden",position:"relative",background:c.bg}}>
        {withPhoto?<img src={withPhoto.thumbnail_url} alt={family} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>
        :<div style={{width:"100%",height:"100%",background:c.bg,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:28,opacity:0.5}}>🌿</span></div>}
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,transparent 40%,rgba(0,0,0,0.55))"}}/>
        <div style={{position:"absolute",bottom:6,left:8,right:8,display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
          <span style={{fontSize:10,fontWeight:600,color:"#fff",textShadow:"0 1px 2px rgba(0,0,0,0.8)",lineHeight:1.3}}>{family}</span>
          {threatened>0&&<span style={{fontSize:8,padding:"1px 5px",borderRadius:99,background:"rgba(162,45,45,0.85)",color:"#fff"}}>{threatened}⚠</span>}
        </div>
      </div>
      <div style={{padding:"7px 10px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:11,color:"#5f5e5a"}}>{members.length} species</span>
        <div style={{display:"flex",gap:2}}>
          {["CR","EN","VU"].map(s=>{const n=members.filter(m=>m.iucn_status===s).length;return n>0?<span key={s} style={{fontSize:8,padding:"1px 4px",borderRadius:99,background:iucnBg(s),color:iucnC(s)}}>{s}:{n}</span>:null;})}
        </div>
      </div>
    </div>;
  }

  function SpeciesRow({sp}){
    const c=FAMILY_COLORS[sp.family]||DEF_FAM;
    return<div onClick={()=>onSpeciesClick(sp)} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:"#fff",borderRadius:8,border:"1px solid #e8e6e1",cursor:"pointer",transition:"background 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background="#f8f7f4"} onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
      <div style={{width:44,height:44,borderRadius:8,overflow:"hidden",flexShrink:0,background:c.bg}}>
        {sp.thumbnail_url?<img src={sp.thumbnail_url} alt={sp.accepted_name} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.parentElement.style.background=c.bg}/>
        :<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:18}}>🌿</span></div>}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13,fontWeight:600,fontStyle:"italic",color:"#2c2c2a",fontFamily:"Georgia,serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sp.accepted_name}</div>
        <div style={{fontSize:10,color:"#b4b2a9",marginTop:1}}>{sp.geophyte_type||"—"} · {sp.region||sp.country_focus||"—"}</div>
      </div>
      <div style={{display:"flex",gap:5,alignItems:"center",flexShrink:0}}>
        {sp.iucn_status&&<span style={{fontSize:9,padding:"2px 6px",borderRadius:99,background:iucnBg(sp.iucn_status),color:iucnC(sp.iucn_status)}}>{sp.iucn_status}</span>}
        {sp.decision&&<span style={{fontSize:9,padding:"2px 6px",borderRadius:99,background:decBg(sp.decision),color:decC(sp.decision)}}>{sp.decision}</span>}
        {sp.composite_score?<span style={{fontSize:12,fontWeight:700,color:"#1D9E75",minWidth:22,textAlign:"right"}}>{sp.composite_score}</span>:null}
        <span style={{color:"#b4b2a9",fontSize:14}}>›</span>
      </div>
    </div>;
  }

  return<div>
    {!selectedFamily?<>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
        <div>
          <div style={{fontSize:16,fontWeight:700,color:"#2c2c2a",fontFamily:"Georgia,serif"}}>Species Families</div>
          <div style={{fontSize:11,color:"#888",marginTop:2}}>{species.length} species · {families.length} families · select a family to explore</div>
        </div>
        <div style={{display:"flex",gap:6}}>
          {[{l:"Total",v:species.length,c:"#1D9E75"},{l:"Threatened",v:species.filter(s=>["CR","EN","VU"].includes(s.iucn_status)).length,c:"#E24B4A"},{l:"TR",v:species.filter(s=>s.country_focus==="TR").length,c:"#185FA5"},{l:"CL",v:species.filter(s=>s.country_focus==="CL").length,c:"#D85A30"}].map(s=><div key={s.l} style={{textAlign:"center",padding:"5px 10px",background:"#f4f3ef",borderRadius:8}}><div style={{fontSize:14,fontWeight:700,color:s.c}}>{s.v}</div><div style={{fontSize:9,color:"#999"}}>{s.l}</div></div>)}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:10}}>
        {families.map(f=><FamilyCard key={f} family={f}/>)}
      </div>
    </>:<>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
        <button onClick={()=>{setSelectedFamily(null);setSearch("");setFC("all");}} style={{padding:"6px 12px",border:"1px solid #e8e6e1",borderRadius:7,background:"#fff",cursor:"pointer",fontSize:11,color:"#888"}}>← Families</button>
        <div style={{flex:1}}>
          <div style={{fontSize:15,fontWeight:700,color:"#2c2c2a",fontFamily:"Georgia,serif"}}>{selectedFamily}</div>
          <div style={{fontSize:11,color:"#888"}}>{familySpecies.length} species</div>
        </div>
      </div>
      <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
        <input type="text" placeholder="Search species..." value={search} onChange={e=>setSearch(e.target.value)} style={{flex:"1 1 160px",...S.input}}/>
        <select value={fC} onChange={e=>setFC(e.target.value)} style={S.input}>
          <option value="all">All countries</option>
          {countries.map(c=><option key={c} value={c}>{c==="TR"?"Türkiye":"Chile"}</option>)}
        </select>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {familySpecies.length===0?<div style={{textAlign:"center",padding:40,color:"#999",fontSize:13}}>No species found</div>
        :familySpecies.map(sp=><SpeciesRow key={sp.id} sp={sp}/>)}
      </div>
    </>}
  </div>;
}

/* ─── METABOLITE EXPLORER ─── */
function MetaboliteExplorer({metabolites}){
  const[selectedCat,setSelectedCat]=useState(null);
  const[search,setSearch]=useState("");
  const[expanded,setExpanded]=useState(null);

  const CAT_META={
    alkaloid:{icon:"🔵",color:"#534AB7",bg:"#EEEDFE",desc:"Nitrogen-containing plant compounds"},
    flavonoid:{icon:"🟡",color:"#BA7517",bg:"#FAEEDA",desc:"Polyphenolic antioxidants"},
    terpenoid:{icon:"🟢",color:"#0F6E56",bg:"#E1F5EE",desc:"Terpenes & terpenoids"},
    phenolic:{icon:"🟤",color:"#854F0B",bg:"#FAEEDA",desc:"Phenolic acids & compounds"},
    saponin:{icon:"🔴",color:"#993556",bg:"#FBEAF0",desc:"Steroid & triterpenoid saponins"},
    glycoside:{icon:"🟣",color:"#185FA5",bg:"#E6F1FB",desc:"Sugar-containing compounds"},
    steroid:{icon:"⚪",color:"#639922",bg:"#EAF3DE",desc:"Steroidal compounds"},
    "amino acid":{icon:"🔶",color:"#D85A30",bg:"#FAECE7",desc:"Amino acids & peptides"},
    other:{icon:"⬜",color:"#888780",bg:"#F1EFE8",desc:"Other compound classes"},
  };

  const CATS=Object.keys(CAT_META);

  // Count per category
  const catCounts={};
  for(const cat of CATS){
    catCounts[cat]=metabolites.filter(m=>(m.activity_category||"other")===cat).length;
  }

  const catMets=selectedCat?metabolites.filter(m=>{
    const matchCat=(m.activity_category||"other")===selectedCat;
    const matchSearch=!search||(m.compound_name||"").toLowerCase().includes(search.toLowerCase())||(m.species?.accepted_name||"").toLowerCase().includes(search.toLowerCase())||(m.reported_activity||"").toLowerCase().includes(search.toLowerCase());
    return matchCat&&matchSearch;
  }):[];

  return<div>
    {!selectedCat?<>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
        <div>
          <div style={{fontSize:16,fontWeight:700,color:"#2c2c2a",fontFamily:"Georgia,serif"}}>Metabolites</div>
          <div style={{fontSize:11,color:"#888",marginTop:2}}>{metabolites.length} compounds · {CATS.length} categories · select a category to explore</div>
        </div>
        <div style={{display:"flex",gap:6}}>
          {[{l:"Total",v:metabolites.length,c:"#534AB7"},{l:"KNApSAcK",v:metabolites.filter(m=>m.source==="KNApSAcK").length,c:"#0F6E56"},{l:"Species",v:[...new Set(metabolites.map(m=>m.species_id).filter(Boolean))].length,c:"#185FA5"}].map(s=><div key={s.l} style={{textAlign:"center",padding:"5px 10px",background:"#f4f3ef",borderRadius:8}}><div style={{fontSize:14,fontWeight:700,color:s.c}}>{s.v}</div><div style={{fontSize:9,color:"#999"}}>{s.l}</div></div>)}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:10}}>
        {CATS.map(cat=>{
          const m=CAT_META[cat];
          const count=catCounts[cat]||0;
          const topMets=metabolites.filter(me=>(me.activity_category||"other")===cat).slice(0,3);
          return<div key={cat} onClick={()=>{setSelectedCat(cat);setSearch("");}} style={{background:"#fff",border:"1px solid #e8e6e1",borderRadius:12,overflow:"hidden",cursor:"pointer",transition:"all 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=m.color;e.currentTarget.style.transform="translateY(-2px)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="#e8e6e1";e.currentTarget.style.transform="translateY(0)";}}>
            <div style={{background:m.bg,padding:"14px 14px 10px",borderBottom:`1px solid ${m.color}22`}}>
              <div style={{fontSize:24,marginBottom:6}}>{m.icon}</div>
              <div style={{fontSize:13,fontWeight:700,color:m.color,textTransform:"capitalize"}}>{cat}</div>
              <div style={{fontSize:10,color:"#888",marginTop:2}}>{m.desc}</div>
            </div>
            <div style={{padding:"10px 14px"}}>
              <div style={{fontSize:20,fontWeight:700,color:"#2c2c2a",marginBottom:6}}>{count}</div>
              <div style={{display:"flex",flexDirection:"column",gap:2}}>
                {topMets.map(me=><div key={me.id} style={{fontSize:9,color:"#b4b2a9",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{(me.compound_name||"").slice(0,40)}{(me.compound_name||"").length>40?"...":""}</div>)}
              </div>
            </div>
          </div>;
        })}
      </div>
    </>:<>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
        <button onClick={()=>{setSelectedCat(null);setSearch("");}} style={{padding:"6px 12px",border:"1px solid #e8e6e1",borderRadius:7,background:"#fff",cursor:"pointer",fontSize:11,color:"#888"}}>← Categories</button>
        <div style={{flex:1,display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:20}}>{CAT_META[selectedCat]?.icon}</span>
          <div>
            <div style={{fontSize:15,fontWeight:700,color:CAT_META[selectedCat]?.color,textTransform:"capitalize"}}>{selectedCat}</div>
            <div style={{fontSize:11,color:"#888"}}>{catMets.length} compounds</div>
          </div>
        </div>
      </div>
      <input type="text" placeholder="Search compound, species, or activity..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:"100%",marginBottom:12,...S.input}}/>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {catMets.length===0?<div style={{textAlign:"center",padding:40,color:"#999",fontSize:13}}>No compounds found</div>
        :catMets.map(m=><div key={m.id} onClick={()=>setExpanded(expanded===m.id?null:m.id)} style={{background:"#fff",border:expanded===m.id?"1px solid #85B7EB":"1px solid #e8e6e1",borderRadius:8,padding:"10px 12px",cursor:"pointer",borderLeft:`3px solid ${CAT_META[selectedCat]?.color||"#888"}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:600,color:"#2c2c2a"}}>{m.compound_name}</div>
              <div style={{fontSize:10,fontStyle:"italic",color:"#888",marginTop:2}}>{m.species?.accepted_name||"—"}</div>
            </div>
            <div style={{display:"flex",gap:4,alignItems:"center",flexShrink:0}}>
              {m.evidence&&<span style={{fontSize:9,padding:"2px 6px",borderRadius:99,background:"#E1F5EE",color:"#085041"}}>{m.evidence}</span>}
              {m.confidence&&<span style={{fontSize:10,fontWeight:700,color:CAT_META[selectedCat]?.color}}>{Math.round(m.confidence*100)}%</span>}
            </div>
          </div>
          {m.reported_activity&&<div style={{fontSize:11,color:"#5f5e5a",marginTop:6,lineHeight:1.5}}>{m.reported_activity.slice(0,120)}{m.reported_activity.length>120?"...":""}</div>}
          {m.compound_class&&<div style={{fontSize:10,color:"#b4b2a9",marginTop:4}}>{m.compound_class}</div>}
          {expanded===m.id&&<div style={{marginTop:10,paddingTop:10,borderTop:"1px solid #e8e6e1"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px 14px",fontSize:11}}>
              {[{l:"Plant organ",v:m.plant_organ},{l:"Source",v:m.source},{l:"Therapeutic area",v:m.therapeutic_area},{l:"Confidence",v:m.confidence?`${Math.round(m.confidence*100)}%`:null}].map(({l,v})=>v?<div key={l}><span style={{color:"#b4b2a9",fontSize:9,textTransform:"uppercase"}}>{l}</span><div style={{color:"#2c2c2a",fontWeight:500}}>{v}</div></div>:null)}
            </div>
            {m.notes&&<div style={{fontSize:10,color:"#5f5e5a",marginTop:8,fontStyle:"italic"}}>{m.notes}</div>}
          </div>}
        </div>)}
      </div>
    </>}
  </div>;
}

/* ─── MARKET VIEW ─── */
function MarketView({markets}){const[expanded,setExpanded]=useState(null);return<div><div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>{[{l:"Hypotheses",v:markets.length},{l:"Spin-offs",v:[...new Set(markets.map(m=>m.spinoff_link))].length},{l:"Near-ready",v:markets.filter(m=>(m.market_readiness||"").includes("6-12")).length}].map(s=><div key={s.l} style={{flex:"1 1 110px",...S.metric}}><div style={S.mLabel}>{s.l}</div><div style={S.mVal()}>{s.v}</div></div>)}</div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:10}}>{markets.map(m=><div key={m.id} onClick={()=>setExpanded(expanded===m.id?null:m.id)} style={{...S.card,padding:16,cursor:"pointer",border:expanded===m.id?"2px solid #85B7EB":"1px solid #e8e6e1"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}><div><div style={{fontSize:14,fontWeight:600,color:"#2c2c2a"}}>{m.application_area}</div><div style={{fontSize:10,fontStyle:"italic",color:"#888"}}>{m.species?.accepted_name||"—"} — {m.market_segment}</div></div>{m.spinoff_link&&<Pill color="#085041" bg="#E1F5EE">{m.spinoff_link}</Pill>}</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:8}}><div style={{...S.metric,textAlign:"center",padding:6}}><div style={{fontSize:8,color:"#999",textTransform:"uppercase"}}>Size</div><div style={{fontSize:14,fontWeight:700,color:"#1D9E75"}}>{m.market_size_usd}</div></div><div style={{...S.metric,textAlign:"center",padding:6}}><div style={{fontSize:8,color:"#999",textTransform:"uppercase"}}>CAGR</div><div style={{fontSize:14,fontWeight:700,color:"#534AB7"}}>{m.market_cagr}</div></div><div style={{...S.metric,textAlign:"center",padding:6}}><div style={{fontSize:8,color:"#999",textTransform:"uppercase"}}>Price</div><div style={{fontSize:11,fontWeight:700,color:"#D85A30"}}>{m.price_range}</div></div></div><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{m.target_geography&&<Pill color="#0C447C" bg="#E6F1FB">{m.target_geography}</Pill>}{m.demand_trend&&<Pill color="#085041" bg="#E1F5EE">{m.demand_trend}</Pill>}{m.market_readiness&&<Pill color="#854F0B" bg="#FAEEDA">{m.market_readiness}</Pill>}</div>{expanded===m.id&&<div style={{marginTop:10,paddingTop:10,borderTop:"1px solid #e8e6e1",fontSize:11}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px 14px"}}>{[{l:"Buyers",v:m.key_buyers},{l:"Competitors",v:m.competitor_products},{l:"Differentiation",v:m.differentiation},{l:"Supply gap",v:m.supply_gap},{l:"Certification",v:m.certification_required},{l:"Revenue model",v:m.revenue_model}].map(({l,v})=><div key={l}><span style={{color:"#b4b2a9",fontSize:9}}>{l}</span><div style={{color:"#2c2c2a",fontWeight:500}}>{v||"—"}</div></div>)}</div></div>}</div>)}</div></div>}

/* ─── PUBLICATIONS VIEW ─── */
function PublicationsView({publications}){
  const[selectedCat,setSelectedCat]=useState(null);
  const[search,setSearch]=useState("");
  const[page,setPage]=useState(0);
  const[expanded,setExpanded]=useState(null);
  const PAGE_SIZE=30;

  const CAT_META={
    Phytochemistry:{icon:"⚗️",color:"#534AB7",bg:"#EEEDFE",desc:"Metabolites, compounds, chemical analysis"},
    Conservation:{icon:"🛡",color:"#A32D2D",bg:"#FCEBEB",desc:"Threatened species, habitat, population"},
    Agronomy:{icon:"🌾",color:"#639922",bg:"#EAF3DE",desc:"Cultivation, yield, crop production"},
    Pharmacology:{icon:"💊",color:"#185FA5",bg:"#E6F1FB",desc:"Medical activity, therapeutic, clinical"},
    Taxonomy:{icon:"🔬",color:"#854F0B",bg:"#FAEEDA",desc:"Systematics, phylogeny, classification"},
    Ecology:{icon:"🌍",color:"#0F6E56",bg:"#E1F5EE",desc:"Distribution, habitat, occurrence"},
    Biotechnology:{icon:"🧬",color:"#993556",bg:"#FBEAF0",desc:"Tissue culture, in vitro, genetic"},
    Other:{icon:"📄",color:"#888780",bg:"#F1EFE8",desc:"Other topics"},
  };

  const CATS=Object.keys(CAT_META);
  const catCounts={};
  for(const cat of CATS) catCounts[cat]=publications.filter(p=>p.category===cat).length;

  const catPubs=selectedCat?publications.filter(p=>p.category===selectedCat&&(!search||(p.title||"").toLowerCase().includes(search.toLowerCase())||(p.authors||"").toLowerCase().includes(search.toLowerCase()))):[];
  const totalPages=Math.ceil(catPubs.length/PAGE_SIZE);
  const paginated=catPubs.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE);

  const uncategorized=publications.filter(p=>!p.category).length;

  return<div>
    {!selectedCat?<>
      {/* Category grid */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
        <div>
          <div style={{fontSize:16,fontWeight:700,color:"#2c2c2a",fontFamily:"Georgia,serif"}}>Publications</div>
          <div style={{fontSize:11,color:"#888",marginTop:2}}>{publications.length} publications · {CATS.length} categories · select a category to browse</div>
        </div>
        <div style={{display:"flex",gap:6}}>
          {[{l:"Total",v:publications.length,c:"#185FA5"},{l:"Open Access",v:publications.filter(p=>p.open_access).length,c:"#0F6E56"},{l:"With Abstract",v:publications.filter(p=>p.abstract).length,c:"#534AB7"}].map(s=><div key={s.l} style={{textAlign:"center",padding:"5px 10px",background:"#f4f3ef",borderRadius:8}}><div style={{fontSize:14,fontWeight:700,color:s.c}}>{s.v}</div><div style={{fontSize:9,color:"#999"}}>{s.l}</div></div>)}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}}>
        {CATS.map(cat=>{
          const m=CAT_META[cat];
          const count=catCounts[cat]||0;
          const topPubs=publications.filter(p=>p.category===cat).slice(0,3);
          return<div key={cat} onClick={()=>{setSelectedCat(cat);setPage(0);setSearch("");}} style={{background:"#fff",border:`1px solid #e8e6e1`,borderRadius:12,overflow:"hidden",cursor:"pointer",transition:"all 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=m.color;e.currentTarget.style.transform="translateY(-2px)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="#e8e6e1";e.currentTarget.style.transform="translateY(0)";}}>
            <div style={{background:m.bg,padding:"14px 14px 10px",borderBottom:`1px solid ${m.color}22`}}>
              <div style={{fontSize:24,marginBottom:6}}>{m.icon}</div>
              <div style={{fontSize:13,fontWeight:700,color:m.color}}>{cat}</div>
              <div style={{fontSize:10,color:"#888",marginTop:2}}>{m.desc}</div>
            </div>
            <div style={{padding:"10px 14px"}}>
              <div style={{fontSize:20,fontWeight:700,color:"#2c2c2a",marginBottom:6}}>{count}</div>
              <div style={{display:"flex",flexDirection:"column",gap:2}}>
                {topPubs.map(p=><div key={p.id} style={{fontSize:9,color:"#b4b2a9",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{(p.title||"").slice(0,45)}{(p.title||"").length>45?"...":""}</div>)}
              </div>
            </div>
          </div>;
        })}
      </div>
      {uncategorized>0&&<div style={{marginTop:12,padding:"8px 12px",background:"#FAEEDA",borderRadius:8,fontSize:11,color:"#633806"}}>⚠ {uncategorized} publications not yet categorized</div>}
    </>:<>
      {/* Category detail */}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
        <button onClick={()=>{setSelectedCat(null);setSearch("");}} style={{padding:"6px 12px",border:"1px solid #e8e6e1",borderRadius:7,background:"#fff",cursor:"pointer",fontSize:11,color:"#888"}}>← Categories</button>
        <div style={{flex:1,display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:20}}>{CAT_META[selectedCat]?.icon}</span>
          <div>
            <div style={{fontSize:15,fontWeight:700,color:CAT_META[selectedCat]?.color}}>{selectedCat}</div>
            <div style={{fontSize:11,color:"#888"}}>{catPubs.length} publications</div>
          </div>
        </div>
      </div>
      <input type="text" placeholder="Search title or author..." value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}} style={{width:"100%",marginBottom:12,...S.input}}/>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {paginated.map(p=><div key={p.id} onClick={()=>setExpanded(expanded===p.id?null:p.id)} style={{background:"#fff",border:expanded===p.id?"1px solid #85B7EB":"1px solid #e8e6e1",borderRadius:8,padding:"10px 12px",cursor:"pointer",borderLeft:`3px solid ${CAT_META[selectedCat]?.color||"#888"}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:600,color:"#2c2c2a",lineHeight:1.4}}>
                {p.doi?<a href={p.doi} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{color:"#185FA5",textDecoration:"none"}}>{(p.title||"Untitled").slice(0,120)}{(p.title||"").length>120?"...":""}</a>:(p.title||"Untitled").slice(0,120)}
              </div>
              <div style={{fontSize:10,color:"#888",marginTop:3}}>{(p.authors||"").slice(0,80)}{(p.authors||"").length>80?"...":""}</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:3,alignItems:"flex-end",flexShrink:0}}>
              {p.year&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:99,background:"#E6F1FB",color:"#0C447C"}}>{p.year}</span>}
              {p.open_access&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:99,background:"#E1F5EE",color:"#085041"}}>OA</span>}
            </div>
          </div>
          {p.journal&&<div style={{fontSize:10,color:"#b4b2a9",marginTop:4,fontStyle:"italic"}}>{p.journal.slice(0,60)}</div>}
          {expanded===p.id&&<div style={{marginTop:10,paddingTop:10,borderTop:"1px solid #e8e6e1"}}>
            {p.abstract?<div style={{fontSize:11,color:"#5f5e5a",lineHeight:1.6,marginBottom:8}}>{p.abstract.slice(0,500)}{p.abstract.length>500?"...":""}</div>
            :<div style={{fontSize:11,color:"#b4b2a9",fontStyle:"italic",marginBottom:8}}>No abstract available — {p.doi?<a href={p.doi} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{color:"#185FA5"}}>view full paper ↗</a>:"no DOI"}</div>}
            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
              {p.source&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:99,background:"#FAECE7",color:"#712B13"}}>{p.source}</span>}
              {p.cited_by_count&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:99,background:"#f4f3ef",color:"#5f5e5a"}}>Cited: {p.cited_by_count}</span>}
            </div>
          </div>}
        </div>)}
      </div>
      {totalPages>1&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginTop:16}}>
        <button onClick={()=>setPage(0)} disabled={page===0} style={{...S.input,padding:"5px 10px",cursor:page===0?"default":"pointer",opacity:page===0?0.4:1}}>«</button>
        <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0} style={{...S.input,padding:"5px 10px",cursor:page===0?"default":"pointer",opacity:page===0?0.4:1}}>‹</button>
        <span style={{fontSize:12,color:"#888",minWidth:100,textAlign:"center"}}>Page {page+1} / {totalPages}</span>
        <button onClick={()=>setPage(p=>Math.min(totalPages-1,p+1))} disabled={page===totalPages-1} style={{...S.input,padding:"5px 10px",cursor:page===totalPages-1?"default":"pointer",opacity:page===totalPages-1?0.4:1}}>›</button>
        <button onClick={()=>setPage(totalPages-1)} disabled={page===totalPages-1} style={{...S.input,padding:"5px 10px",cursor:page===totalPages-1?"default":"pointer",opacity:page===totalPages-1?0.4:1}}>»</button>
      </div>}
    </>}
  </div>;
}
/* ─── RESEARCHERS VIEW ─── */
function ResearchersView({researchers}){const[search,setSearch]=useState("");const[expanded,setExpanded]=useState(null);const filtered=researchers.filter(r=>{if(!search)return true;const s=search.toLowerCase();return(r.name||"").toLowerCase().includes(s)||(r.expertise_area||"").toLowerCase().includes(s)||(r.country||"").toLowerCase().includes(s)||(r.notes||"").toLowerCase().includes(s)});const sorted=[...filtered].sort((a,b)=>(b.h_index||0)-(a.h_index||0));const countries=[...new Set(researchers.map(r=>r.country).filter(Boolean))];return<div><input type="text" placeholder="Search name, expertise, or country..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:"100%",marginBottom:12,...S.input}}/><div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>{[{l:"Total researchers",v:researchers.length},{l:"Countries",v:countries.length},{l:"With h-index",v:researchers.filter(r=>r.h_index).length},{l:"Auto-harvested",v:researchers.filter(r=>(r.notes||"").includes("Auto")).length}].map(s=><div key={s.l} style={{flex:"1 1 100px",...S.metric}}><div style={S.mLabel}>{s.l}</div><div style={S.mVal()}>{s.v}</div></div>)}</div><p style={S.sub}>{sorted.length} researchers · Sorted by h-index</p><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:8}}>{sorted.slice(0,60).map(r=><div key={r.id} onClick={()=>setExpanded(expanded===r.id?null:r.id)} style={{...S.card,padding:14,cursor:"pointer",border:expanded===r.id?"2px solid #85B7EB":"1px solid #e8e6e1"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}><div><div style={{fontSize:13,fontWeight:600,color:"#2c2c2a"}}>{r.name}</div><div style={{fontSize:10,color:"#888"}}>{(r.expertise_area||"").slice(0,60)}</div></div><Pill color={r.priority==="high"?"#0F6E56":r.priority==="medium"?"#BA7517":"#888"} bg={r.priority==="high"?"#E1F5EE":r.priority==="medium"?"#FAEEDA":"#f1efe8"}>{r.priority||"candidate"}</Pill></div><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{r.country&&<Pill color="#0C447C" bg="#E6F1FB">{r.country}</Pill>}{r.h_index&&<Pill color="#3C3489" bg="#EEEDFE">h:{r.h_index}</Pill>}{r.publications_count&&<Pill color="#085041" bg="#E1F5EE">{r.publications_count} pubs</Pill>}{r.recent_activity_year&&<Pill color="#854F0B" bg="#FAEEDA">{r.recent_activity_year}</Pill>}</div>{expanded===r.id&&<div style={{marginTop:10,paddingTop:10,borderTop:"1px solid #e8e6e1",fontSize:11}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px 14px"}}>{[{l:"Consortium fit",v:r.collaboration_fit},{l:"Potential",v:r.consortium_potential},{l:"Species links",v:(r.species_links||[]).join(", ")||"—"},{l:"OpenAlex",v:r.openalex_id?"Linked":"—"}].map(({l,v})=><div key={l}><span style={{color:"#b4b2a9",fontSize:9}}>{l}</span><div style={{color:"#2c2c2a"}}>{v||"—"}</div></div>)}</div>{r.notes&&<div style={{fontSize:10,color:"#5f5e5a",marginTop:6,fontStyle:"italic"}}>{r.notes}</div>}</div>}</div>)}</div>{sorted.length>60&&<p style={{...S.sub,textAlign:"center",marginTop:12}}>Showing 60 of {sorted.length}</p>}</div>;}

/* ─── PARTNERS ─── */
function PartnerView({institutions}){return<div><div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>{[{l:"Institutions",v:institutions.length},{l:"Countries",v:[...new Set(institutions.map(i=>i.country))].length},{l:"MOU planned",v:institutions.filter(i=>i.mou_status==="Planned").length}].map(s=><div key={s.l} style={{flex:"1 1 100px",...S.metric}}><div style={S.mLabel}>{s.l}</div><div style={S.mVal()}>{s.v}</div></div>)}</div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:8}}>{institutions.map(i=><div key={i.id} style={{...S.card,padding:14}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}><div><div style={{fontSize:13,fontWeight:600,color:"#2c2c2a"}}>{i.name}</div><div style={{fontSize:10,color:"#888"}}>{i.city}, {i.country} · {i.institution_type}</div></div>{i.acronym&&<Pill color="#0C447C" bg="#E6F1FB">{i.acronym}</Pill>}</div><div style={{fontSize:11,color:"#5f5e5a",marginBottom:4}}>{i.research_focus}</div><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{i.consortium_role&&<Pill color="#085041" bg="#E1F5EE">{i.consortium_role}</Pill>}<Pill color={i.mou_status==="Planned"?"#BA7517":"#888"} bg={i.mou_status==="Planned"?"#FAEEDA":"#f1efe8"}>MOU: {i.mou_status}</Pill><Pill color={i.priority==="high"?"#0F6E56":"#888"} bg={i.priority==="high"?"#E1F5EE":"#f1efe8"}>{i.priority}</Pill></div></div>)}</div></div>}

/* ─── SOURCES ─── */
function SourcesPanel({sources}){const avg=sources.length?Math.round(sources.reduce((a,s)=>a+(s.freshness_score||0),0)/sources.length*100):0;return<div><div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>{[{l:"Total",v:sources.length},{l:"With API",v:sources.filter(s=>s.api_endpoint).length},{l:"Freshness",v:`${avg}%`}].map(s=><div key={s.l} style={{flex:"1 1 100px",...S.metric}}><div style={S.mLabel}>{s.l}</div><div style={S.mVal()}>{s.v}</div></div>)}</div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:8}}>{sources.map(src=><div key={src.id} style={{...S.card,padding:"10px 12px"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}><span style={{fontSize:12,fontWeight:600,color:"#2c2c2a"}}>{src.source_name}</span><div style={{display:"flex",alignItems:"center",gap:3}}><Dot color={freshC(src.freshness_score||0)}/><span style={{fontSize:10,fontWeight:600,color:freshC(src.freshness_score||0)}}>{Math.round((src.freshness_score||0)*100)}%</span></div></div><div style={{display:"flex",gap:3,marginBottom:4}}><Pill color="#0C447C" bg="#E6F1FB">{src.source_type}</Pill><Pill color={src.api_endpoint?"#085041":"#854F0B"} bg={src.api_endpoint?"#E1F5EE":"#FAEEDA"}>{src.api_endpoint?"API":"Manual"}</Pill></div><div style={S.sub}>{src.data_domain} · {src.update_frequency}</div><div style={{marginTop:3}}><MiniBar value={(src.freshness_score||0)*100} color={freshC(src.freshness_score||0)} h={3}/></div></div>)}</div></div>}

/* ─── PORTFOLIO ─── */
function PortfolioView({species}){return<div><p style={S.sub}>Composite vs. conservation — bubble = venture score</p><div style={{position:"relative",width:"100%",height:320,background:"#fff",borderRadius:14,border:"1px solid #e8e6e1",overflow:"hidden",marginTop:8}}>{[25,50,75].map(v=><div key={v} style={{position:"absolute",left:0,right:0,bottom:`${v}%`,borderBottom:"1px dashed #eae8e3"}}/>)}<span style={{position:"absolute",left:6,bottom:4,...S.sub}}>Low conservation</span><span style={{position:"absolute",left:6,top:4,...S.sub}}>High conservation</span><span style={{position:"absolute",right:6,bottom:4,...S.sub}}>High composite →</span>{species.map(sp=>{const c=sp.composite_score||50,con=sp.score_conservation||50,v=sp.score_venture||50;const x=((c-40)/50)*82+9,y=100-((con-20)/80)*88,sz=16+(v/100)*28;return<div key={sp.id} title={`${sp.accepted_name}\nComp:${c} Cons:${con} Vent:${v}`} style={{position:"absolute",left:`${x}%`,top:`${y}%`,width:sz,height:sz,borderRadius:"50%",background:iucnC(sp.iucn_status),opacity:0.75,transform:"translate(-50%,-50%)",border:"2px solid #fff",display:"flex",alignItems:"center",justifyContent:"center",cursor:"default",transition:"transform 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.transform="translate(-50%,-50%) scale(1.3)";e.currentTarget.style.opacity="1"}} onMouseLeave={e=>{e.currentTarget.style.transform="translate(-50%,-50%) scale(1)";e.currentTarget.style.opacity="0.75"}}><span style={{fontSize:7,color:"#fff",fontWeight:700}}>{(sp.genus||"").slice(0,3)}</span></div>})}</div><div style={{display:"flex",gap:10,marginTop:8,flexWrap:"wrap",justifyContent:"center"}}>{species.map(sp=><div key={sp.id} style={{display:"flex",alignItems:"center",gap:3,...S.sub}}><Dot color={iucnC(sp.iucn_status)} size={5}/><span style={{fontStyle:"italic"}}>{(sp.accepted_name||"").split(" ").slice(0,2).join(" ")}</span></div>)}</div></div>}

/* ─── ADMIN PANEL ─── */
function AdminPanel({species,onDataChange}){
  const[activeForm,setActiveForm]=useState("metabolite");
  const[selectedSpecies,setSelectedSpecies]=useState("");
  const[msg,setMsg]=useState(null);
  const[loading,setLoading]=useState(false);

  // Form states
  const[metForm,setMetForm]=useState({compound_name:"",compound_class:"",reported_activity:"",activity_category:"other",evidence:"Early research",confidence:0.8,notes:""});
  const[propForm,setPropForm]=useState({protocol_type:"micropropagation",explant:"",medium_or_condition:"",success_rate:"",ex_situ_fit:"under_review",greenhouse_fit:"under_review",field_transferability:"under_review",notes:""});
  const[photoForm,setPhotoForm]=useState({photo_url:"",thumbnail_url:"",photo_credit:""});
  const[consForm,setConsForm]=useState({source:"BGCI ThreatSearch",status_original:"",status_interpreted:"",scope:"Regional",assessment_year:new Date().getFullYear(),trend:"Unknown",confidence:0.7,notes:""});
  const[commForm,setCommForm]=useState({application_area:"",market_type:"",venture_fit:"candidate",justification:"",status:"monitor",notes:""});
  const[spForm,setSpForm]=useState({common_name:"",geophyte_type:"Bulbous",tc_status:"",market_area:"",market_size:"",decision_rationale:"",habitat:""});

  const notify=(text,ok=true)=>{setMsg({text,ok});setTimeout(()=>setMsg(null),4000);};

  async function save(table,data,resetFn){
    if(!selectedSpecies){notify("Önce tür seçin","error");return;}
    setLoading(true);
    try{
      const payload={...data,species_id:selectedSpecies};
      if(table==="metabolites")payload.id=crypto.randomUUID();
      if(table==="propagation")payload.protocol_id=`PROP-${selectedSpecies}-${Date.now()}`;
      if(table==="conservation")payload.assessment_id=`CONS-${selectedSpecies}-${Date.now()}`;
      if(table==="commercial")payload.hypothesis_id=`COM-${selectedSpecies}-${Date.now()}`;
      const{error}=await supabase.from(table).insert(payload);
      if(error)throw error;
      notify(`✓ ${table} kaydı eklendi`);
      resetFn();
      if(onDataChange)onDataChange();
    }catch(e){notify(`Hata: ${e.message}`,false);}
    finally{setLoading(false);}
  }

  async function updateSpecies(){
    if(!selectedSpecies){notify("Önce tür seçin");return;}
    setLoading(true);
    try{
      const payload={};
      Object.entries(spForm).forEach(([k,v])=>{if(v!=="")payload[k]=v;});
      if(photoForm.photo_url){payload.photo_url=photoForm.photo_url;payload.thumbnail_url=photoForm.thumbnail_url||photoForm.photo_url;payload.photo_credit=photoForm.photo_credit;}
      const{error}=await supabase.from("species").update(payload).eq("id",selectedSpecies);
      if(error)throw error;
      notify("✓ Tür bilgileri güncellendi");
      if(onDataChange)onDataChange();
    }catch(e){notify(`Hata: ${e.message}`,false);}
    finally{setLoading(false);}
  }

  const inp={padding:"8px 10px",border:"1px solid #e8e6e1",borderRadius:6,fontSize:12,background:"#fff",outline:"none",color:"#2c2c2a",width:"100%"};
  const lbl={fontSize:10,color:"#888",marginBottom:3,display:"block",textTransform:"uppercase",letterSpacing:0.4};
  const field=(label,val,onChange,type="text",opts=null)=><div style={{marginBottom:12}}>
    <label style={lbl}>{label}</label>
    {opts?<select value={val} onChange={e=>onChange(e.target.value)} style={inp}>{opts.map(o=><option key={o} value={o}>{o}</option>)}</select>
    :type==="textarea"?<textarea value={val} onChange={e=>onChange(e.target.value)} rows={3} style={{...inp,resize:"vertical"}}/>
    :<input type={type} value={val} onChange={e=>onChange(e.target.value)} style={inp}/>}
  </div>;

  const FORMS=[
    {k:"metabolite",l:"Metabolit Ekle",icon:"🧪"},
    {k:"propagation",l:"Propagasyon Ekle",icon:"🌱"},
    {k:"photo",l:"Fotoğraf / Tür Bilgisi",icon:"📷"},
    {k:"conservation",l:"Koruma Kaydı",icon:"🛡"},
    {k:"commercial",l:"Ticari Hipotez",icon:"💼"},
  ];

  const selectedSp=species.find(s=>s.id===selectedSpecies);

  return<div style={{maxWidth:700}}>
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:20}}>
      <div style={{width:32,height:32,borderRadius:8,background:"#1D9E75",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:"#fff",fontSize:16}}>⚙</span></div>
      <div><div style={{fontSize:16,fontWeight:700,color:"#2c2c2a"}}>Admin Paneli</div><div style={{fontSize:10,color:"#888"}}>Veri ekleme ve düzenleme</div></div>
    </div>

    {msg&&<div style={{padding:"10px 14px",borderRadius:8,marginBottom:16,background:msg.ok?"#E1F5EE":"#FCEBEB",color:msg.ok?"#085041":"#A32D2D",fontSize:12,fontWeight:500}}>{msg.text}</div>}

    {/* Species Selector */}
    <div style={{marginBottom:20}}>
      <label style={lbl}>Tür Seç</label>
      <select value={selectedSpecies} onChange={e=>setSelectedSpecies(e.target.value)} style={{...inp,marginBottom:0}}>
        <option value="">-- Tür seçin --</option>
        {[...species].sort((a,b)=>(a.accepted_name||"").localeCompare(b.accepted_name||"")).map(s=><option key={s.id} value={s.id}>{s.accepted_name} ({s.id})</option>)}
      </select>
      {selectedSp&&<div style={{marginTop:8,padding:"8px 12px",background:"#f4f3ef",borderRadius:6,fontSize:11,color:"#5f5e5a"}}>
        Seçili: <strong style={{fontStyle:"italic"}}>{selectedSp.accepted_name}</strong> · IUCN: {selectedSp.iucn_status||"—"} · Family: {selectedSp.family||"—"}
      </div>}
    </div>

    {/* Form Tabs */}
    <div style={{display:"flex",gap:4,marginBottom:20,flexWrap:"wrap"}}>
      {FORMS.map(f=><button key={f.k} onClick={()=>setActiveForm(f.k)} style={{padding:"7px 14px",border:"none",borderRadius:7,cursor:"pointer",fontSize:11,background:activeForm===f.k?"#1D9E75":"#f4f3ef",color:activeForm===f.k?"#fff":"#888",fontWeight:activeForm===f.k?600:400}}>
        {f.icon} {f.l}
      </button>)}
    </div>

    {/* METABOLIT FORM */}
    {activeForm==="metabolite"&&<div style={{background:"#fff",border:"1px solid #e8e6e1",borderRadius:12,padding:20}}>
      <h3 style={{fontSize:14,fontWeight:600,marginBottom:16,color:"#2c2c2a"}}>Yeni Metabolit Ekle</h3>
      {field("Bileşik adı *",metForm.compound_name,v=>setMetForm({...metForm,compound_name:v}))}
      {field("Bileşik sınıfı",metForm.compound_class,v=>setMetForm({...metForm,compound_class:v}))}
      {field("Bildirilen aktivite",metForm.reported_activity,v=>setMetForm({...metForm,reported_activity:v}),"textarea")}
      {field("Aktivite kategorisi",metForm.activity_category,v=>setMetForm({...metForm,activity_category:v}),null,["alkaloid","flavonoid","terpenoid","phenolic","saponin","glycoside","steroid","amino acid","other"])}
      {field("Kanıt seviyesi",metForm.evidence,v=>setMetForm({...metForm,evidence:v}),null,["Discovery","Early research","Preclinical","Phase I","Phase II","Established"])}
      <div style={{marginBottom:12}}>
        <label style={lbl}>Güven skoru ({Math.round(metForm.confidence*100)}%)</label>
        <input type="range" min="0" max="1" step="0.05" value={metForm.confidence} onChange={e=>setMetForm({...metForm,confidence:parseFloat(e.target.value)})} style={{width:"100%"}}/>
      </div>
      {field("Notlar",metForm.notes,v=>setMetForm({...metForm,notes:v}),"textarea")}
      <button disabled={loading||!metForm.compound_name} onClick={()=>save("metabolites",metForm,()=>setMetForm({compound_name:"",compound_class:"",reported_activity:"",activity_category:"other",evidence:"Early research",confidence:0.8,notes:""}))} style={{padding:"10px 24px",background:loading||!metForm.compound_name?"#ccc":"#1D9E75",color:"#fff",border:"none",borderRadius:8,cursor:loading||!metForm.compound_name?"default":"pointer",fontSize:12,fontWeight:600}}>
        {loading?"Kaydediliyor...":"Metabolit Ekle"}
      </button>
    </div>}

    {/* PROPAGASYON FORM */}
    {activeForm==="propagation"&&<div style={{background:"#fff",border:"1px solid #e8e6e1",borderRadius:12,padding:20}}>
      <h3 style={{fontSize:14,fontWeight:600,marginBottom:16,color:"#2c2c2a"}}>Propagasyon Protokolü Ekle</h3>
      {field("Protokol tipi",propForm.protocol_type,v=>setPropForm({...propForm,protocol_type:v}),null,["micropropagation","shoot tip culture","embryo rescue","callus culture","organogenesis","somatic embryogenesis","bulblet induction","rhizome culture"])}
      {field("Explant",propForm.explant,v=>setPropForm({...propForm,explant:v}))}
      {field("Ortam / Koşul",propForm.medium_or_condition,v=>setPropForm({...propForm,medium_or_condition:v}))}
      {field("Başarı oranı (%)",propForm.success_rate,v=>setPropForm({...propForm,success_rate:v}),"number")}
      {field("Ex situ uyumu",propForm.ex_situ_fit,v=>setPropForm({...propForm,ex_situ_fit:v}),null,["under_review","low","moderate","high","excellent"])}
      {field("Sera uyumu",propForm.greenhouse_fit,v=>setPropForm({...propForm,greenhouse_fit:v}),null,["under_review","low","moderate","high","excellent"])}
      {field("Saha aktarılabilirliği",propForm.field_transferability,v=>setPropForm({...propForm,field_transferability:v}),null,["under_review","low","moderate","high","excellent"])}
      {field("Notlar",propForm.notes,v=>setPropForm({...propForm,notes:v}),"textarea")}
      <button disabled={loading} onClick={()=>save("propagation",propForm,()=>setPropForm({protocol_type:"micropropagation",explant:"",medium_or_condition:"",success_rate:"",ex_situ_fit:"under_review",greenhouse_fit:"under_review",field_transferability:"under_review",notes:""}))} style={{padding:"10px 24px",background:loading?"#ccc":"#1D9E75",color:"#fff",border:"none",borderRadius:8,cursor:loading?"default":"pointer",fontSize:12,fontWeight:600}}>
        {loading?"Kaydediliyor...":"Protokol Ekle"}
      </button>
    </div>}

    {/* FOTOĞRAF / TÜR BİLGİSİ FORM */}
    {activeForm==="photo"&&<div style={{background:"#fff",border:"1px solid #e8e6e1",borderRadius:12,padding:20}}>
      <h3 style={{fontSize:14,fontWeight:600,marginBottom:16,color:"#2c2c2a"}}>Fotoğraf & Tür Bilgisi Güncelle</h3>
      {field("Fotoğraf URL",photoForm.photo_url,v=>setPhotoForm({...photoForm,photo_url:v}))}
      {field("Thumbnail URL",photoForm.thumbnail_url,v=>setPhotoForm({...photoForm,thumbnail_url:v}))}
      {field("Fotoğraf kredisi",photoForm.photo_credit,v=>setPhotoForm({...photoForm,photo_credit:v}))}
      {photoForm.photo_url&&<div style={{marginBottom:12}}><img src={photoForm.photo_url} alt="preview" style={{width:"100%",maxHeight:200,objectFit:"cover",borderRadius:8}} onError={e=>e.target.style.display="none"}/></div>}
      <div style={{borderTop:"1px solid #e8e6e1",paddingTop:16,marginTop:4,marginBottom:16}}>
        <div style={{fontSize:12,fontWeight:600,color:"#2c2c2a",marginBottom:12}}>Tür Bilgileri</div>
        {field("Yaygın isim",spForm.common_name,v=>setSpForm({...spForm,common_name:v}))}
        {field("Jeofir tipi",spForm.geophyte_type,v=>setSpForm({...spForm,geophyte_type:v}),null,["Bulbous","Cormous","Rhizomatous","Tuberous","Other"])}
        {field("TC durumu",spForm.tc_status,v=>setSpForm({...spForm,tc_status:v}),null,["","Candidate","Partial","Established","Advanced — well documented"])}
        {field("Pazar alanı",spForm.market_area,v=>setSpForm({...spForm,market_area:v}))}
        {field("Pazar büyüklüğü",spForm.market_size,v=>setSpForm({...spForm,market_size:v}))}
        {field("Habitat",spForm.habitat,v=>setSpForm({...spForm,habitat:v}))}
        {field("Karar gerekçesi",spForm.decision_rationale,v=>setSpForm({...spForm,decision_rationale:v}),"textarea")}
      </div>
      <button disabled={loading} onClick={updateSpecies} style={{padding:"10px 24px",background:loading?"#ccc":"#1D9E75",color:"#fff",border:"none",borderRadius:8,cursor:loading?"default":"pointer",fontSize:12,fontWeight:600}}>
        {loading?"Güncelleniyor...":"Güncelle"}
      </button>
    </div>}

    {/* KORUMA KAYDI FORM */}
    {activeForm==="conservation"&&<div style={{background:"#fff",border:"1px solid #e8e6e1",borderRadius:12,padding:20}}>
      <h3 style={{fontSize:14,fontWeight:600,marginBottom:16,color:"#2c2c2a"}}>Koruma Değerlendirmesi Ekle</h3>
      {field("Kaynak",consForm.source,v=>setConsForm({...consForm,source:v}),null,["BGCI ThreatSearch","IUCN Red List","Regional Assessment","Expert Opinion","Field Survey"])}
      {field("Orijinal statü",consForm.status_original,v=>setConsForm({...consForm,status_original:v}))}
      {field("Yorumlanan statü",consForm.status_interpreted,v=>setConsForm({...consForm,status_interpreted:v}),null,["Extinct","Critically Endangered","Endangered","Vulnerable","Near Threatened","Least Concern","Data Deficient"])}
      {field("Kapsam",consForm.scope,v=>setConsForm({...consForm,scope:v}),null,["Global","Regional","National","Local"])}
      {field("Değerlendirme yılı",consForm.assessment_year,v=>setConsForm({...consForm,assessment_year:parseInt(v)}),"number")}
      {field("Trend",consForm.trend,v=>setConsForm({...consForm,trend:v}),null,["Declining","Stable","Improving","Unknown"])}
      {field("Notlar",consForm.notes,v=>setConsForm({...consForm,notes:v}),"textarea")}
      <button disabled={loading} onClick={()=>save("conservation",consForm,()=>setConsForm({source:"BGCI ThreatSearch",status_original:"",status_interpreted:"",scope:"Regional",assessment_year:new Date().getFullYear(),trend:"Unknown",confidence:0.7,notes:""}))} style={{padding:"10px 24px",background:loading?"#ccc":"#1D9E75",color:"#fff",border:"none",borderRadius:8,cursor:loading?"default":"pointer",fontSize:12,fontWeight:600}}>
        {loading?"Kaydediliyor...":"Kayıt Ekle"}
      </button>
    </div>}

    {/* TİCARİ HİPOTEZ FORM */}
    {activeForm==="commercial"&&<div style={{background:"#fff",border:"1px solid #e8e6e1",borderRadius:12,padding:20}}>
      <h3 style={{fontSize:14,fontWeight:600,marginBottom:16,color:"#2c2c2a"}}>Ticari Hipotez Ekle</h3>
      {field("Uygulama alanı *",commForm.application_area,v=>setCommForm({...commForm,application_area:v}))}
      {field("Pazar tipi",commForm.market_type,v=>setCommForm({...commForm,market_type:v}),null,["premium niche","mass market","specialty ingredient","B2B supply","licensing","ornamental"])}
      {field("Venture uyumu",commForm.venture_fit,v=>setCommForm({...commForm,venture_fit:v}),null,["candidate","developing","validated","ready"])}
      {field("Gerekçe",commForm.justification,v=>setCommForm({...commForm,justification:v}),"textarea")}
      {field("Durum",commForm.status,v=>setCommForm({...commForm,status:v}),null,["monitor","developing","active","paused"])}
      {field("Notlar",commForm.notes,v=>setCommForm({...commForm,notes:v}),"textarea")}
      <button disabled={loading||!commForm.application_area} onClick={()=>save("commercial",commForm,()=>setCommForm({application_area:"",market_type:"",venture_fit:"candidate",justification:"",status:"monitor",notes:""}))} style={{padding:"10px 24px",background:loading||!commForm.application_area?"#ccc":"#1D9E75",color:"#fff",border:"none",borderRadius:8,cursor:loading||!commForm.application_area?"default":"pointer",fontSize:12,fontWeight:600}}>
        {loading?"Kaydediliyor...":"Hipotez Ekle"}
      </button>
    </div>}
  </div>;
}
async function fetchAllPublications(){
  const pageSize=1000;let allPubs=[];let from=0;
  while(true){
    const{data,error}=await supabase.from("publications").select("id,species_id,title,authors,doi,year,journal,open_access,primary_topic,relevance_score,cited_by_count,source,abstract,pubmed_id,openalex_id,category,species(accepted_name)").order("year",{ascending:false}).range(from,from+pageSize-1);
    if(error||!data||data.length===0)break;
    allPubs=[...allPubs,...data];
    if(data.length<pageSize)break;
    from+=pageSize;
  }
  return allPubs;
}

/* ═══ MAIN APP ═══ */
export default function Home(){
  const[user,setUser]=useState(null);const[view,setView]=useState("species");const[exp,setExp]=useState(null);const[side,setSide]=useState(true);const[loading,setLoading]=useState(true);const[dbOk,setDbOk]=useState(false);
  const[species,setSpecies]=useState([]);const[metabolites,setMetabolites]=useState([]);const[markets,setMarkets]=useState([]);const[institutions,setInstitutions]=useState([]);const[sources,setSources]=useState([]);const[publications,setPublications]=useState([]);const[researchers,setResearchers]=useState([]);
  const[detailSpecies,setDetailSpecies]=useState(null);

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
        if(sp.data)setSpecies(sp.data);if(mt.data)setMetabolites(mt.data);if(mk.data)setMarkets(mk.data);if(inst.data)setInstitutions(inst.data);if(src.data)setSources(src.data);if(res.data)setResearchers(res.data);
        setPublications(pub);setDbOk(true);
      }catch(e){setDbOk(false);}finally{setLoading(false);}
    }
    f();
  },[]);

  if(!user)return<LoginScreen onLogin={setUser}/>;
  if(loading)return<Loading/>;
  const role=ROLES[user.role];
  const threatened=species.filter(s=>["CR","EN","VU"].includes(s.iucn_status)).length;
  const navItems=[{key:"species",label:"Species",icon:"🌿"},{key:"metabolites",label:"Metabolites",icon:"🧪"},{key:"market",label:"Market",icon:"💰"},{key:"publications",label:"Publications",icon:"📚"},{key:"researchers",label:"Researchers",icon:"👨‍🔬"},{key:"partners",label:"Institutions",icon:"🏛"},{key:"portfolio",label:"Portfolio",icon:"📊"},{key:"sources",label:"Sources",icon:"🔗"},...(user.role==="admin"?[{key:"admin",label:"Admin",icon:"⚙️"}]:[])];

  return<div style={{display:"flex",minHeight:"100vh",background:"#f8f7f4"}}>
    <div style={{width:side?220:0,flexShrink:0,overflow:"hidden",background:"#fff",borderRight:"1px solid #e8e6e1",transition:"width 0.25s ease",display:"flex",flexDirection:"column"}}>
      <div style={{padding:"18px 14px 14px",flex:1,overflow:"hidden"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:20}}><div style={{width:32,height:32,borderRadius:8,background:"linear-gradient(145deg,#085041,#1D9E75)",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:"#fff",fontSize:14,fontWeight:700,fontFamily:"Georgia,serif"}}>A</span></div><div><div style={{fontSize:14,fontWeight:700,letterSpacing:-0.5,color:"#2c2c2a",fontFamily:"Georgia,serif"}}>ATLAS</div><div style={{fontSize:7,color:"#b4b2a9",letterSpacing:1.5,textTransform:"uppercase"}}>GEOCON v2.5</div></div></div>
        <div style={{display:"flex",flexDirection:"column",gap:1}}>{navItems.map(n=><button key={n.key} onClick={()=>{setView(n.key);setExp(null);}} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",border:"none",borderRadius:7,cursor:"pointer",fontSize:11,background:view===n.key?"#f4f3ef":"transparent",color:view===n.key?"#2c2c2a":"#888",fontWeight:view===n.key?600:400,transition:"all 0.15s"}}><span style={{fontSize:13}}>{n.icon}</span>{n.label}</button>)}</div>
        <div style={{marginTop:12,padding:10,background:"#f4f3ef",borderRadius:8,fontSize:9,color:"#888",lineHeight:1.8}}><div><Dot color={dbOk?"#0F6E56":"#A32D2D"} size={6}/><span style={{marginLeft:4}}>{dbOk?"Supabase connected":"Offline"}</span></div><div><strong style={{color:"#2c2c2a"}}>{species.length}</strong> species · <strong style={{color:"#2c2c2a"}}>{metabolites.length}</strong> cpds</div><div><strong style={{color:"#2c2c2a"}}>{publications.length}</strong> pubs · <strong style={{color:"#2c2c2a"}}>{researchers.length}</strong> res.</div></div>
      </div>
      <div style={{padding:14,borderTop:"1px solid #e8e6e1"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><div style={{width:26,height:26,borderRadius:6,background:role.color,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:"#fff",fontSize:10,fontWeight:600}}>{role.ic}</span></div><div><div style={{fontSize:11,fontWeight:600,color:"#2c2c2a"}}>{user.name}</div><div style={{fontSize:8,color:"#b4b2a9"}}>{role.label}</div></div></div>
        <a href="/upload-admin" style={{display:"block",textAlign:"center",padding:"6px 0",fontSize:9,color:"#1D9E75",textDecoration:"none",border:"1px solid #1D9E75",borderRadius:6,marginBottom:6,fontWeight:600}}>📊 Excel Upload</a>
        <button onClick={()=>{setUser(null);setView("species");}} style={{width:"100%",padding:"5px 0",fontSize:9,color:"#888",background:"none",border:"1px solid #e8e6e1",borderRadius:6,cursor:"pointer"}}>Logout</button>
      </div>
    </div>
    <div style={{flex:1,minWidth:0,padding:"16px 20px 28px",overflow:"auto"}}>
      <button onClick={()=>setSide(!side)} style={{fontSize:16,background:"none",border:"none",cursor:"pointer",color:"#888",marginBottom:10,padding:0}}>{side?"◀":"▶"}</button>
      <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>{[{l:"Species",v:species.length,c:"#1D9E75"},{l:"Compounds",v:metabolites.length,c:"#534AB7"},{l:"Publications",v:publications.length,c:"#185FA5"},{l:"Researchers",v:researchers.length,c:"#D85A30"},{l:"Threatened",v:threatened,c:"#E24B4A"}].map(s=><div key={s.l} style={{flex:"1 1 100px",...S.card,padding:"10px 14px",border:"1px solid #e8e6e1"}}><div style={S.mLabel}>{s.l}</div><div style={S.mVal(s.c)}>{s.v}</div></div>)}</div>
      {view==="species"&&<SpeciesModule species={species} exp={exp} setExp={setExp} onSpeciesClick={setDetailSpecies}/>}
      {view==="metabolites"&&<MetaboliteExplorer metabolites={metabolites}/>}
      {view==="market"&&<MarketView markets={markets}/>}
      {view==="publications"&&<PublicationsView publications={publications}/>}
      {view==="researchers"&&<ResearchersView researchers={researchers}/>}
      {view==="partners"&&<PartnerView institutions={institutions}/>}
      {view==="portfolio"&&<PortfolioView species={species}/>}
      {view==="sources"&&<SourcesPanel sources={sources}/>}
      {view==="admin"&&user.role==="admin"&&<AdminPanel species={species} onDataChange={()=>window.location.reload()}/>}
      <div style={{marginTop:32,paddingTop:10,borderTop:"1px solid #e8e6e1",display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:4,fontSize:8,color:"#b4b2a9"}}><span>GEOCON ATLAS v2.5 · {species.length} species · {publications.length} pubs · {researchers.length} researchers</span><span>Venn BioVentures OÜ</span></div>
    </div>
    {detailSpecies&&<SpeciesDetailPanel species={detailSpecies} onClose={()=>setDetailSpecies(null)}/>}
  </div>;
}
