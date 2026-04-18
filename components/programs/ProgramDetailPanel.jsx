"use client";
import { useState, useEffect } from "react";
import { MODULE_COLORS, STATUS_COLORS, S } from "../../lib/constants";
import {
  fetchProgramStory,
  fetchProgramActions,
  fetchProgramDecisions,
  updateProgram,
  updateActionStatus,
  advanceGate,
  createProgramStoryEntry,
  createProgramAction,
  createProgramDecision,
} from "../../lib/programs";

const TABS = ["overview","story","actions","decisions"];

export default function ProgramDetailPanel({ program, onClose, onUpdate }) {
  const [tab,       setTab]       = useState("overview");
  const [stories,   setStories]   = useState([]);
  const [actions,   setActions]   = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [advancing, setAdvancing] = useState(false);

  // Quick-add forms
  const [showStoryForm,    setShowStoryForm]    = useState(false);
  const [showActionForm,   setShowActionForm]   = useState(false);
  const [showDecisionForm, setShowDecisionForm] = useState(false);

  const modColor = MODULE_COLORS[program?.current_module] || "#888";

  useEffect(() => {
    if (!program) return;
    setLoading(true);
    setTab("overview");
    Promise.all([
      fetchProgramStory(program.id),
      fetchProgramActions(program.id),
      fetchProgramDecisions(program.id),
    ]).then(([s, a, d]) => {
      setStories(s);
      setActions(a);
      setDecisions(d);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [program?.id]);

  async function handleAdvanceGate() {
    if (!program) return;
    setAdvancing(true);
    try {
      const updated = await advanceGate(program);
      const newStories = await fetchProgramStory(program.id);
      setStories(newStories);
      if (onUpdate) onUpdate(updated);
    } catch (e) {
      alert(`Hata: ${e.message}`);
    } finally {
      setAdvancing(false);
    }
  }

  async function handleActionStatusChange(actionId, newStatus) {
    await updateActionStatus(actionId, newStatus);
    setActions(prev => prev.map(a => a.id === actionId ? { ...a, status: newStatus } : a));
  }

  if (!program) return null;

  return <>
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.3)", zIndex:100 }} />
    <div style={{ position:"fixed", top:0, right:0, bottom:0, width:580, background:"#fff", zIndex:101, display:"flex", flexDirection:"column", boxShadow:"-4px 0 32px rgba(0,0,0,0.14)" }}>

      {/* ── Header ── */}
      <div style={{ padding:"20px 22px 16px", borderBottom:"1px solid #e8e6e1", background:"#f8f7f4", flexShrink:0 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:9, color:"#888", textTransform:"uppercase", letterSpacing:0.8, marginBottom:4 }}>{program.program_type}</div>
            <div style={{ fontSize:18, fontWeight:700, color:"#2c2c2a", lineHeight:1.3, fontFamily:"Georgia,serif" }}>{program.program_name}</div>
            {program.species && <div style={{ fontSize:12, fontStyle:"italic", color:"#888", marginTop:3 }}>{program.species.accepted_name}</div>}
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:"#888", padding:"0 0 0 12px" }}>✕</button>
        </div>

        {/* Status badges */}
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:12 }}>
          <span style={{ fontSize:10, padding:"3px 10px", borderRadius:99, background:modColor+"15", color:modColor, fontWeight:600 }}>{program.current_module}</span>
          <span style={{ fontSize:10, padding:"3px 10px", borderRadius:99, background:"#f4f3ef", color:"#5f5e5a" }}>{program.current_gate}</span>
          <span style={{ fontSize:10, padding:"3px 10px", borderRadius:99, background:(STATUS_COLORS[program.status]||"#888")+"22", color:STATUS_COLORS[program.status]||"#888", fontWeight:600 }}>{program.status}</span>
          {program.risk_level && <span style={{ fontSize:10, padding:"3px 10px", borderRadius:99, background:program.risk_level==="high"?"#FCEBEB":program.risk_level==="medium"?"#FAEEDA":"#E1F5EE", color:program.risk_level==="high"?"#A32D2D":program.risk_level==="medium"?"#633806":"#085041" }}>{program.risk_level} risk</span>}
        </div>

        {/* Scores */}
        {(program.readiness_score || program.confidence_score || program.priority_score) ? (
          <div style={{ display:"flex", gap:6, marginTop:12 }}>
            {[{l:"Readiness",v:program.readiness_score,c:"#1D9E75"},{l:"Confidence",v:program.confidence_score,c:"#185FA5"},{l:"Priority",v:program.priority_score,c:"#D85A30"}].map(m => m.v ? (
              <div key={m.l} style={{ flex:1, background:"#fff", border:"1px solid #e8e6e1", borderRadius:8, padding:"6px 8px", textAlign:"center" }}>
                <div style={{ fontSize:8, color:"#999", textTransform:"uppercase", marginBottom:2 }}>{m.l}</div>
                <div style={{ fontSize:16, fontWeight:700, color:m.c }}>{m.v}</div>
              </div>
            ) : null)}
          </div>
        ) : null}

        {/* Advance gate button */}
        <button onClick={handleAdvanceGate} disabled={advancing} style={{ marginTop:12, width:"100%", padding:"9px 0", border:"none", borderRadius:9, background:advancing?"#ccc":`linear-gradient(90deg,${modColor},${modColor}cc)`, color:"#fff", fontSize:11, fontWeight:700, cursor:advancing?"default":"pointer" }}>
          {advancing ? "İlerleniyor..." : `→ Next gate: ${getNextGate(program)}`}
        </button>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display:"flex", borderBottom:"1px solid #e8e6e1", flexShrink:0, overflowX:"auto" }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flexShrink:0, padding:"10px 16px", border:"none", borderBottom:tab===t?"2px solid #1D9E75":"2px solid transparent", background:"none", cursor:"pointer", fontSize:11, fontWeight:tab===t?600:400, color:tab===t?"#1D9E75":"#888", textTransform:"capitalize" }}>
            {t}
            {t==="story"    && stories.length   > 0 && <span style={{ marginLeft:4, fontSize:9, padding:"1px 5px", borderRadius:99, background:"#EEEDFE", color:"#534AB7" }}>{stories.length}</span>}
            {t==="actions"  && actions.length   > 0 && <span style={{ marginLeft:4, fontSize:9, padding:"1px 5px", borderRadius:99, background:"#E1F5EE", color:"#085041" }}>{actions.filter(a=>!["completed","Completed"].includes(a.status)).length}</span>}
            {t==="decisions"&& decisions.length > 0 && <span style={{ marginLeft:4, fontSize:9, padding:"1px 5px", borderRadius:99, background:"#FAEEDA", color:"#633806" }}>{decisions.length}</span>}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div style={{ flex:1, overflowY:"auto", padding:"16px 20px" }}>
        {loading ? <div style={{ textAlign:"center", padding:40, color:"#999" }}>Loading...</div> : <>

          {/* OVERVIEW */}
          {tab === "overview" && (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {program.why_this_program
                ? <InfoBlock color="#1D9E75" label="Why this program" text={program.why_this_program} />
                : <EmptyField label="Why this program" hint="Add via Admin → Program güncelle" />
              }
              {program.strategic_rationale && <InfoBlock color="#185FA5" label="Strategic rationale" text={program.strategic_rationale} />}
              {program.next_action
                ? <div style={{ padding:"12px 14px", background:"#E1F5EE", borderRadius:8 }}>
                    <div style={{ fontSize:9, color:"#085041", textTransform:"uppercase", marginBottom:4 }}>Next action</div>
                    <div style={{ fontSize:12, color:"#085041", fontWeight:600 }}>{program.next_action}</div>
                    {program.next_action_due && <div style={{ fontSize:10, color:"#0F6E56", marginTop:4 }}>Due: {program.next_action_due}</div>}
                  </div>
                : <EmptyField label="Next action" hint="Define the first step for this program" />
              }
              {program.primary_blocker && (
                <div style={{ padding:"12px 14px", background:"#FCEBEB", borderRadius:8 }}>
                  <div style={{ fontSize:9, color:"#A32D2D", textTransform:"uppercase", marginBottom:4 }}>Primary blocker</div>
                  <div style={{ fontSize:12, color:"#A32D2D" }}>{program.primary_blocker}</div>
                </div>
              )}
              {program.what_is_missing && <InfoBlock color="#BA7517" label="What is missing" text={program.what_is_missing} bg="#FAEEDA" />}
              {program.recommended_pathway && (
                <div style={{ padding:"10px 14px", background:"#f8f7f4", borderRadius:8, fontSize:11, color:"#5f5e5a" }}>
                  <span style={{ fontSize:9, color:"#b4b2a9", textTransform:"uppercase", marginRight:8 }}>Pathway</span>
                  {program.recommended_pathway}
                </div>
              )}

              {/* GEOCON journey visualization */}
              <div style={{ marginTop:8 }}>
                <div style={{ fontSize:9, color:"#b4b2a9", textTransform:"uppercase", marginBottom:8 }}>GEOCON journey</div>
                <div style={{ display:"flex", gap:4 }}>
                  {["Origin","Forge","Mesh","Exchange","Accord"].map((m,i) => {
                    const mods = ["Origin","Forge","Mesh","Exchange","Accord"];
                    const curIdx = mods.indexOf(program.current_module);
                    const isCurrent = m === program.current_module;
                    const isPast    = i < curIdx;
                    return (
                      <div key={m} style={{ flex:1, textAlign:"center", padding:"6px 4px", borderRadius:6, background:isCurrent?(MODULE_COLORS[m]||"#888"):isPast?"#f4f3ef":"#fafafa", border:`1px solid ${isCurrent?(MODULE_COLORS[m]||"#888"):isPast?"#e8e6e1":"#f0eee8"}` }}>
                        <div style={{ fontSize:9, fontWeight:700, color:isCurrent?"#fff":isPast?"#b4b2a9":"#d0cec8" }}>{m}</div>
                        {isCurrent && <div style={{ fontSize:8, color:"rgba(255,255,255,0.8)", marginTop:2 }}>{program.current_gate}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STORY */}
          {tab === "story" && (
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <div style={{ fontSize:13, fontWeight:600, color:"#2c2c2a" }}>Program story</div>
                <button onClick={() => setShowStoryForm(!showStoryForm)} style={{ padding:"5px 12px", border:"1px solid #534AB7", borderRadius:7, background:showStoryForm?"#534AB7":"#fff", color:showStoryForm?"#fff":"#534AB7", fontSize:11, fontWeight:600, cursor:"pointer" }}>
                  {showStoryForm?"✕ İptal":"+ Entry ekle"}
                </button>
              </div>
              {showStoryForm && <QuickStoryForm programId={program.id} ownerName={program.owner_name} onSave={async entry => { const s = await fetchProgramStory(program.id); setStories(s); setShowStoryForm(false); }} />}
              {stories.length === 0
                ? <EmptyState icon="📖" title="No story entries yet" hint="Start documenting what's happening in this program." />
                : stories.map(s => <StoryCard key={s.id} entry={s} />)
              }
            </div>
          )}

          {/* ACTIONS */}
          {tab === "actions" && (
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <div style={{ fontSize:13, fontWeight:600, color:"#2c2c2a" }}>
                  Actions <span style={{ fontSize:11, color:"#888", fontWeight:400 }}>({actions.filter(a=>!["completed","Completed"].includes(a.status)).length} open)</span>
                </div>
                <button onClick={() => setShowActionForm(!showActionForm)} style={{ padding:"5px 12px", border:"1px solid #1D9E75", borderRadius:7, background:showActionForm?"#1D9E75":"#fff", color:showActionForm?"#fff":"#1D9E75", fontSize:11, fontWeight:600, cursor:"pointer" }}>
                  {showActionForm?"✕ İptal":"+ Aksiyon ekle"}
                </button>
              </div>
              {showActionForm && <QuickActionForm programId={program.id} ownerName={program.owner_name} onSave={async () => { const a = await fetchProgramActions(program.id); setActions(a); setShowActionForm(false); }} />}
              {actions.length === 0
                ? <EmptyState icon="✅" title="No actions yet" hint="Add the first action to get this program moving." />
                : actions.map(a => <ActionCard key={a.id} action={a} onStatusChange={handleActionStatusChange} />)
              }
            </div>
          )}

          {/* DECISIONS */}
          {tab === "decisions" && (
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <div style={{ fontSize:13, fontWeight:600, color:"#2c2c2a" }}>Decision log</div>
                <button onClick={() => setShowDecisionForm(!showDecisionForm)} style={{ padding:"5px 12px", border:"1px solid #D85A30", borderRadius:7, background:showDecisionForm?"#D85A30":"#fff", color:showDecisionForm?"#fff":"#D85A30", fontSize:11, fontWeight:600, cursor:"pointer" }}>
                  {showDecisionForm?"✕ İptal":"+ Karar kaydet"}
                </button>
              </div>
              {showDecisionForm && <QuickDecisionForm programId={program.id} ownerName={program.owner_name} onSave={async () => { const d = await fetchProgramDecisions(program.id); setDecisions(d); setShowDecisionForm(false); }} />}
              {decisions.length === 0
                ? <EmptyState icon="⚖️" title="No decisions recorded" hint="Document key decisions to build institutional memory." />
                : decisions.map(d => <DecisionCard key={d.id} decision={d} />)
              }
            </div>
          )}

        </>}
      </div>
    </div>
  </>;
}

/* ── Helper: next gate label ── */
function getNextGate(program) {
  const GATES = ["Selection","Validation","Protocol","Deployment","Venture","Governance"];
  const MODULES = ["Origin","Forge","Mesh","Exchange","Accord"];
  const gIdx = GATES.indexOf(program.current_gate);
  const mIdx = MODULES.indexOf(program.current_module);
  if (gIdx < GATES.length - 1) return `${GATES[gIdx+1]}`;
  if (mIdx < MODULES.length - 1) return `${MODULES[mIdx+1]}/Selection`;
  return "Complete";
}

/* ── Sub-components ── */
function InfoBlock({ color, label, text, bg }) {
  return (
    <div style={{ padding:"12px 14px", background:bg||"#f8f7f4", borderRadius:8, borderLeft:`3px solid ${color}` }}>
      <div style={{ fontSize:9, color:color, textTransform:"uppercase", letterSpacing:0.6, marginBottom:6, fontWeight:600 }}>{label}</div>
      <div style={{ fontSize:12, color:"#2c2c2a", lineHeight:1.7 }}>{text}</div>
    </div>
  );
}

function EmptyField({ label, hint }) {
  return (
    <div style={{ padding:"12px 14px", background:"#fafafa", borderRadius:8, border:"1px dashed #e8e6e1" }}>
      <div style={{ fontSize:9, color:"#b4b2a9", textTransform:"uppercase", marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:11, color:"#b4b2a9", fontStyle:"italic" }}>{hint}</div>
    </div>
  );
}

function EmptyState({ icon, title, hint }) {
  return (
    <div style={{ textAlign:"center", padding:"40px 20px", color:"#999" }}>
      <div style={{ fontSize:28, marginBottom:10 }}>{icon}</div>
      <div style={{ fontSize:14, fontWeight:600, color:"#2c2c2a", marginBottom:6 }}>{title}</div>
      <div style={{ fontSize:11, color:"#888", lineHeight:1.6 }}>{hint}</div>
    </div>
  );
}

function StoryCard({ entry }) {
  const typeColor = {
    "Evidence Added":"#185FA5","Gate Passed":"#0F6E56","Risk Raised":"#A32D2D",
    "Protocol Updated":"#639922","Decision Made":"#BA7517","Milestone Reached":"#1D9E75",
    "Governance Review Opened":"#D85A30","Community Signal Added":"#534AB7",
  }[entry.entry_type] || "#888";

  return (
    <div style={{ marginBottom:10, padding:"12px 14px", background:"#f8f7f4", borderRadius:8, borderLeft:`3px solid ${typeColor}` }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
        <span style={{ fontSize:12, fontWeight:600, color:"#2c2c2a" }}>{entry.title}</span>
        <span style={{ fontSize:9, color:"#888", flexShrink:0, marginLeft:8 }}>{entry.entry_date}</span>
      </div>
      <div style={{ display:"flex", gap:4, marginBottom:6, flexWrap:"wrap" }}>
        <span style={{ fontSize:9, padding:"1px 7px", borderRadius:99, background:typeColor+"18", color:typeColor, fontWeight:600 }}>{entry.entry_type}</span>
        {entry.linked_module && <span style={{ fontSize:9, padding:"1px 7px", borderRadius:99, background:"#f4f3ef", color:"#5f5e5a" }}>{entry.linked_module}</span>}
        {entry.linked_gate   && <span style={{ fontSize:9, padding:"1px 7px", borderRadius:99, background:"#f4f3ef", color:"#5f5e5a" }}>{entry.linked_gate}</span>}
      </div>
      {entry.summary && <div style={{ fontSize:11, color:"#5f5e5a", lineHeight:1.6 }}>{entry.summary}</div>}
      {entry.author  && <div style={{ fontSize:9, color:"#b4b2a9", marginTop:6 }}>— {entry.author}</div>}
    </div>
  );
}

function ActionCard({ action, onStatusChange }) {
  const isCompleted = ["completed","Completed"].includes(action.status);
  const isBlocked   = ["blocked","Blocked"].includes(action.status);
  const isHigh      = action.priority === "high";
  const borderColor = isCompleted?"#1D9E75":isBlocked?"#A32D2D":isHigh?"#BA7517":"#e8e6e1";

  return (
    <div style={{ marginBottom:8, padding:"12px 14px", background:"#f8f7f4", borderRadius:8, borderLeft:`3px solid ${borderColor}`, opacity:isCompleted?0.6:1 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:12, fontWeight:600, color:"#2c2c2a", textDecoration:isCompleted?"line-through":"none" }}>{action.action_title}</div>
          {action.action_description && <div style={{ fontSize:11, color:"#5f5e5a", marginTop:4 }}>{action.action_description}</div>}
          <div style={{ display:"flex", gap:8, fontSize:10, color:"#888", marginTop:4 }}>
            {action.action_owner && <span>👤 {action.action_owner}</span>}
            {action.due_date     && <span>📅 {action.due_date}</span>}
          </div>
        </div>
        <select value={action.status} onChange={e => onStatusChange(action.id, e.target.value)} style={{ fontSize:10, padding:"3px 6px", border:"1px solid #e8e6e1", borderRadius:6, background:"#fff", cursor:"pointer", flexShrink:0 }}>
          <option value="open">Open</option>
          <option value="in progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="blocked">Blocked</option>
          <option value="dropped">Dropped</option>
        </select>
      </div>
    </div>
  );
}

function DecisionCard({ decision }) {
  return (
    <div style={{ marginBottom:10, padding:"12px 14px", background:"#f8f7f4", borderRadius:8, borderLeft:"3px solid #D85A30" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
        <span style={{ fontSize:12, fontWeight:600, color:"#2c2c2a" }}>{decision.decision_title}</span>
        <span style={{ fontSize:9, color:"#888", flexShrink:0, marginLeft:8 }}>{decision.decision_date}</span>
      </div>
      {decision.decision_type && <span style={{ fontSize:9, padding:"1px 7px", borderRadius:99, background:"#FAECE7", color:"#712B13", display:"inline-block", marginBottom:6 }}>{decision.decision_type}</span>}
      {decision.rationale    && <div style={{ fontSize:11, color:"#5f5e5a", lineHeight:1.6, marginTop:4 }}>{decision.rationale}</div>}
      {decision.impact_summary && <div style={{ fontSize:10, color:"#888", marginTop:6, fontStyle:"italic" }}>Impact: {decision.impact_summary}</div>}
      {decision.made_by      && <div style={{ fontSize:9, color:"#b4b2a9", marginTop:4 }}>— {decision.made_by}</div>}
    </div>
  );
}

/* ── Quick inline forms ── */
const INP = { padding:"8px 10px", border:"1px solid #e8e6e1", borderRadius:6, fontSize:11, background:"#fff", outline:"none", color:"#2c2c2a", width:"100%" };
const LBL = { fontSize:9, color:"#888", marginBottom:3, display:"block", textTransform:"uppercase", letterSpacing:0.4 };

function QuickStoryForm({ programId, ownerName, onSave }) {
  const [form, setForm] = useState({ entry_type:"Evidence Added", title:"", summary:"", author: ownerName||"" });
  const [loading, setLoading] = useState(false);
  async function save() {
    if (!form.title) return;
    setLoading(true);
    try { await createProgramStoryEntry({ ...form, program_id: programId }); onSave(); }
    catch (e) { alert(e.message); }
    finally { setLoading(false); }
  }
  return (
    <div style={{ padding:14, background:"#EEEDFE", borderRadius:10, marginBottom:14 }}>
      <div style={{ marginBottom:10 }}>
        <label style={LBL}>Entry tipi</label>
        <select value={form.entry_type} onChange={e=>setForm({...form,entry_type:e.target.value})} style={INP}>
          {["Evidence Added","Gate Passed","Risk Raised","Protocol Updated","Governance Review Opened","Community Signal Added","Decision Made","Milestone Reached"].map(t=><option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div style={{ marginBottom:10 }}>
        <label style={LBL}>Başlık *</label>
        <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} style={INP} placeholder="Ne oldu?" />
      </div>
      <div style={{ marginBottom:10 }}>
        <label style={LBL}>Özet</label>
        <textarea value={form.summary} onChange={e=>setForm({...form,summary:e.target.value})} rows={3} style={{...INP,resize:"vertical"}} placeholder="Detaylar..." />
      </div>
      <button disabled={loading||!form.title} onClick={save} style={{ padding:"8px 18px", border:"none", borderRadius:7, background:loading||!form.title?"#ccc":"#534AB7", color:"#fff", fontSize:11, fontWeight:600, cursor:"pointer" }}>
        {loading?"Kaydediliyor...":"Kaydet"}
      </button>
    </div>
  );
}

function QuickActionForm({ programId, ownerName, onSave }) {
  const [form, setForm] = useState({ action_title:"", action_owner: ownerName||"", priority:"medium" });
  const [loading, setLoading] = useState(false);
  async function save() {
    if (!form.action_title) return;
    setLoading(true);
    try { await createProgramAction({ ...form, program_id: programId }); onSave(); }
    catch (e) { alert(e.message); }
    finally { setLoading(false); }
  }
  return (
    <div style={{ padding:14, background:"#E1F5EE", borderRadius:10, marginBottom:14 }}>
      <div style={{ marginBottom:10 }}>
        <label style={LBL}>Aksiyon *</label>
        <input value={form.action_title} onChange={e=>setForm({...form,action_title:e.target.value})} style={INP} placeholder="Ne yapılacak?" />
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
        <div><label style={LBL}>Sorumlu</label><input value={form.action_owner} onChange={e=>setForm({...form,action_owner:e.target.value})} style={INP} /></div>
        <div><label style={LBL}>Öncelik</label>
          <select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})} style={INP}>
            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
          </select>
        </div>
      </div>
      <button disabled={loading||!form.action_title} onClick={save} style={{ padding:"8px 18px", border:"none", borderRadius:7, background:loading||!form.action_title?"#ccc":"#1D9E75", color:"#fff", fontSize:11, fontWeight:600, cursor:"pointer" }}>
        {loading?"Kaydediliyor...":"Kaydet"}
      </button>
    </div>
  );
}

function QuickDecisionForm({ programId, ownerName, onSave }) {
  const [form, setForm] = useState({ decision_title:"", decision_type:"Gate Decision", rationale:"", made_by: ownerName||"" });
  const [loading, setLoading] = useState(false);
  async function save() {
    if (!form.decision_title) return;
    setLoading(true);
    try { await createProgramDecision({ ...form, program_id: programId }); onSave(); }
    catch (e) { alert(e.message); }
    finally { setLoading(false); }
  }
  return (
    <div style={{ padding:14, background:"#FAECE7", borderRadius:10, marginBottom:14 }}>
      <div style={{ marginBottom:10 }}>
        <label style={LBL}>Karar başlığı *</label>
        <input value={form.decision_title} onChange={e=>setForm({...form,decision_title:e.target.value})} style={INP} placeholder="Ne kararlaştırıldı?" />
      </div>
      <div style={{ marginBottom:10 }}>
        <label style={LBL}>Karar tipi</label>
        <select value={form.decision_type} onChange={e=>setForm({...form,decision_type:e.target.value})} style={INP}>
          {["Gate Decision","Program Launch","Risk Escalation","Module Transition","Governance Review","Strategic Pivot"].map(t=><option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div style={{ marginBottom:10 }}>
        <label style={LBL}>Gerekçe</label>
        <textarea value={form.rationale} onChange={e=>setForm({...form,rationale:e.target.value})} rows={3} style={{...INP,resize:"vertical"}} placeholder="Neden bu karar?" />
      </div>
      <button disabled={loading||!form.decision_title} onClick={save} style={{ padding:"8px 18px", border:"none", borderRadius:7, background:loading||!form.decision_title?"#ccc":"#D85A30", color:"#fff", fontSize:11, fontWeight:600, cursor:"pointer" }}>
        {loading?"Kaydediliyor...":"Kaydet"}
      </button>
    </div>
  );
}
