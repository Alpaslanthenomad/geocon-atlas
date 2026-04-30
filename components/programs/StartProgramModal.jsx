"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { iucnC, iucnBg } from "../../lib/helpers";

export default function StartProgramModal({ species, user, profile, researcher, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [step, setStep]       = useState(1);
  const [msg, setMsg]         = useState(null);
  const [form, setForm]       = useState({ why_now:"", first_action:"" });

  // Sorumlu = login olan researcher. Yoksa fallback "GEOCON".
  // Display string author/action_owner gibi metin alanlarına yazılır.
  const ownerDisplay = researcher?.name || profile?.full_name || "GEOCON";
  const createdById  = researcher?.id || null;

  const iucnUrgency = { CR:"critical",EN:"high",VU:"medium",NT:"low",LC:"low" }[species?.iucn_status]||"unknown";
  const urgencyColor = { critical:"#A32D2D",high:"#854F0B",medium:"#BA7517",low:"#0F6E56",unknown:"#888" }[iucnUrgency];
  const urgencyBg    = { critical:"#FCEBEB",high:"#FAEEDA",medium:"#FFF3CD",low:"#E1F5EE",unknown:"#f4f3ef" }[iucnUrgency];

  const inp = { padding:"9px 12px", border:"1px solid #e8e6e1", borderRadius:8, fontSize:12, background:"#fff", outline:"none", color:"#2c2c2a", width:"100%", lineHeight:1.6 };
  const lbl = { fontSize:10, color:"#888", marginBottom:4, display:"block", textTransform:"uppercase", letterSpacing:0.4 };

  async function generateAndSave() {
    if (!form.why_now.trim()) return;
    setLoading(true);
    setStep(2);
    try {
      const { data: progData, error: progErr } = await supabase.from("programs").insert({
        program_code:        `PROG-${Date.now()}`,
        program_name:        `${species.accepted_name} · GEOCON Program`,
        species_id:          species.id,
        program_type:        "Conservation & Propagation",
        status:              "Active",
        current_module:      "Origin",
        current_gate:        "Selection",
        created_by:          createdById,
        risk_level:          ["CR","EN"].includes(species?.iucn_status)?"high":["VU"].includes(species?.iucn_status)?"medium":"low",
        readiness_score:     0,
        confidence_score:    20,
        priority_score:      species?.composite_score || 0,
        why_this_program:    form.why_now,
        strategic_rationale: `GEOCON program initiated for ${species.accepted_name}. All programs begin at Origin/Selection and progress through evidence, propagation, community, and venture phases.`,
        next_action:         form.first_action || "Define baseline: collect available literature, assess ex situ feasibility, initiate GEOCON story.",
        what_is_missing:     "Program story not yet complete — generate via GEOCON story harvester.",
        recommended_pathway: "Origin → Forge → Mesh → Exchange → Accord",
      }).select().single();
      if (progErr) throw progErr;

      await supabase.from("program_story_entries").insert({
        program_id:    progData.id,
        entry_type:    "Gate Passed",
        title:         "Program initiated — entering Origin",
        summary:       `GEOCON program started for ${species.accepted_name}. Reason: ${form.why_now}. This species will now follow the full GEOCON journey: Origin → Forge → Mesh → Exchange → Accord. Story will be written transparently at every step.`,
        entry_date:    new Date().toISOString().split("T")[0],
        author:        ownerDisplay,
        linked_module: "Origin",
        linked_gate:   "Selection",
      });

      if (form.first_action) {
        await supabase.from("program_actions").insert({
          program_id:   progData.id,
          action_title: form.first_action,
          action_owner: ownerDisplay,
          status:       "open",
          priority:     "high",
        });
      }
      if (onSuccess) onSuccess();
    } catch (e) {
      setMsg(`Hata: ${e.message}`);
      setStep(1);
    } finally {
      setLoading(false);
    }
  }

  return <>
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:200 }} />
    <div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:520, background:"#fff", borderRadius:16, zIndex:201, boxShadow:"0 24px 64px rgba(0,0,0,0.22)", overflow:"hidden" }}>

      <div style={{ padding:"22px 24px 18px", background:"linear-gradient(135deg,#085041,#1D9E75)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.7)", textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>GEOCON · Yolculuğa başla</div>
            <div style={{ fontSize:20, fontWeight:700, fontStyle:"italic", color:"#fff", fontFamily:"Georgia,serif", lineHeight:1.2 }}>{species?.accepted_name}</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.7)", marginTop:4 }}>{species?.family} · {species?.geophyte_type}</div>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.15)", border:"none", borderRadius:8, width:30, height:30, cursor:"pointer", color:"#fff", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
        </div>
        <div style={{ display:"flex", gap:6, marginTop:12 }}>
          {species?.iucn_status && <span style={{ fontSize:10, padding:"3px 10px", borderRadius:99, background:urgencyBg, color:urgencyColor, fontWeight:600 }}>IUCN: {species.iucn_status}</span>}
          <span style={{ fontSize:10, padding:"3px 10px", borderRadius:99, background:"rgba(255,255,255,0.2)", color:"#fff" }}>Origin → Selection</span>
          <span style={{ fontSize:10, padding:"3px 10px", borderRadius:99, background:"rgba(255,255,255,0.2)", color:"#fff" }}>Conservation & Propagation</span>
        </div>
      </div>

      <div style={{ padding:"14px 24px", background:"#f8f7f4", borderBottom:"1px solid #e8e6e1" }}>
        <div style={{ fontSize:11, color:"#5f5e5a", lineHeight:1.7 }}>
          Her GEOCON programı <strong>Origin</strong>'den başlar ve <strong>Accord</strong>'a kadar ilerler. Koruma ve propagasyon birlikte yürür. Hikaye baştan sona şeffaf yazılır.
        </div>
      </div>

      {step === 1
        ? <div style={{ padding:24 }}>
            {msg && <div style={{ padding:"10px 14px", background:"#FCEBEB", color:"#A32D2D", borderRadius:8, fontSize:12, marginBottom:16 }}>{msg}</div>}
            <div style={{ marginBottom:16 }}>
              <label style={lbl}>Neden şimdi? *</label>
              <textarea value={form.why_now} onChange={e=>setForm({...form,why_now:e.target.value})} rows={4} style={{...inp,resize:"vertical"}} placeholder="Bu türü neden şimdi GEOCON programına alıyoruz? Ne tehdit altında, ne fırsat var, neden bekleyemeyiz?" autoFocus />
              <div style={{ fontSize:10, color:"#b4b2a9", marginTop:4 }}>Bu metin programın açılış hikayesi olacak.</div>
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={lbl}>İlk aksiyon nedir?</label>
              <input value={form.first_action} onChange={e=>setForm({...form,first_action:e.target.value})} style={inp} placeholder="Örn: Mevcut literatürü tara ve ex situ uygulanabilirlik değerlendir" />
            </div>
            <div style={{ marginBottom:24 }}>
              <label style={lbl}>Sorumlu</label>
              <div style={{ ...inp, background:"#f4f3ef", color:"#5f5e5a", display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ fontSize:14 }}>👤</span>
                <span style={{ fontSize:12, fontWeight:600 }}>{ownerDisplay}</span>
                <span style={{ fontSize:9, color:"#999", marginLeft:"auto", fontStyle:"italic" }}>
                  {createdById ? "auto from your profile" : "no profile linked"}
                </span>
              </div>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={onClose} style={{ flex:1, padding:"12px 0", border:"1px solid #e8e6e1", borderRadius:10, background:"#fff", color:"#888", fontSize:12, fontWeight:600, cursor:"pointer" }}>İptal</button>
              <button disabled={!form.why_now.trim()} onClick={generateAndSave} style={{ flex:2, padding:"12px 0", border:"none", borderRadius:10, background:!form.why_now.trim()?"#ccc":"#1D9E75", color:"#fff", fontSize:13, fontWeight:700, cursor:!form.why_now.trim()?"default":"pointer" }}>
                🌿 GEOCON Yolculuğunu Başlat
              </button>
            </div>
          </div>
        : <div style={{ padding:40, textAlign:"center" }}>
            <div style={{ fontSize:36, marginBottom:16 }}>🌿</div>
            <div style={{ fontSize:16, fontWeight:700, color:"#2c2c2a", fontFamily:"Georgia,serif", marginBottom:8 }}>Program başlatılıyor...</div>
            <div style={{ fontSize:12, color:"#888", lineHeight:1.7 }}>Program oluşturuluyor<br/>Açılış hikayesi yazılıyor<br/>İlk aksiyon kaydediliyor</div>
            <div style={{ marginTop:20, height:4, background:"#e8e6e1", borderRadius:2, overflow:"hidden" }}>
              <div style={{ height:"100%", width:"70%", background:"#1D9E75", borderRadius:2 }} />
            </div>
          </div>
      }
    </div>
  </>;
}
