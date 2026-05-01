"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function LinkResearcherForm({species, onDataChange, notify}) {
  const [researchers, setResearchers] = useState([]);
  const [selSpecies, setSelSpecies] = useState("");
  const [selResearcher, setSelResearcher] = useState("");
  const [role, setRole] = useState("Researcher");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [links, setLinks] = useState([]);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newR, setNewR] = useState({name:"",expertise_area:"",country:"",institution:"",h_index:""});
  const [newSaving, setNewSaving] = useState(false);
  const INP = {padding:"8px 10px",border:"1px solid #e8e6e1",borderRadius:6,fontSize:12,background:"#fff",width:"100%"};
  const LBL = {fontSize:10,color:"#888",marginBottom:3,display:"block",textTransform:"uppercase",letterSpacing:0.4};

  useEffect(() => {
    supabase.from("researchers").select("id,name,expertise_area,country").order("name").then(({data})=>setResearchers(data||[]));
  }, []);

  async function handleNewResearcher() {
    if (!newR.name.trim()) return;
    setNewSaving(true);
    const id = "RES-" + Date.now();
    const {data, error} = await supabase.from("researchers").insert({
      id, name: newR.name, expertise_area: newR.expertise_area||null,
      country: newR.country||null, institution: newR.institution||null,
      h_index: newR.h_index ? parseInt(newR.h_index) : null
    }).select().single();
    setNewSaving(false);
    if (error) { notify("Hata: "+error.message, false); return; }
    notify("✓ Araştırmacı eklendi");
    setResearchers(prev => [...prev, data].sort((a,b)=>(a.name||"").localeCompare(b.name||"")));
    setSelResearcher(data.id);
    setNewR({name:"",expertise_area:"",country:"",institution:"",h_index:""});
    setShowNewForm(false);
    onDataChange?.();
  }

  useEffect(() => {
    if (!selSpecies) { setLinks([]); return; }
    supabase.from("researcher_species")
      .select("*, researchers(name,expertise_area)")
      .eq("species_id", selSpecies)
      .then(({data}) => setLinks(data||[]));
  }, [selSpecies]);

  async function handleLink() {
    if (!selSpecies || !selResearcher) return;
    setSaving(true);
    const {error} = await supabase.from("researcher_species").insert({
      species_id: selSpecies,
      researcher_id: selResearcher,
      role, notes: notes||null
    });
    setSaving(false);
    if (error) notify("Hata: " + error.message, false);
    else {
      notify("✓ Araştırmacı bağlandı");
      setSelResearcher(""); setNotes("");
      const {data} = await supabase.from("researcher_species").select("*, researchers(name,expertise_area)").eq("species_id", selSpecies);
      setLinks(data||[]);
      onDataChange?.();
    }
  }

  async function handleUnlink(linkId) {
    const {error} = await supabase.from("researcher_species").delete().eq("id", linkId);
    if (error) notify("Hata: " + error.message, false);
    else {
      notify("✓ Bağlantı kaldırıldı");
      setLinks(links.filter(l => l.id !== linkId));
      onDataChange?.();
    }
  }

  return <div style={{display:"flex",flexDirection:"column",gap:12}}>
    <div style={{padding:"10px 14px",background:"#f8f7f4",borderRadius:10,border:"1px solid #e8e6e1"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:showNewForm?10:0}}>
        <div style={{fontSize:11,color:"#5f5e5a",fontWeight:600}}>Yeni araştırmacı ekle</div>
        <button onClick={()=>setShowNewForm(!showNewForm)} style={{padding:"4px 10px",background:showNewForm?"#f4f3ef":"#1D9E75",color:showNewForm?"#888":"#fff",border:"none",borderRadius:6,cursor:"pointer",fontSize:10,fontWeight:600}}>{showNewForm?"İptal":"+ Ekle"}</button>
      </div>
      {showNewForm && <div style={{display:"flex",flexDirection:"column",gap:8}}>
        <div><label style={LBL}>İsim *</label><input value={newR.name} onChange={e=>setNewR({...newR,name:e.target.value})} placeholder="Ad Soyad" style={INP}/></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <div><label style={LBL}>Uzmanlık</label><input value={newR.expertise_area} onChange={e=>setNewR({...newR,expertise_area:e.target.value})} placeholder="Ör: Plant biotechnology" style={INP}/></div>
          <div><label style={LBL}>Ülke</label><input value={newR.country} onChange={e=>setNewR({...newR,country:e.target.value})} placeholder="Ör: TR" style={INP}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <div><label style={LBL}>Kurum</label><input value={newR.institution} onChange={e=>setNewR({...newR,institution:e.target.value})} placeholder="Üniversite/Kurum" style={INP}/></div>
          <div><label style={LBL}>h-index</label><input type="number" value={newR.h_index} onChange={e=>setNewR({...newR,h_index:e.target.value})} placeholder="0" style={INP}/></div>
        </div>
        <button disabled={newSaving||!newR.name.trim()} onClick={handleNewResearcher}
          style={{padding:"8px 16px",background:newSaving||!newR.name.trim()?"#ccc":"#185FA5",color:"#fff",border:"none",borderRadius:8,cursor:newSaving||!newR.name.trim()?"default":"pointer",fontSize:11,fontWeight:600}}>
          {newSaving?"Kaydediliyor...":"Araştırmacı Oluştur & Seç"}
        </button>
      </div>}
    </div>

    <div>
      <label style={LBL}>Tür *</label>
      <select value={selSpecies} onChange={e=>setSelSpecies(e.target.value)} style={INP}>
        <option value="">-- Tür seçin --</option>
        {[...species].sort((a,b)=>(a.accepted_name||"").localeCompare(b.accepted_name||"")).map(s=><option key={s.id} value={s.id}>{s.accepted_name}</option>)}
      </select>
    </div>
    <div>
      <label style={LBL}>Araştırmacı *</label>
      <select value={selResearcher} onChange={e=>setSelResearcher(e.target.value)} style={INP}>
        <option value="">-- Araştırmacı seçin --</option>
        {researchers.map(r=><option key={r.id} value={r.id}>{r.name} {r.country?`(${r.country})`:""}</option>)}
      </select>
    </div>
    <div>
      <label style={LBL}>Rol</label>
      <select value={role} onChange={e=>setRole(e.target.value)} style={INP}>
        {["Researcher","Lead Researcher","PhD Student","Collaborator","Expert Advisor"].map(r=><option key={r}>{r}</option>)}
      </select>
    </div>
    <div>
      <label style={LBL}>Notlar</label>
      <input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Opsiyonel..." style={INP}/>
    </div>
    <button disabled={saving||!selSpecies||!selResearcher} onClick={handleLink}
      style={{padding:"10px 20px",background:saving||!selSpecies||!selResearcher?"#ccc":"#1D9E75",color:"#fff",border:"none",borderRadius:8,cursor:saving||!selSpecies||!selResearcher?"default":"pointer",fontSize:12,fontWeight:600}}>
      {saving?"Kaydediliyor...":"Araştırmacıyı Bağla"}
    </button>

    {selSpecies && links.length > 0 && <div style={{marginTop:8,paddingTop:12,borderTop:"1px solid #e8e6e1"}}>
      <div style={{fontSize:10,color:"#888",textTransform:"uppercase",marginBottom:8}}>Mevcut bağlantılar</div>
      {links.map(l=><div key={l.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 10px",background:"#f8f7f4",borderRadius:8,marginBottom:4}}>
        <div>
          <div style={{fontSize:12,fontWeight:600,color:"#2c2c2a"}}>{l.researchers?.name}</div>
          <div style={{fontSize:10,color:"#888"}}>{l.role}</div>
        </div>
        <button onClick={()=>handleUnlink(l.id)} style={{padding:"4px 8px",background:"#FCEBEB",color:"#A32D2D",border:"none",borderRadius:6,cursor:"pointer",fontSize:10}}>Kaldır</button>
      </div>)}
    </div>}
  </div>;
}
