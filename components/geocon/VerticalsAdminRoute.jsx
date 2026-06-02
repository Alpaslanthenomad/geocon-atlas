"use client";
// /geocon/admin/verticals — list active verticals + species counts +
// inline edit form for each. New-vertical creation is intentionally
// NOT wired here yet — partner conversation (IUCN, orchid group,
// etc.) gates the second vertical's onboarding. Edits to existing
// verticals (display_name, description, brand_color, emoji, flags,
// config) ARE wired, so the geophytes row can be refined live.

import { useEffect, useState } from "react";
import Link from "next/link";
import { Layers, AlertCircle, Pencil, Save, X } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";
import { useToast } from "../ui";

export default function VerticalsAdminRoute() {
  const { profile, loading: authLoading } = useAuthContext();
  const isAdmin = profile?.role === "admin";
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase.rpc("list_verticals", { p_include_beta: true });
      if (!cancelled) {
        setList(Array.isArray(data) ? data : []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [authLoading, isAdmin]);

  if (authLoading || loading) {
    return <div style={{ padding: 30, textAlign: "center", color: "var(--gx-ink-muted)", fontSize: 12 }}>Loading…</div>;
  }
  if (!isAdmin) {
    return (
      <div style={{ maxWidth: 540, margin: "60px auto", padding: 40, background: "var(--gx-card-bg)", border: "1px solid var(--gx-card-border)", borderRadius: "var(--gx-card-radius)", textAlign: "center" }}>
        <Layers size={28} strokeWidth={1.5} style={{ color: "var(--gx-ink-muted)", marginBottom: 8 }} />
        <h1 style={{ fontFamily: "var(--gx-font-display)", fontSize: 22, margin: 0, color: "var(--gx-ink)" }}>Venn admin only</h1>
        <p style={{ fontSize: 12, color: "var(--gx-ink-muted)", marginTop: 8, lineHeight: 1.6 }}>
          Vertical configuration is reserved for Venn BioVentures admins.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 880, margin: "0 auto" }}>
      <header style={{ marginBottom: 18 }}>
        <div className="gx-overline" style={{ marginBottom: 4 }}>Admin</div>
        <h1 className="gx-h1" style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          Verticals
          <span style={{ fontSize: 13, color: "var(--gx-ink-muted)", fontWeight: 400, fontFamily: "var(--gx-font-mono)" }}>
            {list.length}
          </span>
        </h1>
        <p style={{ fontSize: 12, color: "var(--gx-ink-muted)", marginTop: 4, lineHeight: 1.5, maxWidth: 720 }}>
          GEOCON Atlas çoklu-takson genişlemeye hazır olarak yapılandırıldı.
          species_id artık her zaman bir vertical'a bağlı. Şu an aktif tek
          vertical: <strong>geophytes</strong>. İkinci vertical için partner
          (örn. IUCN orkide grubu) onboarding'i sonra.
        </p>
      </header>

      <div style={{
        marginBottom: 14, padding: 12,
        background: "var(--gx-info-soft)",
        border: "1px solid color-mix(in srgb, var(--gx-info) 25%, transparent)",
        borderRadius: "var(--gx-card-radius)",
        display: "flex", alignItems: "flex-start", gap: 10,
      }}>
        <AlertCircle size={14} strokeWidth={1.85} style={{ color: "var(--gx-info)", marginTop: 2, flexShrink: 0 }} />
        <div style={{ fontSize: 11, color: "var(--gx-ink-soft)", lineHeight: 1.6 }}>
          <strong>Yeni vertical önerisi</strong> şu an raw SQL ile insert
          ediliyor. UI form'u IUCN re-application sonrasına ertelendi —
          başvuru anında "geophyte commons" pitch'i tek vertical olarak
          daha temiz. Detay: <Link href="/AUDIT-2026-06-02.md" style={{ color: "var(--gx-info)" }}>AUDIT-2026-06-02 §IX.3</Link>.
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {list.map((v) => (
          <VerticalRow key={v.id} row={v} onSaved={() => {
            // Re-fetch list after a successful save
            supabase.rpc("list_verticals", { p_include_beta: true })
              .then(({ data }) => setList(Array.isArray(data) ? data : []));
          }} />
        ))}
      </div>
    </div>
  );
}

function VerticalRow({ row, onSaved }) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    display_name: row.display_name,
    description:  row.description || "",
    brand_color:  row.brand_color || "",
    emoji:        row.emoji || "",
    is_beta:      !!row.is_beta,
  });

  async function save() {
    setBusy(true);
    try {
      const { error } = await supabase.rpc("update_vertical", {
        p_id: row.id,
        p_display_name: form.display_name,
        p_description:  form.description || null,
        p_brand_color:  form.brand_color || null,
        p_emoji:        form.emoji || null,
        p_is_beta:      form.is_beta,
      });
      if (error) throw error;
      toast.success("Vertical güncellendi");
      setEditing(false);
      onSaved?.();
    } catch (e) {
      toast.error("Kaydedilemedi", { detail: e?.message || String(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{
      padding: "var(--gx-card-pad-sm)",
      background: "var(--gx-card-bg)",
      border: "1px solid var(--gx-card-border)",
      borderRadius: "var(--gx-card-radius)",
      borderLeft: `3px solid ${form.brand_color || row.brand_color || "var(--gx-accent-violet)"}`,
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 18 }} aria-hidden>{form.emoji || row.emoji || "✦"}</span>
        <h3 style={{
          fontFamily: "var(--gx-font-display)",
          fontSize: 16, fontWeight: 700, color: "var(--gx-ink)",
          margin: 0,
        }}>
          {row.display_name}
        </h3>
        {row.is_beta && (
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
            padding: "2px 7px", borderRadius: 999,
            background: "var(--gx-warning-soft)", color: "var(--gx-warning)",
            fontFamily: "var(--gx-font-mono)",
          }}>BETA</span>
        )}
        <span style={{
          marginLeft: "auto", fontSize: 11,
          color: "var(--gx-ink-muted)", fontFamily: "var(--gx-font-mono)",
        }}>
          {row.species_count.toLocaleString()} species
        </span>
        {!editing ? (
          <button onClick={() => setEditing(true)}
            style={iconBtn} title="Edit" aria-label="Edit vertical">
            <Pencil size={12} strokeWidth={1.85} />
          </button>
        ) : (
          <>
            <button onClick={save} disabled={busy} style={{ ...iconBtn, color: "var(--gx-success)" }} title="Save">
              <Save size={12} strokeWidth={1.85} />
            </button>
            <button onClick={() => setEditing(false)} disabled={busy} style={{ ...iconBtn, color: "var(--gx-danger)" }} title="Cancel">
              <X size={12} strokeWidth={1.85} />
            </button>
          </>
        )}
      </div>

      {!editing ? (
        <>
          {row.description && (
            <p style={{
              marginTop: 6, marginBottom: 0,
              fontSize: 12, color: "var(--gx-ink-soft)", lineHeight: 1.5,
            }}>
              {row.description}
            </p>
          )}
          <div style={{ marginTop: 8, fontSize: 10, color: "var(--gx-ink-faint)", fontFamily: "var(--gx-font-mono)" }}>
            ID: <code>{row.id}</code> · slug: <code>{row.slug}</code>
          </div>
        </>
      ) : (
        <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "100px 1fr", gap: 8, fontSize: 11 }}>
          <label style={lbl}>Display name</label>
          <input style={inp} value={form.display_name}
            onChange={(e) => setForm({ ...form, display_name: e.target.value })} />

          <label style={lbl}>Description</label>
          <textarea style={{ ...inp, fontFamily: "var(--gx-font-body)", minHeight: 60, resize: "vertical" }}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} />

          <label style={lbl}>Emoji</label>
          <input style={inp} value={form.emoji}
            onChange={(e) => setForm({ ...form, emoji: e.target.value })}
            placeholder="🌿" />

          <label style={lbl}>Brand color</label>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input style={{ ...inp, width: 110 }} value={form.brand_color}
              onChange={(e) => setForm({ ...form, brand_color: e.target.value })}
              placeholder="#1D9E75" />
            <input type="color" value={form.brand_color || "#1D9E75"}
              onChange={(e) => setForm({ ...form, brand_color: e.target.value })}
              style={{ width: 32, height: 28, border: "1px solid var(--gx-border-soft)", borderRadius: 6, background: "transparent", cursor: "pointer" }} />
          </div>

          <label style={lbl}>Beta</label>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--gx-ink-soft)" }}>
            <input type="checkbox" checked={form.is_beta}
              onChange={(e) => setForm({ ...form, is_beta: e.target.checked })} />
            Mark this vertical as beta (shows BETA badge to users)
          </label>
        </div>
      )}
    </div>
  );
}

const iconBtn = {
  width: 26, height: 26, borderRadius: 6,
  background: "transparent",
  border: "1px solid var(--gx-border-soft)",
  color: "var(--gx-ink-muted)",
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  cursor: "pointer",
};
const lbl = {
  fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase",
  color: "var(--gx-ink-faint)", alignSelf: "center",
};
const inp = {
  padding: "6px 10px", fontSize: 12,
  background: "var(--gx-surface-2)",
  color: "var(--gx-ink)",
  border: "1px solid var(--gx-border-soft)",
  borderRadius: 6,
  fontFamily: "var(--gx-font-mono)",
};
