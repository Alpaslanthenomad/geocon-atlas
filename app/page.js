"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { ROLES, S } from "../lib/constants";

// Shared
import { Dot, Loading } from "../components/shared";

// Gateway
import LoginScreen from "../components/gateway/LoginScreen";

// Home
import GEOCONHome from "../components/home/GEOCONHome";

// Programs
import StartProgramModal from "../components/programs/StartProgramModal";

// Species
import SpeciesDetailPanel from "../components/species/SpeciesDetailPanel";
import SpeciesModule from "../components/species/SpeciesModule";

// Admin
import AdminPanel from "../components/admin/AdminPanel";




/* ── Data fetcher ── */
async function fetchAllPublications() {
  const pageSize = 1000;
  let allPubs = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("publications")
      .select("id,species_id,title,authors,doi,year,journal,open_access,primary_topic,relevance_score,cited_by_count,source,abstract,pubmed_id,openalex_id,category,species(accepted_name)")
      .order("year", { ascending: false })
      .range(from, from + pageSize - 1);
    if (error || !data || data.length === 0) break;
    allPubs = [...allPubs, ...data];
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return allPubs;
}

/* ── Main app ── */
export default function Home() {
  const [user,   setUser]   = useState(null);
  const [view,   setView]   = useState("home");
  const [side,   setSide]   = useState(true);
  const [loading,setLoading]= useState(true);
  const [dbOk,   setDbOk]   = useState(false);

  const [species,      setSpecies]      = useState([]);
  const [metabolites,  setMetabolites]  = useState([]);
  const [markets,      setMarkets]      = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [sources,      setSources]      = useState([]);
  const [publications, setPublications] = useState([]);
  const [researchers,  setResearchers]  = useState([]);
  const [programs,     setPrograms]     = useState([]);

  const [detailSpecies,  setDetailSpecies]  = useState(null);
  const [startProgramSp, setStartProgramSp] = useState(null);

  useEffect(() => {
    async function loadAll() {
      try {
        const [sp, mt, mk, inst, src, res, prog] = await Promise.all([
          supabase.from("species").select("*").order("composite_score", { ascending: false }),
          supabase.from("metabolites").select("*, species(accepted_name)"),
          supabase.from("market_intelligence").select("*, species(accepted_name)"),
          supabase.from("institutions").select("*").order("priority"),
          supabase.from("data_sources").select("*").order("freshness_score", { ascending: false }),
          supabase.from("researchers").select("*").order("h_index", { ascending: false, nullsFirst: false }),
          supabase.from("programs").select("*, species(accepted_name,iucn_status,thumbnail_url)").order("priority_score", { ascending: false }),
        ]);
        const pub = await fetchAllPublications();

        if (sp.data)   setSpecies(sp.data);
        if (mt.data)   setMetabolites(mt.data);
        if (mk.data)   setMarkets(mk.data);
        if (inst.data) setInstitutions(inst.data);
        if (src.data)  setSources(src.data);
        if (res.data)  setResearchers(res.data);
        if (prog.data) setPrograms(prog.data);
        setPublications(pub);
        setDbOk(true);
      } catch {
        setDbOk(false);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  if (!user)   return <LoginScreen onLogin={setUser} />;
  if (loading) return <Loading />;

  const role           = ROLES[user.role];
  const threatened     = species.filter((s) => ["CR","EN","VU"].includes(s.iucn_status)).length;
  const activePrograms = programs.filter((p) => p.status === "Active").length;

  const navItems = [
    { key: "home",        label: "Home",         icon: "🏠" },
    { key: "programs",    label: "Programs",      icon: "📋" },
    { key: "species",     label: "Species",       icon: "🌿" },"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { ROLES, S } from "../lib/constants";

// Shared
import { Dot, Loading } from "../components/shared";

// Gateway
import LoginScreen from "../components/gateway/LoginScreen";

// Home
import GEOCONHome from "../components/home/GEOCONHome";

// Programs
import StartProgramModal from "../components/programs/StartProgramModal";

// Species
import SpeciesDetailPanel from "../components/species/SpeciesDetailPanel";
import SpeciesModule from "../components/species/SpeciesModule";

// Admin
import AdminPanel from "../components/admin/AdminPanel";




/* ── Data fetcher ── */
async function fetchAllPublications() {
  const pageSize = 1000;
  let allPubs = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("publications")
      .select("id,species_id,title,authors,doi,year,journal,open_access,primary_topic,relevance_score,cited_by_count,source,abstract,pubmed_id,openalex_id,category,species(accepted_name)")
      .order("year", { ascending: false })
      .range(from, from + pageSize - 1);
    if (error || !data || data.length === 0) break;
    allPubs = [...allPubs, ...data];
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return allPubs;
}

/* ── Main app ── */
export default function Home() {
  const [user,   setUser]   = useState(null);
  const [view,   setView]   = useState("home");
  const [side,   setSide]   = useState(true);
  const [loading,setLoading]= useState(true);
  const [dbOk,   setDbOk]   = useState(false);

  const [species,      setSpecies]      = useState([]);
  const [metabolites,  setMetabolites]  = useState([]);
  const [markets,      setMarkets]      = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [sources,      setSources]      = useState([]);
  const [publications, setPublications] = useState([]);
  const [researchers,  setResearchers]  = useState([]);
  const [programs,     setPrograms]     = useState([]);

  const [detailSpecies,  setDetailSpecies]  = useState(null);
  const [startProgramSp, setStartProgramSp] = useState(null);

  useEffect(() => {
    async function loadAll() {
      try {
        const [sp, mt, mk, inst, src, res, prog] = await Promise.all([
          supabase.from("species").select("*").order("composite_score", { ascending: false }),
          supabase.from("metabolites").select("*, species(accepted_name)"),
          supabase.from("market_intelligence").select("*, species(accepted_name)"),
          supabase.from("institutions").select("*").order("priority"),
          supabase.from("data_sources").select("*").order("freshness_score", { ascending: false }),
          supabase.from("researchers").select("*").order("h_index", { ascending: false, nullsFirst: false }),
          supabase.from("programs").select("*, species(accepted_name,iucn_status,thumbnail_url)").order("priority_score", { ascending: false }),
        ]);
        const pub = await fetchAllPublications();

        if (sp.data)   setSpecies(sp.data);
        if (mt.data)   setMetabolites(mt.data);
        if (mk.data)   setMarkets(mk.data);
        if (inst.data) setInstitutions(inst.data);
        if (src.data)  setSources(src.data);
        if (res.data)  setResearchers(res.data);
        if (prog.data) setPrograms(prog.data);
        setPublications(pub);
        setDbOk(true);
      } catch {
        setDbOk(false);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  if (!user)   return <LoginScreen onLogin={setUser} />;
  if (loading) return <Loading />;

  const role           = ROLES[user.role];
  const threatened     = species.filter((s) => ["CR","EN","VU"].includes(s.iucn_status)).length;
  const activePrograms = programs.filter((p) => p.status === "Active").length;

  const navItems = [
    { key: "home",        label: "Home",         icon: "🏠" },
    { key: "programs",    label: "Programs",      icon: "📋" },
    { key: "species",     label: "Species",       icon: "🌿" },
    { key: "metabolites", label: "Metabolites",   icon: "🧪" },
    { key: "market",      label: "Market",        icon: "💰" },
    { key: "publications",label: "Publications",  icon: "📚" },
    { key: "researchers", label: "Researchers",   icon: "👨‍🔬" },
    { key: "partners",    label: "Institutions",  icon: "🏛" },
    { key: "portfolio",   label: "Portfolio",     icon: "📊" },
    { key: "sources",     label: "Sources",       icon: "🔗" },
    ...(user.role === "admin" ? [{ key: "admin", label: "Admin", icon: "⚙️" }] : []),
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8f7f4" }}>

      {/* ── Sidebar ── */}
      <div style={{ width: side ? 220 : 0, flexShrink: 0, overflow: "hidden", background: "#fff", borderRight: "1px solid #e8e6e1", transition: "width 0.25s ease", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "18px 14px 14px", flex: 1, overflow: "hidden" }}>

          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(145deg,#085041,#1D9E75)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: "Georgia,serif" }}>A</span>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: -0.5, color: "#2c2c2a", fontFamily: "Georgia,serif" }}>ATLAS</div>
              <div style={{ fontSize: 7, color: "#b4b2a9", letterSpacing: 1.5, textTransform: "uppercase" }}>GEOCON v3.0</div>
            </div>
          </div>

          {/* Nav */}
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {navItems.map((n) => (
              <button
                key={n.key}
                onClick={() => setView(n.key)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", border: "none", borderRadius: 7, cursor: "pointer", fontSize: 11, background: view === n.key ? "#f4f3ef" : "transparent", color: view === n.key ? "#2c2c2a" : "#888", fontWeight: view === n.key ? 600 : 400, transition: "all 0.15s" }}
              >
                <span style={{ fontSize: 13 }}>{n.icon}</span>
                {n.label}
                {n.key === "programs" && activePrograms > 0 && (
                  <span style={{ marginLeft: "auto", fontSize: 9, padding: "1px 5px", borderRadius: 99, background: "#E1F5EE", color: "#085041", fontWeight: 700 }}>{activePrograms}</span>
                )}
              </button>
            ))}
          </div>

          {/* Stats */}
          <div style={{ marginTop: 12, padding: 10, background: "#f4f3ef", borderRadius: 8, fontSize: 9, color: "#888", lineHeight: 1.8 }}>
            <div><Dot color={dbOk ? "#0F6E56" : "#A32D2D"} size={6} /><span style={{ marginLeft: 4 }}>{dbOk ? "Supabase connected" : "Offline"}</span></div>
            <div><strong style={{ color: "#2c2c2a" }}>{species.length}</strong> species · <strong style={{ color: "#2c2c2a" }}>{programs.length}</strong> programs</div>
            <div><strong style={{ color: "#2c2c2a" }}>{publications.length}</strong> pubs · <strong style={{ color: "#2c2c2a" }}>{metabolites.length}</strong> cpds</div>
          </div>
        </div>

        {/* User footer */}
        <div style={{ padding: 14, borderTop: "1px solid #e8e6e1" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: 6, background: role.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontSize: 10, fontWeight: 600 }}>{role.ic}</span>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#2c2c2a" }}>{user.name}</div>
              <div style={{ fontSize: 8, color: "#b4b2a9" }}>{role.label}</div>
            </div>
          </div>
          <a href="/upload-admin" style={{ display: "block", textAlign: "center", padding: "6px 0", fontSize: 9, color: "#1D9E75", textDecoration: "none", border: "1px solid #1D9E75", borderRadius: 6, marginBottom: 6, fontWeight: 600 }}>
            📊 Excel Upload
          </a>
          <button
            onClick={() => { setUser(null); setView("home"); }}
            style={{ width: "100%", padding: "5px 0", fontSize: 9, color: "#888", background: "none", border: "1px solid #e8e6e1", borderRadius: 6, cursor: "pointer" }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ flex: 1, minWidth: 0, padding: "16px 20px 28px", overflow: "auto" }}>
        <button onClick={() => setSide(!side)} style={{ fontSize: 16, background: "none", border: "none", cursor: "pointer", color: "#888", marginBottom: 10, padding: 0 }}>
          {side ? "◀" : "▶"}
        </button>

        {/* Top metrics bar */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          {[
            { l: "Species",     v: species.length,      c: "#1D9E75" },
            { l: "Programs",    v: programs.length,     c: "#534AB7" },
            { l: "Compounds",   v: metabolites.length,  c: "#185FA5" },
            { l: "Publications",v: publications.length, c: "#D85A30" },
            { l: "Threatened",  v: threatened,          c: "#E24B4A" },
          ].map((s) => (
            <div key={s.l} style={{ flex: "1 1 100px", ...S.card, padding: "10px 14px", border: "1px solid #e8e6e1" }}>
              <div style={S.mLabel}>{s.l}</div>
              <div style={S.mVal(s.c)}>{s.v}</div>
            </div>
          ))}
        </div>

        {/* ── View routing ── */}
        {view === "home"         && <GEOCONHome species={species} publications={publications} metabolites={metabolites} researchers={researchers} programs={programs} user={user} setView={setView} onSpeciesClick={setDetailSpecies} />}
        {view === "programs"     && <ProgramsView species={species} user={user} />}
        {view === "species"      && <SpeciesModule species={species} onSpeciesClick={setDetailSpecies} />}
        {view === "metabolites"  && <MetaboliteExplorer metabolites={metabolites} />}
        {view === "market"       && <MarketView markets={markets} />}
        {view === "publications" && <PublicationsView publications={publications} />}
        {view === "researchers"  && <ResearchersView researchers={researchers} />}
        {view === "partners"     && <PartnerView institutions={institutions} />}
        {view === "portfolio"    && <PortfolioView species={species} />}
        {view === "sources"      && <SourcesPanel sources={sources} />}
        {view === "admin"        && user.role === "admin" && <AdminPanel species={species} programs={programs} onDataChange={() => window.location.reload()} />}

        {/* Footer */}
        <div style={{ marginTop: 32, paddingTop: 10, borderTop: "1px solid #e8e6e1", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 4, fontSize: 8, color: "#b4b2a9" }}>
          <span>GEOCON ATLAS v3.0 · {species.length} species · {programs.length} programs · {publications.length} pubs</span>
          <span>Venn BioVentures OÜ</span>
        </div>
      </div>

      {/* ── Panels & Modals ── */}
      {detailSpecies && (
        <SpeciesDetailPanel
          species={detailSpecies}
          onClose={() => setDetailSpecies(null)}
          onStartProgram={(sp) => { setStartProgramSp(sp); setDetailSpecies(null); }}
        />
      )}
      {startProgramSp && (
        <StartProgramModal
          species={startProgramSp}
          onClose={() => setStartProgramSp(null)}
          onSuccess={() => { setStartProgramSp(null); window.location.reload(); }}
        />
      )}
    </div>
  );
}

function MetaboliteExplorer({metabolites}){
  const[selectedCat,setSelectedCat]=useState(null);const[search,setSearch]=useState("");const[expanded,setExpanded]=useState(null);
  const CAT_META={alkaloid:{icon:"🔵",color:"#534AB7",bg:"#EEEDFE",desc:"Nitrogen-containing plant compounds"},flavonoid:{icon:"🟡",color:"#BA7517",bg:"#FAEEDA",desc:"Polyphenolic antioxidants"},terpenoid:{icon:"🟢",color:"#0F6E56",bg:"#E1F5EE",desc:"Terpenes & terpenoids"},phenolic:{icon:"🟤",color:"#854F0B",bg:"#FAEEDA",desc:"Phenolic acids & compounds"},saponin:{icon:"🔴",color:"#993556",bg:"#FBEAF0",desc:"Steroid & triterpenoid saponins"},glycoside:{icon:"🟣",color:"#185FA5",bg:"#E6F1FB",desc:"Sugar-containing compounds"},steroid:{icon:"⚪",color:"#639922",bg:"#EAF3DE",desc:"Steroidal compounds"},"amino acid":{icon:"🔶",color:"#D85A30",bg:"#FAECE7",desc:"Amino acids & peptides"},other:{icon:"⬜",color:"#888780",bg:"#F1EFE8",desc:"Other compound classes"}};
  const CATS=Object.keys(CAT_META);
  const catCounts={};for(const cat of CATS){catCounts[cat]=metabolites.filter(m=>(m.activity_category||"other")===cat).length;}
  const catMets=selectedCat?metabolites.filter(m=>{const matchCat=(m.activity_category||"other")===selectedCat;const matchSearch=!search||(m.compound_name||"").toLowerCase().includes(search.toLowerCase())||(m.species?.accepted_name||"").toLowerCase().includes(search.toLowerCase());return matchCat&&matchSearch;}):[];
  return<div>
    {!selectedCat?<>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}><div><div style={{fontSize:16,fontWeight:700,color:"#2c2c2a",fontFamily:"Georgia,serif"}}>Metabolites</div><div style={{fontSize:11,color:"#888",marginTop:2}}>{metabolites.length} compounds · {CATS.length} categories</div></div><div style={{display:"flex",gap:6}}>{[{l:"Total",v:metabolites.length,c:"#534AB7"},{l:"Species",v:[...new Set(metabolites.map(m=>m.species_id).filter(Boolean))].length,c:"#185FA5"}].map(s=><div key={s.l} style={{textAlign:"center",padding:"5px 10px",background:"#f4f3ef",borderRadius:8}}><div style={{fontSize:14,fontWeight:700,color:s.c}}>{s.v}</div><div style={{fontSize:9,color:"#999"}}>{s.l}</div></div>)}</div></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:10}}>{CATS.map(cat=>{const m=CAT_META[cat];const count=catCounts[cat]||0;const topMets=metabolites.filter(me=>(me.activity_category||"other")===cat).slice(0,3);return<div key={cat} onClick={()=>{setSelectedCat(cat);setSearch("");}} style={{background:"#fff",border:"1px solid #e8e6e1",borderRadius:12,overflow:"hidden",cursor:"pointer",transition:"all 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=m.color;e.currentTarget.style.transform="translateY(-2px)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="#e8e6e1";e.currentTarget.style.transform="translateY(0)"}}><div style={{background:m.bg,padding:"14px 14px 10px",borderBottom:`1px solid ${m.color}22`}}><div style={{fontSize:24,marginBottom:6}}>{m.icon}</div><div style={{fontSize:13,fontWeight:700,color:m.color,textTransform:"capitalize"}}>{cat}</div><div style={{fontSize:10,color:"#888",marginTop:2}}>{m.desc}</div></div><div style={{padding:"10px 14px"}}><div style={{fontSize:20,fontWeight:700,color:"#2c2c2a",marginBottom:6}}>{count}</div><div style={{display:"flex",flexDirection:"column",gap:2}}>{topMets.map(me=><div key={me.id} style={{fontSize:9,color:"#b4b2a9",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{(me.compound_name||"").slice(0,40)}</div>)}</div></div></div>;})}
      </div>
    </>:<>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}><button onClick={()=>{setSelectedCat(null);setSearch("");}} style={{padding:"6px 12px",border:"1px solid #e8e6e1",borderRadius:7,background:"#fff",cursor:"pointer",fontSize:11,color:"#888"}}>← Categories</button><div style={{flex:1,display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:20}}>{CAT_META[selectedCat]?.icon}</span><div><div style={{fontSize:15,fontWeight:700,color:CAT_META[selectedCat]?.color,textTransform:"capitalize"}}>{selectedCat}</div><div style={{fontSize:11,color:"#888"}}>{catMets.length} compounds</div></div></div></div>
      <input type="text" placeholder="Search compound or species..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:"100%",marginBottom:12,...S.input}}/>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>{catMets.length===0?<div style={{textAlign:"center",padding:40,color:"#999",fontSize:13}}>No compounds found</div>:catMets.map(m=><div key={m.id} onClick={()=>setExpanded(expanded===m.id?null:m.id)} style={{background:"#fff",border:expanded===m.id?"1px solid #85B7EB":"1px solid #e8e6e1",borderRadius:8,padding:"10px 12px",cursor:"pointer",borderLeft:`3px solid ${CAT_META[selectedCat]?.color||"#888"}`}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}><div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:"#2c2c2a"}}>{m.compound_name}</div><div style={{fontSize:10,fontStyle:"italic",color:"#888",marginTop:2}}>{m.species?.accepted_name||"—"}</div></div><div style={{display:"flex",gap:4,alignItems:"center",flexShrink:0}}>{m.evidence&&<span style={{fontSize:9,padding:"2px 6px",borderRadius:99,background:"#E1F5EE",color:"#085041"}}>{m.evidence}</span>}{m.confidence&&<span style={{fontSize:10,fontWeight:700,color:CAT_META[selectedCat]?.color}}>{Math.round(m.confidence*100)}%</span>}</div></div>{m.reported_activity&&<div style={{fontSize:11,color:"#5f5e5a",marginTop:6,lineHeight:1.5}}>{m.reported_activity.slice(0,120)}</div>}{expanded===m.id&&<div style={{marginTop:10,paddingTop:10,borderTop:"1px solid #e8e6e1"}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px 14px",fontSize:11}}>{[{l:"Plant organ",v:m.plant_organ},{l:"Therapeutic area",v:m.therapeutic_area},{l:"Confidence",v:m.confidence?`${Math.round(m.confidence*100)}%`:null}].map(({l,v})=>v?<div key={l}><span style={{color:"#b4b2a9",fontSize:9,textTransform:"uppercase"}}>{l}</span><div style={{color:"#2c2c2a",fontWeight:500}}>{v}</div></div>:null)}</div></div>}</div>)}</div>
    </>}
  </div>;
}

/* ── Programs View ── */
function ProgramsView({species,user}){
  const[programs,setPrograms]=useState([]);const[loading,setLoading]=useState(true);const[selected,setSelected]=useState(null);const[tab,setTab]=useState("overview");const[stories,setStories]=useState([]);const[actions,setActions]=useState([]);const[decisions,setDecisions]=useState([]);
  useEffect(()=>{supabase.from("programs").select("*, species(accepted_name,iucn_status,family,thumbnail_url)").order("priority_score",{ascending:false}).then(({data})=>{setPrograms(data||[]);setLoading(false);});},[]);
  useEffect(()=>{if(!selected)return;Promise.all([supabase.from("program_story_entries").select("*").eq("program_id",selected.id).order("created_at",{ascending:false}),supabase.from("program_actions").select("*").eq("program_id",selected.id).order("priority"),supabase.from("program_decisions").select("*").eq("program_id",selected.id).order("decision_date",{ascending:false})]).then(([s,a,d])=>{setStories(s.data||[]);setActions(a.data||[]);setDecisions(d.data||[]);});},[selected?.id]);
  if(loading)return<Loading/>;
  const active=programs.filter(p=>p.status==="Active");const blocked=programs.filter(p=>p.status==="Blocked");
  return<div>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:8}}>
      <div><div style={{fontSize:16,fontWeight:700,color:"#2c2c2a",fontFamily:"Georgia,serif"}}>GEOCON Programs</div><div style={{fontSize:11,color:"#888",marginTop:2}}>{programs.length} programs · {active.length} active · {blocked.length} blocked</div></div>
      <div style={{display:"flex",gap:6}}>{[{l:"Active",v:active.length,c:"#1D9E75"},{l:"Blocked",v:blocked.length,c:"#A32D2D"},{l:"Draft",v:programs.filter(p=>p.status==="Draft").length,c:"#888"}].map(s=><div key={s.l} style={{textAlign:"center",padding:"5px 10px",background:"#f4f3ef",borderRadius:8}}><div style={{fontSize:14,fontWeight:700,color:s.c}}>{s.v}</div><div style={{fontSize:9,color:"#999"}}>{s.l}</div></div>)}</div>
    </div>
    {programs.length===0?<div style={{textAlign:"center",padding:60,color:"#999"}}><div style={{fontSize:32,marginBottom:12}}>🌿</div><div style={{fontSize:15,fontWeight:600,color:"#2c2c2a",marginBottom:8}}>No programs yet</div><div style={{fontSize:12}}>Open any species and click "+ Start Program" to begin a GEOCON journey.</div></div>:<>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6,marginBottom:16}}>{["Origin","Forge","Mesh","Exchange","Accord"].map(m=>{const count=programs.filter(p=>p.current_module===m).length;return<div key={m} style={{padding:"10px 12px",background:"#fff",borderRadius:10,border:`1px solid ${MODULE_COLORS[m]}33`,textAlign:"center"}}><div style={{fontSize:11,fontWeight:700,color:MODULE_COLORS[m]}}>{m}</div><div style={{fontSize:20,fontWeight:700,color:"#2c2c2a",margin:"4px 0"}}>{count}</div></div>;})}</div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>{programs.map(p=>{const modColor=MODULE_COLORS[p.current_module]||"#888";return<div key={p.id} onClick={()=>{setSelected(p);setTab("overview");}} style={{background:"#fff",border:selected?.id===p.id?"2px solid #1D9E75":"1px solid #e8e6e1",borderLeft:`4px solid ${modColor}`,borderRadius:10,padding:"14px 16px",cursor:"pointer"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}><div style={{flex:1}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}><span style={{fontSize:13,fontWeight:700,color:"#2c2c2a"}}>{p.program_name}</span><span style={{fontSize:9,padding:"2px 8px",borderRadius:99,background:(STATUS_COLORS[p.status]||"#888")+"22",color:STATUS_COLORS[p.status]||"#888",fontWeight:600}}>{p.status}</span></div>{p.species&&<div style={{fontSize:11,fontStyle:"italic",color:"#888",marginBottom:6}}>{p.species.accepted_name} · {p.program_type}</div>}<div style={{display:"flex",gap:6,flexWrap:"wrap"}}><span style={{fontSize:10,padding:"2px 8px",borderRadius:99,background:modColor+"15",color:modColor}}>Module: {p.current_module}</span>{p.current_gate&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:99,background:"#f4f3ef",color:"#5f5e5a"}}>Gate: {p.current_gate}</span>}</div></div>{p.readiness_score>0&&<div style={{textAlign:"center",padding:"4px 10px",background:"#f4f3ef",borderRadius:8}}><div style={{fontSize:7,color:"#999",textTransform:"uppercase"}}>Readiness</div><div style={{fontSize:16,fontWeight:700,color:"#1D9E75"}}>{p.readiness_score}</div></div>}</div>{p.next_action&&<div style={{marginTop:8,padding:"6px 10px",background:"#f8f7f4",borderRadius:6,fontSize:11,color:"#5f5e5a"}}>→ {p.next_action}</div>}{p.primary_blocker&&<div style={{marginTop:4,padding:"6px 10px",background:"#FCEBEB",borderRadius:6,fontSize:11,color:"#A32D2D"}}>⚠ {p.primary_blocker}</div>}</div>;})}
      </div>
    </>}
    {selected&&<>
      <div onClick={()=>setSelected(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.3)",zIndex:100}}/>
      <div style={{position:"fixed",top:0,right:0,bottom:0,width:560,background:"#fff",zIndex:101,display:"flex",flexDirection:"column",boxShadow:"-4px 0 24px rgba(0,0,0,0.12)"}}>
        <div style={{padding:"18px 20px",borderBottom:"1px solid #e8e6e1",background:"#f8f7f4",flexShrink:0}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div style={{flex:1}}><div style={{fontSize:9,color:"#888",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>{selected.program_type}</div><div style={{fontSize:18,fontWeight:700,color:"#2c2c2a",lineHeight:1.3}}>{selected.program_name}</div>{selected.species&&<div style={{fontSize:12,fontStyle:"italic",color:"#888",marginTop:2}}>{selected.species.accepted_name}</div>}</div><button onClick={()=>setSelected(null)} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#888"}}>✕</button></div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:10}}><span style={{fontSize:10,padding:"2px 8px",borderRadius:99,background:(MODULE_COLORS[selected.current_module]||"#888")+"15",color:MODULE_COLORS[selected.current_module]||"#888"}}>{selected.current_module}</span><span style={{fontSize:10,padding:"2px 8px",borderRadius:99,background:"#f4f3ef",color:"#5f5e5a"}}>{selected.current_gate}</span><span style={{fontSize:10,padding:"2px 8px",borderRadius:99,background:(STATUS_COLORS[selected.status]||"#888")+"22",color:STATUS_COLORS[selected.status]||"#888"}}>{selected.status}</span></div>
        </div>
        {(selected.readiness_score||selected.confidence_score||selected.priority_score)&&<div style={{padding:"10px 20px",borderBottom:"1px solid #e8e6e1",display:"flex",gap:6,flexShrink:0}}>{[{l:"Readiness",v:selected.readiness_score,c:"#1D9E75"},{l:"Confidence",v:selected.confidence_score,c:"#185FA5"},{l:"Priority",v:selected.priority_score,c:"#D85A30"}].map(m=>m.v?<div key={m.l} style={{flex:1,background:"#f4f3ef",borderRadius:8,padding:"6px 8px",textAlign:"center"}}><div style={{fontSize:8,color:"#999",textTransform:"uppercase",marginBottom:2}}>{m.l}</div><div style={{fontSize:16,fontWeight:700,color:m.c}}>{m.v}</div></div>:null)}</div>}
        <div style={{display:"flex",borderBottom:"1px solid #e8e6e1",flexShrink:0,overflowX:"auto"}}>{["overview","story","actions","decisions"].map(t=><button key={t} onClick={()=>setTab(t)} style={{flexShrink:0,padding:"10px 14px",border:"none",borderBottom:tab===t?"2px solid #1D9E75":"2px solid transparent",background:"none",cursor:"pointer",fontSize:11,fontWeight:tab===t?600:400,color:tab===t?"#1D9E75":"#888",textTransform:"capitalize"}}>{t}</button>)}</div>
        <div style={{flex:1,overflowY:"auto",padding:"16px 20px"}}>
          {tab==="overview"&&<div style={{display:"flex",flexDirection:"column",gap:12}}>
            {selected.why_this_program&&<div style={{padding:"12px 14px",background:"#f8f7f4",borderRadius:8,borderLeft:"3px solid #1D9E75"}}><div style={{fontSize:9,color:"#888",textTransform:"uppercase",marginBottom:6}}>Why this program</div><div style={{fontSize:12,color:"#2c2c2a",lineHeight:1.7}}>{selected.why_this_program}</div></div>}
            {selected.strategic_rationale&&<div style={{padding:"12px 14px",background:"#f8f7f4",borderRadius:8,borderLeft:"3px solid #185FA5"}}><div style={{fontSize:9,color:"#888",textTransform:"uppercase",marginBottom:6}}>Strategic rationale</div><div style={{fontSize:12,color:"#2c2c2a",lineHeight:1.7}}>{selected.strategic_rationale}</div></div>}
            {selected.next_action&&<div style={{padding:"12px 14px",background:"#E1F5EE",borderRadius:8}}><div style={{fontSize:9,color:"#085041",textTransform:"uppercase",marginBottom:4}}>Next action</div><div style={{fontSize:12,color:"#085041",fontWeight:600}}>{selected.next_action}</div></div>}
            {selected.primary_blocker&&<div style={{padding:"12px 14px",background:"#FCEBEB",borderRadius:8}}><div style={{fontSize:9,color:"#A32D2D",textTransform:"uppercase",marginBottom:4}}>Primary blocker</div><div style={{fontSize:12,color:"#A32D2D"}}>{selected.primary_blocker}</div></div>}
            {selected.what_is_missing&&<div style={{padding:"12px 14px",background:"#FAEEDA",borderRadius:8}}><div style={{fontSize:9,color:"#633806",textTransform:"uppercase",marginBottom:4}}>What is missing</div><div style={{fontSize:12,color:"#633806",lineHeight:1.6}}>{selected.what_is_missing}</div></div>}
            {selected.recommended_pathway&&<div style={{padding:"12px 14px",background:"#f8f7f4",borderRadius:8}}><div style={{fontSize:9,color:"#888",textTransform:"uppercase",marginBottom:4}}>Recommended pathway</div><div style={{fontSize:12,color:"#2c2c2a",lineHeight:1.6}}>{selected.recommended_pathway}</div></div>}
          </div>}
          {tab==="story"&&<div>{stories.length===0?<div style={{textAlign:"center",padding:32,color:"#999",fontSize:13}}>No story entries yet</div>:stories.map(s=><div key={s.id} style={{marginBottom:10,padding:"12px 14px",background:"#f8f7f4",borderRadius:8,borderLeft:"3px solid #534AB7"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:12,fontWeight:600,color:"#2c2c2a"}}>{s.title}</span><span style={{fontSize:9,color:"#888"}}>{s.entry_date}</span></div>{s.entry_type&&<span style={{fontSize:9,padding:"1px 6px",borderRadius:99,background:"#EEEDFE",color:"#3C3489",marginBottom:6,display:"inline-block"}}>{s.entry_type}</span>}{s.summary&&<div style={{fontSize:11,color:"#5f5e5a",lineHeight:1.6,marginTop:4}}>{s.summary}</div>}</div>)}</div>}
          {tab==="actions"&&<div>{actions.length===0?<div style={{textAlign:"center",padding:32,color:"#999",fontSize:13}}>No actions yet</div>:actions.map(a=><div key={a.id} style={{marginBottom:8,padding:"12px 14px",background:"#f8f7f4",borderRadius:8,borderLeft:`3px solid ${a.status==="completed"?"#1D9E75":a.priority==="high"?"#A32D2D":"#888"}`}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:12,fontWeight:600,color:"#2c2c2a"}}>{a.action_title}</span><span style={{fontSize:9,padding:"2px 6px",borderRadius:99,background:a.status==="completed"?"#E1F5EE":"#f4f3ef",color:a.status==="completed"?"#085041":"#888"}}>{a.status}</span></div>{a.action_description&&<div style={{fontSize:11,color:"#5f5e5a",marginBottom:4}}>{a.action_description}</div>}<div style={{display:"flex",gap:8,fontSize:10,color:"#888"}}>{a.action_owner&&<span>Owner: {a.action_owner}</span>}{a.due_date&&<span>Due: {a.due_date}</span>}</div></div>)}</div>}
          {tab==="decisions"&&<div>{decisions.length===0?<div style={{textAlign:"center",padding:32,color:"#999",fontSize:13}}>No decisions recorded yet</div>:decisions.map(d=><div key={d.id} style={{marginBottom:10,padding:"12px 14px",background:"#f8f7f4",borderRadius:8,borderLeft:"3px solid #D85A30"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:12,fontWeight:600,color:"#2c2c2a"}}>{d.decision_title}</span><span style={{fontSize:9,color:"#888"}}>{d.decision_date}</span></div>{d.decision_type&&<span style={{fontSize:9,padding:"1px 6px",borderRadius:99,background:"#FAECE7",color:"#712B13",marginBottom:6,display:"inline-block"}}>{d.decision_type}</span>}{d.rationale&&<div style={{fontSize:11,color:"#5f5e5a",lineHeight:1.6,marginTop:4}}>{d.rationale}</div>}{d.made_by&&<div style={{fontSize:10,color:"#888",marginTop:4}}>Decision by: {d.made_by}</div>}</div>)}</div>}
        </div>
      </div>
    </>}
  </div>;
}

/* ── Publications View ── */

function PublicationsView({publications}){
  const[selectedCat,setSelectedCat]=useState(null);const[search,setSearch]=useState("");const[page,setPage]=useState(0);const[expanded,setExpanded]=useState(null);const PAGE_SIZE=30;
  const CAT_META={Phytochemistry:{icon:"⚗️",color:"#534AB7",bg:"#EEEDFE",desc:"Metabolites, compounds, chemical analysis"},Conservation:{icon:"🛡",color:"#A32D2D",bg:"#FCEBEB",desc:"Threatened species, habitat, population"},Agronomy:{icon:"🌾",color:"#639922",bg:"#EAF3DE",desc:"Cultivation, yield, crop production"},Pharmacology:{icon:"💊",color:"#185FA5",bg:"#E6F1FB",desc:"Medical activity, therapeutic, clinical"},Taxonomy:{icon:"🔬",color:"#854F0B",bg:"#FAEEDA",desc:"Systematics, phylogeny, classification"},Ecology:{icon:"🌍",color:"#0F6E56",bg:"#E1F5EE",desc:"Distribution, habitat, occurrence"},Biotechnology:{icon:"🧬",color:"#993556",bg:"#FBEAF0",desc:"Tissue culture, in vitro, genetic"},Other:{icon:"📄",color:"#888780",bg:"#F1EFE8",desc:"Other topics"}};
  const CATS=Object.keys(CAT_META);const catCounts={};for(const cat of CATS)catCounts[cat]=publications.filter(p=>p.category===cat).length;
  const catPubs=selectedCat?publications.filter(p=>p.category===selectedCat&&(!search||(p.title||"").toLowerCase().includes(search.toLowerCase())||(p.authors||"").toLowerCase().includes(search.toLowerCase()))):[];
  const totalPages=Math.ceil(catPubs.length/PAGE_SIZE);const paginated=catPubs.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE);const uncategorized=publications.filter(p=>!p.category).length;
  return<div>
    {!selectedCat?<>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}><div><div style={{fontSize:16,fontWeight:700,color:"#2c2c2a",fontFamily:"Georgia,serif"}}>Publications</div><div style={{fontSize:11,color:"#888",marginTop:2}}>{publications.length} publications · {CATS.length} categories</div></div><div style={{display:"flex",gap:6}}>{[{l:"Total",v:publications.length,c:"#185FA5"},{l:"Open Access",v:publications.filter(p=>p.open_access).length,c:"#0F6E56"},{l:"With Abstract",v:publications.filter(p=>p.abstract).length,c:"#534AB7"}].map(s=><div key={s.l} style={{textAlign:"center",padding:"5px 10px",background:"#f4f3ef",borderRadius:8}}><div style={{fontSize:14,fontWeight:700,color:s.c}}>{s.v}</div><div style={{fontSize:9,color:"#999"}}>{s.l}</div></div>)}</div></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}}>{CATS.map(cat=>{const m=CAT_META[cat];const count=catCounts[cat]||0;const topPubs=publications.filter(p=>p.category===cat).slice(0,3);return<div key={cat} onClick={()=>{setSelectedCat(cat);setPage(0);setSearch("");}} style={{background:"#fff",border:"1px solid #e8e6e1",borderRadius:12,overflow:"hidden",cursor:"pointer",transition:"all 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=m.color;e.currentTarget.style.transform="translateY(-2px)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="#e8e6e1";e.currentTarget.style.transform="translateY(0)"}}><div style={{background:m.bg,padding:"14px 14px 10px",borderBottom:`1px solid ${m.color}22`}}><div style={{fontSize:24,marginBottom:6}}>{m.icon}</div><div style={{fontSize:13,fontWeight:700,color:m.color}}>{cat}</div><div style={{fontSize:10,color:"#888",marginTop:2}}>{m.desc}</div></div><div style={{padding:"10px 14px"}}><div style={{fontSize:20,fontWeight:700,color:"#2c2c2a",marginBottom:6}}>{count}</div><div style={{display:"flex",flexDirection:"column",gap:2}}>{topPubs.map(p=><div key={p.id} style={{fontSize:9,color:"#b4b2a9",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{(p.title||"").slice(0,45)}</div>)}</div></div></div>;})}
      </div>
      {uncategorized>0&&<div style={{marginTop:12,padding:"8px 12px",background:"#FAEEDA",borderRadius:8,fontSize:11,color:"#633806"}}>⚠ {uncategorized} publications not yet categorized</div>}
    </>:<>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}><button onClick={()=>{setSelectedCat(null);setSearch("");}} style={{padding:"6px 12px",border:"1px solid #e8e6e1",borderRadius:7,background:"#fff",cursor:"pointer",fontSize:11,color:"#888"}}>← Categories</button><div style={{flex:1,display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:20}}>{CAT_META[selectedCat]?.icon}</span><div><div style={{fontSize:15,fontWeight:700,color:CAT_META[selectedCat]?.color}}>{selectedCat}</div><div style={{fontSize:11,color:"#888"}}>{catPubs.length} publications</div></div></div></div>
      <input type="text" placeholder="Search title or author..." value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}} style={{width:"100%",marginBottom:12,...S.input}}/>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>{paginated.map(p=><div key={p.id} onClick={()=>setExpanded(expanded===p.id?null:p.id)} style={{background:"#fff",border:expanded===p.id?"1px solid #85B7EB":"1px solid #e8e6e1",borderRadius:8,padding:"10px 12px",cursor:"pointer",borderLeft:`3px solid ${CAT_META[selectedCat]?.color||"#888"}`}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}><div style={{flex:1}}><div style={{fontSize:12,fontWeight:600,color:"#2c2c2a",lineHeight:1.4}}>{p.doi?<a href={p.doi} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{color:"#185FA5",textDecoration:"none"}}>{(p.title||"Untitled").slice(0,120)}</a>:(p.title||"Untitled").slice(0,120)}</div><div style={{fontSize:10,color:"#888",marginTop:3}}>{(p.authors||"").slice(0,80)}</div></div><div style={{display:"flex",flexDirection:"column",gap:3,alignItems:"flex-end",flexShrink:0}}>{p.year&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:99,background:"#E6F1FB",color:"#0C447C"}}>{p.year}</span>}{p.open_access&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:99,background:"#E1F5EE",color:"#085041"}}>OA</span>}</div></div>{p.journal&&<div style={{fontSize:10,color:"#b4b2a9",marginTop:4,fontStyle:"italic"}}>{p.journal.slice(0,60)}</div>}{expanded===p.id&&<div style={{marginTop:10,paddingTop:10,borderTop:"1px solid #e8e6e1"}}>{p.abstract?<div style={{fontSize:11,color:"#5f5e5a",lineHeight:1.6}}>{p.abstract.slice(0,500)}</div>:<div style={{fontSize:11,color:"#b4b2a9",fontStyle:"italic"}}>No abstract — {p.doi?<a href={p.doi} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{color:"#185FA5"}}>view paper ↗</a>:"no DOI"}</div>}</div>}</div>)}</div>
      {totalPages>1&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginTop:16}}><button onClick={()=>setPage(0)} disabled={page===0} style={{...S.input,padding:"5px 10px",cursor:page===0?"default":"pointer",opacity:page===0?0.4:1}}>«</button><button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0} style={{...S.input,padding:"5px 10px",cursor:page===0?"default":"pointer",opacity:page===0?0.4:1}}>‹</button><span style={{fontSize:12,color:"#888",minWidth:100,textAlign:"center"}}>Page {page+1} / {totalPages}</span><button onClick={()=>setPage(p=>Math.min(totalPages-1,p+1))} disabled={page===totalPages-1} style={{...S.input,padding:"5px 10px",cursor:page===totalPages-1?"default":"pointer",opacity:page===totalPages-1?0.4:1}}>›</button><button onClick={()=>setPage(totalPages-1)} disabled={page===totalPages-1} style={{...S.input,padding:"5px 10px",cursor:page===totalPages-1?"default":"pointer",opacity:page===totalPages-1?0.4:1}}>»</button></div>}
    </>}
  </div>;
}

/* ── Other views (Market, Researchers, Partners, Sources, Portfolio, Admin) ── */
function MarketView({markets}){const[expanded,setExpanded]=useState(null);return<div><div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>{[{l:"Hypotheses",v:markets.length},{l:"Spin-offs",v:[...new Set(markets.map(m=>m.spinoff_link))].length}].map(s=><div key={s.l} style={{flex:"1 1 110px",...S.metric}}><div style={S.mLabel}>{s.l}</div><div style={S.mVal()}>{s.v}</div></div>)}</div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:10}}>{markets.map(m=><div key={m.id} onClick={()=>setExpanded(expanded===m.id?null:m.id)} style={{...S.card,padding:16,cursor:"pointer"}}><div style={{fontSize:14,fontWeight:600,color:"#2c2c2a",marginBottom:4}}>{m.application_area}</div><div style={{fontSize:10,fontStyle:"italic",color:"#888"}}>{m.species?.accepted_name||"—"} — {m.market_segment}</div></div>)}</div></div>;}

    { key: "metabolites", label: "Metabolites",   icon: "🧪" },
    { key: "market",      label: "Market",        icon: "💰" },
    { key: "publications",label: "Publications",  icon: "📚" },
    { key: "researchers", label: "Researchers",   icon: "👨‍🔬" },
    { key: "partners",    label: "Institutions",  icon: "🏛" },
    { key: "portfolio",   label: "Portfolio",     icon: "📊" },
    { key: "sources",     label: "Sources",       icon: "🔗" },
    ...(user.role === "admin" ? [{ key: "admin", label: "Admin", icon: "⚙️" }] : []),
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8f7f4" }}>

      {/* ── Sidebar ── */}
      <div style={{ width: side ? 220 : 0, flexShrink: 0, overflow: "hidden", background: "#fff", borderRight: "1px solid #e8e6e1", transition: "width 0.25s ease", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "18px 14px 14px", flex: 1, overflow: "hidden" }}>

          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(145deg,#085041,#1D9E75)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: "Georgia,serif" }}>A</span>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: -0.5, color: "#2c2c2a", fontFamily: "Georgia,serif" }}>ATLAS</div>
              <div style={{ fontSize: 7, color: "#b4b2a9", letterSpacing: 1.5, textTransform: "uppercase" }}>GEOCON v3.0</div>
            </div>
          </div>

          {/* Nav */}
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {navItems.map((n) => (
              <button
                key={n.key}
                onClick={() => setView(n.key)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", border: "none", borderRadius: 7, cursor: "pointer", fontSize: 11, background: view === n.key ? "#f4f3ef" : "transparent", color: view === n.key ? "#2c2c2a" : "#888", fontWeight: view === n.key ? 600 : 400, transition: "all 0.15s" }}
              >
                <span style={{ fontSize: 13 }}>{n.icon}</span>
                {n.label}
                {n.key === "programs" && activePrograms > 0 && (
                  <span style={{ marginLeft: "auto", fontSize: 9, padding: "1px 5px", borderRadius: 99, background: "#E1F5EE", color: "#085041", fontWeight: 700 }}>{activePrograms}</span>
                )}
              </button>
            ))}
          </div>

          {/* Stats */}
          <div style={{ marginTop: 12, padding: 10, background: "#f4f3ef", borderRadius: 8, fontSize: 9, color: "#888", lineHeight: 1.8 }}>
            <div><Dot color={dbOk ? "#0F6E56" : "#A32D2D"} size={6} /><span style={{ marginLeft: 4 }}>{dbOk ? "Supabase connected" : "Offline"}</span></div>
            <div><strong style={{ color: "#2c2c2a" }}>{species.length}</strong> species · <strong style={{ color: "#2c2c2a" }}>{programs.length}</strong> programs</div>
            <div><strong style={{ color: "#2c2c2a" }}>{publications.length}</strong> pubs · <strong style={{ color: "#2c2c2a" }}>{metabolites.length}</strong> cpds</div>
          </div>
        </div>

        {/* User footer */}
        <div style={{ padding: 14, borderTop: "1px solid #e8e6e1" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: 6, background: role.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontSize: 10, fontWeight: 600 }}>{role.ic}</span>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#2c2c2a" }}>{user.name}</div>
              <div style={{ fontSize: 8, color: "#b4b2a9" }}>{role.label}</div>
            </div>
          </div>
          <a href="/upload-admin" style={{ display: "block", textAlign: "center", padding: "6px 0", fontSize: 9, color: "#1D9E75", textDecoration: "none", border: "1px solid #1D9E75", borderRadius: 6, marginBottom: 6, fontWeight: 600 }}>
            📊 Excel Upload
          </a>
          <button
            onClick={() => { setUser(null); setView("home"); }}
            style={{ width: "100%", padding: "5px 0", fontSize: 9, color: "#888", background: "none", border: "1px solid #e8e6e1", borderRadius: 6, cursor: "pointer" }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ flex: 1, minWidth: 0, padding: "16px 20px 28px", overflow: "auto" }}>
        <button onClick={() => setSide(!side)} style={{ fontSize: 16, background: "none", border: "none", cursor: "pointer", color: "#888", marginBottom: 10, padding: 0 }}>
          {side ? "◀" : "▶"}
        </button>

        {/* Top metrics bar */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          {[
            { l: "Species",     v: species.length,      c: "#1D9E75" },
            { l: "Programs",    v: programs.length,     c: "#534AB7" },
            { l: "Compounds",   v: metabolites.length,  c: "#185FA5" },
            { l: "Publications",v: publications.length, c: "#D85A30" },
            { l: "Threatened",  v: threatened,          c: "#E24B4A" },
          ].map((s) => (
            <div key={s.l} style={{ flex: "1 1 100px", ...S.card, padding: "10px 14px", border: "1px solid #e8e6e1" }}>
              <div style={S.mLabel}>{s.l}</div>
              <div style={S.mVal(s.c)}>{s.v}</div>
            </div>
          ))}
        </div>

        {/* ── View routing ── */}
        {view === "home"         && <GEOCONHome species={species} publications={publications} metabolites={metabolites} researchers={researchers} programs={programs} user={user} setView={setView} onSpeciesClick={setDetailSpecies} />}
        {view === "programs"     && <ProgramsView species={species} user={user} />}
        {view === "species"      && <SpeciesModule species={species} onSpeciesClick={setDetailSpecies} />}
        {view === "metabolites"  && <MetaboliteExplorer metabolites={metabolites} />}
        {view === "market"       && <MarketView markets={markets} />}
        {view === "publications" && <PublicationsView publications={publications} />}
        {view === "researchers"  && <ResearchersView researchers={researchers} />}
        {view === "partners"     && <PartnerView institutions={institutions} />}
        {view === "portfolio"    && <PortfolioView species={species} />}
        {view === "sources"      && <SourcesPanel sources={sources} />}
        {view === "admin"        && user.role === "admin" && <AdminPanel species={species} programs={programs} onDataChange={() => window.location.reload()} />}

        {/* Footer */}
        <div style={{ marginTop: 32, paddingTop: 10, borderTop: "1px solid #e8e6e1", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 4, fontSize: 8, color: "#b4b2a9" }}>
          <span>GEOCON ATLAS v3.0 · {species.length} species · {programs.length} programs · {publications.length} pubs</span>
          <span>Venn BioVentures OÜ</span>
        </div>
      </div>

      {/* ── Panels & Modals ── */}
      {detailSpecies && (
        <SpeciesDetailPanel
          species={detailSpecies}
          onClose={() => setDetailSpecies(null)}
          onStartProgram={(sp) => { setStartProgramSp(sp); setDetailSpecies(null); }}
        />
      )}
      {startProgramSp && (
        <StartProgramModal
          species={startProgramSp}
          onClose={() => setStartProgramSp(null)}
          onSuccess={() => { setStartProgramSp(null); window.location.reload(); }}
        />
      )}
    </div>
  );
}

function MetaboliteExplorer({metabolites}){
  const[selectedCat,setSelectedCat]=useState(null);const[search,setSearch]=useState("");const[expanded,setExpanded]=useState(null);
  const CAT_META={alkaloid:{icon:"🔵",color:"#534AB7",bg:"#EEEDFE",desc:"Nitrogen-containing plant compounds"},flavonoid:{icon:"🟡",color:"#BA7517",bg:"#FAEEDA",desc:"Polyphenolic antioxidants"},terpenoid:{icon:"🟢",color:"#0F6E56",bg:"#E1F5EE",desc:"Terpenes & terpenoids"},phenolic:{icon:"🟤",color:"#854F0B",bg:"#FAEEDA",desc:"Phenolic acids & compounds"},saponin:{icon:"🔴",color:"#993556",bg:"#FBEAF0",desc:"Steroid & triterpenoid saponins"},glycoside:{icon:"🟣",color:"#185FA5",bg:"#E6F1FB",desc:"Sugar-containing compounds"},steroid:{icon:"⚪",color:"#639922",bg:"#EAF3DE",desc:"Steroidal compounds"},"amino acid":{icon:"🔶",color:"#D85A30",bg:"#FAECE7",desc:"Amino acids & peptides"},other:{icon:"⬜",color:"#888780",bg:"#F1EFE8",desc:"Other compound classes"}};
  const CATS=Object.keys(CAT_META);
  const catCounts={};for(const cat of CATS){catCounts[cat]=metabolites.filter(m=>(m.activity_category||"other")===cat).length;}
  const catMets=selectedCat?metabolites.filter(m=>{const matchCat=(m.activity_category||"other")===selectedCat;const matchSearch=!search||(m.compound_name||"").toLowerCase().includes(search.toLowerCase())||(m.species?.accepted_name||"").toLowerCase().includes(search.toLowerCase());return matchCat&&matchSearch;}):[];
  return<div>
    {!selectedCat?<>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}><div><div style={{fontSize:16,fontWeight:700,color:"#2c2c2a",fontFamily:"Georgia,serif"}}>Metabolites</div><div style={{fontSize:11,color:"#888",marginTop:2}}>{metabolites.length} compounds · {CATS.length} categories</div></div><div style={{display:"flex",gap:6}}>{[{l:"Total",v:metabolites.length,c:"#534AB7"},{l:"Species",v:[...new Set(metabolites.map(m=>m.species_id).filter(Boolean))].length,c:"#185FA5"}].map(s=><div key={s.l} style={{textAlign:"center",padding:"5px 10px",background:"#f4f3ef",borderRadius:8}}><div style={{fontSize:14,fontWeight:700,color:s.c}}>{s.v}</div><div style={{fontSize:9,color:"#999"}}>{s.l}</div></div>)}</div></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:10}}>{CATS.map(cat=>{const m=CAT_META[cat];const count=catCounts[cat]||0;const topMets=metabolites.filter(me=>(me.activity_category||"other")===cat).slice(0,3);return<div key={cat} onClick={()=>{setSelectedCat(cat);setSearch("");}} style={{background:"#fff",border:"1px solid #e8e6e1",borderRadius:12,overflow:"hidden",cursor:"pointer",transition:"all 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=m.color;e.currentTarget.style.transform="translateY(-2px)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="#e8e6e1";e.currentTarget.style.transform="translateY(0)"}}><div style={{background:m.bg,padding:"14px 14px 10px",borderBottom:`1px solid ${m.color}22`}}><div style={{fontSize:24,marginBottom:6}}>{m.icon}</div><div style={{fontSize:13,fontWeight:700,color:m.color,textTransform:"capitalize"}}>{cat}</div><div style={{fontSize:10,color:"#888",marginTop:2}}>{m.desc}</div></div><div style={{padding:"10px 14px"}}><div style={{fontSize:20,fontWeight:700,color:"#2c2c2a",marginBottom:6}}>{count}</div><div style={{display:"flex",flexDirection:"column",gap:2}}>{topMets.map(me=><div key={me.id} style={{fontSize:9,color:"#b4b2a9",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{(me.compound_name||"").slice(0,40)}</div>)}</div></div></div>;})}
      </div>
    </>:<>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}><button onClick={()=>{setSelectedCat(null);setSearch("");}} style={{padding:"6px 12px",border:"1px solid #e8e6e1",borderRadius:7,background:"#fff",cursor:"pointer",fontSize:11,color:"#888"}}>← Categories</button><div style={{flex:1,display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:20}}>{CAT_META[selectedCat]?.icon}</span><div><div style={{fontSize:15,fontWeight:700,color:CAT_META[selectedCat]?.color,textTransform:"capitalize"}}>{selectedCat}</div><div style={{fontSize:11,color:"#888"}}>{catMets.length} compounds</div></div></div></div>
      <input type="text" placeholder="Search compound or species..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:"100%",marginBottom:12,...S.input}}/>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>{catMets.length===0?<div style={{textAlign:"center",padding:40,color:"#999",fontSize:13}}>No compounds found</div>:catMets.map(m=><div key={m.id} onClick={()=>setExpanded(expanded===m.id?null:m.id)} style={{background:"#fff",border:expanded===m.id?"1px solid #85B7EB":"1px solid #e8e6e1",borderRadius:8,padding:"10px 12px",cursor:"pointer",borderLeft:`3px solid ${CAT_META[selectedCat]?.color||"#888"}`}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}><div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:"#2c2c2a"}}>{m.compound_name}</div><div style={{fontSize:10,fontStyle:"italic",color:"#888",marginTop:2}}>{m.species?.accepted_name||"—"}</div></div><div style={{display:"flex",gap:4,alignItems:"center",flexShrink:0}}>{m.evidence&&<span style={{fontSize:9,padding:"2px 6px",borderRadius:99,background:"#E1F5EE",color:"#085041"}}>{m.evidence}</span>}{m.confidence&&<span style={{fontSize:10,fontWeight:700,color:CAT_META[selectedCat]?.color}}>{Math.round(m.confidence*100)}%</span>}</div></div>{m.reported_activity&&<div style={{fontSize:11,color:"#5f5e5a",marginTop:6,lineHeight:1.5}}>{m.reported_activity.slice(0,120)}</div>}{expanded===m.id&&<div style={{marginTop:10,paddingTop:10,borderTop:"1px solid #e8e6e1"}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px 14px",fontSize:11}}>{[{l:"Plant organ",v:m.plant_organ},{l:"Therapeutic area",v:m.therapeutic_area},{l:"Confidence",v:m.confidence?`${Math.round(m.confidence*100)}%`:null}].map(({l,v})=>v?<div key={l}><span style={{color:"#b4b2a9",fontSize:9,textTransform:"uppercase"}}>{l}</span><div style={{color:"#2c2c2a",fontWeight:500}}>{v}</div></div>:null)}</div></div>}</div>)}</div>
    </>}
  </div>;
}

/* ── Programs View ── */
function ProgramsView({species,user}){
  const[programs,setPrograms]=useState([]);const[loading,setLoading]=useState(true);const[selected,setSelected]=useState(null);const[tab,setTab]=useState("overview");const[stories,setStories]=useState([]);const[actions,setActions]=useState([]);const[decisions,setDecisions]=useState([]);
  useEffect(()=>{supabase.from("programs").select("*, species(accepted_name,iucn_status,family,thumbnail_url)").order("priority_score",{ascending:false}).then(({data})=>{setPrograms(data||[]);setLoading(false);});},[]);
  useEffect(()=>{if(!selected)return;Promise.all([supabase.from("program_story_entries").select("*").eq("program_id",selected.id).order("created_at",{ascending:false}),supabase.from("program_actions").select("*").eq("program_id",selected.id).order("priority"),supabase.from("program_decisions").select("*").eq("program_id",selected.id).order("decision_date",{ascending:false})]).then(([s,a,d])=>{setStories(s.data||[]);setActions(a.data||[]);setDecisions(d.data||[]);});},[selected?.id]);
  if(loading)return<Loading/>;
  const active=programs.filter(p=>p.status==="Active");const blocked=programs.filter(p=>p.status==="Blocked");
  return<div>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:8}}>
      <div><div style={{fontSize:16,fontWeight:700,color:"#2c2c2a",fontFamily:"Georgia,serif"}}>GEOCON Programs</div><div style={{fontSize:11,color:"#888",marginTop:2}}>{programs.length} programs · {active.length} active · {blocked.length} blocked</div></div>
      <div style={{display:"flex",gap:6}}>{[{l:"Active",v:active.length,c:"#1D9E75"},{l:"Blocked",v:blocked.length,c:"#A32D2D"},{l:"Draft",v:programs.filter(p=>p.status==="Draft").length,c:"#888"}].map(s=><div key={s.l} style={{textAlign:"center",padding:"5px 10px",background:"#f4f3ef",borderRadius:8}}><div style={{fontSize:14,fontWeight:700,color:s.c}}>{s.v}</div><div style={{fontSize:9,color:"#999"}}>{s.l}</div></div>)}</div>
    </div>
    {programs.length===0?<div style={{textAlign:"center",padding:60,color:"#999"}}><div style={{fontSize:32,marginBottom:12}}>🌿</div><div style={{fontSize:15,fontWeight:600,color:"#2c2c2a",marginBottom:8}}>No programs yet</div><div style={{fontSize:12}}>Open any species and click "+ Start Program" to begin a GEOCON journey.</div></div>:<>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6,marginBottom:16}}>{["Origin","Forge","Mesh","Exchange","Accord"].map(m=>{const count=programs.filter(p=>p.current_module===m).length;return<div key={m} style={{padding:"10px 12px",background:"#fff",borderRadius:10,border:`1px solid ${MODULE_COLORS[m]}33`,textAlign:"center"}}><div style={{fontSize:11,fontWeight:700,color:MODULE_COLORS[m]}}>{m}</div><div style={{fontSize:20,fontWeight:700,color:"#2c2c2a",margin:"4px 0"}}>{count}</div></div>;})}</div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>{programs.map(p=>{const modColor=MODULE_COLORS[p.current_module]||"#888";return<div key={p.id} onClick={()=>{setSelected(p);setTab("overview");}} style={{background:"#fff",border:selected?.id===p.id?"2px solid #1D9E75":"1px solid #e8e6e1",borderLeft:`4px solid ${modColor}`,borderRadius:10,padding:"14px 16px",cursor:"pointer"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}><div style={{flex:1}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}><span style={{fontSize:13,fontWeight:700,color:"#2c2c2a"}}>{p.program_name}</span><span style={{fontSize:9,padding:"2px 8px",borderRadius:99,background:(STATUS_COLORS[p.status]||"#888")+"22",color:STATUS_COLORS[p.status]||"#888",fontWeight:600}}>{p.status}</span></div>{p.species&&<div style={{fontSize:11,fontStyle:"italic",color:"#888",marginBottom:6}}>{p.species.accepted_name} · {p.program_type}</div>}<div style={{display:"flex",gap:6,flexWrap:"wrap"}}><span style={{fontSize:10,padding:"2px 8px",borderRadius:99,background:modColor+"15",color:modColor}}>Module: {p.current_module}</span>{p.current_gate&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:99,background:"#f4f3ef",color:"#5f5e5a"}}>Gate: {p.current_gate}</span>}</div></div>{p.readiness_score>0&&<div style={{textAlign:"center",padding:"4px 10px",background:"#f4f3ef",borderRadius:8}}><div style={{fontSize:7,color:"#999",textTransform:"uppercase"}}>Readiness</div><div style={{fontSize:16,fontWeight:700,color:"#1D9E75"}}>{p.readiness_score}</div></div>}</div>{p.next_action&&<div style={{marginTop:8,padding:"6px 10px",background:"#f8f7f4",borderRadius:6,fontSize:11,color:"#5f5e5a"}}>→ {p.next_action}</div>}{p.primary_blocker&&<div style={{marginTop:4,padding:"6px 10px",background:"#FCEBEB",borderRadius:6,fontSize:11,color:"#A32D2D"}}>⚠ {p.primary_blocker}</div>}</div>;})}
      </div>
    </>}
    {selected&&<>
      <div onClick={()=>setSelected(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.3)",zIndex:100}}/>
      <div style={{position:"fixed",top:0,right:0,bottom:0,width:560,background:"#fff",zIndex:101,display:"flex",flexDirection:"column",boxShadow:"-4px 0 24px rgba(0,0,0,0.12)"}}>
        <div style={{padding:"18px 20px",borderBottom:"1px solid #e8e6e1",background:"#f8f7f4",flexShrink:0}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div style={{flex:1}}><div style={{fontSize:9,color:"#888",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>{selected.program_type}</div><div style={{fontSize:18,fontWeight:700,color:"#2c2c2a",lineHeight:1.3}}>{selected.program_name}</div>{selected.species&&<div style={{fontSize:12,fontStyle:"italic",color:"#888",marginTop:2}}>{selected.species.accepted_name}</div>}</div><button onClick={()=>setSelected(null)} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#888"}}>✕</button></div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:10}}><span style={{fontSize:10,padding:"2px 8px",borderRadius:99,background:(MODULE_COLORS[selected.current_module]||"#888")+"15",color:MODULE_COLORS[selected.current_module]||"#888"}}>{selected.current_module}</span><span style={{fontSize:10,padding:"2px 8px",borderRadius:99,background:"#f4f3ef",color:"#5f5e5a"}}>{selected.current_gate}</span><span style={{fontSize:10,padding:"2px 8px",borderRadius:99,background:(STATUS_COLORS[selected.status]||"#888")+"22",color:STATUS_COLORS[selected.status]||"#888"}}>{selected.status}</span></div>
        </div>
        {(selected.readiness_score||selected.confidence_score||selected.priority_score)&&<div style={{padding:"10px 20px",borderBottom:"1px solid #e8e6e1",display:"flex",gap:6,flexShrink:0}}>{[{l:"Readiness",v:selected.readiness_score,c:"#1D9E75"},{l:"Confidence",v:selected.confidence_score,c:"#185FA5"},{l:"Priority",v:selected.priority_score,c:"#D85A30"}].map(m=>m.v?<div key={m.l} style={{flex:1,background:"#f4f3ef",borderRadius:8,padding:"6px 8px",textAlign:"center"}}><div style={{fontSize:8,color:"#999",textTransform:"uppercase",marginBottom:2}}>{m.l}</div><div style={{fontSize:16,fontWeight:700,color:m.c}}>{m.v}</div></div>:null)}</div>}
        <div style={{display:"flex",borderBottom:"1px solid #e8e6e1",flexShrink:0,overflowX:"auto"}}>{["overview","story","actions","decisions"].map(t=><button key={t} onClick={()=>setTab(t)} style={{flexShrink:0,padding:"10px 14px",border:"none",borderBottom:tab===t?"2px solid #1D9E75":"2px solid transparent",background:"none",cursor:"pointer",fontSize:11,fontWeight:tab===t?600:400,color:tab===t?"#1D9E75":"#888",textTransform:"capitalize"}}>{t}</button>)}</div>
        <div style={{flex:1,overflowY:"auto",padding:"16px 20px"}}>
          {tab==="overview"&&<div style={{display:"flex",flexDirection:"column",gap:12}}>
            {selected.why_this_program&&<div style={{padding:"12px 14px",background:"#f8f7f4",borderRadius:8,borderLeft:"3px solid #1D9E75"}}><div style={{fontSize:9,color:"#888",textTransform:"uppercase",marginBottom:6}}>Why this program</div><div style={{fontSize:12,color:"#2c2c2a",lineHeight:1.7}}>{selected.why_this_program}</div></div>}
            {selected.strategic_rationale&&<div style={{padding:"12px 14px",background:"#f8f7f4",borderRadius:8,borderLeft:"3px solid #185FA5"}}><div style={{fontSize:9,color:"#888",textTransform:"uppercase",marginBottom:6}}>Strategic rationale</div><div style={{fontSize:12,color:"#2c2c2a",lineHeight:1.7}}>{selected.strategic_rationale}</div></div>}
            {selected.next_action&&<div style={{padding:"12px 14px",background:"#E1F5EE",borderRadius:8}}><div style={{fontSize:9,color:"#085041",textTransform:"uppercase",marginBottom:4}}>Next action</div><div style={{fontSize:12,color:"#085041",fontWeight:600}}>{selected.next_action}</div></div>}
            {selected.primary_blocker&&<div style={{padding:"12px 14px",background:"#FCEBEB",borderRadius:8}}><div style={{fontSize:9,color:"#A32D2D",textTransform:"uppercase",marginBottom:4}}>Primary blocker</div><div style={{fontSize:12,color:"#A32D2D"}}>{selected.primary_blocker}</div></div>}
            {selected.what_is_missing&&<div style={{padding:"12px 14px",background:"#FAEEDA",borderRadius:8}}><div style={{fontSize:9,color:"#633806",textTransform:"uppercase",marginBottom:4}}>What is missing</div><div style={{fontSize:12,color:"#633806",lineHeight:1.6}}>{selected.what_is_missing}</div></div>}
            {selected.recommended_pathway&&<div style={{padding:"12px 14px",background:"#f8f7f4",borderRadius:8}}><div style={{fontSize:9,color:"#888",textTransform:"uppercase",marginBottom:4}}>Recommended pathway</div><div style={{fontSize:12,color:"#2c2c2a",lineHeight:1.6}}>{selected.recommended_pathway}</div></div>}
          </div>}
          {tab==="story"&&<div>{stories.length===0?<div style={{textAlign:"center",padding:32,color:"#999",fontSize:13}}>No story entries yet</div>:stories.map(s=><div key={s.id} style={{marginBottom:10,padding:"12px 14px",background:"#f8f7f4",borderRadius:8,borderLeft:"3px solid #534AB7"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:12,fontWeight:600,color:"#2c2c2a"}}>{s.title}</span><span style={{fontSize:9,color:"#888"}}>{s.entry_date}</span></div>{s.entry_type&&<span style={{fontSize:9,padding:"1px 6px",borderRadius:99,background:"#EEEDFE",color:"#3C3489",marginBottom:6,display:"inline-block"}}>{s.entry_type}</span>}{s.summary&&<div style={{fontSize:11,color:"#5f5e5a",lineHeight:1.6,marginTop:4}}>{s.summary}</div>}</div>)}</div>}
          {tab==="actions"&&<div>{actions.length===0?<div style={{textAlign:"center",padding:32,color:"#999",fontSize:13}}>No actions yet</div>:actions.map(a=><div key={a.id} style={{marginBottom:8,padding:"12px 14px",background:"#f8f7f4",borderRadius:8,borderLeft:`3px solid ${a.status==="completed"?"#1D9E75":a.priority==="high"?"#A32D2D":"#888"}`}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:12,fontWeight:600,color:"#2c2c2a"}}>{a.action_title}</span><span style={{fontSize:9,padding:"2px 6px",borderRadius:99,background:a.status==="completed"?"#E1F5EE":"#f4f3ef",color:a.status==="completed"?"#085041":"#888"}}>{a.status}</span></div>{a.action_description&&<div style={{fontSize:11,color:"#5f5e5a",marginBottom:4}}>{a.action_description}</div>}<div style={{display:"flex",gap:8,fontSize:10,color:"#888"}}>{a.action_owner&&<span>Owner: {a.action_owner}</span>}{a.due_date&&<span>Due: {a.due_date}</span>}</div></div>)}</div>}
          {tab==="decisions"&&<div>{decisions.length===0?<div style={{textAlign:"center",padding:32,color:"#999",fontSize:13}}>No decisions recorded yet</div>:decisions.map(d=><div key={d.id} style={{marginBottom:10,padding:"12px 14px",background:"#f8f7f4",borderRadius:8,borderLeft:"3px solid #D85A30"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:12,fontWeight:600,color:"#2c2c2a"}}>{d.decision_title}</span><span style={{fontSize:9,color:"#888"}}>{d.decision_date}</span></div>{d.decision_type&&<span style={{fontSize:9,padding:"1px 6px",borderRadius:99,background:"#FAECE7",color:"#712B13",marginBottom:6,display:"inline-block"}}>{d.decision_type}</span>}{d.rationale&&<div style={{fontSize:11,color:"#5f5e5a",lineHeight:1.6,marginTop:4}}>{d.rationale}</div>}{d.made_by&&<div style={{fontSize:10,color:"#888",marginTop:4}}>Decision by: {d.made_by}</div>}</div>)}</div>}
        </div>
      </div>
    </>}
  </div>;
}

/* ── Publications View ── */

function PublicationsView({publications}){
  const[selectedCat,setSelectedCat]=useState(null);const[search,setSearch]=useState("");const[page,setPage]=useState(0);const[expanded,setExpanded]=useState(null);const PAGE_SIZE=30;
  const CAT_META={Phytochemistry:{icon:"⚗️",color:"#534AB7",bg:"#EEEDFE",desc:"Metabolites, compounds, chemical analysis"},Conservation:{icon:"🛡",color:"#A32D2D",bg:"#FCEBEB",desc:"Threatened species, habitat, population"},Agronomy:{icon:"🌾",color:"#639922",bg:"#EAF3DE",desc:"Cultivation, yield, crop production"},Pharmacology:{icon:"💊",color:"#185FA5",bg:"#E6F1FB",desc:"Medical activity, therapeutic, clinical"},Taxonomy:{icon:"🔬",color:"#854F0B",bg:"#FAEEDA",desc:"Systematics, phylogeny, classification"},Ecology:{icon:"🌍",color:"#0F6E56",bg:"#E1F5EE",desc:"Distribution, habitat, occurrence"},Biotechnology:{icon:"🧬",color:"#993556",bg:"#FBEAF0",desc:"Tissue culture, in vitro, genetic"},Other:{icon:"📄",color:"#888780",bg:"#F1EFE8",desc:"Other topics"}};
  const CATS=Object.keys(CAT_META);const catCounts={};for(const cat of CATS)catCounts[cat]=publications.filter(p=>p.category===cat).length;
  const catPubs=selectedCat?publications.filter(p=>p.category===selectedCat&&(!search||(p.title||"").toLowerCase().includes(search.toLowerCase())||(p.authors||"").toLowerCase().includes(search.toLowerCase()))):[];
  const totalPages=Math.ceil(catPubs.length/PAGE_SIZE);const paginated=catPubs.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE);const uncategorized=publications.filter(p=>!p.category).length;
  return<div>
    {!selectedCat?<>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}><div><div style={{fontSize:16,fontWeight:700,color:"#2c2c2a",fontFamily:"Georgia,serif"}}>Publications</div><div style={{fontSize:11,color:"#888",marginTop:2}}>{publications.length} publications · {CATS.length} categories</div></div><div style={{display:"flex",gap:6}}>{[{l:"Total",v:publications.length,c:"#185FA5"},{l:"Open Access",v:publications.filter(p=>p.open_access).length,c:"#0F6E56"},{l:"With Abstract",v:publications.filter(p=>p.abstract).length,c:"#534AB7"}].map(s=><div key={s.l} style={{textAlign:"center",padding:"5px 10px",background:"#f4f3ef",borderRadius:8}}><div style={{fontSize:14,fontWeight:700,color:s.c}}>{s.v}</div><div style={{fontSize:9,color:"#999"}}>{s.l}</div></div>)}</div></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}}>{CATS.map(cat=>{const m=CAT_META[cat];const count=catCounts[cat]||0;const topPubs=publications.filter(p=>p.category===cat).slice(0,3);return<div key={cat} onClick={()=>{setSelectedCat(cat);setPage(0);setSearch("");}} style={{background:"#fff",border:"1px solid #e8e6e1",borderRadius:12,overflow:"hidden",cursor:"pointer",transition:"all 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=m.color;e.currentTarget.style.transform="translateY(-2px)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="#e8e6e1";e.currentTarget.style.transform="translateY(0)"}}><div style={{background:m.bg,padding:"14px 14px 10px",borderBottom:`1px solid ${m.color}22`}}><div style={{fontSize:24,marginBottom:6}}>{m.icon}</div><div style={{fontSize:13,fontWeight:700,color:m.color}}>{cat}</div><div style={{fontSize:10,color:"#888",marginTop:2}}>{m.desc}</div></div><div style={{padding:"10px 14px"}}><div style={{fontSize:20,fontWeight:700,color:"#2c2c2a",marginBottom:6}}>{count}</div><div style={{display:"flex",flexDirection:"column",gap:2}}>{topPubs.map(p=><div key={p.id} style={{fontSize:9,color:"#b4b2a9",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{(p.title||"").slice(0,45)}</div>)}</div></div></div>;})}
      </div>
      {uncategorized>0&&<div style={{marginTop:12,padding:"8px 12px",background:"#FAEEDA",borderRadius:8,fontSize:11,color:"#633806"}}>⚠ {uncategorized} publications not yet categorized</div>}
    </>:<>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}><button onClick={()=>{setSelectedCat(null);setSearch("");}} style={{padding:"6px 12px",border:"1px solid #e8e6e1",borderRadius:7,background:"#fff",cursor:"pointer",fontSize:11,color:"#888"}}>← Categories</button><div style={{flex:1,display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:20}}>{CAT_META[selectedCat]?.icon}</span><div><div style={{fontSize:15,fontWeight:700,color:CAT_META[selectedCat]?.color}}>{selectedCat}</div><div style={{fontSize:11,color:"#888"}}>{catPubs.length} publications</div></div></div></div>
      <input type="text" placeholder="Search title or author..." value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}} style={{width:"100%",marginBottom:12,...S.input}}/>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>{paginated.map(p=><div key={p.id} onClick={()=>setExpanded(expanded===p.id?null:p.id)} style={{background:"#fff",border:expanded===p.id?"1px solid #85B7EB":"1px solid #e8e6e1",borderRadius:8,padding:"10px 12px",cursor:"pointer",borderLeft:`3px solid ${CAT_META[selectedCat]?.color||"#888"}`}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}><div style={{flex:1}}><div style={{fontSize:12,fontWeight:600,color:"#2c2c2a",lineHeight:1.4}}>{p.doi?<a href={p.doi} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{color:"#185FA5",textDecoration:"none"}}>{(p.title||"Untitled").slice(0,120)}</a>:(p.title||"Untitled").slice(0,120)}</div><div style={{fontSize:10,color:"#888",marginTop:3}}>{(p.authors||"").slice(0,80)}</div></div><div style={{display:"flex",flexDirection:"column",gap:3,alignItems:"flex-end",flexShrink:0}}>{p.year&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:99,background:"#E6F1FB",color:"#0C447C"}}>{p.year}</span>}{p.open_access&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:99,background:"#E1F5EE",color:"#085041"}}>OA</span>}</div></div>{p.journal&&<div style={{fontSize:10,color:"#b4b2a9",marginTop:4,fontStyle:"italic"}}>{p.journal.slice(0,60)}</div>}{expanded===p.id&&<div style={{marginTop:10,paddingTop:10,borderTop:"1px solid #e8e6e1"}}>{p.abstract?<div style={{fontSize:11,color:"#5f5e5a",lineHeight:1.6}}>{p.abstract.slice(0,500)}</div>:<div style={{fontSize:11,color:"#b4b2a9",fontStyle:"italic"}}>No abstract — {p.doi?<a href={p.doi} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{color:"#185FA5"}}>view paper ↗</a>:"no DOI"}</div>}</div>}</div>)}</div>
      {totalPages>1&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginTop:16}}><button onClick={()=>setPage(0)} disabled={page===0} style={{...S.input,padding:"5px 10px",cursor:page===0?"default":"pointer",opacity:page===0?0.4:1}}>«</button><button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0} style={{...S.input,padding:"5px 10px",cursor:page===0?"default":"pointer",opacity:page===0?0.4:1}}>‹</button><span style={{fontSize:12,color:"#888",minWidth:100,textAlign:"center"}}>Page {page+1} / {totalPages}</span><button onClick={()=>setPage(p=>Math.min(totalPages-1,p+1))} disabled={page===totalPages-1} style={{...S.input,padding:"5px 10px",cursor:page===totalPages-1?"default":"pointer",opacity:page===totalPages-1?0.4:1}}>›</button><button onClick={()=>setPage(totalPages-1)} disabled={page===totalPages-1} style={{...S.input,padding:"5px 10px",cursor:page===totalPages-1?"default":"pointer",opacity:page===totalPages-1?0.4:1}}>»</button></div>}
    </>}
  </div>;
}

/* ── Other views (Market, Researchers, Partners, Sources, Portfolio, Admin) ── */
function MarketView({markets}){const[expanded,setExpanded]=useState(null);return<div><div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>{[{l:"Hypotheses",v:markets.length},{l:"Spin-offs",v:[...new Set(markets.map(m=>m.spinoff_link))].length}].map(s=><div key={s.l} style={{flex:"1 1 110px",...S.metric}}><div style={S.mLabel}>{s.l}</div><div style={S.mVal()}>{s.v}</div></div>)}</div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:10}}>{markets.map(m=><div key={m.id} onClick={()=>setExpanded(expanded===m.id?null:m.id)} style={{...S.card,padding:16,cursor:"pointer"}}><div style={{fontSize:14,fontWeight:600,color:"#2c2c2a",marginBottom:4}}>{m.application_area}</div><div style={{fontSize:10,fontStyle:"italic",color:"#888"}}>{m.species?.accepted_name||"—"} — {m.market_segment}</div></div>)}</div></div>;}
