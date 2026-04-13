"use client";
import { useState, useEffect } from "react";

/* ══════════════════════════════════════════════════════════
   GEOCON ATLAS v2.0 — Global Geophyte Intelligence Platform
   Powered by Venn BioVentures OÜ
   ══════════════════════════════════════════════════════════ */

const SPECIES = [
  { id:"GEO-0001",name:"Fritillaria imperialis",family:"Liliaceae",genus:"Fritillaria",type:"Bulbous",country:"TR",region:"E. Mediterranean",endemic:true,iucn:"VU",cites:"II",trend:"Decreasing",trl:3,decision:"Accelerate",rationale:"High market demand + critical conservation status — flagship for Fritillaria Dermocosmetics spin-off",scores:{conservation:82,science:68,production:55,governance:45,venture:78},composite:67,climate:0.65,regDrag:-0.15,spinoff:"Fritillaria Dermocosmetics",market:"Dermocosmetics",marketSize:"$41B",metabolites:["Imperialine","Peiminine","Verticinone"],habitat:"Montane steppe · 1200-2800m",threats:["Illegal collection","Overgrazing","Habitat loss"],tc:"Pilot — bulb scale micropropagation",conf:0.75,partners:["Ankara Uni","Kew Gardens"],verified:"2026-04-13",lat:37.9,lng:35.3 },
  { id:"GEO-0002",name:"Lilium candidum",family:"Liliaceae",genus:"Lilium",type:"Bulbous",country:"TR",region:"Mediterranean",endemic:false,iucn:"LC",cites:"—",trend:"Stable",trl:4,decision:"Accelerate",rationale:"Strong cosmetic ingredient potential + established TIS protocols — Lilium Clean Beauty anchor",scores:{conservation:45,science:72,production:70,governance:65,venture:85},composite:68,climate:0.40,regDrag:-0.05,spinoff:"Lilium Clean Beauty",market:"Clean Beauty",marketSize:"$12B",metabolites:["Kaempferol","Quercetin","β-sitosterol"],habitat:"Mediterranean scrubland · 200-1000m",threats:["Urbanization","Over-collection"],tc:"Established — TIS compatible",conf:0.82,partners:["Ege Uni","INRAE France"],verified:"2026-04-10",lat:38.4,lng:27.1 },
  { id:"GEO-0003",name:"Orchis italica",family:"Orchidaceae",genus:"Orchis",type:"Tuberous",country:"TR",region:"Mediterranean",endemic:false,iucn:"NT",cites:"II",trend:"Decreasing",trl:2,decision:"Develop",rationale:"Salep market demand critical; conservation urgency rising across Mediterranean",scores:{conservation:75,science:60,production:35,governance:40,venture:70},composite:57,climate:0.55,regDrag:-0.20,spinoff:"Orchid Mucilage / Salep",market:"Premium Food/Pharma",marketSize:"$8B",metabolites:["Glucomannan","Starch polysaccharides"],habitat:"Grasslands · 300-1500m",threats:["Illegal salep harvest","Habitat degradation"],tc:"Challenging — asymbiotic germination",conf:0.55,partners:["Hacettepe Uni"],verified:"2026-04-08",lat:39.9,lng:32.9 },
  { id:"GEO-0004",name:"Tecophilaea cyanocrocus",family:"Tecophilaeaceae",genus:"Tecophilaea",type:"Cormous",country:"CL",region:"Chilean Mediterranean",endemic:true,iucn:"CR",cites:"—",trend:"Decreasing",trl:2,decision:"Urgent Conserve",rationale:"Critically endangered; genetic bottleneck — cryo campaign needed urgently",scores:{conservation:95,science:55,production:30,governance:50,venture:60},composite:61,climate:0.80,regDrag:-0.10,spinoff:"Vitalcore Andes",market:"Ultra-premium ornamental",marketSize:"$2B niche",metabolites:["Anthocyanins (unique blue)"],habitat:"Chilean matorral · 400-900m",threats:["Habitat loss","Wildfire","Over-collection"],tc:"Preliminary — needs cryopreservation",conf:0.45,partners:["U Chile","Edinburgh RBG","Kew"],verified:"2026-04-05",lat:-33.4,lng:-70.6 },
  { id:"GEO-0005",name:"Alstroemeria ligtu",family:"Alstroemeriaceae",genus:"Alstroemeria",type:"Rhizomatous",country:"CL",region:"Chilean Mediterranean",endemic:true,iucn:"VU",cites:"—",trend:"Decreasing",trl:3,decision:"Accelerate",rationale:"Chilean endemic complex — ideal for CORFO + ornamental market entry",scores:{conservation:70,science:65,production:60,governance:55,venture:75},composite:65,climate:0.70,regDrag:-0.08,spinoff:"Vitalcore Andes",market:"Ornamental + cosmetic",marketSize:"$15B",metabolites:["Flavonoids","Phenolic acids"],habitat:"Central Chilean forests · 200-1200m",threats:["Deforestation","Fire","Urbanization"],tc:"Moderate — rhizome + TC protocols",conf:0.62,partners:["U Austral","INIA Chile"],verified:"2026-04-11",lat:-39.8,lng:-73.2 },
  { id:"GEO-0006",name:"Cyclamen coum",family:"Primulaceae",genus:"Cyclamen",type:"Tuberous",country:"TR",region:"Pontic / Caucasus",endemic:false,iucn:"LC",cites:"II",trend:"Stable",trl:5,decision:"Scale",rationale:"Commercial-ready; strong ornamental market; lowest regulatory drag",scores:{conservation:40,science:70,production:80,governance:70,venture:72},composite:66,climate:0.30,regDrag:-0.05,spinoff:"Anatolia Bulbs",market:"Ornamental",marketSize:"$68B",metabolites:["Cyclamin","Triterpenoid saponins"],habitat:"Deciduous woodland · 0-1500m",threats:["Wild collection"],tc:"Commercial — somatic embryogenesis",conf:0.88,partners:["Wageningen","Düzce Uni"],verified:"2026-04-12",lat:40.8,lng:31.2 },
  { id:"GEO-0007",name:"Crocus sativus",family:"Iridaceae",genus:"Crocus",type:"Cormous",country:"TR",region:"Multi-region",endemic:false,iucn:"—",cites:"—",trend:"Cultivated",trl:6,decision:"Scale",rationale:"World's most valuable spice — advanced corm multiplication + cooperative model",scores:{conservation:30,science:85,production:90,governance:80,venture:90},composite:77,climate:0.35,regDrag:-0.02,spinoff:"Anatolia Bulbs",market:"Spice / Pharma",marketSize:"$2B saffron",metabolites:["Crocin","Picrocrocin","Safranal"],habitat:"Semi-arid steppe · cultivated",threats:["Climate shift","Market competition"],tc:"Advanced — well documented",conf:0.92,partners:["Safranbolu Coop","Uni Kashmir"],verified:"2026-04-13",lat:41.3,lng:32.6 },
  { id:"GEO-0008",name:"Leucocoryne purpurea",family:"Amaryllidaceae",genus:"Leucocoryne",type:"Bulbous",country:"CL",region:"Atacama / Coquimbo",endemic:true,iucn:"VU",cites:"—",trend:"Decreasing",trl:2,decision:"Develop",rationale:"Chilean Glory-of-the-Sun; untapped ornamental and fragrance potential",scores:{conservation:72,science:50,production:40,governance:55,venture:65},composite:57,climate:0.60,regDrag:-0.08,spinoff:"Vitalcore Andes",market:"Cut flower / fragrance",marketSize:"$5B specialty",metabolites:["Alliin derivatives","Sulfur compounds"],habitat:"Coastal desert · 100-600m",threats:["Mining","Urbanization","Drought"],tc:"Early — seed germination only",conf:0.40,partners:["U La Serena"],verified:"2026-04-06",lat:-29.9,lng:-71.3 },
];

const SOURCES = [
  {id:"SRC-001",name:"BGCI ThreatSearch",type:"Conservation",freq:"Monthly",status:"active",fresh:0.85,last:"2026-04-01",feeds:"Conservation"},
  {id:"SRC-002",name:"GBIF Occurrence",type:"Occurrence",freq:"Weekly",status:"active",fresh:0.92,last:"2026-04-10",feeds:"Locations"},
  {id:"SRC-003",name:"POWO (Kew)",type:"Taxonomy",freq:"Monthly",status:"active",fresh:0.88,last:"2026-03-28",feeds:"Species, Synonyms"},
  {id:"SRC-004",name:"KNApSAcK",type:"Metabolites",freq:"Monthly",status:"active",fresh:0.78,last:"2026-03-15",feeds:"Metabolites"},
  {id:"SRC-005",name:"OpenAlex",type:"Literature",freq:"Weekly",status:"active",fresh:0.95,last:"2026-04-12",feeds:"Publications"},
  {id:"SRC-006",name:"IUCN Red List",type:"Conservation",freq:"Annual",status:"active",fresh:0.70,last:"2025-12-10",feeds:"Conservation"},
  {id:"SRC-007",name:"CITES Species+",type:"Regulatory",freq:"Event",status:"active",fresh:0.82,last:"2026-02-20",feeds:"Regulatory"},
  {id:"SRC-008",name:"PubChem",type:"Chemistry",freq:"Continuous",status:"active",fresh:0.97,last:"2026-04-13",feeds:"Compounds"},
  {id:"SRC-009",name:"PubMed / PMC",type:"Literature",freq:"Daily",status:"active",fresh:0.96,last:"2026-04-13",feeds:"Biomedical pubs"},
  {id:"SRC-010",name:"SANBI Red List",type:"Conservation",freq:"Annual",status:"scheduled",fresh:0.55,last:"2025-08-01",feeds:"S. Africa"},
  {id:"SRC-011",name:"CONAF Chile",type:"Regulatory",freq:"Event",status:"active",fresh:0.72,last:"2026-01-15",feeds:"Chile regulation"},
  {id:"SRC-012",name:"FAO WIEWS",type:"Genetic Res.",freq:"Annual",status:"scheduled",fresh:0.60,last:"2025-06-30",feeds:"Germplasm"},
  {id:"SRC-013",name:"Kew Seed Info",type:"Propagation",freq:"Annual",status:"active",fresh:0.75,last:"2025-11-20",feeds:"Seed biology"},
  {id:"SRC-014",name:"USDA GRIN",type:"Genetic Res.",freq:"Monthly",status:"active",fresh:0.80,last:"2026-03-05",feeds:"Accessions"},
  {id:"SRC-015",name:"ChEBI (EBI)",type:"Chemistry",freq:"Monthly",status:"active",fresh:0.90,last:"2026-04-02",feeds:"Ontology"},
];

const ROLES = {
  admin:{label:"Admin",desc:"Full platform access",ic:"A",color:"#534AB7",accent:"#EEEDFE"},
  researcher:{label:"Researcher",desc:"Species, conservation & science data",ic:"R",color:"#1D9E75",accent:"#E1F5EE"},
  investor:{label:"Investor",desc:"Commercial, market & scoring data",ic:"I",color:"#D85A30",accent:"#FAECE7"},
  producer:{label:"Producer",desc:"Production, supply chain & compliance",ic:"P",color:"#639922",accent:"#EAF3DE"},
  policymaker:{label:"Policymaker",desc:"Conservation, governance & regulatory",ic:"K",color:"#185FA5",accent:"#E6F1FB"},
};

const USERS = {
  admin:{name:"Alpaslan",role:"admin"},
  researcher:{name:"Dr. Ayşe Kaya",role:"researcher"},
  investor:{name:"Henrik Larsson",role:"investor"},
  producer:{name:"Mehmet Çelik",role:"producer"},
  policymaker:{name:"Elena Rodriguez",role:"policymaker"},
};

const S = {
  card: { background:"#fff", borderRadius:14, border:"1px solid #e8e6e1", overflow:"hidden" },
  pill: (c,bg) => ({ display:"inline-flex",alignItems:"center",padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:500,color:c,background:bg,whiteSpace:"nowrap",lineHeight:1.6 }),
  metric: { background:"#f4f3ef", padding:"8px 12px", borderRadius:8 },
  metricLabel: { fontSize:9, color:"#888", letterSpacing:0.4, textTransform:"uppercase", marginBottom:2 },
  metricValue: (c) => ({ fontSize:20, fontWeight:700, color:c||"#2c2c2a", fontFamily:"Georgia,serif" }),
  sectionTitle: { fontSize:13, fontWeight:600, color:"#2c2c2a", margin:"0 0 12px", letterSpacing:-0.2 },
  subtle: { fontSize:10, color:"#999" },
  inputBase: { padding:"8px 12px", border:"1px solid #e8e6e1", borderRadius:8, fontSize:12, background:"#fff", outline:"none", color:"#2c2c2a" },
};

const iucnColor = s => ({CR:"#A32D2D",EN:"#854F0B",VU:"#BA7517",NT:"#3B6D11",LC:"#0F6E56"}[s] || "#888");
const iucnBg = s => ({CR:"#FCEBEB",EN:"#FAEEDA",VU:"#FFF3CD",NT:"#EAF3DE",LC:"#E1F5EE"}[s] || "#f1efe8");
const decColor = d => ({Accelerate:"#0F6E56","Urgent Conserve":"#A32D2D",Develop:"#185FA5",Scale:"#3B6D11",Monitor:"#888"}[d] || "#888");
const decBg = d => ({Accelerate:"#E1F5EE","Urgent Conserve":"#FCEBEB",Develop:"#E6F1FB",Scale:"#EAF3DE",Monitor:"#f1efe8"}[d] || "#f1efe8");
const freshColor = v => v > 0.85 ? "#0F6E56" : v > 0.65 ? "#BA7517" : "#A32D2D";
const flag = c => c === "TR" ? "\uD83C\uDDF9\uD83C\uDDF7" : c === "CL" ? "\uD83C\uDDE8\uD83C\uDDF1" : "\uD83C\uDF0D";

function Pill({children,color,bg}){ return <span style={S.pill(color,bg)}>{children}</span>; }
function Dot({color,size=6}){ return <span style={{display:"inline-block",width:size,height:size,borderRadius:"50%",background:color,flexShrink:0}} />; }

function MiniBar({value,max=100,color,h=5}){
  return (
    <div style={{height:h,background:"#eae8e3",borderRadius:h/2,overflow:"hidden",flex:1}}>
      <div style={{height:"100%",width:`${(value/max)*100}%`,background:color,borderRadius:h/2,transition:"width 0.6s ease"}} />
    </div>
  );
}

function RadarChart({scores,size=110}){
  const keys=Object.keys(scores),n=keys.length,cx=size/2,cy=size/2,r=size*0.36;
  const ang=(i)=>(Math.PI*2*i)/n-Math.PI/2;
  const pt=(i,v)=>{const a=ang(i),d=(v/100)*r;return[cx+d*Math.cos(a),cy+d*Math.sin(a)];};
  const cols={conservation:"#E24B4A",science:"#534AB7",production:"#1D9E75",governance:"#D85A30",venture:"#185FA5"};
  const dp=keys.map((k,i)=>pt(i,scores[k]));
  return(
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {[25,50,75,100].map(lv=>{const pts=keys.map((_,i)=>pt(i,lv)).map(p=>`${p[0]},${p[1]}`).join(" ");return<polygon key={lv} points={pts} fill="none" stroke="#e8e6e1" strokeWidth="0.5"/>;})}
      {keys.map((_,i)=>{const[ex,ey]=pt(i,100);return<line key={i} x1={cx} y1={cy} x2={ex} y2={ey} stroke="#e8e6e1" strokeWidth="0.5"/>;})}
      <polygon points={dp.map(p=>`${p[0]},${p[1]}`).join(" ")} fill="rgba(29,158,117,0.12)" stroke="#1D9E75" strokeWidth="1.5"/>
      {keys.map((k,i)=>{const[px,py]=pt(i,scores[k]);return<circle key={k} cx={px} cy={py} r={2.5} fill={cols[k]}/>;})}
      {keys.map((k,i)=>{const[lx,ly]=pt(i,118);return<text key={k} x={lx} y={ly} textAnchor="middle" dominantBaseline="central" style={{fontSize:8,fill:"#999"}}>{k.slice(0,4).toUpperCase()}</text>;})}
    </svg>
  );
}

/* ─── LOGIN ─── */
function LoginScreen({onLogin}){
  const[sel,setSel]=useState("admin");
  const[ready,setReady]=useState(false);
  useEffect(()=>{setTimeout(()=>setReady(true),100);},[]);
  return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24,background:"#f8f7f4"}}>
      <div style={{width:"100%",maxWidth:440,opacity:ready?1:0,transform:ready?"translateY(0)":"translateY(16px)",transition:"all 0.6s ease"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:60,height:60,borderRadius:16,background:"linear-gradient(145deg,#085041,#1D9E75)",marginBottom:14,boxShadow:"0 6px 24px rgba(8,80,65,0.25)"}}>
            <span style={{color:"#fff",fontSize:26,fontWeight:700,fontFamily:"Georgia,serif"}}>A</span>
          </div>
          <h1 style={{fontSize:28,fontWeight:700,letterSpacing:-1,color:"#2c2c2a",margin:"0 0 4px",fontFamily:"Georgia,'Times New Roman',serif"}}>
            GEOCON <span style={{fontWeight:400,letterSpacing:3,fontSize:22}}>ATLAS</span>
          </h1>
          <p style={{fontSize:13,color:"#888",margin:0}}>Global geophyte intelligence platform</p>
          <p style={{fontSize:10,color:"#b4b2a9",margin:"6px 0 0",letterSpacing:1}}>POWERED BY VENN BIOVENTURES</p>
        </div>
        <div style={{...S.card,padding:"24px 24px 20px"}}>
          <p style={{fontSize:11,color:"#b4b2a9",margin:"0 0 14px",letterSpacing:0.5,textTransform:"uppercase"}}>Select your role</p>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {Object.entries(ROLES).map(([k,r])=>(
              <button key={k} onClick={()=>setSel(k)} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",border:sel===k?`2px solid ${r.color}`:"1px solid #e8e6e1",borderRadius:10,background:sel===k?r.accent:"#fff",cursor:"pointer",transition:"all 0.15s",textAlign:"left"}}>
                <div style={{width:34,height:34,borderRadius:8,background:r.color,display:"flex",alignItems:"center",justifyContent:"center",transition:"transform 0.15s",transform:sel===k?"scale(1.05)":"scale(1)"}}>
                  <span style={{color:"#fff",fontSize:14,fontWeight:600}}>{r.ic}</span>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:500,color:"#2c2c2a"}}>{r.label}</div>
                  <div style={{fontSize:10,color:"#b4b2a9"}}>{r.desc}</div>
                </div>
                {sel===k&&<Dot color={r.color} size={8}/>}
              </button>
            ))}
          </div>
          <button onClick={()=>onLogin(USERS[sel])} style={{width:"100%",padding:"12px 0",border:"none",borderRadius:10,marginTop:18,background:ROLES[sel].color,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",letterSpacing:0.3,transition:"opacity 0.15s"}}
            onMouseEnter={e=>e.target.style.opacity="0.9"} onMouseLeave={e=>e.target.style.opacity="1"}>
            Enter as {ROLES[sel].label}
          </button>
        </div>
        <div style={{display:"flex",justifyContent:"center",gap:20,marginTop:20,fontSize:10,color:"#b4b2a9"}}>
          <span>24 modules</span><span>15 data sources</span><span>8 pilot species</span><span>v2.0</span>
        </div>
      </div>
    </div>
  );
}

/* ─── SPECIES CARD ─── */
function SpeciesCard({sp,role,expanded,onToggle}){
  const restricted=role==="investor"||role==="producer";
  const sc={conservation:"#E24B4A",science:"#534AB7",production:"#1D9E75",governance:"#D85A30",venture:"#185FA5"};
  return(
    <div onClick={onToggle} style={{...S.card,cursor:"pointer",border:expanded?"2px solid #85B7EB":"1px solid #e8e6e1",boxShadow:expanded?"0 4px 20px rgba(0,0,0,0.06)":"none",transition:"all 0.2s"}}>
      <div style={{height:3,background:`linear-gradient(90deg,${iucnColor(sp.iucn)}88,${decColor(sp.decision)}88)`}}/>
      <div style={{padding:"14px 16px 12px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,marginBottom:10}}>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
              <span style={{fontSize:14}}>{flag(sp.country)}</span>
              <span style={{fontSize:14,fontWeight:600,fontStyle:"italic",color:"#2c2c2a",fontFamily:"Georgia,serif"}}>{sp.name}</span>
            </div>
            <div style={{fontSize:10,color:"#b4b2a9"}}>{sp.family} · {sp.type} · {sp.region}</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:3}}>
            <Pill color={iucnColor(sp.iucn)} bg={iucnBg(sp.iucn)}>{sp.iucn||"NE"}</Pill>
            <Pill color={decColor(sp.decision)} bg={decBg(sp.decision)}>{sp.decision}</Pill>
          </div>
        </div>
        <div style={{display:"flex",gap:12,alignItems:"center"}}>
          <div style={{flex:1}}>
            {Object.entries(sp.scores).map(([k,v])=>(
              <div key={k} style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                <span style={{fontSize:9,color:"#b4b2a9",width:36,textAlign:"right",flexShrink:0}}>{k.slice(0,5)}</span>
                <MiniBar value={v} color={sc[k]}/>
                <span style={{fontSize:9,fontWeight:600,color:"#5f5e5a",width:18,textAlign:"right"}}>{v}</span>
              </div>
            ))}
          </div>
          <RadarChart scores={sp.scores} size={100}/>
        </div>
        <div style={{display:"flex",gap:6,marginTop:10}}>
          {[{l:"Composite",v:sp.composite},{l:"TRL",v:sp.trl},{l:"Confidence",v:`${Math.round(sp.conf*100)}%`},{l:"Climate",v:`${Math.round(sp.climate*100)}%`}].map(m=>(
            <div key={m.l} style={{flex:1,...S.metric,textAlign:"center"}}>
              <div style={S.metricLabel}>{m.l}</div>
              <div style={{fontSize:14,fontWeight:700,color:"#2c2c2a"}}>{m.v}</div>
            </div>
          ))}
        </div>
      </div>
      {expanded&&(
        <div style={{padding:"0 16px 16px",borderTop:"1px solid #e8e6e1",marginTop:0,paddingTop:14}}>
          <p style={{fontSize:11,color:"#5f5e5a",margin:"0 0 10px",lineHeight:1.6}}>{sp.rationale}</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px 16px",fontSize:11,marginBottom:10}}>
            {[{l:"Spin-off",v:sp.spinoff},{l:"Market",v:`${sp.market} (${sp.marketSize})`},{l:"Habitat",v:sp.habitat},{l:"TC status",v:sp.tc},{l:"CITES",v:sp.cites},{l:"Trend",v:sp.trend}].map(({l,v})=>(
              <div key={l}><span style={{color:"#b4b2a9",fontSize:10}}>{l}</span><div style={{color:"#2c2c2a",fontWeight:500}}>{v}</div></div>
            ))}
          </div>
          {role!=="investor"&&role!=="producer"&&(
            <div style={{marginBottom:8}}><span style={{fontSize:10,color:"#b4b2a9"}}>Key metabolites</span>
              <div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:3}}>{sp.metabolites.map(m=><Pill key={m} color="#3C3489" bg="#EEEDFE">{m}</Pill>)}</div>
            </div>
          )}
          {role!=="investor"&&(
            <div style={{marginBottom:8}}><span style={{fontSize:10,color:"#b4b2a9"}}>Threats</span>
              <div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:3}}>{sp.threats.map(t=><Pill key={t} color="#791F1F" bg="#FCEBEB">{t}</Pill>)}</div>
            </div>
          )}
          <div style={{marginBottom:4}}><span style={{fontSize:10,color:"#b4b2a9"}}>Research partners</span>
            <div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:3}}>{sp.partners.map(p=><Pill key={p} color="#0C447C" bg="#E6F1FB">{p}</Pill>)}</div>
          </div>
          <div style={{fontSize:9,color:"#b4b2a9",marginTop:8}}>Last verified: {sp.verified} · {sp.id}</div>
          {restricted&&(
            <div style={{marginTop:8,padding:"6px 10px",borderRadius:8,background:"#FFF3CD",fontSize:10,color:"#854F0B"}}>
              Some data restricted for {ROLES[role].label} role. Contact admin for full access.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── PORTFOLIO MATRIX ─── */
function PortfolioView(){
  return(
    <div>
      <p style={S.subtle}>Composite score vs. conservation urgency — bubble size proportional to venture score</p>
      <div style={{position:"relative",width:"100%",height:340,background:"#fff",borderRadius:14,border:"1px solid #e8e6e1",overflow:"hidden",marginTop:8}}>
        {[25,50,75].map(v=><div key={v} style={{position:"absolute",left:0,right:0,bottom:`${v}%`,borderBottom:"1px dashed #eae8e3"}}/>)}
        <span style={{position:"absolute",left:8,bottom:6,...S.subtle}}>Low conservation</span>
        <span style={{position:"absolute",left:8,top:6,...S.subtle}}>High conservation</span>
        <span style={{position:"absolute",right:8,bottom:6,...S.subtle}}>High composite &rarr;</span>
        {SPECIES.map(sp=>{
          const x=((sp.composite-40)/50)*82+9;const y=100-((sp.scores.conservation-20)/80)*88;const sz=16+(sp.scores.venture/100)*28;
          return(
            <div key={sp.id} title={`${sp.name}\nComposite: ${sp.composite} | Conservation: ${sp.scores.conservation} | Venture: ${sp.scores.venture}`}
              style={{position:"absolute",left:`${x}%`,top:`${y}%`,width:sz,height:sz,borderRadius:"50%",background:iucnColor(sp.iucn),opacity:0.75,transform:"translate(-50%,-50%)",border:"2px solid #fff",display:"flex",alignItems:"center",justifyContent:"center",cursor:"default",transition:"transform 0.2s,opacity 0.2s"}}
              onMouseEnter={e=>{e.currentTarget.style.transform="translate(-50%,-50%) scale(1.3)";e.currentTarget.style.opacity="1";}}
              onMouseLeave={e=>{e.currentTarget.style.transform="translate(-50%,-50%) scale(1)";e.currentTarget.style.opacity="0.75";}}>
              <span style={{fontSize:7,color:"#fff",fontWeight:700}}>{sp.genus.slice(0,3)}</span>
            </div>
          );
        })}
      </div>
      <div style={{display:"flex",gap:12,marginTop:10,flexWrap:"wrap",justifyContent:"center"}}>
        {SPECIES.map(sp=>(
          <div key={sp.id} style={{display:"flex",alignItems:"center",gap:4,...S.subtle}}>
            <Dot color={iucnColor(sp.iucn)} size={6}/><span style={{fontStyle:"italic"}}>{sp.name.split(" ").slice(0,2).join(" ")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── SOURCES PANEL ─── */
function SourcesPanel(){
  const avg=Math.round(SOURCES.reduce((a,s)=>a+s.fresh,0)/SOURCES.length*100);
  const act=SOURCES.filter(s=>s.status==="active").length;
  return(
    <div>
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        {[{l:"Total",v:SOURCES.length},{l:"Active",v:act},{l:"Scheduled",v:SOURCES.length-act},{l:"Avg. freshness",v:`${avg}%`}].map(s=>(
          <div key={s.l} style={{flex:"1 1 100px",...S.metric}}><div style={S.metricLabel}>{s.l}</div><div style={S.metricValue()}>{s.v}</div></div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:8}}>
        {SOURCES.map(src=>(
          <div key={src.id} style={{...S.card,padding:"12px 14px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <span style={{fontSize:12,fontWeight:600,color:"#2c2c2a"}}>{src.name}</span>
              <div style={{display:"flex",alignItems:"center",gap:4}}>
                <Dot color={freshColor(src.fresh)}/><span style={{fontSize:10,fontWeight:600,color:freshColor(src.fresh)}}>{Math.round(src.fresh*100)}%</span>
              </div>
            </div>
            <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:6}}>
              <Pill color="#0C447C" bg="#E6F1FB">{src.type}</Pill>
              <Pill color={src.status==="active"?"#085041":"#854F0B"} bg={src.status==="active"?"#E1F5EE":"#FAEEDA"}>{src.status}</Pill>
            </div>
            <div style={{...S.subtle,marginBottom:4}}>Feeds: {src.feeds} · {src.freq} · Last: {src.last}</div>
            <MiniBar value={src.fresh*100} color={freshColor(src.fresh)} h={3}/>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── MAIN APP ─── */
export default function Home(){
  const[user,setUser]=useState(null);
  const[view,setView]=useState("species");
  const[search,setSearch]=useState("");
  const[fCountry,setFCountry]=useState("all");
  const[fDec,setFDec]=useState("all");
  const[sortBy,setSortBy]=useState("composite");
  const[expanded,setExpanded]=useState(null);
  const[sideOpen,setSideOpen]=useState(true);

  if(!user) return <LoginScreen onLogin={setUser}/>;

  const role=ROLES[user.role];
  const filtered=SPECIES
    .filter(s=>{if(search&&!s.name.toLowerCase().includes(search.toLowerCase())&&!s.genus.toLowerCase().includes(search.toLowerCase()))return false;if(fCountry!=="all"&&s.country!==fCountry)return false;if(fDec!=="all"&&s.decision!==fDec)return false;return true;})
    .sort((a,b)=>{if(sortBy==="composite")return b.composite-a.composite;if(sortBy==="conservation")return b.scores.conservation-a.scores.conservation;if(sortBy==="venture")return b.scores.venture-a.scores.venture;if(sortBy==="trl")return b.trl-a.trl;return a.name.localeCompare(b.name);});

  const countries=[...new Set(SPECIES.map(s=>s.country))];
  const decisions=[...new Set(SPECIES.map(s=>s.decision))];
  const navItems=[{key:"species",label:"Species intelligence",icon:"\uD83C\uDF3F"},{key:"portfolio",label:"Portfolio matrix",icon:"\uD83D\uDCCA"},{key:"sources",label:"Data sources",icon:"\uD83D\uDD17"}];

  const avgComp=Math.round(SPECIES.reduce((a,s)=>a+s.composite,0)/SPECIES.length);
  const threatened=SPECIES.filter(s=>["CR","EN","VU"].includes(s.iucn)).length;
  const avgFresh=Math.round(SOURCES.reduce((a,s)=>a+s.fresh,0)/SOURCES.length*100);

  return(
    <div style={{display:"flex",minHeight:"100vh",background:"#f8f7f4"}}>
      {/* SIDEBAR */}
      <div style={{width:sideOpen?230:0,flexShrink:0,overflow:"hidden",background:"#fff",borderRight:"1px solid #e8e6e1",transition:"width 0.25s ease",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"20px 16px 16px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:24}}>
            <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(145deg,#085041,#1D9E75)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px rgba(8,80,65,0.2)"}}>
              <span style={{color:"#fff",fontSize:16,fontWeight:700,fontFamily:"Georgia,serif"}}>A</span>
            </div>
            <div>
              <div style={{fontSize:15,fontWeight:700,letterSpacing:-0.5,color:"#2c2c2a",fontFamily:"Georgia,serif"}}>ATLAS</div>
              <div style={{fontSize:8,color:"#b4b2a9",letterSpacing:1.5,textTransform:"uppercase"}}>GEOCON v2.0</div>
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:2}}>
            {navItems.map(n=>(
              <button key={n.key} onClick={()=>setView(n.key)} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",border:"none",borderRadius:8,cursor:"pointer",fontSize:12,background:view===n.key?"#f4f3ef":"transparent",color:view===n.key?"#2c2c2a":"#888",fontWeight:view===n.key?600:400,transition:"all 0.15s"}}>
                <span style={{fontSize:14}}>{n.icon}</span>{n.label}
              </button>
            ))}
          </div>
        </div>
        {/* Sidebar stats */}
        <div style={{padding:"0 16px",marginTop:8}}>
          <div style={{padding:12,background:"#f4f3ef",borderRadius:10,fontSize:10,color:"#888",lineHeight:1.8}}>
            <div><strong style={{color:"#2c2c2a"}}>{SPECIES.length}</strong> species tracked</div>
            <div><strong style={{color:"#2c2c2a"}}>{SOURCES.filter(s=>s.status==="active").length}</strong> active data feeds</div>
            <div><strong style={{color:"#2c2c2a"}}>{threatened}</strong> threatened (CR/EN/VU)</div>
            <div>Avg. freshness: <strong style={{color:freshColor(avgFresh/100)}}>{avgFresh}%</strong></div>
          </div>
        </div>
        {/* User block */}
        <div style={{marginTop:"auto",padding:"16px",borderTop:"1px solid #e8e6e1"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <div style={{width:30,height:30,borderRadius:8,background:role.color,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{color:"#fff",fontSize:12,fontWeight:600}}>{role.ic}</span>
            </div>
            <div>
              <div style={{fontSize:12,fontWeight:600,color:"#2c2c2a"}}>{user.name}</div>
              <div style={{fontSize:9,color:"#b4b2a9"}}>{role.label}</div>
            </div>
          </div>
          <button onClick={()=>{setUser(null);setView("species");}} style={{width:"100%",padding:"6px 0",fontSize:10,color:"#888",background:"none",border:"1px solid #e8e6e1",borderRadius:6,cursor:"pointer"}}>
            Logout
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{flex:1,minWidth:0,padding:"20px 24px 32px",overflow:"auto"}}>
        <button onClick={()=>setSideOpen(!sideOpen)} style={{fontSize:18,background:"none",border:"none",cursor:"pointer",color:"#888",marginBottom:12,padding:0}}>
          {sideOpen?"\u25C0":"\u25B6"}
        </button>

        {/* Top metrics */}
        <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
          {[{l:"Species tracked",v:SPECIES.length,c:"#1D9E75"},{l:"Avg. composite",v:avgComp,c:"#534AB7"},{l:"Threatened",v:threatened,c:"#E24B4A"},{l:"Data freshness",v:`${avgFresh}%`,c:"#185FA5"},{l:"Active sources",v:`${SOURCES.filter(s=>s.status==="active").length}/${SOURCES.length}`,c:"#D85A30"}].map(s=>(
            <div key={s.l} style={{flex:"1 1 130px",...S.card,padding:"12px 16px",border:"1px solid #e8e6e1"}}>
              <div style={S.metricLabel}>{s.l}</div>
              <div style={S.metricValue(s.c)}>{s.v}</div>
            </div>
          ))}
        </div>

        {/* SPECIES VIEW */}
        {view==="species"&&(
          <>
            <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
              <input type="text" placeholder="Search species or genus..." value={search} onChange={e=>setSearch(e.target.value)}
                style={{flex:"1 1 180px",minWidth:150,...S.inputBase}}/>
              <select value={fCountry} onChange={e=>setFCountry(e.target.value)} style={S.inputBase}>
                <option value="all">All countries</option>
                {countries.map(c=><option key={c} value={c}>{c==="TR"?"Türkiye":"Chile"}</option>)}
              </select>
              <select value={fDec} onChange={e=>setFDec(e.target.value)} style={S.inputBase}>
                <option value="all">All decisions</option>
                {decisions.map(d=><option key={d} value={d}>{d}</option>)}
              </select>
              <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={S.inputBase}>
                <option value="composite">Sort: Composite</option>
                <option value="conservation">Sort: Conservation</option>
                <option value="venture">Sort: Venture</option>
                <option value="trl">Sort: TRL</option>
                <option value="name">Sort: Name</option>
              </select>
            </div>
            <p style={{...S.subtle,margin:"0 0 10px"}}>{filtered.length} of {SPECIES.length} species · Click to expand</p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(360px,1fr))",gap:10}}>
              {filtered.map(sp=><SpeciesCard key={sp.id} sp={sp} role={user.role} expanded={expanded===sp.id} onToggle={()=>setExpanded(expanded===sp.id?null:sp.id)}/>)}
            </div>
            {filtered.length===0&&<div style={{textAlign:"center",padding:60,color:"#b4b2a9"}}>No species match your filters.</div>}
          </>
        )}

        {view==="portfolio"&&<PortfolioView/>}
        {view==="sources"&&<SourcesPanel/>}

        {/* Footer */}
        <div style={{marginTop:40,paddingTop:12,borderTop:"1px solid #e8e6e1",display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:4,fontSize:9,color:"#b4b2a9"}}>
          <span>GEOCON ATLAS v2.0 · 24 modules · {SOURCES.length} sources · {SPECIES.length} pilot species</span>
          <span>Powered by Venn BioVentures OÜ · Estonia</span>
        </div>
      </div>
    </div>
  );
}
