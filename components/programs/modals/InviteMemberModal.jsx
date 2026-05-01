"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { inviteMember, ROLE_LABEL } from "../../../lib/programMembers";
import { ModalShell } from "./CompleteTicModal";

/* ─────────────────────────────────────────────────────────
   InviteMemberModal
   - Two modes: researcher (typeahead) | external (email + name)
   - Role picker (excludes 'owner')
   - Visibility picker
   - Optional invitation message + COI check
───────────────────────────────────────────────────────── */

const ROLE_OPTIONS = [
  "co_founder",
  "conservation_lead",
  "science_lead",
  "pathway_lead",
  "contributor",
  "observer",
];

export default function InviteMemberModal({ programId, onClose, onInvited }) {
  const [mode, setMode] = useState("researcher"); // 'researcher' | 'external'
  const [role, setRole] = useState("contributor");
  const [visibility, setVisibility] = useState("workspace");
  const [message, setMessage] = useState("");

  // researcher mode
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [chosenResearcher, setChosenResearcher] = useState(null);

  // external mode
  const [extEmail, setExtEmail] = useState("");
  const [extName, setExtName] = useState("");
  const [extAffil, setExtAffil] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // typeahead search
  useEffect(() => {
    if (mode !== "researcher" || !searchTerm.trim() || searchTerm.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      const { data } = await supabase
        .from("researchers")
        .select("id, name, email, affiliation")
        .ilike("name", `%${searchTerm.trim()}%`)
        .limit(8);
      setSearchResults(data || []);
      setSearching(false);
    }, 250);
    return () => clearTimeout(t);
  }, [searchTerm, mode]);

  const submit = async () => {
    setError(null);

    if (mode === "researcher") {
      if (!chosenResearcher) {
        setError("Pick a researcher from the search.");
        return;
      }
    } else {
      if (!extEmail.trim() || !/.+@.+\..+/.test(extEmail.trim())) {
        setError("Enter a valid email address.");
        return;
      }
      if (!extName.trim()) {
        setError("Enter a display name for the external invitee.");
        return;
      }
    }

    setSubmitting(true);
    const payload = mode === "researcher"
      ? {
          role,
          researcherId: chosenResearcher.id,
          invitationMessage: message.trim() || null,
          visibility,
        }
      : {
          role,
          externalEmail: extEmail.trim(),
          externalName: extName.trim(),
          externalAffiliation: extAffil.trim() || null,
          invitationMessage: message.trim() || null,
          visibility,
        };
    const res = await inviteMember(programId, payload);
    setSubmitting(false);
    if (res.success) {
      onInvited();
    } else {
      setError(res.error || "Invite failed.");
    }
  };

  return (
    <ModalShell title="Invite contributor" onClose={onClose} width={520}>
      {/* Mode toggle */}
      <div style={{ display: "flex", gap: 0, marginBottom: 16, border: "1px solid #E5E7EB", borderRadius: 6, overflow: "hidden" }}>
        <button
          type="button"
          onClick={() => setMode("researcher")}
          style={tabBtn(mode === "researcher")}
        >GEOCON researcher</button>
        <button
          type="button"
          onClick={() => setMode("external")}
          style={tabBtn(mode === "external")}
        >External (email)</button>
      </div>

      {mode === "researcher" ? (
        <div style={{ marginBottom: 12 }}>
          <label style={lbl}>Search researcher</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setChosenResearcher(null); }}
            placeholder="Type a name…"
            autoFocus
            style={input}
          />
          {searching && <div style={{ fontSize: 11, color: "#6B7280", marginTop: 4 }}>searching…</div>}
          {searchResults.length > 0 && !chosenResearcher && (
            <div style={{
              marginTop: 4,
              border: "1px solid #E5E7EB",
              borderRadius: 6,
              maxHeight: 180,
              overflow: "auto",
              background: "#FFFFFF",
            }}>
              {searchResults.map((r) => (
                <div
                  key={r.id}
                  onClick={() => { setChosenResearcher(r); setSearchTerm(r.name); setSearchResults([]); }}
                  style={{
                    padding: "8px 10px",
                    borderBottom: "1px solid #F3F4F6",
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{r.name}</div>
                  {(r.email || r.affiliation) && (
                    <div style={{ fontSize: 11, color: "#6B7280" }}>
                      {r.email}{r.email && r.affiliation ? " · " : ""}{r.affiliation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {chosenResearcher && (
            <div style={{
              marginTop: 6,
              padding: 8,
              background: "#DCFCE7",
              border: "1px solid #BBF7D0",
              borderRadius: 6,
              fontSize: 12,
              color: "#166534",
            }}>
              ✓ {chosenResearcher.name}
              <button
                onClick={() => { setChosenResearcher(null); setSearchTerm(""); }}
                style={{
                  marginLeft: 8,
                  background: "transparent",
                  border: "none",
                  color: "#166534",
                  cursor: "pointer",
                  fontSize: 11,
                  textDecoration: "underline",
                }}
              >change</button>
            </div>
          )}
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>Email <span style={{ color: "#A32D2D" }}>*</span></label>
            <input
              type="email"
              value={extEmail}
              onChange={(e) => setExtEmail(e.target.value)}
              placeholder="name@example.org"
              style={input}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>Display name <span style={{ color: "#A32D2D" }}>*</span></label>
            <input
              type="text"
              value={extName}
              onChange={(e) => setExtName(e.target.value)}
              placeholder="Full name"
              style={input}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>Affiliation</label>
            <input
              type="text"
              value={extAffil}
              onChange={(e) => setExtAffil(e.target.value)}
              placeholder="Organisation, university, etc."
              style={input}
            />
          </div>
        </>
      )}

      <div style={{ marginBottom: 12 }}>
        <label style={lbl}>Role</label>
        <select value={role} onChange={(e) => setRole(e.target.value)} style={input}>
          {ROLE_OPTIONS.map((r) => (
            <option key={r} value={r}>{ROLE_LABEL[r] || r}</option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={lbl}>Visibility</label>
        <select value={visibility} onChange={(e) => setVisibility(e.target.value)} style={input}>
          <option value="workspace">🔒 Workspace (default)</option>
          <option value="network">👥 Network</option>
          <option value="public">🌐 Public</option>
        </select>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={lbl}>Invitation message (optional)</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="Why you'd like them to join the program."
          style={{ ...input, resize: "vertical" }}
        />
      </div>

      {error && (
        <div style={{ padding: 8, background: "#FEE2E2", color: "#991B1B", borderRadius: 6, fontSize: 13, marginBottom: 12 }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button onClick={onClose} disabled={submitting} style={btnSecondary}>Cancel</button>
        <button onClick={submit} disabled={submitting} style={submitting ? btnDisabled : btnPrimary}>
          {submitting ? "Sending…" : "Send invite"}
        </button>
      </div>
    </ModalShell>
  );
}

const tabBtn = (active) => ({
  flex: 1,
  padding: "8px 12px",
  border: "none",
  background: active ? "#0E7C66" : "#FFFFFF",
  color: active ? "#FFFFFF" : "#374151",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
});

const lbl = { display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 };
const input = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 6,
  border: "1px solid #D1D5DB",
  fontSize: 13,
  fontFamily: "inherit",
  boxSizing: "border-box",
};
const btnPrimary = {
  fontSize: 13,
  padding: "8px 16px",
  borderRadius: 6,
  border: "1px solid #0E7C66",
  background: "#0E7C66",
  color: "#FFFFFF",
  cursor: "pointer",
  fontWeight: 600,
};
const btnSecondary = {
  fontSize: 13,
  padding: "8px 16px",
  borderRadius: 6,
  border: "1px solid #D1D5DB",
  background: "#FFFFFF",
  color: "#374151",
  cursor: "pointer",
};
const btnDisabled = {
  fontSize: 13,
  padding: "8px 16px",
  borderRadius: 6,
  border: "1px solid #E5E7EB",
  background: "#F3F4F6",
  color: "#9CA3AF",
  cursor: "not-allowed",
};
