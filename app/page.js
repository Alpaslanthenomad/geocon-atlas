/* ─── PUBLICATIONS VIEW — paginated, 1600+ kayıt için ─── */
function PublicationsView({publications}){
  const[search,setSearch]=useState("");
  const[expanded,setExpanded]=useState(null);
  const[page,setPage]=useState(0);
  const[sourceFilter,setSourceFilter]=useState("all");
  const[yearFilter,setYearFilter]=useState("all");
  const PAGE_SIZE=50;

  const sources=[...new Set(publications.map(p=>p.source).filter(Boolean))].sort();
  const decades=[...new Set(publications.map(p=>p.year?Math.floor(p.year/10)*10:null).filter(Boolean))].sort((a,b)=>b-a);

  const filtered=publications.filter(p=>{
    if(search){
      const s=search.toLowerCase();
      if(!(p.title||"").toLowerCase().includes(s)&&
         !(p.authors||"").toLowerCase().includes(s)&&
         !(p.journal||"").toLowerCase().includes(s)&&
         !(p.species?.accepted_name||"").toLowerCase().includes(s)) return false;
    }
    if(sourceFilter!=="all"&&p.source!==sourceFilter) return false;
    if(yearFilter!=="all"&&(!p.year||Math.floor(p.year/10)*10!==parseInt(yearFilter))) return false;
    return true;
  });

  const sorted=[...filtered].sort((a,b)=>(b.year||0)-(a.year||0));
  const totalPages=Math.ceil(sorted.length/PAGE_SIZE);
  const paginated=sorted.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE);
  const oaCount=publications.filter(p=>p.open_access).length;

  // Arama değişince page sıfırla
  const handleSearch=v=>{setSearch(v);setPage(0);};
  const handleSource=v=>{setSourceFilter(v);setPage(0);};
  const handleYear=v=>{setYearFilter(v);setPage(0);};

  return<div>
    <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>
      <input type="text" placeholder="Başlık, yazar, dergi, tür ara..." value={search} onChange={e=>handleSearch(e.target.value)} style={{flex:"1 1 200px",minWidth:160,...S.input}}/>
      <select value={sourceFilter} onChange={e=>handleSource(e.target.value)} style={S.input}>
        <option value="all">Tüm kaynaklar</option>
        {sources.map(s=><option key={s} value={s}>{s} ({publications.filter(p=>p.source===s).length})</option>)}
      </select>
      <select value={yearFilter} onChange={e=>handleYear(e.target.value)} style={S.input}>
        <option value="all">Tüm yıllar</option>
        {decades.map(d=><option key={d} value={d}>{d}s</option>)}
      </select>
    </div>

    <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
      {[{l:"Toplam",v:publications.length},{l:"Filtrelenen",v:filtered.length},{l:"Open Access",v:oaCount},{l:"Kaynak",v:sources.length},{l:"Tür",v:[...new Set(publications.map(p=>p.species_id).filter(Boolean))].length}].map(s=><div key={s.l} style={{flex:"1 1 80px",...S.metric,padding:"6px 10px"}}><div style={S.mLabel}>{s.l}</div><div style={{...S.mVal(),fontSize:16}}>{s.v}</div></div>)}
    </div>

    <p style={{...S.sub,margin:"0 0 8px"}}>{sorted.length} yayın · Sayfa {page+1}/{totalPages||1} · Yıla göre sıralı</p>

    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:8}}>
      {paginated.map(p=><div key={p.id} onClick={()=>setExpanded(expanded===p.id?null:p.id)} style={{...S.card,padding:14,cursor:"pointer",border:expanded===p.id?"2px solid #85B7EB":"1px solid #e8e6e1"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,marginBottom:4}}>
          <div style={{flex:1}}><div style={{fontSize:12,fontWeight:600,color:"#2c2c2a",lineHeight:1.4}}>{(p.title||"Untitled").slice(0,120)}{(p.title||"").length>120?"...":""}</div></div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:2,flexShrink:0}}>
            {p.year&&<Pill color="#0C447C" bg="#E6F1FB">{p.year}</Pill>}
            {p.open_access&&<Pill color="#085041" bg="#E1F5EE">OA</Pill>}
          </div>
        </div>
        <div style={{fontSize:10,color:"#888",marginBottom:4}}>{(p.authors||"—").slice(0,80)}{(p.authors||"").length>80?"...":""}</div>
        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
          {p.source&&<Pill color="#712B13" bg="#FAECE7">{p.source}</Pill>}
          {p.journal&&<Pill color="#3C3489" bg="#EEEDFE">{(p.journal||"").slice(0,30)}</Pill>}
          {p.species?.accepted_name&&<Pill color="#085041" bg="#E1F5EE" style={{fontStyle:"italic"}}>{p.species.accepted_name}</Pill>}
          {p.primary_topic&&<Pill color="#854F0B" bg="#FAEEDA">{(p.primary_topic||"").slice(0,25)}</Pill>}
        </div>
        {expanded===p.id&&<div style={{marginTop:10,paddingTop:10,borderTop:"1px solid #e8e6e1",fontSize:11}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px 14px"}}>
            {[{l:"DOI",v:p.doi?p.doi.replace("https://doi.org/",""):""},{l:"Kaynak",v:p.source},{l:"Konu",v:p.primary_topic},{l:"Atıf",v:p.cited_by_count||"—"},{l:"Tür ID",v:p.species_id},{l:"Relevanslık",v:p.relevance_score?`${Math.round(p.relevance_score*100)}%`:"—"}].map(({l,v})=><div key={l}><span style={{color:"#b4b2a9",fontSize:9}}>{l}</span><div style={{color:"#2c2c2a"}}>{v||"—"}</div></div>)}
          </div>
          {p.abstract&&<div style={{marginTop:8,fontSize:10,color:"#5f5e5a",lineHeight:1.5,borderTop:"1px solid #e8e6e1",paddingTop:8}}>{p.abstract.slice(0,400)}...</div>}
          {p.doi&&<a href={p.doi} target="_blank" rel="noopener noreferrer" style={{display:"inline-block",marginTop:6,fontSize:10,color:"#185FA5",textDecoration:"none"}}>Makaleyi görüntüle ↗</a>}
        </div>}
      </div>)}
    </div>

    {totalPages>1&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginTop:16}}>
      <button onClick={()=>setPage(0)} disabled={page===0} style={{...S.input,padding:"5px 10px",cursor:page===0?"default":"pointer",opacity:page===0?0.4:1}}>«</button>
      <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0} style={{...S.input,padding:"5px 10px",cursor:page===0?"default":"pointer",opacity:page===0?0.4:1}}>‹</button>
      <span style={{fontSize:12,color:"#888",minWidth:100,textAlign:"center"}}>Sayfa {page+1} / {totalPages}</span>
      <button onClick={()=>setPage(p=>Math.min(totalPages-1,p+1))} disabled={page===totalPages-1} style={{...S.input,padding:"5px 10px",cursor:page===totalPages-1?"default":"pointer",opacity:page===totalPages-1?0.4:1}}>›</button>
      <button onClick={()=>setPage(totalPages-1)} disabled={page===totalPages-1} style={{...S.input,padding:"5px 10px",cursor:page===totalPages-1?"default":"pointer",opacity:page===totalPages-1?0.4:1}}>»</button>
    </div>}
  </div>;
}
