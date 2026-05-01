"use client";
import { useEffect, useState, useCallback } from "react";
import {
  fetchProgramMembers,
  updateMemberStatus,
  signMemberNDA,
  updateMemberVisibility,
  ROLE_LABEL,
  ROLE_ORDER,
  ROLE_COLOR,
  STATUS_COLOR,
  VISIBILITY_LABEL,
  memberDisplayName,
  memberDisplayEmail,
  memberDisplayAffiliation,
} from "../../../lib/programMembers";
import InviteMemberModal from "../modals/InviteMemberModal";

/* ─────────────────────────────────────────────────────────
   ContributorsTab
   - Shows member roster grouped by role
   - Invite modal (researcher / GEOCON user / external)
   - Owner inline actions: status change, NDA, visibility
───────────────────────────────────────────────────────── */

export default function ContributorsTab({ programId, onChanged }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [msg, setMsg] = useState(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const d = await fetchProgramMembers(programId);
    setData(d);
    setLoading(false);
  }, [programId]);

  useEffect(() => { load(); }, [load]);

  const flash = (text, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3000);
  };

  const handleStatus = async (m, newStatus) => {
    setBusy(m.id);
    const res = await updateMemberStatus(m.id, newStatus);
    setBusy(null);
    if (res.success) {
      flash(`${memberDisplayName(m)} → ${newStatus}`, true);
      load();
      if (onChanged) onChanged();
    } else flash(res.error || "Update failed", false);
  };

  const handleNDA = async (m) => {
    const link = window.prompt("NDA document link (optional):", m.nda_document_link || "");
    if (link === null) return;  // canceled
    setBusy(m.id);
    const res = await signMemberNDA(m.id, link.trim() || null);
    setBusy(null);
    if (res.success) { flash("NDA recorded", true); load(); if (onChanged) onChanged(); }
    else flash(res.error || "NDA failed", false);
  };

  const handleVisibility = async (m, newVis) => {
    setBusy(m.id);
    const res = await updateMemberVisibility(m.id, newVis);
    setBusy(null);
    if (res.success) { load(); if (onChanged) onChanged(); }
    else flash(res.error || "Visibility change failed", false);
  };

  if (loading) return <div style={ph}>Loading contributors…</div>;
  if (!data) return <div style={{ ...ph, color: "#A32D2D" }}>Could not load contributors.</div>;

  const { is_owner, members = [] } = data;
  const grouped = groupMembers(members);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {is_owner && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 13, color: "#6B7280" }}>
            <strong>{members.length}</strong> contributor{members.length !== 1 ? "s" : ""}
          </div>
          <button onClick={() => setInviteOpen(true)} style={btnPrimary}>+ Invite</button>
        </div>
      )}

      {msg && (
        <div style={{
          padding: "8px 12px",
          borderRadius: 6,
          fontSize: 13,
          background: msg.ok ? "#DCFCE7" : "#FEE2E2",
          color: msg.ok ? "#166534" : "#991B1B",
          border: `1px solid ${msg.ok ? "#BBF7D0" : "#FECACA"}`,
        }}>{msg.text}</div>
      )}

      {Object.keys(grouped).length === 0 ? (
        <div style={ph}>No contributors yet.</div>
      ) : (
        Object.entries(grouped).map(([role, list]) => (
          <RoleSection
            key={role}
            role={role}
            members={list}
            isOwner={is_owner}
            busy={busy}
            onStatus={handleStatus}
            onNDA={handleNDA}
            onVisibility={handleVisibility}
          />
        ))
      )}

      {inviteOpen && (
        <InviteMemberModal
          programId={programId}
          onClose={() => setInviteOpen(false)}
          onInvited={() => { setInviteOpen(false); load(); if (onChanged) onChanged(); }}
        />
      )}
    </div>
  );
}

/* ─── Sub-components ─── */

function RoleSection({ role, members, isOwner, busy, onStatus, onNDA, onVisibility }) {
  const c = ROLE_COLOR[role] || ROLE_COLOR.contributor;
  return (
    <section style={{ border: "1px solid #E5E7EB", borderRadius: 10, background: "#FFFFFF", overflow: "hidden" }}>
      <header style={{
        padding: "10px 14px",
        background: c.bg,
        borderBottom: `1px solid ${c.border}`,
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: c.color }}>
          {ROLE_LABEL[role] || role}
          <span style={{ marginLeft: 8, fontWeight: 400, color: "#6B7280" }}>
            · {members.length}
          </span>
        </div>
      </header>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {members.map((m) => (
          <MemberRow
            key={m.id}
            member={m}
            isOwner={isOwner}
            busy={busy === m.id}
            onStatus={onStatus}
            onNDA={onNDA}
            onVisibility={onVisibility}
          />
        ))}
      </div>
    </section>
  );
}

function MemberRow({ member: m, isOwner, busy, onStatus, onNDA, onVisibility }) {
  const sc = STATUS_COLOR[m.status] || STATUS_COLOR.invited;
  const name = memberDisplayName(m);
  const email = memberDisplayEmail(m);
  const affil = memberDisplayAffiliation(m);
  const isExternal = !!m.external_email && !m.researcher_id && !m.user_id;

  return (
    <div style={{
      padding: "12px 14px",
      borderBottom: "1px solid #F3F4F6",
      display: "flex",
      alignItems: "flex-start",
      gap: 12,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>{name}</span>
          <span style={{
            fontSize: 11,
            padding: "2px 8px",
            borderRadius: 999,
            background: sc.bg,
            color: sc.color,
            border: `1px solid ${sc.border}`,
          }}>
            {m.status}
          </span>
          {isExternal && (
            <span style={{ fontSize: 10, color: "#6B7280", textTransform: "uppercase" }}>external</span>
          )}
          {m.nda_signed_at && (
            <span style={{ fontSize: 10, color: "#10B981", fontWeight: 600 }}>NDA ✓</span>
          )}
          {m.visibility && (
            <span style={{ fontSize: 10, color: "#6B7280" }}>
              {VISIBILITY_LABEL[m.visibility] || m.visibility}
            </span>
          )}
        </div>
        {(email || affil) && (
          <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
            {email}{email && affil ? " · " : ""}{affil}
          </div>
        )}
        {m.invitation_message && (
          <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4, fontStyle: "italic" }}>
            “{m.invitation_message}”
          </div>
        )}
        {m.invited_at && !m.accepted_at && m.status === "invited" && (
          <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 2 }}>
            invited {fmtDate(m.invited_at)}
          </div>
        )}
        {m.accepted_at && (
          <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 2 }}>
            joined {fmtDate(m.accepted_at)}
          </div>
        )}
      </div>

      {isOwner && m.role !== "owner" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
          {m.status === "invited" && (
            <>
              <button onClick={() => onStatus(m, "active")} disabled={busy} style={busy ? btnDisabled : btnPrimaryXs}>
                Accept
              </button>
              <button onClick={() => onStatus(m, "declined")} disabled={busy} style={busy ? btnDisabled : btnSecondaryXs}>
                Decline
              </button>
            </>
          )}
          {m.status === "active" && (
            <>
              {!m.nda_signed_at && (
                <button onClick={() => onNDA(m)} disabled={busy} style={busy ? btnDisabled : btnSecondaryXs}>
                  Sign NDA
                </button>
              )}
              <select
                value={m.visibility || "workspace"}
                onChange={(e) => onVisibility(m, e.target.value)}
                disabled={busy}
                style={{
                  fontSize: 11,
                  padding: "3px 6px",
                  borderRadius: 4,
                  border: "1px solid #D1D5DB",
                  cursor: busy ? "not-allowed" : "pointer",
                }}
              >
                <option value="public">🌐 Public</option>
                <option value="network">👥 Network</option>
                <option value="workspace">🔒 Workspace</option>
              </select>
              <button onClick={() => onStatus(m, "withdrawn")} disabled={busy} style={busy ? btnDisabled : btnDangerXs}>
                Withdraw
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── helpers ─── */

function groupMembers(members) {
  const groups = {};
  members.forEach((m) => {
    const r = m.role || "contributor";
    if (!groups[r]) groups[r] = [];
    groups[r].push(m);
  });
  // sort each group by joined_at then name
  Object.values(groups).forEach((arr) => {
    arr.sort((a, b) => {
      const ad = a.joined_at || a.invited_at || "";
      const bd = b.joined_at || b.invited_at || "";
      return ad.localeCompare(bd);
    });
  });
  // return sorted by ROLE_ORDER
  const ordered = {};
  Object.keys(groups)
    .sort((a, b) => (ROLE_ORDER[a] ?? 99) - (ROLE_ORDER[b] ?? 99))
    .forEach((k) => { ordered[k] = groups[k]; });
  return ordered;
}

function fmtDate(s) {
  if (!s) return "";
  try { return new Date(s).toLocaleDateString(); } catch { return s; }
}

/* ─── styles ─── */

const ph = {
  padding: 24,
  textAlign: "center",
  color: "#6B7280",
  background: "#F9FAFB",
  borderRadius: 8,
  fontSize: 13,
};

const btnPrimary = {
  fontSize: 13,
  padding: "6px 14px",
  borderRadius: 6,
  border: "1px solid #0E7C66",
  background: "#0E7C66",
  color: "#FFFFFF",
  cursor: "pointer",
  fontWeight: 600,
};

const btnPrimaryXs = {
  fontSize: 11,
  padding: "3px 8px",
  borderRadius: 4,
  border: "1px solid #0E7C66",
  background: "#0E7C66",
  color: "#FFFFFF",
  cursor: "pointer",
  fontWeight: 600,
};

const btnSecondaryXs = {
  fontSize: 11,
  padding: "3px 8px",
  borderRadius: 4,
  border: "1px solid #D1D5DB",
  background: "#FFFFFF",
  color: "#374151",
  cursor: "pointer",
};

const btnDangerXs = {
  fontSize: 11,
  padding: "3px 8px",
  borderRadius: 4,
  border: "1px solid #FECACA",
  background: "#FFFFFF",
  color: "#A32D2D",
  cursor: "pointer",
};

const btnDisabled = {
  fontSize: 11,
  padding: "3px 8px",
  borderRadius: 4,
  border: "1px solid #E5E7EB",
  background: "#F3F4F6",
  color: "#9CA3AF",
  cursor: "not-allowed",
};
