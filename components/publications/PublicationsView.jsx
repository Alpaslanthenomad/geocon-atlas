"use client";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import { S } from "../../lib/constants";
import AddPublicationModal from "./AddPublicationModal";

/* ── Publications View ── */
export default function PublicationsView({publications, metabolites = [], metabolitePublications = [], user, profile, researcher, onPublicationAdded}){
  const[selectedCat,setSelectedCat]=useState(null);const[search,setSearch]=useState("");const[page,setPage]=useState(0);const[expanded,setExpanded]=useState(null);const[mode,setMode]=useState("curated");const PAGE_SIZE=30;
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Approved researcher mı? Sadece o görür "+ Add publication" butonunu
  const canAdd = !!(user && researcher && profile?.approval_status === "approved");

  // Publication ID → metabolite_publications array
  const linksByPubId = useMemo(() => {
    const map = new Map();
    for (const link of metabolitePublications) {
      if (!map.has(link.publication_id)) map.set(link.publication_id, []);
      map.get(link.publication_id).push(link);
    }
    return map;
  }, [metabolitePublications]);
  // Metabolite ID → metabolite (lookup)
  const metabolitesById = useMemo(() => {
    const map = new Map();
    for (const m of metabolites) map.set(m.id, m);
    return map;
  }, [metabolites]);

  const CAT_META={Phytochemistry:{icon:"⚗️",color:"#534AB7",bg:"#EEEDFE",desc:"Metabolites, compounds, chemical analysis"},Conservation:{icon:"🛡",color:"#A32D2D",bg:"#FCEBEB",desc:"Threatened species, habitat, population"},Agronomy:{icon:"🌾",color:"#639922",bg:"#EAF3DE",desc:"Cultivation, yield, crop production"},Pharmacology:{icon:"💊",color:"#185FA5",bg:"#E6F1FB",desc:"Medical activity, therapeutic, clinical"},Taxonomy:{icon:"🔬",color:"#854F0B",bg:"#FAEEDA",desc:"Systematics, phylogeny, classification"},Ecology:{icon:"🌍",color:"#0F6E56",bg:"#E1F5EE",desc:"Distribution, habitat, occurrence"},Biotechnology:{icon:"🧬",color:"#993556",bg:"#FBEAF0",desc:"Tissue culture, in vitro, genetic"},Other:{icon:"📄",color:"#888780",bg:"#F1EFE8",desc:"Other topics"}};
  const CATS=Object.keys(CAT_META);
  // Curated = bir programa fiilen bağlı (program_publications'tan beslenir, app/page.js'te annotate edilir)
  // Eski is_curated alanı geriye uyumluluk için fallback
  const isCuratedPub = p => p.is_geocon_curated === true || p.is_curated === true;
  const curatedPubs=publications.filter(isCuratedPub);
  const visiblePubs=mode==="curated"?curatedPubs:publications;
  const catCounts={};for(const cat of CATS)catCounts[cat]=visiblePubs.filter(p=>p.category===cat).length;
  const catPubs=selectedCat?visiblePubs.filter(p=>p.category===selectedCat&&(!search||(p.title||"").toLowerCase().includes(search.toLowerCase())||(p.authors||"").toLowerCase().includes(search.toLowerCase()))):[];
  const totalPages=Math.ceil(catPubs.length/PAGE_SIZE);const paginated=catPubs.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE);const uncategorized=visiblePubs.filter(p=>!p.category).length;
  return<div>
    {/* Mode toggle bar */}
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,padding:"10px 14px",background:mode==="curated"?"#E1F5EE":"#f4f3ef",borderRadius:10,border:`1px solid ${mode==="curated"?"#1D9E7544":"#e8e6e1"}`}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:18}}>{mode==="curated"?"⭐":"📚"}</span>
        <div>
          <div style={{fontSize:12,fontWeight:700,color:mode==="curated"?"#085041":"#2c2c2a"}}>{mode==="curated"?"Curated mode":"Archive mode"}</div>
          <div style={{fontSize:10,color:"#888"}}>{mode==="curated"?`${curatedPubs.length} publications linked to active programs`:`${publications.length} publications including archive`}</div>
        </div>
      </div>
      <div style={{display:"flex",gap:4,background:"#fff",padding:3,borderRadius:7,border:"1px solid #e8e6e1"}}>
        <button onClick={()=>{setMode("curated");setSelectedCat(null);setPage(0);}} style={{padding:"5px 12px",border:"none",borderRadius:5,cursor:"pointer",fontSize:11,fontWeight:600,background:mode==="curated"?"#1D9E75":"transparent",color:mode==="curated"?"#fff":"#888"}}>⭐ Curated ({curatedPubs.length})</button>
        <button onClick={()=>{setMode("all");setSelectedCat(null);setPage(0);}} style={{padding:"5px 12px",border:"none",borderRadius:5,cursor:"pointer",fontSize:11,fontWeight:600,background:mode==="all"?"#888":"transparent",color:mode==="all"?"#fff":"#888"}}>📚 All ({publications.length})</button>
      </div>
      {canAdd && (
        <button
          onClick={() => setAddModalOpen(true)}
          style={{
            padding: "6px 14px", marginLeft: 8,
            background: "#185FA5", color: "#fff",
            border: "none", borderRadius: 7, cursor: "pointer",
            fontSize: 11, fontWeight: 700,
            display: "inline-flex", alignItems: "center", gap: 5,
            boxShadow: "0 1px 3px rgba(24,95,165,0.25)",
          }}
          title="Link your existing publications or add new ones by DOI"
        >
          + Add publication
        </button>
      )}
    </div>
    {addModalOpen && canAdd && (
      <AddPublicationModal
        user={user}
        profile={profile}
        researcher={researcher}
        allPublications={publications}
        onClose={() => setAddModalOpen(false)}
        onSuccess={(payload) => { onPublicationAdded && onPublicationAdded(payload); }}
      />
    )}
    {!selectedCat?<>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}><div><div style={{fontSize:16,fontWeight:700,color:"#2c2c2a",fontFamily:"Georgia,serif"}}>Publications</div><div style={{fontSize:11,color:"#888",marginTop:2}}>{visiblePubs.length} publications · {CATS.length} categories</div></div><div style={{display:"flex",gap:6}}>{[{l:"Total",v:visiblePubs.length,c:"#185FA5"},{l:"Open Access",v:visiblePubs.filter(p=>p.open_access).length,c:"#0F6E56"},{l:"With TLDR",v:visiblePubs.filter(p=>p.s2_tldr).length,c:"#534AB7"},{l:"Influential",v:visiblePubs.filter(p=>p.s2_influential_citation_count>0).length,c:"#854F0B"}].map(s=><div key={s.l} style={{textAlign:"center",padding:"5px 10px",background:"#f4f3ef",borderRadius:8}}><div style={{fontSize:14,fontWeight:700,color:s.c}}>{s.v}</div><div style={{fontSize:9,color:"#999"}}>{s.l}</div></div>)}</div></div>
      {mode==="curated"&&curatedPubs.length===0&&<div style={{textAlign:"center",padding:40,color:"#999",background:"#fcfbf9",borderRadius:10}}><div style={{fontSize:32,marginBottom:8}}>📚</div><div style={{fontSize:13,color:"#5f5e5a"}}>No curated publications yet</div><div style={{fontSize:11,marginTop:4}}>Switch to Archive mode to browse all publications</div></div>}
      {(mode!=="curated"||curatedPubs.length>0)&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10,opacity:mode==="all"?0.85:1}}>{CATS.map(cat=>{const m=CAT_META[cat];const count=catCounts[cat]||0;const topPubs=visiblePubs.filter(p=>p.category===cat).slice(0,3);return<div key={cat} onClick={()=>{setSelectedCat(cat);setPage(0);setSearch("");}} style={{background:"#fff",border:"1px solid #e8e6e1",borderRadius:12,overflow:"hidden",cursor:"pointer",transition:"all 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=m.color;e.currentTarget.style.transform="translateY(-2px)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="#e8e6e1";e.currentTarget.style.transform="translateY(0)"}}><div style={{background:m.bg,padding:"14px 14px 10px",borderBottom:`1px solid ${m.color}22`}}><div style={{fontSize:24,marginBottom:6}}>{m.icon}</div><div style={{fontSize:13,fontWeight:700,color:m.color}}>{cat}</div><div style={{fontSize:10,color:"#888",marginTop:2}}>{m.desc}</div></div><div style={{padding:"10px 14px"}}><div style={{fontSize:20,fontWeight:700,color:"#2c2c2a",marginBottom:6}}>{count}</div><div style={{display:"flex",flexDirection:"column",gap:2}}>{topPubs.map(p=><div key={p.id} style={{fontSize:9,color:"#b4b2a9",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{(p.title||"").slice(0,45)}</div>)}</div></div></div>;})}
      </div>}
      {uncategorized>0&&<div style={{marginTop:12,padding:"8px 12px",background:"#FAEEDA",borderRadius:8,fontSize:11,color:"#633806"}}>⚠ {uncategorized} publications not yet categorized</div>}
    </>:<>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}><button onClick={()=>{setSelectedCat(null);setSearch("");}} style={{padding:"6px 12px",border:"1px solid #e8e6e1",borderRadius:7,background:"#fff",cursor:"pointer",fontSize:11,color:"#888"}}>← Categories</button><div style={{flex:1,display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:20}}>{CAT_META[selectedCat]?.icon}</span><div><div style={{fontSize:15,fontWeight:700,color:CAT_META[selectedCat]?.color}}>{selectedCat}</div><div style={{fontSize:11,color:"#888"}}>{catPubs.length} publications</div></div></div></div>
      <input type="text" placeholder="Search title or author..." value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}} style={{width:"100%",marginBottom:12,...S.input}}/>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>{paginated.map(p=>{
        const isCur=isCuratedPub(p);
        const hasInfluential = p.s2_influential_citation_count > 0;
        const hasTldr = p.s2_tldr && p.s2_tldr.length > 0;
        return (
          <div key={p.id} onClick={()=>setExpanded(expanded===p.id?null:p.id)}
            style={{background:"#fff",border:expanded===p.id?"1px solid #85B7EB":"1px solid #e8e6e1",borderRadius:8,padding:"10px 12px",cursor:"pointer",borderLeft:`3px solid ${isCur?"#1D9E75":(CAT_META[selectedCat]?.color||"#888")}`,opacity:mode==="all"&&!isCur?0.7:1}}
          >
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3,flexWrap:"wrap"}}>
                  {isCur && <span style={{fontSize:9,padding:"1px 6px",borderRadius:99,background:"#E1F5EE",color:"#085041",fontWeight:700}}>⭐ CURATED</span>}
                  {hasInfluential && <span style={{fontSize:9,padding:"1px 6px",borderRadius:99,background:"#FAEEDA",color:"#854F0B",fontWeight:700}} title="Influential citations from Semantic Scholar">⚡ {p.s2_influential_citation_count} influential</span>}
                  {hasTldr && expanded!==p.id && <span style={{fontSize:9,padding:"1px 6px",borderRadius:99,background:"#EEEDFE",color:"#3C3489",fontWeight:600}} title="Has AI summary">📝 TLDR</span>}
                </div>
                <div style={{fontSize:12,fontWeight:600,color:"#2c2c2a",lineHeight:1.4}}>
                  {p.doi
                    ? <a href={p.doi} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{color:"#185FA5",textDecoration:"none"}}>{(p.title||"Untitled").slice(0,140)}</a>
                    : (p.title||"Untitled").slice(0,140)}
                </div>
                <div style={{fontSize:10,color:"#888",marginTop:3}}>{(p.authors||"").slice(0,80)}</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:3,alignItems:"flex-end",flexShrink:0}}>
                {p.year && <span style={{fontSize:10,padding:"1px 6px",borderRadius:99,background:"#E6F1FB",color:"#0C447C"}}>{p.year}</span>}
                {p.open_access && <span style={{fontSize:10,padding:"1px 6px",borderRadius:99,background:"#E1F5EE",color:"#085041"}}>OA</span>}
              </div>
            </div>
            {p.journal && <div style={{fontSize:10,color:"#b4b2a9",marginTop:4,fontStyle:"italic"}}>{p.journal.slice(0,60)}</div>}
            {expanded===p.id && (
              <div style={{marginTop:10,paddingTop:10,borderTop:"1px solid #e8e6e1",display:"flex",flexDirection:"column",gap:8}}>
                {/* TLDR — varsa abstract'ın üstünde, daha öne çıkan */}
                {hasTldr && (
                  <div style={{padding:"10px 12px",background:"#EEEDFE",borderRadius:8,borderLeft:"3px solid #534AB7"}}>
                    <div style={{fontSize:9,color:"#3C3489",fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",marginBottom:4}}>📝 TLDR · Semantic Scholar</div>
                    <div style={{fontSize:11,color:"#2c2c2a",lineHeight:1.5,fontStyle:"italic"}}>{p.s2_tldr}</div>
                  </div>
                )}
                {/* Abstract */}
                {p.abstract
                  ? <div style={{fontSize:11,color:"#5f5e5a",lineHeight:1.6}}>{p.abstract.slice(0,500)}{p.abstract.length>500&&"…"}</div>
                  : !hasTldr && <div style={{fontSize:11,color:"#b4b2a9",fontStyle:"italic"}}>No abstract — {p.doi?<a href={p.doi} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{color:"#185FA5"}}>view paper ↗</a>:"no DOI"}</div>
                }
                {/* S2 metadata satırı */}
                {(p.s2_influential_citation_count!=null || p.s2_reference_count!=null || (p.s2_fields_of_study&&p.s2_fields_of_study.length>0)) && (
                  <div style={{display:"flex",gap:10,fontSize:10,color:"#888",flexWrap:"wrap",alignItems:"center"}}>
                    {p.s2_influential_citation_count!=null && <span><strong style={{color:"#854F0B"}}>{p.s2_influential_citation_count}</strong> influential</span>}
                    {p.s2_reference_count!=null && p.s2_reference_count>0 && <span><strong style={{color:"#5f5e5a"}}>{p.s2_reference_count}</strong> refs</span>}
                    {p.s2_fields_of_study && p.s2_fields_of_study.length>0 && (
                      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                        {p.s2_fields_of_study.map(f=><span key={f} style={{fontSize:9,padding:"1px 6px",borderRadius:99,background:"#f4f3ef",color:"#5f5e5a"}}>{f}</span>)}
                      </div>
                    )}
                  </div>
                )}
                {p.contributed_by && <div style={{fontSize:10,color:"#888"}}>Contributed by: <strong>{p.contributed_by}</strong></div>}
                {/* Metabolites mentioned in this publication */}
                {(() => {
                  const links = linksByPubId.get(p.id) || [];
                  if (links.length === 0) return null;
                  // Distinct metabolite_id'ler — aynı metabolit birden fazla satırda görünebilir
                  const seen = new Set();
                  const unique = [];
                  for (const l of links) {
                    if (seen.has(l.metabolite_id)) continue;
                    seen.add(l.metabolite_id);
                    const m = metabolitesById.get(l.metabolite_id);
                    if (m && m.compound_name) unique.push({ ...l, m });
                  }
                  // compound_name başına grupla (aynı isim farklı türlerden gelmiş olabilir)
                  const byName = new Map();
                  for (const item of unique) {
                    const name = item.m.compound_name;
                    if (!byName.has(name)) byName.set(name, { name, links: [], primary: false, classNames: new Set() });
                    const bucket = byName.get(name);
                    bucket.links.push(item);
                    if (item.is_primary_source) bucket.primary = true;
                    if (item.m.compound_class) bucket.classNames.add(item.m.compound_class);
                  }
                  const compounds = [...byName.values()].sort((a, b) => (b.primary?1:0) - (a.primary?1:0));
                  return (
                    <div style={{padding:"10px 12px",background:"#EEEDFE",borderRadius:8,borderLeft:"3px solid #534AB7"}}>
                      <div style={{fontSize:9,color:"#3C3489",fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",marginBottom:6}}>
                        ⚗️ Metabolites mentioned · {compounds.length} compound{compounds.length===1?"":"s"}
                      </div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                        {compounds.slice(0, 25).map(c => (
                          <span key={c.name} style={{
                            fontSize:10, padding:"2px 8px",
                            background:c.primary?"#534AB7":"#fff",
                            color:c.primary?"#fff":"#3C3489",
                            border:"1px solid "+(c.primary?"#534AB7":"#534AB744"),
                            borderRadius:99, fontWeight:c.primary?700:500,
                          }}>
                            {c.primary && "★ "}{c.name}
                            {c.classNames.size > 0 && (
                              <span style={{opacity:0.7, marginLeft:4, fontSize:9}}>
                                · {[...c.classNames][0]}
                              </span>
                            )}
                          </span>
                        ))}
                        {compounds.length > 25 && (
                          <span style={{fontSize:10, color:"#888", padding:"2px 6px"}}>
                            +{compounds.length - 25} more
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}
                {/* Similar publications — sadece embedding success ise */}
                {p.s2_enrichment_status === "success" && <SimilarPublications publicationId={p.id} />}
              </div>
            )}
          </div>
        );
      })}</div>
      {totalPages>1&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginTop:16}}><button onClick={()=>setPage(0)} disabled={page===0} style={{...S.input,padding:"5px 10px",cursor:page===0?"default":"pointer",opacity:page===0?0.4:1}}>«</button><button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0} style={{...S.input,padding:"5px 10px",cursor:page===0?"default":"pointer",opacity:page===0?0.4:1}}>‹</button><span style={{fontSize:12,color:"#888",minWidth:100,textAlign:"center"}}>Page {page+1} / {totalPages}</span><button onClick={()=>setPage(p=>Math.min(totalPages-1,p+1))} disabled={page===totalPages-1} style={{...S.input,padding:"5px 10px",cursor:page===totalPages-1?"default":"pointer",opacity:page===totalPages-1?0.4:1}}>›</button><button onClick={()=>setPage(totalPages-1)} disabled={page===totalPages-1} style={{...S.input,padding:"5px 10px",cursor:page===totalPages-1?"default":"pointer",opacity:page===totalPages-1?0.4:1}}>»</button></div>}
    </>}
  </div>;
}

/* ── Similar Publications — embedding-based recommendation ── */
function SimilarPublications({ publicationId }) {
  const [items, setItems] = useState(null); // null = loading, [] = no embedding/no similar, [...] = results
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setItems(null);
    setError(null);
    supabase
      .rpc("find_similar_publications", { p_publication_id: publicationId, p_limit: 5, p_min_similarity: 0.6 })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setError(error.message);
          setItems([]);
        } else {
          setItems(data || []);
        }
      });
    return () => { cancelled = true; };
  }, [publicationId]);

  if (items === null) {
    return (
      <div style={{ padding: "8px 12px", background: "#f4f3ef", borderRadius: 8, fontSize: 10, color: "#888" }}>
        🧠 Looking for similar publications…
      </div>
    );
  }

  if (error) return null;
  if (items.length === 0) return null; // embedding yok ya da benzer yayın yok — sessizce gizle

  return (
    <div style={{ padding: "10px 12px", background: "#E6F1FB", borderRadius: 8, borderLeft: "3px solid #185FA5" }}>
      <div style={{ fontSize: 9, color: "#0C447C", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>
        🧠 Similar publications · semantic similarity
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map(it => (
          <div key={it.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, paddingBottom: 6, borderBottom: "1px dashed #d4e3f3" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: "#2c2c2a", lineHeight: 1.4, fontWeight: 500 }}>
                {it.doi
                  ? <a href={it.doi} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ color: "#185FA5", textDecoration: "none" }}>{(it.title || "Untitled").slice(0, 100)}</a>
                  : (it.title || "Untitled").slice(0, 100)}
              </div>
              <div style={{ fontSize: 9, color: "#888", marginTop: 2 }}>
                {it.year && <span>{it.year} · </span>}{(it.authors || "").slice(0, 60)}
              </div>
            </div>
            <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 99, background: "#fff", color: "#0C447C", fontWeight: 700, flexShrink: 0 }}>
              {Math.round(it.similarity * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
