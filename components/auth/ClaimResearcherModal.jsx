"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";

/* ── Claim Researcher Modal ──
   Login sonrası, profile.researcher_id boşsa açılır.
   3 yol:
   1. "Find me in the database" — researchers tablosunda fuzzy ad arama, claim et
   2. "I'm new" — yeni researcher kaydı oluştur (member_status='pending_approval')
   3. "Skip for now" — observer olarak devam et (signup_intent='observer')
*/
export default function ClaimResearcherModal({ user, onClose, onSubmitted }) {
  const [step, setStep] = useState("choose");
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [hits, setHits] = useState([]);
  const [evidence, setEvidence] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const [newR, setNewR] = useState({ name: "", institution: "", country: "", expertise_area: "", orcid: "", website: "" });

  const doSearch = async () => {
    if (search.trim().length < 3) return;
    setSearching(true);
    setMsg(null);
    try {
      const { data, error } = await supabase
        .from("researchers")
        .select("id,name,institution,country,expertise_area,orcid,h_index,publications_count")
        .ilike("name", `%${search.trim()}%`)
        .order("publications_count", { ascending: false, nullsFirst: false })
        .limit(15);
      if (error) setMsg({ ok: false, text: error.message });
      else setHits(data || []);
    } catch (e) {
      setMsg({ ok: false, text: e.message });
    }
    setSearching(false);
  };

  const claimExisting = async (researcher) => {
    setBusy(true);
    setMsg(null);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          claim_request_for_researcher_id: researcher.id,
          claim_evidence: evidence.trim() || null,
          signup_intent: "claim_existing",
        })
        .eq("id", user.id);
      if (error) throw error;
      setMsg({ ok: true, text: `Claim submitted for "${researcher.name}". An admin will review your request.` });
      setTimeout(() => { onSubmitted && onSubmitted(); onClose && onClose(); }, 1800);
    } catch (e) {
      setMsg({ ok: false, text: e.message });
    }
    setBusy(false);
  };

  const submitNewResearcher = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const newId = "R-USR-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
      const { error: insErr } = await supabase.from("researchers").insert({
        id: newId,
        name: newR.name.trim(),
        institution: newR.institution.trim() || null,
        country: newR.country.trim() || null,
        expertise_area: newR.expertise_area.trim() || null,
        orcid: newR.orcid.trim() || null,
        website: newR.website.trim() || null,
        member_status: "pending_approval",
        notes: `Self-registered via signup by ${user.email} on ${new Date().toISOString()}`,
      });
      if (insErr) throw insErr;
      const { error: updErr } = await supabase
        .from("profiles")
        .update({
          claim_request_for_researcher_id: newId,
          claim_evidence: evidence.trim() || null,
          signup_intent: "new_researcher",
        })
        .eq("id", user.id);
      if (updErr) throw updErr;
      setMsg({ ok: true, text: "New researcher entry submitted. An admin will review your request." });
      setTimeout(() => { onSubmitted && onSubmitted(); onClose && onClose(); }, 1800);
    } catch (e) {
      setMsg({ ok: false, text: e.message });
    }
    setBusy(false);
  };

  const skipForNow = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ signup_intent: "observer" })
        .eq("id", user.id);
      if (error) throw error;
      setMsg({ ok: true, text: "Continuing as observer. You can claim a researcher profile later." });
      setTimeout(() => { onSubmitted && onSubmitted(); onClose && onClose(); }, 1200);
    } catch (e) {
      setMsg({ ok: false, text: e.message });
    }
    setBusy(false);
  };

  const inp = { padding: "8px 10px", border: "1px solid #e8e6e1", borderRadius: 6, fontSize: 12, background: "#fff", outline: "none", color: "#2c2c2a", width: "100%" };
  const lbl = { fontSize: 10, color: "#888", marginBottom: 3, display: "block", textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 };

  return (
    <>
      <div onClick={busy ? null : onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        width: 560, maxWidth: "94vw", maxHeight: "90vh", background: "#fff", borderRadius: 14,
        boxShadow: "0 12px 40px rgba(0,0,0,0.18)", zIndex: 201, overflow: "hidden",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{ background: "linear-gradient(135deg, #534AB7 0%, #3C3489 100%)", padding: "18px 22px", color: "#fff" }}>
          <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "Georgia, serif" }}>Connect your researcher profile</div>
          <div style={{ fontSize: 11, opacity: 0.9, marginTop: 4, lineHeight: 1.5 }}>
            GEOCON tracks 3,266 researchers from publications and institutional records. Are you one of them, or new to our database?
          </div>
        </div>

        <div style={{ padding: "18px 22px", overflowY: "auto", flex: 1 }}>
          {step === "choose" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button onClick={() => setStep("search")} style={{ padding: "14px 16px", textAlign: "left", border: "1px solid #e8e6e1", borderRadius: 10, background: "#fff", cursor: "pointer" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#2c2c2a" }}>🔍 Find me in the database</div>
                <div style={{ fontSize: 11, color: "#888", marginTop: 4, lineHeight: 1.4 }}>
                  Search by your name. If your publications are indexed in GEOCON, your researcher record likely exists.
                </div>
              </button>
              <button onClick={() => setStep("new")} style={{ padding: "14px 16px", textAlign: "left", border: "1px solid #e8e6e1", borderRadius: 10, background: "#fff", cursor: "pointer" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#2c2c2a" }}>➕ I'm new — create my researcher entry</div>
                <div style={{ fontSize: 11, color: "#888", marginTop: 4, lineHeight: 1.4 }}>
                  You don't have publications indexed yet, or you're starting your geophyte research career.
                </div>
              </button>
              <button onClick={skipForNow} disabled={busy} style={{ padding: "14px 16px", textAlign: "left", border: "1px solid #e8e6e1", borderRadius: 10, background: "#f4f3ef", cursor: busy ? "default" : "pointer" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#5f5e5a" }}>👤 Skip for now</div>
                <div style={{ fontSize: 11, color: "#888", marginTop: 4, lineHeight: 1.4 }}>
                  Browse GEOCON as an observer. You can claim a profile later from your account settings.
                </div>
              </button>
            </div>
          )}

          {step === "search" && (
            <div>
              <button onClick={() => setStep("choose")} style={{ background: "none", border: "none", color: "#888", fontSize: 11, cursor: "pointer", marginBottom: 10 }}>← Back</button>
              <label style={lbl}>Search your name</label>
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && doSearch()} placeholder="e.g. Ada Lovelace, A. Lovelace, Lovelace A" style={{ ...inp, flex: 1 }} />
                <button onClick={doSearch} disabled={searching || search.trim().length < 3} style={{ padding: "8px 14px", background: searching ? "#ccc" : "#534AB7", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                  {searching ? "..." : "Search"}
                </button>
              </div>

              {hits.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 10, color: "#888", marginBottom: 6, fontWeight: 600 }}>{hits.length} potential matches</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {hits.map(r => (
                      <div key={r.id} style={{ padding: "10px 12px", border: "1px solid #e8e6e1", borderRadius: 8, background: "#fff" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#2c2c2a" }}>{r.name}</div>
                            <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>
                              {r.institution || "—"} {r.country && `· ${r.country}`}
                            </div>
                            <div style={{ display: "flex", gap: 6, marginTop: 4, fontSize: 10, color: "#5f5e5a", flexWrap: "wrap" }}>
                              {r.publications_count > 0 && <span>📄 {r.publications_count} pubs</span>}
                              {r.h_index && <span>h-index {r.h_index}</span>}
                              {r.orcid && <span style={{ fontFamily: "monospace" }}>ORCID</span>}
                            </div>
                          </div>
                          <button onClick={() => claimExisting(r)} disabled={busy} style={{ padding: "6px 12px", background: busy ? "#ccc" : "#534AB7", color: "#fff", border: "none", borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: busy ? "default" : "pointer", whiteSpace: "nowrap" }}>
                            This is me
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <label style={lbl}>Verification note <span style={{ color: "#999" }}>(optional, helps admin)</span></label>
                    <textarea value={evidence} onChange={e => setEvidence(e.target.value)} placeholder="ORCID, institution email, link to your publication page, etc." style={{ ...inp, minHeight: 50, fontFamily: "inherit", marginTop: 4 }} />
                  </div>
                </div>
              )}
              {hits.length === 0 && search && !searching && (
                <div style={{ padding: 14, fontSize: 12, color: "#888", textAlign: "center", background: "#f4f3ef", borderRadius: 8 }}>
                  No matches. Try a different spelling, or <button onClick={() => setStep("new")} style={{ background: "none", border: "none", color: "#534AB7", textDecoration: "underline", cursor: "pointer", padding: 0, fontSize: 12 }}>create a new entry</button>.
                </div>
              )}
            </div>
          )}

          {step === "new" && (
            <div>
              <button onClick={() => setStep("choose")} style={{ background: "none", border: "none", color: "#888", fontSize: 11, cursor: "pointer", marginBottom: 10 }}>← Back</button>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div>
                  <label style={lbl}>Full name *</label>
                  <input type="text" value={newR.name} onChange={e => setNewR({ ...newR, name: e.target.value })} style={inp} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div>
                    <label style={lbl}>Institution</label>
                    <input type="text" value={newR.institution} onChange={e => setNewR({ ...newR, institution: e.target.value })} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Country</label>
                    <input type="text" value={newR.country} onChange={e => setNewR({ ...newR, country: e.target.value })} style={inp} />
                  </div>
                </div>
                <div>
                  <label style={lbl}>Expertise area</label>
                  <input type="text" value={newR.expertise_area} onChange={e => setNewR({ ...newR, expertise_area: e.target.value })} placeholder="e.g. plant tissue culture, conservation genetics" style={inp} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div>
                    <label style={lbl}>ORCID</label>
                    <input type="text" value={newR.orcid} onChange={e => setNewR({ ...newR, orcid: e.target.value })} placeholder="0000-0002-..." style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Website</label>
                    <input type="text" value={newR.website} onChange={e => setNewR({ ...newR, website: e.target.value })} placeholder="https://..." style={inp} />
                  </div>
                </div>
                <div>
                  <label style={lbl}>Why GEOCON? <span style={{ color: "#999" }}>(optional)</span></label>
                  <textarea value={evidence} onChange={e => setEvidence(e.target.value)} placeholder="A short note about your interest in geophyte research." style={{ ...inp, minHeight: 50, fontFamily: "inherit" }} />
                </div>
                <button onClick={submitNewResearcher} disabled={busy || !newR.name.trim()} style={{ padding: "10px 14px", borderRadius: 7, border: "none", background: (busy || !newR.name.trim()) ? "#ccc" : "#534AB7", color: "#fff", fontSize: 13, fontWeight: 600, cursor: (busy || !newR.name.trim()) ? "default" : "pointer", marginTop: 4 }}>
                  {busy ? "..." : "Submit for review"}
                </button>
              </div>
            </div>
          )}

          {msg && (
            <div style={{ marginTop: 12, padding: "8px 10px", borderRadius: 6, fontSize: 11, background: msg.ok ? "#E1F5EE" : "#FCEBEB", color: msg.ok ? "#085041" : "#A32D2D" }}>
              {msg.text}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
