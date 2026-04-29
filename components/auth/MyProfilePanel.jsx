"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

/* ── My Profile Panel ──
   Kullanıcının kendi profil + linked researcher kaydını görür/düzenler.
   Sadece approved kullanıcılar researcher kaydını edit edebilir.
*/
export default function MyProfilePanel({ user, profile, researcher, onClose, onRefresh, onClaimClick }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [edit, setEdit] = useState(null);

  useEffect(() => {
    if (researcher) {
      setEdit({
        institution: researcher.institution || "",
        country: researcher.country || "",
        expertise_area: researcher.expertise_area || "",
        orcid: researcher.orcid || "",
        website: researcher.website || "",
      });
    } else {
      setEdit(null);
    }
  }, [researcher?.id]);

  const saveResearcher = async () => {
    if (!researcher || !edit) return;
    setBusy(true);
    setMsg(null);
    try {
      const { error } = await supabase
        .from("researchers")
        .update({
          institution: edit.institution.trim() || null,
          country: edit.country.trim() || null,
          expertise_area: edit.expertise_area.trim() || null,
          orcid: edit.orcid.trim() || null,
          website: edit.website.trim() || null,
        })
        .eq("id", researcher.id);
      if (error) throw error;
      setMsg({ ok: true, text: "Profile updated." });
      onRefresh && onRefresh();
      setTimeout(() => setMsg(null), 2500);
    } catch (e) {
      setMsg({ ok: false, text: e.message });
    }
    setBusy(false);
  };

  const inp = { padding: "8px 10px", border: "1px solid #e8e6e1", borderRadius: 6, fontSize: 12, background: "#fff", outline: "none", color: "#2c2c2a", width: "100%" };
  const lbl = { fontSize: 10, color: "#888", marginBottom: 3, display: "block", textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 };

  const claimRequested = !!profile?.claim_request_for_researcher_id && !researcher;
  const isPending = profile?.approval_status === "pending";
  const isApproved = profile?.approval_status === "approved";

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 100 }} />
      <div style={{ position: "fixed", top: 0, right: 0, height: "100vh", width: 480, maxWidth: "94vw", background: "#fff", boxShadow: "-8px 0 24px rgba(0,0,0,0.10)", zIndex: 101, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e8e6e1", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#2c2c2a", fontFamily: "Georgia, serif" }}>My profile</div>
            <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>{user?.email}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 18, color: "#888", cursor: "pointer" }}>×</button>
        </div>

        <div style={{ padding: "18px 20px", overflowY: "auto", flex: 1 }}>

          {isPending && (
            <div style={{ padding: "12px 14px", background: "#FAEEDA", borderRadius: 8, marginBottom: 14, fontSize: 11, color: "#633806", borderLeft: "3px solid #BA7517", lineHeight: 1.5 }}>
              <strong>Awaiting admin approval.</strong> You can browse all data while you wait. Once approved, you can create programs, contribute evidence, and edit your researcher profile.
            </div>
          )}

          {researcher && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 10, color: "#888", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600, marginBottom: 8 }}>
                Linked researcher
              </div>
              <div style={{ padding: "12px 14px", background: "#EEEDFE", borderRadius: 10, borderLeft: "3px solid #534AB7", marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#3C3489" }}>{researcher.name}</div>
                <div style={{ fontSize: 10, color: "#5f5e5a", marginTop: 4, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {researcher.publications_count != null && <span>📄 {researcher.publications_count} pubs</span>}
                  {researcher.h_index != null && <span>h-index {researcher.h_index}</span>}
                  {researcher.member_status && <span style={{ padding: "1px 5px", borderRadius: 4, background: researcher.member_status === "active_member" ? "#1D9E75" : "#888", color: "#fff", fontWeight: 600, fontSize: 9 }}>{researcher.member_status.replace(/_/g, " ")}</span>}
                </div>
              </div>

              {edit && isApproved && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div>
                    <label style={lbl}>Institution</label>
                    <input type="text" value={edit.institution} onChange={e => setEdit({ ...edit, institution: e.target.value })} style={inp} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div>
                      <label style={lbl}>Country</label>
                      <input type="text" value={edit.country} onChange={e => setEdit({ ...edit, country: e.target.value })} style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>ORCID</label>
                      <input type="text" value={edit.orcid} onChange={e => setEdit({ ...edit, orcid: e.target.value })} style={inp} />
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>Expertise area</label>
                    <input type="text" value={edit.expertise_area} onChange={e => setEdit({ ...edit, expertise_area: e.target.value })} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Website</label>
                    <input type="text" value={edit.website} onChange={e => setEdit({ ...edit, website: e.target.value })} style={inp} />
                  </div>
                  <button onClick={saveResearcher} disabled={busy} style={{ padding: "9px 14px", borderRadius: 6, border: "none", background: busy ? "#ccc" : "#534AB7", color: "#fff", fontSize: 12, fontWeight: 600, cursor: busy ? "default" : "pointer" }}>
                    {busy ? "..." : "Save changes"}
                  </button>
                </div>
              )}

              {!isApproved && (
                <div style={{ fontSize: 11, color: "#888", padding: "10px", background: "#f4f3ef", borderRadius: 6 }}>
                  ℹ Editing is enabled after admin approval.
                </div>
              )}
            </div>
          )}

          {claimRequested && (
            <div style={{ marginBottom: 18, padding: "14px 16px", background: "#FAEEDA", borderRadius: 10, borderLeft: "3px solid #BA7517" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#633806", marginBottom: 4 }}>Claim under review</div>
              <div style={{ fontSize: 11, color: "#5f5e5a", lineHeight: 1.5 }}>
                You requested to claim researcher <code style={{ background: "#fff", padding: "1px 5px", borderRadius: 3 }}>{profile.claim_request_for_researcher_id}</code>. An admin will verify and approve.
              </div>
            </div>
          )}

          {!researcher && !claimRequested && profile?.signup_intent !== "observer" && (
            <div style={{ marginBottom: 18, padding: "14px 16px", background: "#EEEDFE", borderRadius: 10, borderLeft: "3px solid #534AB7" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#3C3489", marginBottom: 4 }}>Not connected to a researcher profile</div>
              <div style={{ fontSize: 11, color: "#5f5e5a", lineHeight: 1.5, marginBottom: 8 }}>
                Connect your account to a researcher record to track your contributions and lead programs.
              </div>
              <button onClick={onClaimClick} style={{ padding: "8px 14px", background: "#534AB7", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                Connect now →
              </button>
            </div>
          )}

          {profile?.signup_intent === "observer" && (
            <div style={{ marginBottom: 18, padding: "12px 14px", background: "#f4f3ef", borderRadius: 8, fontSize: 11, color: "#5f5e5a", lineHeight: 1.5 }}>
              You're browsing as an <strong>observer</strong>. You can <button onClick={onClaimClick} style={{ background: "none", border: "none", color: "#534AB7", textDecoration: "underline", padding: 0, fontSize: 11, cursor: "pointer", fontWeight: 600 }}>claim a researcher profile</button> any time.
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
