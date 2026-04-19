“use client”;
import { useState } from “react”;
import { supabase } from “../../lib/supabase”;
import {
createProgram,
createProgramStoryEntry,
createProgramAction,
createProgramDecision,
} from “../../lib/programs”;

const INP = { padding:“8px 10px”, border:“1px solid #e8e6e1”, borderRadius:6, fontSize:12, background:”#fff”, outline:“none”, color:”#2c2c2a”, width:“100%” };
const LBL = { fontSize:10, color:”#888”, marginBottom:3, display:“block”, textTransform:“uppercase”, letterSpacing:0.4 };

const FORMS = [
{ k:“program”,     l:“Program Oluştur”,  icon:“📋” },
{ k:“story”,       l:“Story Entry”,      icon:“📖” },
{ k:“action”,      l:“Aksiyon Ekle”,     icon:“✅” },
{ k:“decision”,    l:“Karar Kaydet”,     icon:“⚖️” },
{ k:“newspecies”,  l:“Yeni Tür Ekle”,   icon:“🌿” },
{ k:“metabolite”,  l:“Metabolit Ekle”,  icon:“🧪” },
{ k:“propagation”, l:“Propagasyon”,      icon:“🌱” },
{ k:“conservation”,l:“Koruma Kaydı”,    icon:“🛡” },
{ k:“commercial”,  l:“Ticari Hipotez”,  icon:“💼” },
];

export default function AdminPanel({ species, programs = [], onDataChange }) {
const [activeForm,       setActiveForm]       = useState(“program”);
const [selectedSpecies,  setSelectedSpecies]  = useState(””);
const [msg,              setMsg]              = useState(null);
const [saving,           setSaving]           = useState(false);

// Form states
const [progF,    setProgF]    = useState({ program_name:””, species_id:””, program_type:“Conservation & Propagation”, status:“Draft”, current_module:“Origin”, current_gate:“Selection”, owner_name:“Alpaslan Acar”, readiness_score:0, priority_score:0, why_this_program:””, next_action:”” });
const [storyF,   setStoryF]   = useState({ program_id:””, title:””, entry_type:“Evidence Added”, summary:””, entry_date:new Date().toISOString().split(“T”)[0], author:“Alpaslan Acar”, linked_module:””, linked_gate:”” });
const [actionF,  setActionF]  = useState({ program_id:””, action_title:””, action_description:””, action_owner:“Alpaslan Acar”, due_date:””, status:“open”, priority:“medium” });
const [decisionF,setDecisionF]= useState({ program_id:””, decision_title:””, decision_type:“Gate Decision”, rationale:””, made_by:“Alpaslan Acar”, decision_date:new Date().toISOString().split(“T”)[0] });
const [spF,      setSpF]      = useState({ accepted_name:””, genus:””, family:””, geophyte_type:“Bulbous”, country_focus:“TR”, iucn_status:””, endemicity_flag:false, common_name:””, habitat:””, decision:“Monitor” });
const [metF,     setMetF]     = useState({ compound_name:””, compound_class:””, reported_activity:””, activity_category:“other”, evidence:“Early research”, confidence:0.8, notes:”” });
const [propF,    setPropF]    = useState({ protocol_type:“micropropagation”, explant:””, medium_or_condition:””, success_rate:””, ex_situ_fit:“under_review”, notes:”” });
const [consF,    setConsF]    = useState({ source:“BGCI ThreatSearch”, status_original:””, status_interpreted:””, scope:“Regional”, assessment_year:new Date().getFullYear(), trend:“Unknown”, notes:”” });
const [commF,    setCommF]    = useState({ application_area:””, market_type:””, venture_fit:“candidate”, justification:””, status:“monitor”, notes:”” });

const notify = (text, ok = true) => { setMsg({ text, ok }); setTimeout(() => setMsg(null), 4000); };

const selectedSp = species.find(s => s.id === selectedSpecies);

// Species-dependent save
async function saveSpeciesData(table, data, resetFn) {
if (!selectedSpecies) { notify(“Önce tür seçin”, false); return; }
setSaving(true);
try {
const payload = { …data, species_id: selectedSpecies };
if (table === “metabolites”)  payload.id              = crypto.randomUUID();
if (table === “propagation”)  payload.protocol_id     = `PROP-${selectedSpecies}-${Date.now()}`;
if (table === “conservation”) payload.assessment_id   = `CONS-${selectedSpecies}-${Date.now()}`;
if (table === “commercial”)   payload.hypothesis_id   = `COM-${selectedSpecies}-${Date.now()}`;
const { error } = await supabase.from(table).insert(payload);
if (error) throw error;
notify(`✓ ${table} kaydı eklendi`);
resetFn();
onDataChange?.();
} catch (e) { notify(`Hata: ${e.message}`, false); }
finally { setSaving(false); }
}

async function handleProgram() {
if (!progF.program_name) return;
setSaving(true);
try {
await createProgram({ …progF, readiness_score:parseInt(progF.readiness_score)||0, confidence_score:0, priority_score:parseInt(progF.priority_score)||0 });
notify(“✓ Program oluşturuldu”);
setProgF({ program_name:””, species_id:””, program_type:“Conservation & Propagation”, status:“Draft”, current_module:“Origin”, current_gate:“Selection”, owner_name:“Alpaslan Acar”, readiness_score:0, priority_score:0, why_this_program:””, next_action:”” });
onDataChange?.();
} catch (e) { notify(`Hata: ${e.message}`, false); }
finally { setSaving(false); }
}

async function handleStory() {
if (!storyF.program_id || !storyF.title) return;
setSaving(true);
try {
await createProgramStoryEntry({ …storyF });
notify(“✓ Story entry eklendi”);
setStoryF(f => ({ …f, title:””, summary:”” }));
onDataChange?.();
} catch (e) { notify(`Hata: ${e.message}`, false); }
finally { setSaving(false); }
}

async function handleAction() {
if (!actionF.program_id || !actionF.action_title) return;
setSaving(true);
try {
await createProgramAction({ …actionF });
notify(“✓ Aksiyon eklendi”);
setActionF(f => ({ …f, action_title:””, action_description:”” }));
onDataChange?.();
} catch (e) { notify(`Hata: ${e.message}`, false); }
finally { setSaving(false); }
}

async function handleDecision() {
if (!decisionF.program_id || !decisionF.decision_title) return;
setSaving(true);
try {
await createProgramDecision({ …decisionF });
notify(“✓ Karar kaydedildi”);
setDecisionF(f => ({ …f, decision_title:””, rationale:”” }));
onDataChange?.();
} catch (e) { notify(`Hata: ${e.message}`, false); }
finally { setSaving(false); }
}

async function handleNewSpecies() {
if (!spF.accepted_name) return;
setSaving(true);
try {
const id = `GEO-UPL-${spF.accepted_name.replace(/\s+/g,"-").slice(0,20)}-${Math.random().toString(36).slice(2,6)}`;
const { error } = await supabase.from(“species”).insert({ …spF, id, confidence:50, last_verified:new Date().toISOString().split(“T”)[0] });
if (error) throw error;
notify(“✓ Tür eklendi”);
setSpF({ accepted_name:””, genus:””, family:””, geophyte_type:“Bulbous”, country_focus:“TR”, iucn_status:””, endemicity_flag:false, common_name:””, habitat:””, decision:“Monitor” });
onDataChange?.();
} catch (e) { notify(`Hata: ${e.message}`, false); }
finally { setSaving(false); }
}

// Field helpers
const Txt = ({ label, val, set, ph=”” }) => (
<div style={{ marginBottom:12 }}>
<label style={LBL}>{label}</label>
<input value={val} onChange={e=>set(e.target.value)} style={INP} placeholder={ph} />
</div>
);
const Sel = ({ label, val, set, opts }) => (
<div style={{ marginBottom:12 }}>
<label style={LBL}>{label}</label>
<select value={val} onChange={e=>set(e.target.value)} style={INP}>
{opts.map(o => <option key={o} value={o}>{o}</option>)}
</select>
</div>
);
const Ta = ({ label, val, set }) => (
<div style={{ marginBottom:12 }}>
<label style={LBL}>{label}</label>
<textarea value={val} onChange={e=>set(e.target.value)} rows={3} style={{ …INP, resize:“vertical” }} />
</div>
);
const Btn = ({ label, onClick, disabled }) => (
<button disabled={disabled || saving} onClick={onClick} style={{ padding:“10px 24px”, background:disabled||saving?”#ccc”:”#1D9E75”, color:”#fff”, border:“none”, borderRadius:8, cursor:disabled||saving?“default”:“pointer”, fontSize:12, fontWeight:600 }}>
{saving ? “Kaydediliyor…” : label}
</button>
);

return (
<div style={{ maxWidth:700 }}>
{/* Header */}
<div style={{ display:“flex”, alignItems:“center”, gap:8, marginBottom:20 }}>
<div style={{ width:32, height:32, borderRadius:8, background:”#1D9E75”, display:“flex”, alignItems:“center”, justifyContent:“center” }}>
<span style={{ color:”#fff”, fontSize:16 }}>⚙</span>
</div>
<div>
<div style={{ fontSize:16, fontWeight:700, color:”#2c2c2a” }}>Admin Paneli</div>
<div style={{ fontSize:10, color:”#888” }}>Veri ekleme ve düzenleme — tüm işlemler `lib/programs.js` üzerinden</div>
</div>
</div>

```
  {/* Notification */}
  {msg && <div style={{ padding:"10px 14px", borderRadius:8, marginBottom:16, background:msg.ok?"#E1F5EE":"#FCEBEB", color:msg.ok?"#085041":"#A32D2D", fontSize:12, fontWeight:500 }}>{msg.text}</div>}

  {/* Species selector */}
  <div style={{ marginBottom:16 }}>
    <label style={LBL}>Tür Seç (species gerektiren formlar için)</label>
    <select value={selectedSpecies} onChange={e=>setSelectedSpecies(e.target.value)} style={{ ...INP, marginBottom:0 }}>
      <option value="">-- Tür seçin --</option>
      {[...species].sort((a,b)=>(a.accepted_name||"").localeCompare(b.accepted_name||"")).map(s=><option key={s.id} value={s.id}>{s.accepted_name}</option>)}
    </select>
    {selectedSp && <div style={{ marginTop:6, padding:"6px 10px", background:"#f4f3ef", borderRadius:6, fontSize:11, color:"#5f5e5a" }}>Seçili: <strong style={{ fontStyle:"italic" }}>{selectedSp.accepted_name}</strong> · {selectedSp.iucn_status||"—"}</div>}
  </div>

  {/* Form tabs */}
  <div style={{ display:"flex", gap:4, marginBottom:20, flexWrap:"wrap" }}>
    {FORMS.map(f => (
      <button key={f.k} onClick={() => setActiveForm(f.k)} style={{ padding:"7px 12px", border:"none", borderRadius:7, cursor:"pointer", fontSize:11, background:activeForm===f.k?"#1D9E75":"#f4f3ef", color:activeForm===f.k?"#fff":"#888", fontWeight:activeForm===f.k?600:400 }}>
        {f.icon} {f.l}
      </button>
    ))}
  </div>

  {/* Form body */}
  <div style={{ background:"#fff", border:"1px solid #e8e6e1", borderRadius:12, padding:20 }}>

    {activeForm === "program" && <>
      <Txt label="Program adı *" val={progF.program_name} set={v=>setProgF({...progF,program_name:v})} />
      <div style={{ marginBottom:12 }}>
        <label style={LBL}>Tür</label>
        <select value={progF.species_id} onChange={e=>setProgF({...progF,species_id:e.target.value})} style={INP}>
          <option value="">-- Tür seçin --</option>
          {species.map(s=><option key={s.id} value={s.id}>{s.accepted_name}</option>)}
        </select>
      </div>
      <Sel label="Program tipi" val={progF.program_type} set={v=>setProgF({...progF,program_type:v})} opts={["Conservation & Propagation","Conservation Rescue","Propagation Program","Metabolite Discovery","Premium Ornamental","Functional Ingredient","Venture Formation"]} />
      <Sel label="Modül" val={progF.current_module} set={v=>setProgF({...progF,current_module:v})} opts={["Origin","Forge","Mesh","Exchange","Accord"]} />
      <Sel label="Gate"  val={progF.current_gate}   set={v=>setProgF({...progF,current_gate:v})}   opts={["Selection","Validation","Protocol","Deployment","Venture","Governance"]} />
      <Txt label="Sorumlu" val={progF.owner_name} set={v=>setProgF({...progF,owner_name:v})} />
      <Ta  label="Neden bu program?" val={progF.why_this_program} set={v=>setProgF({...progF,why_this_program:v})} />
      <Txt label="Sonraki aksiyon" val={progF.next_action} set={v=>setProgF({...progF,next_action:v})} />
      <Btn label="Program Oluştur" onClick={handleProgram} disabled={!progF.program_name} />
    </>}

    {activeForm === "story" && <>
      <div style={{ marginBottom:12 }}>
        <label style={LBL}>Program *</label>
        <select value={storyF.program_id} onChange={e=>setStoryF({...storyF,program_id:e.target.value})} style={INP}>
          <option value="">-- Program seçin --</option>
          {programs.map(p=><option key={p.id} value={p.id}>{p.program_name}</option>)}
        </select>
      </div>
      <Sel label="Entry tipi" val={storyF.entry_type} set={v=>setStoryF({...storyF,entry_type:v})} opts={["Evidence Added","Gate Passed","Risk Raised","Protocol Updated","Governance Review Opened","Community Signal Added","Decision Made","Milestone Reached"]} />
      <Txt label="Başlık *" val={storyF.title}   set={v=>setStoryF({...storyF,title:v})} />
      <Ta  label="Özet"    val={storyF.summary} set={v=>setStoryF({...storyF,summary:v})} />
      <Txt label="Yazan"   val={storyF.author}  set={v=>setStoryF({...storyF,author:v})} />
      <Btn label="Story Entry Ekle" onClick={handleStory} disabled={!storyF.program_id||!storyF.title} />
    </>}

    {activeForm === "action" && <>
      <div style={{ marginBottom:12 }}>
        <label style={LBL}>Program *</label>
        <select value={actionF.program_id} onChange={e=>setActionF({...actionF,program_id:e.target.value})} style={INP}>
          <option value="">-- Program seçin --</option>
          {programs.map(p=><option key={p.id} value={p.id}>{p.program_name}</option>)}
        </select>
      </div>
      <Txt label="Aksiyon başlığı *" val={actionF.action_title}       set={v=>setActionF({...actionF,action_title:v})} />
      <Ta  label="Açıklama"          val={actionF.action_description} set={v=>setActionF({...actionF,action_description:v})} />
      <Txt label="Sorumlu"           val={actionF.action_owner}       set={v=>setActionF({...actionF,action_owner:v})} />
      <Sel label="Öncelik"           val={actionF.priority}           set={v=>setActionF({...actionF,priority:v})} opts={["low","medium","high"]} />
      <Btn label="Aksiyon Ekle" onClick={handleAction} disabled={!actionF.program_id||!actionF.action_title} />
    </>}

    {activeForm === "decision" && <>
      <div style={{ marginBottom:12 }}>
        <label style={LBL}>Program *</label>
        <select value={decisionF.program_id} onChange={e=>setDecisionF({...decisionF,program_id:e.target.value})} style={INP}>
          <option value="">-- Program seçin --</option>
          {programs.map(p=><option key={p.id} value={p.id}>{p.program_name}</option>)}
        </select>
      </div>
      <Txt label="Karar başlığı *" val={decisionF.decision_title} set={v=>setDecisionF({...decisionF,decision_title:v})} />
      <Sel label="Karar tipi"      val={decisionF.decision_type}  set={v=>setDecisionF({...decisionF,decision_type:v})} opts={["Gate Decision","Program Launch","Risk Escalation","Module Transition","Governance Review","Strategic Pivot"]} />
      <Ta  label="Gerekçe"         val={decisionF.rationale}      set={v=>setDecisionF({...decisionF,rationale:v})} />
      <Txt label="Karar veren"     val={decisionF.made_by}        set={v=>setDecisionF({...decisionF,made_by:v})} />
      <Btn label="Karar Kaydet" onClick={handleDecision} disabled={!decisionF.program_id||!decisionF.decision_title} />
    </>}

    {activeForm === "newspecies" && <>
      <Txt label="Kabul edilen isim *" val={spF.accepted_name} set={v=>setSpF({...spF,accepted_name:v})} />
      <Txt label="Genus"               val={spF.genus}         set={v=>setSpF({...spF,genus:v})} />
      <Txt label="Familya"             val={spF.family}        set={v=>setSpF({...spF,family:v})} />
      <Sel label="Geofit tipi"         val={spF.geophyte_type} set={v=>setSpF({...spF,geophyte_type:v})} opts={["Bulbous","Cormous","Rhizomatous","Tuberous","Other"]} />
      <Sel label="Ülke"                val={spF.country_focus} set={v=>setSpF({...spF,country_focus:v})} opts={["TR","CL","OTHER"]} />
      <Sel label="IUCN"                val={spF.iucn_status}   set={v=>setSpF({...spF,iucn_status:v})} opts={["","CR","EN","VU","NT","LC","DD","NE"]} />
      <Txt label="Yaygın isim"         val={spF.common_name}   set={v=>setSpF({...spF,common_name:v})} />
      <Sel label="Karar"               val={spF.decision}      set={v=>setSpF({...spF,decision:v})} opts={["Monitor","Develop","Scale","Accelerate","Rescue Now","Data Needed"]} />
      <div style={{ marginBottom:12, display:"flex", alignItems:"center", gap:8 }}>
        <input type="checkbox" checked={spF.endemicity_flag} onChange={e=>setSpF({...spF,endemicity_flag:e.target.checked})} id="endemic" />
        <label htmlFor="endemic" style={{ fontSize:12, color:"#2c2c2a" }}>Endemik tür</label>
      </div>
      <Btn label="Tür Ekle" onClick={handleNewSpecies} disabled={!spF.accepted_name} />
    </>}

    {activeForm === "metabolite" && <>
      <Txt label="Bileşik adı *"      val={metF.compound_name}    set={v=>setMetF({...metF,compound_name:v})} />
      <Sel label="Aktivite kategorisi" val={metF.activity_category} set={v=>setMetF({...metF,activity_category:v})} opts={["alkaloid","flavonoid","terpenoid","phenolic","saponin","glycoside","steroid","amino acid","other"]} />
      <Ta  label="Bildirilen aktivite" val={metF.reported_activity} set={v=>setMetF({...metF,reported_activity:v})} />
      <Btn label="Metabolit Ekle" onClick={() => saveSpeciesData("metabolites", metF, ()=>setMetF({compound_name:"",compound_class:"",reported_activity:"",activity_category:"other",evidence:"Early research",confidence:0.8,notes:""}))} disabled={!metF.compound_name} />
    </>}

    {activeForm === "propagation" && <>
      <Sel label="Protokol tipi" val={propF.protocol_type}       set={v=>setPropF({...propF,protocol_type:v})} opts={["micropropagation","shoot tip culture","embryo rescue","callus culture","bulblet induction"]} />
      <Txt label="Explant"       val={propF.explant}             set={v=>setPropF({...propF,explant:v})} />
      <Txt label="Ortam"         val={propF.medium_or_condition} set={v=>setPropF({...propF,medium_or_condition:v})} />
      <Ta  label="Notlar"        val={propF.notes}               set={v=>setPropF({...propF,notes:v})} />
      <Btn label="Protokol Ekle" onClick={() => saveSpeciesData("propagation", propF, ()=>setPropF({protocol_type:"micropropagation",explant:"",medium_or_condition:"",success_rate:"",ex_situ_fit:"under_review",notes:""}))} disabled={false} />
    </>}

    {activeForm === "conservation" && <>
      <Sel label="Kaynak"           val={consF.source}             set={v=>setConsF({...consF,source:v})}             opts={["BGCI ThreatSearch","IUCN Red List","Regional Assessment","Expert Opinion"]} />
      <Sel label="Yorumlanan statü" val={consF.status_interpreted} set={v=>setConsF({...consF,status_interpreted:v})} opts={["Critically Endangered","Endangered","Vulnerable","Near Threatened","Least Concern","Data Deficient"]} />
      <Ta  label="Notlar"           val={consF.notes}              set={v=>setConsF({...consF,notes:v})} />
      <Btn label="Kayıt Ekle" onClick={() => saveSpeciesData("conservation", consF, ()=>setConsF({source:"BGCI ThreatSearch",status_original:"",status_interpreted:"",scope:"Regional",assessment_year:new Date().getFullYear(),trend:"Unknown",notes:""}))} disabled={false} />
    </>}

    {activeForm === "commercial" && <>
      <Txt label="Uygulama alanı *" val={commF.application_area} set={v=>setCommF({...commF,application_area:v})} />
      <Sel label="Venture uyumu"    val={commF.venture_fit}      set={v=>setCommF({...commF,venture_fit:v})} opts={["candidate","developing","validated","ready"]} />
      <Ta  label="Gerekçe"          val={commF.justification}    set={v=>setCommF({...commF,justification:v})} />
      <Btn label="Hipotez Ekle" onClick={() => saveSpeciesData("commercial", commF, ()=>setCommF({application_area:"",market_type:"",venture_fit:"candidate",justification:"",status:"monitor",notes:""}))} disabled={!commF.application_area} />
    </>}

  </div>
</div>
```

);
}
