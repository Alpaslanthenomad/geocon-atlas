"use client";
// User settings panel for outbound webhook channels (Slack / Discord /
// generic). Mounts on /geocon/profile. Lists existing channels with
// last-delivery status; lets the user add a new one + remove old.
//
// Pairs with the U1 dispatcher: every notification the user receives
// is queued out to each active channel by the
// notifications_webhook_enqueue trigger and POSTed by the
// /api/cron/dispatch-webhooks cron.

import { useEffect, useState } from "react";
import { Webhook, Trash2, Plus, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";
import { useToast } from "../ui";

const PROVIDERS = [
  { key: "slack",   label: "Slack",   placeholder: "https://hooks.slack.com/services/T.../B.../...",  hint: "Slack workspace → Apps → Incoming Webhooks → New" },
  { key: "discord", label: "Discord", placeholder: "https://discord.com/api/webhooks/.../...",        hint: "Discord channel → Edit Channel → Integrations → Webhooks" },
  { key: "generic", label: "Generic", placeholder: "https://your-server.example/webhook",             hint: "Any endpoint that accepts JSON { text } or { content }" },
];

export default function WebhookChannelsPanel() {
  const { user } = useAuthContext();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState("slack");
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await supabase.rpc("list_my_webhooks");
    setRows(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function add() {
    if (!url.trim()) { toast.warning("URL gerekli"); return; }
    if (!/^https?:\/\//i.test(url.trim())) { toast.warning("URL https:// ile başlamalı"); return; }
    setBusy(true);
    try {
      const { error } = await supabase.from("webhook_channels").insert({
        user_id: user.id,
        provider,
        label: label.trim() || null,
        url: url.trim(),
      });
      if (error) throw error;
      toast.success("Webhook eklendi");
      setLabel("");
      setUrl("");
      load();
    } catch (e) {
      toast.error("Eklenemedi", { detail: e?.message });
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    if (!confirm("Bu webhook kanalını sil?")) return;
    const { error } = await supabase.from("webhook_channels").delete().eq("id", id);
    if (error) { toast.error("Silinemedi"); return; }
    toast.info("Silindi");
    load();
  }

  async function toggleActive(id, isActive) {
    await supabase.from("webhook_channels").update({ is_active: !isActive }).eq("id", id);
    load();
  }

  if (!user) return null;

  const meta = PROVIDERS.find((p) => p.key === provider) || PROVIDERS[0];

  return (
    <section style={{
      marginTop: 14,
      padding: "var(--gx-card-pad)",
      background: "var(--gx-card-bg)",
      border: "1px solid var(--gx-card-border)",
      borderRadius: "var(--gx-card-radius)",
    }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <div>
          <div className="gx-overline">Notifications</div>
          <h2 style={{
            fontFamily: "var(--gx-font-display)",
            fontSize: 18, fontWeight: 700, color: "var(--gx-ink)",
            margin: 0, display: "inline-flex", alignItems: "center", gap: 8,
          }}>
            <Webhook size={16} strokeWidth={1.85} style={{ color: "var(--gx-accent-violet)" }} />
            Webhook channels
          </h2>
        </div>
        <span style={{ fontSize: 11, color: "var(--gx-ink-muted)" }}>
          {rows.length} channel{rows.length === 1 ? "" : "s"}
        </span>
      </div>

      <p style={{ fontSize: 11, color: "var(--gx-ink-muted)", lineHeight: 1.5, marginTop: 0, marginBottom: 12 }}>
        Her aldığın notification bu kanallara da gönderilir — Slack/Discord workspace'ine veya
        kendi sunucundaki bir webhook'a. Gizlilik: URL kimseyle paylaşılmaz.
      </p>

      {/* Existing channels */}
      {loading ? (
        <div className="gx-skeleton" style={{ height: 40 }} />
      ) : rows.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
          {rows.map((r) => (
            <div key={r.id} style={{
              padding: "9px 11px",
              background: "var(--gx-surface-2)",
              border: "1px solid var(--gx-border-soft)",
              borderRadius: 8,
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase",
                padding: "2px 7px", borderRadius: 999,
                background: r.is_active ? "var(--gx-success-soft)" : "var(--gx-surface-3)",
                color: r.is_active ? "var(--gx-success)" : "var(--gx-ink-muted)",
                fontFamily: "var(--gx-font-mono)",
              }}>
                {r.provider}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--gx-ink)" }}>
                  {r.label || r.provider}
                </div>
                <div style={{ fontSize: 10, color: "var(--gx-ink-muted)", marginTop: 2, fontFamily: "var(--gx-font-mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {r.url.slice(0, 64)}{r.url.length > 64 ? "…" : ""}
                </div>
                {r.last_delivery_at && (
                  <div style={{ fontSize: 10, color: "var(--gx-ink-faint)", marginTop: 3, display: "inline-flex", alignItems: "center", gap: 4 }}>
                    {r.last_delivery_status?.startsWith("delivered")
                      ? <CheckCircle size={10} strokeWidth={2} style={{ color: "var(--gx-success)" }} />
                      : <AlertCircle size={10} strokeWidth={2} style={{ color: "var(--gx-warning)" }} />}
                    Last: {new Date(r.last_delivery_at).toLocaleString()} · {r.last_delivery_status}
                  </div>
                )}
              </div>
              <button onClick={() => toggleActive(r.id, r.is_active)}
                style={{ ...ghostBtn, fontSize: 10 }}>
                {r.is_active ? "Pause" : "Resume"}
              </button>
              <button onClick={() => remove(r.id)}
                style={{ ...ghostBtn, color: "var(--gx-danger)", borderColor: "var(--gx-danger-soft)" }}
                title="Delete">
                <Trash2 size={11} strokeWidth={1.85} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new */}
      <div style={{
        padding: 12,
        background: "var(--gx-surface-2)",
        border: "1px dashed var(--gx-border-soft)",
        borderRadius: 8,
      }}>
        <div className="gx-overline" style={{ marginBottom: 8 }}>Add a channel</div>
        <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
          {PROVIDERS.map((p) => (
            <button key={p.key} onClick={() => setProvider(p.key)}
              style={{
                flex: 1, fontSize: 11, fontWeight: 700,
                padding: "6px 0", borderRadius: 7,
                background: provider === p.key ? "var(--gx-accent-violet)" : "transparent",
                color: provider === p.key ? "#fff" : "var(--gx-ink-soft)",
                border: `1px solid ${provider === p.key ? "var(--gx-accent-violet)" : "var(--gx-border-soft)"}`,
                cursor: "pointer",
              }}>
              {p.label}
            </button>
          ))}
        </div>
        <input value={label} onChange={(e) => setLabel(e.target.value)}
          placeholder="Label (örn. #conservation channel)"
          style={inputStyle} />
        <input value={url} onChange={(e) => setUrl(e.target.value)}
          placeholder={meta.placeholder}
          style={{ ...inputStyle, marginTop: 6, fontFamily: "var(--gx-font-mono)", fontSize: 11 }} />
        <div style={{ fontSize: 10, color: "var(--gx-ink-faint)", marginTop: 6, fontStyle: "italic" }}>
          {meta.hint}
        </div>
        <button onClick={add} disabled={busy || !url.trim()}
          style={{
            marginTop: 10, padding: "8px 16px",
            fontSize: 12, fontWeight: 700,
            background: "var(--gx-success)", color: "#fff",
            border: "none", borderRadius: 7, cursor: "pointer",
            opacity: (busy || !url.trim()) ? 0.6 : 1,
            display: "inline-flex", alignItems: "center", gap: 6,
          }}>
          <Plus size={12} strokeWidth={2.2} />
          {busy ? "Ekleniyor…" : "Kanal ekle"}
        </button>
      </div>
    </section>
  );
}

const ghostBtn = {
  fontSize: 10, fontWeight: 700,
  background: "transparent", color: "var(--gx-ink-soft)",
  border: "1px solid var(--gx-border-soft)",
  borderRadius: 6, padding: "4px 8px", cursor: "pointer",
  display: "inline-flex", alignItems: "center", gap: 4,
};

const inputStyle = {
  width: "100%", boxSizing: "border-box",
  fontSize: 12, padding: "8px 10px",
  background: "var(--gx-surface)", color: "var(--gx-ink)",
  border: "1px solid var(--gx-border-soft)",
  borderRadius: 7, outline: "none",
  fontFamily: "var(--gx-font-body)",
};
