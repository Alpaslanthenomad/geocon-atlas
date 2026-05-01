"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function CommunitiesView({species, researchers}) {
  const [links, setLinks] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("researcher_species")
      .select("*, researchers(id,name,expertise_area,country,h_index), species(id,accepted_name,family,iucn_status,thumbnail_url)")
      .then(({data}) => { setLinks(data||[]); setLoading(false); });
  }, []);

  const speciesWithResearchers = species.filter(sp =>
    links.some(l => l.species_id === sp.id)
  );

  const filteredSpecies = speciesWithResearchers.filter(sp =>
    !search || (sp.accepted_name||"").toLowerCase().includes(search.toLowerCase()) ||
    (sp.family||"").toLowerCase().includes(search.toLowerCase())
  );

  const getResearchers = (spId) => links.filter(l => l.species_id === spId);

  if (loading) return <div style={{textAlign:"center",padding:40,color:"#999"}}>Loading communities...</div>;

  return <div>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:8}}>
      <div>
        <div style={{fontSize:16,fontWeight:700,color:"#2c2c2a",fontFamily:"Georgia,serif"}}>Research Communities</div>
        <div style={{fontSize:11,color:"#888",marginTop:2}}>{links.length} researcher-species links · {speciesWithResearchers.length} species with communities</div>
      </div>
      <div style={{display:"flex",gap:6}}>
        {[
          {l:"Total links", v:links.length, c:"#1D9E75"},
          {l:"Active species", v:speciesWithResearchers.length, c:"#185FA5"},
          {l:"Researchers linked", v:new Set(links.map(l=>l.researcher_id)).size, c:"#534AB7"},
        ].map(s=><div key={s.l} style={{textAlign:"center",padding:"5px 10px",background:"#f4f3ef",borderRadius:8}}>
          <div style={{fontSize:14,fontWeight:700,color:s.c}}>{s.v}</div>
          <div style={{fontSize:9,color:"#999"}}>{s.l}</div>
        </div>)}
      </div>
    </div>

    {links.length === 0 ? (
      <div style={{textAlign:"center",padding:60,color:"#999"}}>
        <div style={{fontSize:32,marginBottom:12}}>🤝</div>
        <div style={{fontSize:15,fontWeight:600,color:"#2c2c2a",marginBottom:8}}>No communities yet</div>
        <div style={{fontSize:12,lineHeight:1.6}}>Go to Admin → "Araştırmacı Bağla" to connect researchers to species.</div>
      </div>
    ) : (
      <>
        <input type="text" placeholder="Search species or family..." value={search}
          onChange={e=>setSearch(e.target.value)}
          style={{width:"100%",marginBottom:14,padding:"8px 12px",border:"1px solid #e8e6e1",borderRadius:8,fontSize:12,outline:"none"}}/>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:12}}>
          {filteredSpecies.map(sp => {
            const spResearchers = getResearchers(sp.id);
            const iucnColors = {CR:"#A32D2D",EN:"#854F0B",VU:"#BA7517",NT:"#3B6D11",LC:"#0F6E56"};
            const iucnBgs = {CR:"#FCEBEB",EN:"#FAEEDA",VU:"#FFF3CD",NT:"#EAF3DE",LC:"#E1F5EE"};
            const ic = iucnColors[sp.iucn_status]||"#888";
            const ib = iucnBgs[sp.iucn_status]||"#f4f3ef";
            return (
              <div key={sp.id} style={{background:"#fff",borderRadius:14,border:"1px solid #e8e6e1",overflow:"hidden"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderBottom:"1px solid #f4f3ef",background:"#fcfbf9"}}>
                  {sp.thumbnail_url && <img src={sp.thumbnail_url} alt={sp.accepted_name} style={{width:40,height:40,borderRadius:8,objectFit:"cover",flexShrink:0}} onError={e=>e.target.style.display="none"}/>}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:700,fontStyle:"italic",color:"#2c2c2a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sp.accepted_name}</div>
                    <div style={{fontSize:10,color:"#888"}}>{sp.family}</div>
                  </div>
                  {sp.iucn_status && <span style={{fontSize:9,padding:"2px 7px",borderRadius:99,background:ib,color:ic,fontWeight:600,flexShrink:0}}>{sp.iucn_status}</span>}
                </div>
                <div style={{padding:"10px 14px"}}>
                  <div style={{fontSize:9,color:"#b4b2a9",textTransform:"uppercase",letterSpacing:0.6,marginBottom:8}}>Research community ({spResearchers.length})</div>
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {spResearchers.map(link => (
                      <div key={link.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",background:"#f8f7f4",borderRadius:8}}>
                        <div style={{width:28,height:28,borderRadius:6,background:"#1D9E75",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                          <span style={{color:"#fff",fontSize:11,fontWeight:700}}>{(link.researchers?.name||"?")[0]}</span>
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:12,fontWeight:600,color:"#2c2c2a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{link.researchers?.name||"Unknown"}</div>
                          <div style={{fontSize:9,color:"#888"}}>{link.researchers?.expertise_area||""} {link.researchers?.country?`· ${link.researchers.country}`:""}</div>
                        </div>
                        {link.role && <span style={{fontSize:9,padding:"1px 6px",borderRadius:99,background:"#E1F5EE",color:"#085041",flexShrink:0}}>{link.role}</span>}
                        {link.researchers?.h_index && <span style={{fontSize:9,padding:"1px 6px",borderRadius:99,background:"#EEEDFE",color:"#3C3489",flexShrink:0}}>h:{link.researchers.h_index}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </>
    )}
  </div>;
}
