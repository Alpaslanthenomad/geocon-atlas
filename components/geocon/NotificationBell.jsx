"use client";
// components/geocon/NotificationBell.jsx
//
// Bell + unread badge + dropdown panel for the GEOCON shell header. Resolves
// the signed-in user from AuthContext; for signed-out viewers it renders
// nothing. Clicking a notification marks it read and navigates to the
// underlying program (and, when relevant, the stream tab anchor).

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "../../lib/authContext";
import { useNotifications } from "../programs/v2/hooks/useNotifications";
import { supabase } from "../../lib/supabase";

export default function NotificationBell() {
  const { user } = useAuthContext();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const panelRef = useRef(null);

  const { items, unread, loading, markOneRead, markAllRead } =
    useNotifications(user?.id || null, { limit: 30 });

  // Close on outside click + Escape
  useEffect(() => {
    if (!open) return;
    function onDoc(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;

  async function handleClickItem(it) {
    if (!it.read_at) await markOneRead(it.id);
    setOpen(false);

    // Proposal-flavored notifications carry proposal_id in payload, not program_id.
    if (it.type?.startsWith("proposal_")) {
      const pid = it.payload?.proposal_id;
      if (pid) router.push(`/geocon/proposals/${pid}`);
      return;
    }

    if (!it.program_id) return;
    const tab = (it.type === "mention" || it.type === "reply") ? "stream" : "foundation";
    router.push(`/geocon/programs/${encodeURIComponent(it.program_id)}?tab=${tab}`);
  }

  return (
    <div ref={panelRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        title={unread > 0 ? `${unread} unread` : "Notifications"}
        style={{
          position: "relative",
          background: open ? "var(--gx-surface-3)" : "transparent",
          border: "1px solid",
          borderColor: open ? "#e8e6e1" : "transparent",
          borderRadius: 8,
          padding: "6px 10px",
          cursor: "pointer",
          fontSize: 16,
          lineHeight: 1,
          color: "var(--gx-ink)",
        }}
      >
        🔔
        {unread > 0 && (
          <span
            style={{
              position: "absolute",
              top: -2,
              right: -2,
              minWidth: 16,
              height: 16,
              padding: "0 4px",
              borderRadius: 999,
              background: "#A32D2D",
              color: "#fff",
              fontSize: 9,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1.5px solid #fff",
            }}
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            width: 380,
            maxHeight: 480,
            background: "#fff",
            border: "1px solid #e8e6e1",
            borderRadius: 10,
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
            display: "flex",
            flexDirection: "column",
            zIndex: 50,
          }}
        >
          <div style={{ padding: "10px 12px", borderBottom: "1px solid #f0eee8", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--gx-ink)" }}>
              Notifications {unread > 0 && <span style={{ color: "#A32D2D", marginLeft: 4 }}>· {unread}</span>}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {unread > 0 && !showPrefs && (
                <button
                  onClick={markAllRead}
                  style={{ fontSize: 10, color: "#0a4a3e", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setShowPrefs((s) => !s)}
                style={{ fontSize: 10, color: showPrefs ? "#A32D2D" : "#666", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
                title="Preferences"
              >
                {showPrefs ? "← Back" : "⚙ Prefs"}
              </button>
            </div>
          </div>

          {showPrefs && <PreferencesPanel />}

          {!showPrefs && <div style={{ overflow: "auto", flex: 1 }}>
            {loading && items.length === 0 ? (
              <div style={{ padding: 20, textAlign: "center", color: "#888", fontSize: 11 }}>Loading…</div>
            ) : items.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", color: "#888", fontSize: 11 }}>
                You're all caught up.
              </div>
            ) : (
              items.map((it) => (
                <button
                  key={it.id}
                  onClick={() => handleClickItem(it)}
                  style={{
                    display: "flex",
                    gap: 10,
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 12px",
                    background: it.read_at ? "transparent" : "#f1faf7",
                    border: "none",
                    borderBottom: "1px solid #f5f3ec",
                    cursor: "pointer",
                  }}
                >
                  <NotificationIcon type={it.type} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: "var(--gx-ink)", lineHeight: 1.45 }}>
                      <strong>{it.actor_name || "Someone"}</strong> {actionLabel(it)}{" "}
                      {it.type?.startsWith("proposal_") && it.payload?.title ? (
                        <span style={{ color: "#0a4a3e", fontWeight: 600 }}>{it.payload.title}</span>
                      ) : it.program_name ? (
                        <span style={{ color: "#0a4a3e", fontWeight: 600 }}>{it.program_name}</span>
                      ) : null}
                    </div>
                    {it.payload?.body_excerpt && (
                      <div style={{ marginTop: 2, fontSize: 10, color: "#666", lineHeight: 1.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        “{it.payload.body_excerpt}”
                      </div>
                    )}
                    {it.type === "tic_assigned" && (it.payload?.tic_label_en || it.payload?.tic_label_tr) && (
                      <div style={{ marginTop: 2, fontSize: 10, color: "#666" }}>
                        {it.payload.tic_label_en || it.payload.tic_label_tr}
                        {it.payload?.due_date && <> · due {it.payload.due_date}</>}
                      </div>
                    )}
                    <div style={{ marginTop: 3, fontSize: 9, color: "#a8a59c" }}>{formatAgo(it.created_at)}</div>
                  </div>
                  {!it.read_at && (
                    <div style={{ width: 6, height: 6, borderRadius: 999, background: "#0F6E56", marginTop: 5 }} aria-label="unread" />
                  )}
                </button>
              ))
            )}
          </div>}
        </div>
      )}
    </div>
  );
}

function NotificationIcon({ type }) {
  const map = {
    mention:      { icon: "@",  tint: "#185FA5" },
    reply:        { icon: "↳",  tint: "#0F6E56" },
    tic_assigned: { icon: "👤", tint: "#534AB7" },
    tic_completed:{ icon: "✓",  tint: "#0F6E56" },
    tic_waived:   { icon: "⊘",  tint: "#BA7517" },
    output_added: { icon: "📦", tint: "#D85A30" },
    pathway_declared:     { icon: "🛤", tint: "#185FA5" },
    proposal_received:    { icon: "📬", tint: "#185FA5" },
    proposal_accepted:    { icon: "✓",  tint: "#0F6E56" },
    proposal_declined:    { icon: "✕",  tint: "#A32D2D" },
    proposal_withdrawn:   { icon: "↺",  tint: "var(--gx-ink-muted)" },
    proposal_negotiating: { icon: "…",  tint: "#534AB7" },
    proposal_comment:     { icon: "💬", tint: "#185FA5" },
    proposal_reply:       { icon: "↳",  tint: "#0F6E56" },
    proposal_mention:     { icon: "@",  tint: "#185FA5" },
  };
  const m = map[type] || { icon: "•", tint: "var(--gx-ink-muted)" };
  return (
    <div
      style={{
        flexShrink: 0,
        width: 26,
        height: 26,
        borderRadius: 6,
        background: m.tint + "22",
        color: m.tint,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {m.icon}
    </div>
  );
}

function actionLabel(it) {
  switch (it.type) {
    case "mention":      return "mentioned you in";
    case "reply":        return "replied to you in";
    case "tic_assigned": return "assigned you a tic in";
    case "tic_completed":return "completed a tic in";
    case "tic_waived":   return "waived a tic in";
    case "output_added": return "added an output to";
    case "pathway_declared": return "declared a pathway in";
    case "proposal_received":    return "sent you a proposal";
    case "proposal_accepted":    return "accepted your proposal";
    case "proposal_declined":    return "declined your proposal";
    case "proposal_withdrawn":   return "withdrew their proposal";
    case "proposal_negotiating": return "is negotiating your proposal";
    case "proposal_comment":     return "commented on";
    case "proposal_reply":       return "replied to you on";
    case "proposal_mention":     return "mentioned you on";
    default:             return "updated";
  }
}

const PREF_TYPES = [
  { type: "mention",              label: "@-mentions in program comments" },
  { type: "reply",                label: "Replies to your comments" },
  { type: "tic_assigned",         label: "TIC assignments" },
  { type: "proposal_received",    label: "New proposals sent to you" },
  { type: "proposal_negotiating", label: "Proposal moved to negotiating" },
  { type: "proposal_accepted",    label: "Proposal accepted" },
  { type: "proposal_declined",    label: "Proposal declined" },
  { type: "proposal_withdrawn",   label: "Proposal withdrawn" },
];

function PreferencesPanel() {
  const [prefs, setPrefs] = useState({});      // explicit overrides
  const [loading, setLoading] = useState(true);
  const [savingType, setSavingType] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.rpc("get_my_notification_preferences");
      if (cancelled) return;
      setPrefs(data || {});
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  async function toggle(type) {
    // Default-on semantics: absent → on. Toggle flips to off (explicit row).
    const currentlyOn = prefs[type] !== false;
    const next = !currentlyOn;
    setSavingType(type);
    setPrefs((p) => ({ ...p, [type]: next }));
    const { error } = await supabase.rpc("set_my_notification_preference", {
      p_type: type, p_enabled: next,
    });
    setSavingType(null);
    if (error) {
      setPrefs((p) => ({ ...p, [type]: currentlyOn }));
      alert(error.message);
    }
  }

  if (loading) {
    return <div style={{ padding: 20, textAlign: "center", color: "#888", fontSize: 11 }}>Loading…</div>;
  }

  return (
    <div style={{ overflow: "auto", flex: 1, padding: "4px 12px 8px" }}>
      <div style={{ fontSize: 10, color: "#888", padding: "8px 4px 6px", lineHeight: 1.5 }}>
        Pick which kinds of notifications you want to receive. All are on by default.
      </div>
      {PREF_TYPES.map((p) => {
        const on = prefs[p.type] !== false;
        const saving = savingType === p.type;
        return (
          <label
            key={p.type}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 6px",
              gap: 10,
              fontSize: 11,
              color: "var(--gx-ink)",
              borderBottom: "1px solid #f5f3ec",
              cursor: saving ? "wait" : "pointer",
              opacity: saving ? 0.6 : 1,
            }}
          >
            <span>{p.label}</span>
            <span
              onClick={() => !saving && toggle(p.type)}
              style={{
                width: 32, height: 18,
                background: on ? "#0a4a3e" : "#ddd",
                borderRadius: 999,
                position: "relative",
                transition: "background 0.15s",
                flexShrink: 0,
              }}
            >
              <span style={{
                position: "absolute",
                top: 2, left: on ? 16 : 2,
                width: 14, height: 14,
                background: "#fff",
                borderRadius: 999,
                transition: "left 0.15s",
                boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
              }} />
            </span>
          </label>
        );
      })}
    </div>
  );
}

function formatAgo(at) {
  if (!at) return "";
  const d = new Date(at);
  const ms = Date.now() - d.getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}
