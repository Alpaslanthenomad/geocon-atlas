"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

/* ── Admin Approval Panel ──
   Yalnızca admin'ler görür. Pending profile'ları listeler, approve/reject yapar.
   Approve = profiles.researcher_id'yi claim_request_for_researcher_id'den kopyala + status='approved'
*/
export default function AdminApprovalPanel({ user, onClose }) {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actBusy, setActBusy] = useState(null);
  const [msg, setMsg] = useState(null);
  const [filter, setFilter] = useState("pending");

  const refresh = async () => {
    setLoading(true);
    let q = supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("approval_status", filter);
    const { data, error } = await q;
    if (error) {
      setMsg({ ok: false, text: error.message });
      setLoading(false);
      return;
    }

    const rIds = [...new Set((data || []).map(p => p.claim_request_for_researcher_id || p.researcher_id).filter(Boolean))];
    let rMap = new Map();
    if (rIds.length > 0) {
      const { data: rs } = await supabase.from("researchers").select("id,name,institution,country,publications_count,h_index,member_status").in("id", rIds);
      for (const r of (rs || [])) rMap.set(r.id, r);
    }
    const enriched = (data || []).map(p => ({
      ...p,
      claim_researcher: p.claim_request_for_researcher_id ? rMap.get(p.claim_request_for_researcher_id) : null,
      linked_researcher: p.researcher_id ? rMap.get(p.researcher_id) : null,
    }));
    setPending(enriched);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, [filter]);

  const approve = async (p) => {
    setActBusy(p.id);
    setMsg(null);
    try {
      const updates = {
        approval_status: "approved",
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      };
      if (p.claim_request_for_researcher_id && !p.researcher_id) {
        updates.researcher_id = p.claim_request_for_researcher_id;
      }
      const { error } = await supabase.from("profiles").update(updates).eq("id", p.id);
      if (error) throw error;

      if (p.claim_request_for_researcher_id) {
        await supabase.from("researchers").update({ member_status: "active_member" }).eq("id", p.claim_request_for_researcher_id);
      }

      setMsg({ ok: true, text: `Approved: ${p.full_name || p.email}` });
      refresh();
    } catch (e) {
      setMsg({ ok: false, text: e.message });
    }
    setActBusy(null);
  };

  const reject = async (p) => {
    if (!confirm(`Reject ${p.full_name || p.email}?`)) return;
    setActBusy(p.id);
    setMsg(null);
    try {
      const note = prompt("Reason for rejection (optional):");
      const { error } = await supabase.from("profiles").update({
        approval_status: "rejected",
        approval_note: note || null,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      }).eq("id", p.id);
      if (error) throw error;
      setMsg({ ok: true, text: `Rejected: ${p.full_name || p.email}` });
      refresh();
    } catch (e) {
      setMsg({ ok: false, text: e.message });
    }
    setActBusy(null);
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 100 }} />
      <div style={{ position: "fixed", top: 0, right: 0, height: "100vh", width: 720, maxWidth: "96vw", background: "#fff", boxShadow: "-8px 0 24px rgba(0,0,0,0.10)", zIndex: 101, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e8e6e1", display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(135deg, #3C3489 0%, #534AB7 100%)", color: "#fff" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "Georgia, serif" }}>Admin · User approvals</div>
            <div style={{ fontSize: 10, opacity: 0.85, marginTop: 2 }}>Review pending researchers and claim requests</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 18, color: "#fff", cursor: "pointer" }}>×</button>
        </div>

        <div style={{ padding: "10px 20px", borderBottom: "1px solid #e8e6e1", display: "flex", gap: 6 }}>
          {[{ k: "pending", l: "Pending", c: "#854F0B" }, { k: "approved", l: "Approved", c: "#085041" }, { k: "rejected", l: "Rejected", c: "#A32D2D" }, { k: "all", l: "All", c: "#5f5e5a" }].map(f => (
            <button key={f.k} onClick={() => setFilter(f.k)} style={{
              padding: "5px 12px", border: "1px solid " + (filter === f.k ? f.c : "#e8e6e1"),
              background: filter === f.k ? f.c : "#fff", color: filter === f.k ? "#fff" : f.c,
              borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: "pointer",
            }}>{f.l}</button>
          ))}
        </div>

        <div style={{ padding: "16px 20px", overflowY: "auto", flex: 1 }}>
          {loading && <div style={{ textAlign: "center", padding: 30, color: "#888" }}>Loading…</div>}
          {!loading && pending.length === 0 && (
            <div style={{ textAlign: "center", padding: 40, color: "#888", background: "#f4f3ef", borderRadius: 10, fontSize: 12 }}>
              No {filter === "all" ? "" : filter} profiles.
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {pending.map(p => {
              const r = p.claim_researcher || p.linked_researcher;
              return (
                <div key={p.id} style={{ padding: "12px 14px", background: "#fff", border: "1px solid #e8e6e1", borderRadius: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#2c2c2a" }}>
                        {p.full_name || "(no name)"}
                      </div>
                      <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>
                        {p.email} · signed up {p.created_at?.slice(0, 10)}
                      </div>
                      <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 99, background: "#EEEDFE", color: "#3C3489", fontWeight: 700 }}>
                          {p.signup_intent || "no intent"}
                        </span>
                        <span style={{
                          fontSize: 9, padding: "1px 6px", borderRadius: 99, fontWeight: 700,
                          background: p.approval_status === "approved" ? "#E1F5EE" : p.approval_status === "pending" ? "#FAEEDA" : "#FCEBEB",
                          color: p.approval_status === "approved" ? "#085041" : p.approval_status === "pending" ? "#854F0B" : "#A32D2D",
                        }}>{p.approval_status?.toUpperCase()}</span>
                        {p.role !== "researcher" && (
                          <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 99, background: "#3C3489", color: "#fff", fontWeight: 700 }}>{p.role?.toUpperCase()}</span>
                        )}
                      </div>

                      {r && (
                        <div style={{ marginTop: 8, padding: "8px 10px", background: "#fcfbf9", borderRadius: 6, borderLeft: "2px solid #534AB7" }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "#2c2c2a" }}>
                            {p.linked_researcher ? "Linked: " : "Requesting: "} {r.name}
                          </div>
                          <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>
                            {r.institution || "—"} · {r.country || "—"}
                            {r.publications_count != null && ` · 📄 ${r.publications_count} pubs`}
                            {r.h_index && ` · h-index ${r.h_index}`}
                          </div>
                        </div>
                      )}

                      {p.claim_evidence && (
                        <div style={{ marginTop: 6, fontSize: 10, color: "#5f5e5a", padding: "6px 8px", background: "#f4f3ef", borderRadius: 5, lineHeight: 1.5 }}>
                          <strong>Evidence:</strong> {p.claim_evidence}
                        </div>
                      )}
                      {p.approval_note && (
                        <div style={{ marginTop: 6, fontSize: 10, color: "#A32D2D", padding: "6px 8px", background: "#FCEBEB", borderRadius: 5 }}>
                          <strong>Note:</strong> {p.approval_note}
                        </div>
                      )}
                    </div>

                    {p.approval_status === "pending" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 5, flexShrink: 0 }}>
                        <button onClick={() => approve(p)} disabled={actBusy === p.id} style={{ padding: "5px 12px", background: actBusy === p.id ? "#ccc" : "#1D9E75", color: "#fff", border: "none", borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: actBusy === p.id ? "default" : "pointer", whiteSpace: "nowrap" }}>
                          ✓ Approve
                        </button>
                        <button onClick={() => reject(p)} disabled={actBusy === p.id} style={{ padding: "5px 12px", background: "#fff", color: "#A32D2D", border: "1px solid #A32D2D", borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: actBusy === p.id ? "default" : "pointer", whiteSpace: "nowrap" }}>
                          ✗ Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {msg && (
            <div style={{ position: "sticky", bottom: 10, marginTop: 12, padding: "8px 10px", borderRadius: 6, fontSize: 11, background: msg.ok ? "#E1F5EE" : "#FCEBEB", color: msg.ok ? "#085041" : "#A32D2D" }}>
              {msg.text}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
