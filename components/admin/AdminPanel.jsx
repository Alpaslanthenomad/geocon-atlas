"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import LinkResearcherForm from "./LinkResearcherForm";
import S2EnrichmentCard from "./S2EnrichmentCard";

export default function AdminPanel({species,programs=[],onDataChange}){
  const[activeForm,setActiveForm]=useState("editprogram");
  const[editProgF,setEditProgF]=useState(null);
  const[editSaving,setEditSaving]=useState(false);
  const[selectedSpecies,setSelectedSpecies]=useState("");
  const[msg,setMsg]=useState(null);
  const[loading,setLoading]=useState(false);
  const notify=(text,ok=true)=>{setMsg({text,ok});setTimeout(()=>setMsg(null),4000);};
  const inp={padding:"8px 10px",border:"1px solid #e8e6e1",borderRadius:6,fontSize:12,background:"#fff",outline:"none",color:"#2c2c2a",width:"100%"};
  const lbl={fontSize:10,color:"#888",marginBottom:3,display:"block",textTransform:"uppercase",letterSpacing:0.4};

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
      notify(`✓ ${table} kaydı eklendi`);resetFn();if(onDataChange)onDataChange();
    }catch(e){notify(`Hata: ${e.message}`,false);}finally{setLoading(false);}
  }
  async function saveStory(form,resetFn){if(!form.program_id||!form.title)return;setLoading(true);try{const{error}=await supabase.from("program_story_entries").insert({...form});if(error)throw error;notify("✓ Story entry eklendi");resetFn();if(onDataChange)onDataChange();}catch(e){notify(`Hata: ${e.message}`,false);}finally{setLoading(false);}}
  async function saveAction(form,resetFn){if(!form.program_id||!form.action_title)return;setLoading(true);try{const{error}=await supabase.from("program_actions").insert({...form});if(error)throw error;notify("✓ Aksiyon eklendi");resetFn();if(onDataChange)onDataChange();}catch(e){notify(`Hata: ${e.message}`,false);}finally{setLoading(false);}}
  async function saveDecision(form,resetFn){if(!form.program_id||!form.decision_title)return;setLoading(true);try{const{error}=await supabase.from("program_decisions").insert({...form});if(error)throw error;notify("✓ Karar kaydedildi");resetFn();if(onDataChange)onDataChange();}catch(e){notify(`Hata: ${e.message}`,false);}finally{setLoading(false);}}
  async function saveNewSpecies(form,resetFn){if(!form.accepted_name)return;setLoading(true);try{const id=`GEO-UPL-${form.accepted_name.replace(/\s+/g,"-").slice(0,20)}-${Math.random().toString(36).slice(2,6)}`;const{error}=await supabase.from("species").insert({...form,id,confidence:50,last_verified:new Date().toISOString().split("T")[0]});if(error)throw error;notify("✓ Tür eklendi");resetFn();if(onDataChange)onDataChange();}catch(e){notify(`Hata: ${e.message}`,false);}finally{setLoading(false);}}

  const FORMS=[{k:"editprogram",l:"Program Düzenle",icon:"✏️"},{k:"linkresearcher",l:"Araştırmacı Bağla",icon:"🤝"},{k:"program",l:"Program Oluştur",icon:"📋"},{k:"story",l:"Story Entry",icon:"📖"},{k:"action",l:"Aksiyon Ekle",icon:"✅"},{k:"decision",l:"Karar Kaydet",icon:"⚖️"},{k:"newspecies",l:"Yeni Tür Ekle",icon:"🌿"},{k:"metabolite",l:"Metabolit Ekle",icon:"🧪"},{k:"propagation",l:"Propagasyon",icon:"🌱"},{k:"conservation",l:"Koruma Kaydı",icon:"🛡"},{k:"commercial",l:"Ticari Hipotez",icon:"💼"}];
  const selectedSp=species.find(s=>s.id===selectedSpecies);

  const[metF,setMetF]=useState({compound_name:"",compound_class:"",reported_activity:"",activity_category:"other",evidence:"Early research",confidence:0.8,notes:""});
  const[propF,setPropF]=useState({protocol_type:"micropropagation",explant:"",medium_or_condition:"",success_rate:"",ex_situ_fit:"under_review",notes:""});
  const[consF,setConsF]=useState({source:"BGCI ThreatSearch",status_original:"",status_interpreted:"",scope:"Regional",assessment_year:new Date().getFullYear(),trend:"Unknown",notes:""});
  const[commF,setCommF]=useState({application_area:"",market_type:"",venture_fit:"candidate",justification:"",status:"monitor",notes:""});
  const[progF,setProgF]=useState({program_name:"",species_id:"",program_type:"Conservation & Propagation",status:"Draft",current_module:"Origin",current_gate:"Selection",readiness_score:0,priority_score:0,why_this_program:"",next_action:""});
  const[storyF,setStoryF]=useState({program_id:"",title:"",entry_type:"Evidence Added",summary:"",entry_date:new Date().toISOString().split("T")[0],author:"",linked_module:"",linked_gate:""});
  const[actionF,setActionF]=useState({program_id:"",action_title:"",action_description:"",action_owner:"",due_date:"",status:"open",priority:"medium"});
  const[decisionF,setDecisionF]=useState({program_id:"",decision_title:"",decision_type:"Gate Decision",rationale:"",made_by:"",decision_date:new Date().toISOString().split("T")[0]});
  const[spF,setSpF]=useState({accepted_name:"",genus:"",family:"",geophyte_type:"Bulbous",country_focus:"TR",iucn_status:"",endemicity_flag:false,common_name:"",habitat:"",decision:"Monitor"});

  const sel=(label,val,onChange,opts)=><div style={{marginBottom:12}}><label style={lbl}>{label}</label><select value={val} onChange={e=>onChange(e.target.value)} style={inp}>{opts.map(o=><option key={o} value={o}>{o}</option>)}</select></div>;
  const txt=(label,val,onChange,ph="")=><div style={{marginBottom:12}}><label style={lbl}>{label}</label><input value={val} onChange={e=>onChange(e.target.value)} style={inp} placeholder={ph}/></div>;
  const ta=(label,val,onChange)=><div style={{marginBottom:12}}><label style={lbl}>{label}</label><textarea value={val} onChange={e=>onChange(e.target.value)} rows={3} style={{...inp,resize:"vertical"}}/></div>;
  const btn=(label,onClick,disabled)=><button disabled={disabled} onClick={onClick} style={{padding:"10px 24px",background:disabled?"#ccc":"#1D9E75",color:"#fff",border:"none",borderRadius:8,cursor:disabled?"default":"pointer",fontSize:12,fontWeight:600}}>{loading?"Kaydediliyor...":label}</button>;

  return<div style={{maxWidth:700}}>
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:20}}><div style={{width:32,height:32,borderRadius:8,background:"#1D9E75",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:"#fff",fontSize:16}}>⚙</span></div><div><div style={{fontSize:16,fontWeight:700,color:"#2c2c2a"}}>Admin Paneli</div><div style={{fontSize:10,color:"#888"}}>Veri ekleme ve düzenleme</div></div></div>
    <S2EnrichmentCard />
    {msg&&<div style={{padding:"10px 14px",borderRadius:8,marginBottom:16,background:msg.ok?"#E1F5EE":"#FCEBEB",color:msg.ok?"#085041":"#A32D2D",fontSize:12,fontWeight:500}}>{msg.text}</div>}
    <div style={{marginBottom:16}}>
      <label style={lbl}>Tür Seç (species gerektiren formlar için)</label>
      <select value={selectedSpecies} onChange={e=>setSelectedSpecies(e.target.value)} style={{...inp,marginBottom:0}}><option value="">-- Tür seçin --</option>{[...species].sort((a,b)=>(a.accepted_name||"").localeCompare(b.accepted_name||"")).map(s=><option key={s.id} value={s.id}>{s.accepted_name}</option>)}</select>
      {selectedSp&&<div style={{marginTop:6,padding:"6px 10px",background:"#f4f3ef",borderRadius:6,fontSize:11,color:"#5f5e5a"}}>Seçili: <strong style={{fontStyle:"italic"}}>{selectedSp.accepted_name}</strong> · {selectedSp.iucn_status||"—"}</div>}
    </div>
    <div style={{display:"flex",gap:4,marginBottom:20,flexWrap:"wrap"}}>{FORMS.map(f=><button key={f.k} onClick={()=>setActiveForm(f.k)} style={{padding:"7px 12px",border:"none",borderRadius:7,cursor:"pointer",fontSize:11,background:activeForm===f.k?"#1D9E75":"#f4f3ef",color:activeForm===f.k?"#fff":"#888",fontWeight:activeForm===f.k?600:400}}>{f.icon} {f.l}</button>)}</div>
    <div style={{background:"#fff",border:"1px solid #e8e6e1",borderRadius:12,padding:20}}>
      {activeForm==="editprogram"&&<div>
        <div style={{marginBottom:12}}>
          <label style={{fontSize:10,color:"#888",marginBottom:4,display:"block",textTransform:"uppercase"}}>Program Seç</label>
          <select value={editProgF?.id||""} onChange={e=>{const p=programs.find(x=>x.id===e.target.value);setEditProgF(p?{...p}:null);}} style={{padding:"8px 10px",border:"1px solid #e8e6e1",borderRadius:6,fontSize:12,background:"#fff",width:"100%"}}>
            <option value="">-- Program seçin --</option>
            {programs.map(p=><option key={p.id} value={p.id}>{p.program_name}</option>)}
          </select>
        </div>
        {editProgF&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div><label style={{fontSize:10,color:"#888",marginBottom:3,display:"block",textTransform:"uppercase"}}>Program Adı</label><input value={editProgF.program_name||""} onChange={e=>setEditProgF({...editProgF,program_name:e.target.value})} style={{...inp}}/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <div><label style={{fontSize:10,color:"#888",marginBottom:3,display:"block",textTransform:"uppercase"}}>Status</label>
              <select value={editProgF.status||"Draft"} onChange={e=>setEditProgF({...editProgF,status:e.target.value})} style={{...inp,marginBottom:0}}>
                {["Draft","Active","Blocked","On Hold","Completed","Archived"].map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div><label style={{fontSize:10,color:"#888",marginBottom:3,display:"block",textTransform:"uppercase"}}>Modül</label>
              <select value={editProgF.current_module||"Origin"} onChange={e=>setEditProgF({...editProgF,current_module:e.target.value})} style={{...inp,marginBottom:0}}>
                {["Origin","Forge","Mesh","Exchange","Accord"].map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <div><label style={{fontSize:10,color:"#888",marginBottom:3,display:"block",textTransform:"uppercase"}}>Gate</label>
              <select value={editProgF.current_gate||"Selection"} onChange={e=>setEditProgF({...editProgF,current_gate:e.target.value})} style={{...inp,marginBottom:0}}>
                {["Selection","Validation","Protocol","Deployment","Venture","Governance"].map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div><label style={{fontSize:10,color:"#888",marginBottom:3,display:"block",textTransform:"uppercase"}}>Readiness (0-100)</label>
              <input type="number" min="0" max="100" value={editProgF.readiness_score||0} onChange={e=>setEditProgF({...editProgF,readiness_score:parseInt(e.target.value)||0})} style={{...inp}}/>
            </div>
          </div>
          <div><label style={{fontSize:10,color:"#888",marginBottom:3,display:"block",textTransform:"uppercase"}}>Neden bu program?</label><textarea value={editProgF.why_this_program||""} onChange={e=>setEditProgF({...editProgF,why_this_program:e.target.value})} rows={3} style={{...inp,resize:"vertical"}}/></div>
          <div><label style={{fontSize:10,color:"#888",marginBottom:3,display:"block",textTransform:"uppercase"}}>Sonraki aksiyon</label><input value={editProgF.next_action||""} onChange={e=>setEditProgF({...editProgF,next_action:e.target.value})} style={{...inp}}/></div>
          <div><label style={{fontSize:10,color:"#888",marginBottom:3,display:"block",textTransform:"uppercase"}}>Primary Blocker</label><input value={editProgF.primary_blocker||""} onChange={e=>setEditProgF({...editProgF,primary_blocker:e.target.value})} style={{...inp}}/></div>
          <div style={{display:"flex",gap:8,marginTop:4}}>
            <button disabled={editSaving} onClick={async()=>{setEditSaving(true);const{error}=await supabase.from("programs").update({program_name:editProgF.program_name,status:editProgF.status,current_module:editProgF.current_module,current_gate:editProgF.current_gate,readiness_score:editProgF.readiness_score,why_this_program:editProgF.why_this_program,next_action:editProgF.next_action,primary_blocker:editProgF.primary_blocker}).eq("id",editProgF.id);setEditSaving(false);if(error)notify("Hata: "+error.message,false);else{notify("✓ Program güncellendi");onDataChange?.();}}} style={{padding:"10px 20px",background:editSaving?"#ccc":"#1D9E75",color:"#fff",border:"none",borderRadius:8,cursor:editSaving?"default":"pointer",fontSize:12,fontWeight:600}}>{editSaving?"Kaydediliyor...":"Kaydet"}</button>
            <button onClick={async()=>{if(!confirm("Bu programı silmek istediğinizden emin misiniz?"))return;const{error}=await supabase.from("programs").delete().eq("id",editProgF.id);if(error)notify("Hata: "+error.message,false);else{notify("✓ Program silindi");setEditProgF(null);onDataChange?.();}}} style={{padding:"10px 20px",background:"#FCEBEB",color:"#A32D2D",border:"1px solid #A32D2D",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600}}>Sil</button>
          </div>
        </div>}
      </div>}
      {activeForm==="linkresearcher"&&<div>
        <div style={{padding:"10px 14px",background:"#E1F5EE",borderRadius:10,border:"1px solid #1D9E75",marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:11,color:"#085041",fontWeight:600}}>+ Yeni araştırmacı ekle (listede yoksa)</div>
            <button onClick={()=>setActiveForm("addresearcher")} style={{padding:"4px 10px",background:"#1D9E75",color:"#fff",border:"none",borderRadius:6,cursor:"pointer",fontSize:10,fontWeight:600}}>Ekle →</button>
          </div>
        </div>
        <LinkResearcherForm species={species} onDataChange={onDataChange} notify={notify}/>
      </div>}
      {activeForm==="addresearcher"&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
        <div><label style={lbl}>İsim *</label><input value={progF.newRName||""} onChange={e=>setProgF({...progF,newRName:e.target.value})} placeholder="Ad Soyad" style={inp}/></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <div><label style={lbl}>Uzmanlık</label><input value={progF.newRExp||""} onChange={e=>setProgF({...progF,newRExp:e.target.value})} placeholder="Plant biotechnology" style={inp}/></div>
          <div><label style={lbl}>Ülke</label><input value={progF.newRCountry||""} onChange={e=>setProgF({...progF,newRCountry:e.target.value})} placeholder="TR" style={inp}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <div><label style={lbl}>Kurum</label><input value={progF.newRInst||""} onChange={e=>setProgF({...progF,newRInst:e.target.value})} placeholder="Üniversite/Kurum" style={inp}/></div>
          <div><label style={lbl}>h-index</label><input type="number" value={progF.newRH||""} onChange={e=>setProgF({...progF,newRH:e.target.value})} placeholder="0" style={inp}/></div>
        </div>
        <button disabled={loading||!progF.newRName} onClick={async()=>{
          if(!progF.newRName?.trim()) return;
          setLoading(true);
          const newId="RES-"+Date.now();
          const {error}=await supabase.from("researchers").insert({id:newId,name:progF.newRName,expertise_area:progF.newRExp||null,country:progF.newRCountry||null,institution:progF.newRInst||null,h_index:progF.newRH?parseInt(progF.newRH):null});
          setLoading(false);
          if(error)notify("Hata: "+error.message,false);
          else{notify("✓ Araştırmacı eklendi! Şimdi 'Araştırmacı Bağla' sekmesinden bağlayabilirsiniz.");setProgF({...progF,newRName:"",newRExp:"",newRCountry:"",newRInst:"",newRH:""});onDataChange?.();}
        }} style={{padding:"10px 20px",background:loading||!progF.newRName?"#ccc":"#185FA5",color:"#fff",border:"none",borderRadius:8,cursor:loading||!progF.newRName?"default":"pointer",fontSize:12,fontWeight:600}}>
          {loading?"Kaydediliyor...":"Araştırmacıyı Kaydet"}
        </button>
        <button onClick={()=>setActiveForm("linkresearcher")} style={{padding:"8px",background:"none",border:"none",cursor:"pointer",fontSize:11,color:"#888"}}>← Geri dön</button>
      </div>}
      {activeForm==="program"&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
        {txt("Program adı *",progF.program_name,v=>setProgF({...progF,program_name:v}))}
        <div>
          <label style={lbl}>Program kapsamı</label>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {[{k:"single",l:"🌿 Tek tür"},{k:"genus",l:"🌱 Genus"},{k:"region",l:"🗺 Bölge"},{k:"custom",l:"⚗️ Özel seçim"}].map(t=>
              <button key={t.k} onClick={()=>setProgF({...progF,scope_type:t.k,species_id:"",selectedSpeciesIds:[]})}
                style={{padding:"6px 12px",border:`1px solid ${(progF.scope_type||"single")===t.k?"#1D9E75":"#e8e6e1"}`,borderRadius:8,background:(progF.scope_type||"single")===t.k?"#E1F5EE":"#fff",color:(progF.scope_type||"single")===t.k?"#085041":"#888",fontSize:11,cursor:"pointer",fontWeight:(progF.scope_type||"single")===t.k?600:400}}>
                {t.l}
              </button>
            )}
          </div>
        </div>
        {(progF.scope_type||"single")==="single"&&<div>
          <label style={lbl}>Tür</label>
          <select value={progF.species_id||""} onChange={e=>setProgF({...progF,species_id:e.target.value})} style={inp}>
            <option value="">-- Tür seçin --</option>
            {[...species].sort((a,b)=>(a.accepted_name||"").localeCompare(b.accepted_name||"")).map(s=><option key={s.id} value={s.id}>{s.accepted_name}{s.iucn_status?` [${s.iucn_status}]`:""}</option>)}
          </select>
        </div>}
        {(progF.scope_type)==="genus"&&<div>
          <label style={lbl}>Genus → o genusun tüm türleri eklenir</label>
          <select onChange={e=>{const g=e.target.value;if(!g)return;const ids=species.filter(s=>s.genus===g).map(s=>s.id);setProgF({...progF,scope_label:g,selectedSpeciesIds:ids,species_id:ids[0]||"",program_name:progF.program_name||g+" Conservation Program"});}} style={inp}>
            <option value="">-- Genus seçin --</option>
            {[...new Set(species.map(s=>s.genus).filter(Boolean))].sort().map(g=><option key={g} value={g}>{g} ({species.filter(s=>s.genus===g).length} tür)</option>)}
          </select>
          {(progF.selectedSpeciesIds||[]).length>0&&<div style={{marginTop:6,padding:"8px 10px",background:"#E1F5EE",borderRadius:8,fontSize:11,color:"#085041"}}>✓ {(progF.selectedSpeciesIds||[]).length} tür: {species.filter(s=>(progF.selectedSpeciesIds||[]).includes(s.id)).map(s=>s.accepted_name).join(", ")}</div>}
        </div>}
        {(progF.scope_type)==="region"&&<div>
          <label style={lbl}>Bölge/Ülke → o bölgedeki tüm türler eklenir</label>
          <select onChange={e=>{const r=e.target.value;if(!r)return;const ids=species.filter(s=>s.region===r||s.country_focus===r).map(s=>s.id);setProgF({...progF,scope_label:r,selectedSpeciesIds:ids,species_id:ids[0]||"",program_name:progF.program_name||r+" Geophyte Conservation"});}} style={inp}>
            <option value="">-- Bölge/Ülke seçin --</option>
            {[...new Set(species.map(s=>s.region||s.country_focus).filter(Boolean))].sort().map(r=><option key={r} value={r}>{r} ({species.filter(s=>s.region===r||s.country_focus===r).length} tür)</option>)}
          </select>
          {(progF.selectedSpeciesIds||[]).length>0&&<div style={{marginTop:6,padding:"8px 10px",background:"#E6F1FB",borderRadius:8,fontSize:11,color:"#0C447C"}}>✓ {(progF.selectedSpeciesIds||[]).length} tür seçildi</div>}
        </div>}
        {(progF.scope_type)==="custom"&&<div>
          <label style={lbl}>Türleri seç (Ctrl/Cmd ile çoklu)</label>
          <select multiple onChange={e=>{const ids=[...e.target.selectedOptions].map(o=>o.value);setProgF({...progF,selectedSpeciesIds:ids,species_id:ids[0]||""});}} style={{...inp,height:130}}>
            {[...species].sort((a,b)=>(a.accepted_name||"").localeCompare(b.accepted_name||"")).map(s=><option key={s.id} value={s.id}>{s.accepted_name} [{s.family}]{s.iucn_status?` [${s.iucn_status}]`:""}</option>)}
          </select>
          {(progF.selectedSpeciesIds||[]).length>0&&<div style={{marginTop:6,padding:"6px 10px",background:"#EEEDFE",borderRadius:8,fontSize:11,color:"#3C3489"}}>✓ {(progF.selectedSpeciesIds||[]).length} tür seçildi</div>}
        </div>}
        {sel("Program tipi",progF.program_type,v=>setProgF({...progF,program_type:v}),["Conservation & Propagation","Conservation Rescue","Propagation Program","Metabolite Discovery","Premium Ornamental","Functional Ingredient","Venture Formation"])}
        {sel("Modül",progF.current_module,v=>setProgF({...progF,current_module:v}),["Origin","Forge","Mesh","Exchange","Accord"])}
        {sel("Gate",progF.current_gate,v=>setProgF({...progF,current_gate:v}),["Selection","Validation","Protocol","Deployment","Venture","Governance"])}
        {ta("Neden bu program?",progF.why_this_program,v=>setProgF({...progF,why_this_program:v}))}
        {txt("Sonraki aksiyon",progF.next_action,v=>setProgF({...progF,next_action:v}))}
        {btn("Program Oluştur",async()=>{
          setLoading(true);
          try{
            const{data:prog,error}=await supabase.from("programs").insert({
              ...progF,program_code:`PROG-${Date.now()}`,
              scope_type:progF.scope_type||"single",scope_label:progF.scope_label||null,
              readiness_score:parseInt(progF.readiness_score)||0,
              confidence_score:parseInt(progF.confidence_score)||0,
              priority_score:parseInt(progF.priority_score)||0
            }).select().single();
            if(error)throw error;
            const allIds=[...new Set([...(progF.selectedSpeciesIds||[]),...(progF.species_id?[progF.species_id]:[])]) ].filter(Boolean);
            if(allIds.length>1){
              await supabase.from("program_species").insert(allIds.map(sid=>({program_id:prog.id,species_id:sid,role:"Primary"})));
            }
            notify("✓ Program oluşturuldu"+(allIds.length>1?` — ${allIds.length} tür bağlandı`:""));
            setProgF({program_name:"",species_id:"",scope_type:"single",selectedSpeciesIds:[],scope_label:"",program_type:"Conservation & Propagation",status:"Draft",current_module:"Origin",current_gate:"Selection",readiness_score:0,priority_score:0,why_this_program:"",next_action:""});
            if(onDataChange)onDataChange();
          }catch(e){notify("Hata: "+e.message,false);}
          setLoading(false);
        },loading||!progF.program_name)}
      </div>}
      {activeForm==="story"&&<><div style={{marginBottom:12}}><label style={lbl}>Program *</label><select value={storyF.program_id} onChange={e=>setStoryF({...storyF,program_id:e.target.value})} style={inp}><option value="">-- Program seçin --</option>{programs.map(p=><option key={p.id} value={p.id}>{p.program_name}</option>)}</select></div>{sel("Entry tipi",storyF.entry_type,v=>setStoryF({...storyF,entry_type:v}),["Evidence Added","Gate Passed","Risk Raised","Protocol Updated","Governance Review Opened","Community Signal Added","Decision Made","Milestone Reached"])}{txt("Başlık *",storyF.title,v=>setStoryF({...storyF,title:v}))}{ta("Özet",storyF.summary,v=>setStoryF({...storyF,summary:v}))}{txt("Yazan",storyF.author,v=>setStoryF({...storyF,author:v}))}{btn("Story Entry Ekle",()=>saveStory(storyF,()=>setStoryF({program_id:storyF.program_id,title:"",entry_type:"Evidence Added",summary:"",entry_date:new Date().toISOString().split("T")[0],author:"",linked_module:"",linked_gate:""})),loading||!storyF.program_id||!storyF.title)}</>}
      {activeForm==="action"&&<><div style={{marginBottom:12}}><label style={lbl}>Program *</label><select value={actionF.program_id} onChange={e=>setActionF({...actionF,program_id:e.target.value})} style={inp}><option value="">-- Program seçin --</option>{programs.map(p=><option key={p.id} value={p.id}>{p.program_name}</option>)}</select></div>{txt("Aksiyon başlığı *",actionF.action_title,v=>setActionF({...actionF,action_title:v}))}{ta("Açıklama",actionF.action_description,v=>setActionF({...actionF,action_description:v}))}{txt("Sorumlu",actionF.action_owner,v=>setActionF({...actionF,action_owner:v}))}{sel("Öncelik",actionF.priority,v=>setActionF({...actionF,priority:v}),["low","medium","high"])}{btn("Aksiyon Ekle",()=>saveAction(actionF,()=>setActionF({program_id:actionF.program_id,action_title:"",action_description:"",action_owner:"",due_date:"",status:"open",priority:"medium"})),loading||!actionF.program_id||!actionF.action_title)}</>}
      {activeForm==="decision"&&<><div style={{marginBottom:12}}><label style={lbl}>Program *</label><select value={decisionF.program_id} onChange={e=>setDecisionF({...decisionF,program_id:e.target.value})} style={inp}><option value="">-- Program seçin --</option>{programs.map(p=><option key={p.id} value={p.id}>{p.program_name}</option>)}</select></div>{txt("Karar başlığı *",decisionF.decision_title,v=>setDecisionF({...decisionF,decision_title:v}))}{sel("Karar tipi",decisionF.decision_type,v=>setDecisionF({...decisionF,decision_type:v}),["Gate Decision","Program Launch","Risk Escalation","Module Transition","Governance Review","Strategic Pivot"])}{ta("Gerekçe",decisionF.rationale,v=>setDecisionF({...decisionF,rationale:v}))}{txt("Karar veren",decisionF.made_by,v=>setDecisionF({...decisionF,made_by:v}))}{btn("Karar Kaydet",()=>saveDecision(decisionF,()=>setDecisionF({program_id:decisionF.program_id,decision_title:"",decision_type:"Gate Decision",rationale:"",made_by:"",decision_date:new Date().toISOString().split("T")[0]})),loading||!decisionF.program_id||!decisionF.decision_title)}</>}
      {activeForm==="newspecies"&&<>{txt("Kabul edilen isim *",spF.accepted_name,v=>setSpF({...spF,accepted_name:v}))}{txt("Genus",spF.genus,v=>setSpF({...spF,genus:v}))}{txt("Familya",spF.family,v=>setSpF({...spF,family:v}))}{sel("Geofit tipi",spF.geophyte_type,v=>setSpF({...spF,geophyte_type:v}),["Bulbous","Cormous","Rhizomatous","Tuberous","Other"])}{sel("Ülke",spF.country_focus,v=>setSpF({...spF,country_focus:v}),["TR","CL","OTHER"])}{sel("IUCN",spF.iucn_status,v=>setSpF({...spF,iucn_status:v}),["","CR","EN","VU","NT","LC","DD","NE"])}{txt("Yaygın isim",spF.common_name,v=>setSpF({...spF,common_name:v}))}{sel("Karar",spF.decision,v=>setSpF({...spF,decision:v}),["Monitor","Develop","Scale","Accelerate","Rescue Now","Data Needed"])}<div style={{marginBottom:12,display:"flex",alignItems:"center",gap:8}}><input type="checkbox" checked={spF.endemicity_flag} onChange={e=>setSpF({...spF,endemicity_flag:e.target.checked})} id="endemic"/><label htmlFor="endemic" style={{fontSize:12,color:"#2c2c2a"}}>Endemik tür</label></div>{btn("Tür Ekle",()=>saveNewSpecies(spF,()=>setSpF({accepted_name:"",genus:"",family:"",geophyte_type:"Bulbous",country_focus:"TR",iucn_status:"",endemicity_flag:false,common_name:"",habitat:"",decision:"Monitor"})),loading||!spF.accepted_name)}</>}
      {activeForm==="metabolite"&&<>{txt("Bileşik adı *",metF.compound_name,v=>setMetF({...metF,compound_name:v}))}{sel("Aktivite kategorisi",metF.activity_category,v=>setMetF({...metF,activity_category:v}),["alkaloid","flavonoid","terpenoid","phenolic","saponin","glycoside","steroid","amino acid","other"])}{ta("Bildirilen aktivite",metF.reported_activity,v=>setMetF({...metF,reported_activity:v}))}{btn("Metabolit Ekle",()=>save("metabolites",metF,()=>setMetF({compound_name:"",compound_class:"",reported_activity:"",activity_category:"other",evidence:"Early research",confidence:0.8,notes:""})),loading||!metF.compound_name)}</>}
      {activeForm==="propagation"&&<>{sel("Protokol tipi",propF.protocol_type,v=>setPropF({...propF,protocol_type:v}),["micropropagation","shoot tip culture","embryo rescue","callus culture","bulblet induction"])}{txt("Explant",propF.explant,v=>setPropF({...propF,explant:v}))}{txt("Ortam",propF.medium_or_condition,v=>setPropF({...propF,medium_or_condition:v}))}{ta("Notlar",propF.notes,v=>setPropF({...propF,notes:v}))}{btn("Protokol Ekle",()=>save("propagation",propF,()=>setPropF({protocol_type:"micropropagation",explant:"",medium_or_condition:"",success_rate:"",ex_situ_fit:"under_review",notes:""})),loading)}</>}
      {activeForm==="conservation"&&<>{sel("Kaynak",consF.source,v=>setConsF({...consF,source:v}),["BGCI ThreatSearch","IUCN Red List","Regional Assessment","Expert Opinion"])}{sel("Yorumlanan statü",consF.status_interpreted,v=>setConsF({...consF,status_interpreted:v}),["Critically Endangered","Endangered","Vulnerable","Near Threatened","Least Concern","Data Deficient"])}{ta("Notlar",consF.notes,v=>setConsF({...consF,notes:v}))}{btn("Kayıt Ekle",()=>save("conservation",consF,()=>setConsF({source:"BGCI ThreatSearch",status_original:"",status_interpreted:"",scope:"Regional",assessment_year:new Date().getFullYear(),trend:"Unknown",notes:""})),loading)}</>}
      {activeForm==="commercial"&&<>{txt("Uygulama alanı *",commF.application_area,v=>setCommF({...commF,application_area:v}))}{sel("Venture uyumu",commF.venture_fit,v=>setCommF({...commF,venture_fit:v}),["candidate","developing","validated","ready"])}{ta("Gerekçe",commF.justification,v=>setCommF({...commF,justification:v}))}{btn("Hipotez Ekle",()=>save("commercial",commF,()=>setCommF({application_area:"",market_type:"",venture_fit:"candidate",justification:"",status:"monitor",notes:""})),loading||!commF.application_area)}</>}
    </div>
  </div>;
}
