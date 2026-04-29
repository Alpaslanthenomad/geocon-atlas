"use client";
import { useState } from "react";
import { signOut } from "../../lib/auth";

/* ── AuthBar ──
   Sağ üstte gösterilen küçük durum kutucuğu.
   - Logout: "Log in" butonu
   - Login: avatar + dropdown
   - Pending: sarı uyarı rozeti
   - Claim gerek: mor "CLAIM" rozeti
*/
export default function AuthBar({ user, profile, researcher, onLoginClick, onClaimClick, onProfileClick, onAdminClick }) {
  const [open, setOpen] = useState(false);

  if (!user) {
    return (
      <button
        onClick={onLoginClick}
        style={{
          padding: "6px 14px", background: "#0a4a3e", color: "#fff",
          border: "none", borderRadius: 7, cursor: "pointer",
          fontSize: 12, fontWeight: 600,
        }}
      >Log in</button>
    );
  }

  const initial = (profile?.full_name || user.email || "?").slice(0, 1).toUpperCase();
  const isPending = profile?.approval_status === "pending";
  const isAdmin = profile?.role === "admin";
  const needsClaim = !profile?.researcher_id && profile?.signup_intent !== "observer" && !profile?.claim_request_for_researcher_id;

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "5px 12px 5px 5px", background: "#fff",
          border: "1px solid #e8e6e1", borderRadius: 99, cursor: "pointer",
        }}
      >
        <span style={{
          width: 28, height: 28, borderRadius: 99,
          background: isAdmin ? "#3C3489" : isPending ? "#854F0B" : "#0a4a3e",
          color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 700,
        }}>{initial}</span>
        <span style={{ fontSize: 12, color: "#2c2c2a", fontWeight: 600 }}>
          {researcher?.name || profile?.full_name || user.email.split("@")[0]}
        </span>
        {isPending && (
          <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 99, background: "#FAEEDA", color: "#854F0B", fontWeight: 700 }}>PENDING</span>
        )}
        {needsClaim && !isPending && (
          <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 99, background: "#EEEDFE", color: "#3C3489", fontWeight: 700 }}>CLAIM</span>
        )}
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 50 }} />
          <div style={{
            position: "absolute", top: "calc(100% + 6px)", right: 0,
            background: "#fff", border: "1px solid #e8e6e1", borderRadius: 10,
            boxShadow: "0 8px 24px rgba(0,0,0,0.10)", minWidth: 240, zIndex: 51,
            overflow: "hidden",
          }}>
            <div style={{ padding: "12px 14px", borderBottom: "1px solid #f4f3ef", background: "#fcfbf9" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#2c2c2a" }}>
                {profile?.full_name || user.email.split("@")[0]}
              </div>
              <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>{user.email}</div>
              {researcher && (
                <div style={{ fontSize: 10, color: "#534AB7", marginTop: 4, fontStyle: "italic" }}>
                  Linked to: {researcher.name}
                </div>
              )}
              <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                {isAdmin && <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 99, background: "#3C3489", color: "#fff", fontWeight: 700 }}>ADMIN</span>}
                <span style={{
                  fontSize: 9, padding: "1px 6px", borderRadius: 99, fontWeight: 700,
                  background: profile?.approval_status === "approved" ? "#E1F5EE" : profile?.approval_status === "pending" ? "#FAEEDA" : "#FCEBEB",
                  color: profile?.approval_status === "approved" ? "#085041" : profile?.approval_status === "pending" ? "#854F0B" : "#A32D2D",
                }}>{(profile?.approval_status || "unknown").toUpperCase()}</span>
              </div>
            </div>

            {needsClaim && (
              <button onClick={() => { setOpen(false); onClaimClick && onClaimClick(); }} style={menuItemStyle("#534AB7")}>
                🔗 Connect researcher profile
              </button>
            )}
            <button onClick={() => { setOpen(false); onProfileClick && onProfileClick(); }} style={menuItemStyle("#2c2c2a")}>
              👤 My profile
            </button>
            {isAdmin && (
              <button onClick={() => { setOpen(false); onAdminClick && onAdminClick(); }} style={menuItemStyle("#3C3489")}>
                ⚙ Admin: pending approvals
              </button>
            )}
            <button onClick={async () => { setOpen(false); await signOut(); }} style={{ ...menuItemStyle("#A32D2D"), borderTop: "1px solid #f4f3ef" }}>
              ↩ Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const menuItemStyle = (color) => ({
  display: "block", width: "100%", textAlign: "left",
  padding: "10px 14px", border: "none", background: "none",
  color, fontSize: 12, fontWeight: 600, cursor: "pointer",
});
