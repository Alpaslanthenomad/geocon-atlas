"use client";
// Bahçe (The Garden) — Phase 0 internal ventures workspace.
//
// /geocon/ventures — admin-only. Two tabs:
//   1. Opportunities — born from venn_verified conservation outcomes
//   2. Investor CRM — curated funding contacts
//
// This is a DEAL-PREPARATION workspace (Venn's internal tool), NOT a
// marketplace and NOT investor-facing. No money flows through GEOCON.
// The commons stays pure; commercialization conversations happen here,
// behind the door, admin-only.

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sprout, Users, Plus, ArrowRight, Building2, X, ShieldAlert,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";
import { useToast } from "../ui";
import { SkeletonList } from "../shared/Skeleton";

const STAGE_TINT = {
  idea: "var(--gx-ink-muted)", prototype: "var(--gx-accent-azure)",
  pilot: "var(--gx-warning)", scaling: "var(--gx-success)",
};
const STATUS_TINT = {
  draft: "var(--gx-ink-muted)", active: "var(--gx-success)",
  parked: "var(--gx-warning)", closed: "var(--gx-ink-soft)",
};

export default function VenturesRoute() {
  const { profile, loading: authLoading } = useAuthContext();
  const isAdmin = profile?.role === "admin";
  const [tab, setTab] = useState("opportunities");

  if (authLoading) return <SkeletonList rows={4} rowHeight={64} />;
  if (!isAdmin) return <Forbidden />;

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "20px 16px 60px" }}>
      <header style={{ marginBottom: 14 }}>
        <div className="gx-overline" style={{ color: "#0F6E56" }}>Internal · Venn Ventures</div>
        <h1 style={{
          fontFamily: "var(--gx-font-display)", fontSize: 28, fontWeight: 700,
          letterSpacing: "-0.02em", color: "var(--gx-ink)",
          margin: "2px 0 6px 0", display: "inline-flex", alignItems: "center", gap: 10,
        }}>
          <Sprout size={20} strokeWidth={1.85} style={{ color: "#1D9E75" }} />
          The Garden
        </h1>
        <p style={{ fontSize: 12, color: "var(--gx-ink-muted)", lineHeight: 1.55, maxWidth: 640 }}>
          Doğrulanmış (venn_verified) koruma çıktılarından doğan ticari fırsatlar
          ve onları destekleyebilecek yatırımcı/VC ağı. Bu bir deal-hazırlık
          çalışma alanı — pazaryeri değil, yatırımcıya açık değil. Para GEOCON'dan
          akmaz; commons temiz kalır.
        </p>
      </header>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: "1px solid var(--gx-border-soft)" }}>
        {[
          { key: "opportunities", label: "Opportunities", Icon: Sprout },
          { key: "investors",     label: "Investor CRM",  Icon: Users },
        ].map((t) => {
          const on = tab === t.key;
          const Icon = t.Icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "9px 14px", fontSize: 12, fontWeight: 700,
                background: "transparent",
                color: on ? "#0F6E56" : "var(--gx-ink-soft)",
                border: "none",
                borderBottom: `2px solid ${on ? "#1D9E75" : "transparent"}`,
                cursor: "pointer", marginBottom: -1,
              }}>
              <Icon size={13} strokeWidth={2} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "opportunities" ? <OpportunitiesTab /> : <InvestorsTab />}
    </main>
  );
}

function OpportunitiesTab() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("list_bridge_opportunities");
      if (error) throw error;
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error("Yüklenemedi", { detail: e?.message });
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  if (loading) return <SkeletonList rows={4} rowHeight={64} />;
  if (rows.length === 0) {
    return (
      <div style={{
        padding: 30, textAlign: "center",
        background: "var(--gx-surface-2)", border: "1px dashed var(--gx-border-soft)",
        borderRadius: 10, color: "var(--gx-ink-muted)", fontSize: 12, lineHeight: 1.6,
      }}>
        Henüz fırsat yok. Bir <strong>venn_verified</strong> outcome'da
        <span style={{ color: "#0F6E56", fontWeight: 700 }}> "Ticari yol haritası →"</span> butonuna
        basıldığında buraya düşer. Kapı yalnız doğrulanmış çıktılarda açılır.
      </div>
    );
  }

  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
      {rows.map((o) => (
        <li key={o.id}>
          <Link href={`/geocon/ventures/${o.id}`}
            style={{
              display: "block", padding: 13,
              background: "var(--gx-card-bg)",
              border: "1px solid var(--gx-card-border)",
              borderLeft: `3px solid ${STAGE_TINT[o.stage] || "var(--gx-ink-muted)"}`,
              borderRadius: 9, textDecoration: "none", color: "inherit",
            }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", marginBottom: 5 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--gx-ink)" }}>{o.title}</span>
              <Badge text={o.status} tint={STATUS_TINT[o.status]} />
              <Badge text={o.stage} tint={STAGE_TINT[o.stage]} />
              {o.need_kind && <Badge text={o.need_kind} tint="var(--gx-accent-violet)" />}
              <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--gx-ink-muted)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Users size={10} strokeWidth={2} /> {o.matched_count} in pipeline
                <ArrowRight size={11} strokeWidth={2} />
              </span>
            </div>
            {o.species_name && (
              <div style={{ fontSize: 11, fontFamily: "var(--gx-font-serif)", fontStyle: "italic", color: "var(--gx-ink-soft)" }}>
                {o.species_name}
              </div>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function InvestorsTab() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null=closed, {}=new, {…}=edit

  async function load() {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("list_bridge_investors");
      if (error) throw error;
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error("Yüklenemedi", { detail: e?.message });
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
        <button onClick={() => setEditing({})}
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "7px 13px", fontSize: 11, fontWeight: 700,
            background: "#0F6E56", color: "#fff", border: "none",
            borderRadius: 7, cursor: "pointer",
          }}>
          <Plus size={12} strokeWidth={2.4} /> Yatırımcı ekle
        </button>
      </div>

      {loading ? <SkeletonList rows={3} rowHeight={56} /> : rows.length === 0 ? (
        <div style={{
          padding: 26, textAlign: "center",
          background: "var(--gx-surface-2)", border: "1px dashed var(--gx-border-soft)",
          borderRadius: 10, color: "var(--gx-ink-muted)", fontSize: 12,
        }}>
          CRM boş. İlk yatırımcı/VC kaydını ekle — fırsatlarla eşleştirme buradan beslenir.
        </div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
          {rows.map((inv) => (
            <li key={inv.id} onClick={() => setEditing(inv)}
              style={{
                padding: 11, cursor: "pointer",
                background: "var(--gx-card-bg)",
                border: "1px solid var(--gx-card-border)",
                borderRadius: 9,
              }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--gx-ink)" }}>{inv.name}</span>
                {inv.fund && <span style={{ fontSize: 11, color: "var(--gx-ink-soft)" }}>· {inv.fund}</span>}
                {inv.kind && <Badge text={inv.kind} tint="var(--gx-accent-azure)" />}
                {inv.impact_focus && <Badge text="impact" tint="var(--gx-success)" />}
                {(inv.ticket_min || inv.ticket_max) && (
                  <span style={{ marginLeft: "auto", fontSize: 11, fontFamily: "var(--gx-font-mono)", color: "var(--gx-ink-muted)" }}>
                    {fmtTicket(inv)}
                  </span>
                )}
              </div>
              {Array.isArray(inv.thesis_tags) && inv.thesis_tags.length > 0 && (
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
                  {inv.thesis_tags.map((t) => (
                    <span key={t} style={{
                      fontSize: 9, padding: "1px 7px", borderRadius: 999,
                      background: "var(--gx-surface-3)", color: "var(--gx-ink-soft)",
                      fontFamily: "var(--gx-font-mono)",
                    }}>{t}</span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {editing !== null && (
        <InvestorEditor
          investor={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

function InvestorEditor({ investor, onClose, onSaved }) {
  const toast = useToast();
  const [f, setF] = useState({
    name: investor.name || "", fund: investor.fund || "", kind: investor.kind || "vc",
    thesis_tags: (investor.thesis_tags || []).join(", "),
    stage_focus: (investor.stage_focus || []).join(", "),
    ticket_min: investor.ticket_min || "", ticket_max: investor.ticket_max || "",
    ticket_currency: investor.ticket_currency || "USD",
    geography: (investor.geography || []).join(", "),
    impact_focus: !!investor.impact_focus,
    biodiversity_appetite: investor.biodiversity_appetite || "",
    contact_name: investor.contact_name || "", contact_email: investor.contact_email || "",
    warm_intro_path: investor.warm_intro_path || "", notes_md: investor.notes_md || "",
  });
  const [saving, setSaving] = useState(false);

  function arr(s) { return s.split(",").map((x) => x.trim()).filter(Boolean); }

  async function save() {
    if (!f.name.trim()) { toast.warning("İsim gerekli"); return; }
    setSaving(true);
    try {
      const { error } = await supabase.rpc("upsert_bridge_investor", {
        p_id: investor.id || null,
        p_name: f.name.trim(), p_fund: f.fund.trim() || null, p_kind: f.kind,
        p_thesis_tags: arr(f.thesis_tags), p_stage_focus: arr(f.stage_focus),
        p_ticket_min: f.ticket_min ? Number(f.ticket_min) : null,
        p_ticket_max: f.ticket_max ? Number(f.ticket_max) : null,
        p_ticket_currency: f.ticket_currency || "USD",
        p_geography: arr(f.geography), p_impact_focus: f.impact_focus,
        p_biodiversity_appetite: f.biodiversity_appetite.trim() || null,
        p_contact_name: f.contact_name.trim() || null,
        p_contact_email: f.contact_email.trim() || null,
        p_warm_intro_path: f.warm_intro_path.trim() || null,
        p_notes_md: f.notes_md.trim() || null,
      });
      if (error) throw error;
      toast.success("Kaydedildi");
      onSaved();
    } catch (e) {
      toast.error("Kayıt başarısız", { detail: e?.message });
    } finally { setSaving(false); }
  }

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: "min(560px, 100%)", maxHeight: "88vh", overflowY: "auto",
        background: "var(--gx-card-bg)", border: "1px solid var(--gx-card-border)",
        borderRadius: 12, padding: 18,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
          <h3 style={{ fontFamily: "var(--gx-font-display)", fontSize: 18, fontWeight: 700, margin: 0 }}>
            {investor.id ? "Yatırımcı düzenle" : "Yeni yatırımcı"}
          </h3>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--gx-ink-muted)" }}>
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <Field label="İsim *"><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} style={inp} /></Field>
        <Row>
          <Field label="Fon"><input value={f.fund} onChange={(e) => setF({ ...f, fund: e.target.value })} style={inp} /></Field>
          <Field label="Tür">
            <select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })} style={inp}>
              {["vc","angel","family_office","corp_vc","impact_fund","grant","foundation"].map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </Field>
        </Row>
        <Field label="Tez etiketleri (virgülle)"><input value={f.thesis_tags} onChange={(e) => setF({ ...f, thesis_tags: e.target.value })} placeholder="biotech, conservation, cosmetic" style={inp} /></Field>
        <Field label="Aşama odağı (virgülle)"><input value={f.stage_focus} onChange={(e) => setF({ ...f, stage_focus: e.target.value })} placeholder="seed, series_a" style={inp} /></Field>
        <Row>
          <Field label="Bilet min"><input type="number" value={f.ticket_min} onChange={(e) => setF({ ...f, ticket_min: e.target.value })} style={inp} /></Field>
          <Field label="Bilet max"><input type="number" value={f.ticket_max} onChange={(e) => setF({ ...f, ticket_max: e.target.value })} style={inp} /></Field>
          <Field label="Para"><input value={f.ticket_currency} onChange={(e) => setF({ ...f, ticket_currency: e.target.value })} style={inp} /></Field>
        </Row>
        <Field label="Coğrafya (virgülle)"><input value={f.geography} onChange={(e) => setF({ ...f, geography: e.target.value })} placeholder="TR, EU, global" style={inp} /></Field>
        <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "var(--gx-ink-soft)", margin: "6px 0" }}>
          <input type="checkbox" checked={f.impact_focus} onChange={(e) => setF({ ...f, impact_focus: e.target.checked })} />
          Impact / ESG odaklı
        </label>
        <Field label="Biyoçeşitlilik iştahı"><input value={f.biodiversity_appetite} onChange={(e) => setF({ ...f, biodiversity_appetite: e.target.value })} style={inp} /></Field>
        <Row>
          <Field label="Kontak adı"><input value={f.contact_name} onChange={(e) => setF({ ...f, contact_name: e.target.value })} style={inp} /></Field>
          <Field label="Kontak email"><input value={f.contact_email} onChange={(e) => setF({ ...f, contact_email: e.target.value })} style={inp} /></Field>
        </Row>
        <Field label="Sıcak giriş yolu"><input value={f.warm_intro_path} onChange={(e) => setF({ ...f, warm_intro_path: e.target.value })} placeholder="via Dr. X / cold / LinkedIn" style={inp} /></Field>
        <Field label="Notlar"><textarea rows={3} value={f.notes_md} onChange={(e) => setF({ ...f, notes_md: e.target.value })} style={{ ...inp, resize: "vertical" }} /></Field>

        <button onClick={save} disabled={saving}
          style={{
            marginTop: 12, width: "100%", padding: "11px", fontSize: 13, fontWeight: 700,
            background: "#0F6E56", color: "#fff", border: "none", borderRadius: 8,
            cursor: "pointer", opacity: saving ? 0.6 : 1,
          }}>
          {saving ? "Kaydediliyor…" : "Kaydet"}
        </button>
      </div>
    </div>
  );
}

function Forbidden() {
  return (
    <div style={{ maxWidth: 480, margin: "80px auto", padding: 32, textAlign: "center",
                  background: "var(--gx-danger-soft)", color: "var(--gx-danger)",
                  border: "1px solid var(--gx-danger)", borderRadius: 12 }}>
      <ShieldAlert size={28} strokeWidth={1.6} style={{ marginBottom: 8 }} />
      <h1 style={{ fontFamily: "var(--gx-font-display)", fontSize: 20, margin: "0 0 6px 0" }}>
        Internal workspace
      </h1>
      <p style={{ fontSize: 12, lineHeight: 1.6, margin: 0 }}>
        The Garden yalnızca yönetim erişimine açıktır.
      </p>
    </div>
  );
}

function Badge({ text, tint }) {
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase",
      padding: "2px 7px", borderRadius: 999,
      background: `color-mix(in srgb, ${tint || "var(--gx-ink-muted)"} 16%, transparent)`,
      color: tint || "var(--gx-ink-muted)", fontFamily: "var(--gx-font-mono)",
    }}>{text}</span>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 8, flex: 1 }}>
      <div style={{ fontSize: 10, color: "var(--gx-ink-muted)", marginBottom: 3, letterSpacing: 0.3, textTransform: "uppercase", fontWeight: 700 }}>{label}</div>
      {children}
    </div>
  );
}
function Row({ children }) {
  return <div style={{ display: "flex", gap: 8 }}>{children}</div>;
}
function fmtTicket(inv) {
  const f = (n) => n >= 1e6 ? `${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n/1e3)}K` : n;
  if (inv.ticket_min && inv.ticket_max) return `${inv.ticket_currency} ${f(inv.ticket_min)}–${f(inv.ticket_max)}`;
  if (inv.ticket_max) return `≤ ${inv.ticket_currency} ${f(inv.ticket_max)}`;
  if (inv.ticket_min) return `≥ ${inv.ticket_currency} ${f(inv.ticket_min)}`;
  return "";
}

const inp = {
  width: "100%", boxSizing: "border-box",
  padding: "8px 10px", fontSize: 12,
  background: "var(--gx-surface)", color: "var(--gx-ink)",
  border: "1px solid var(--gx-border-soft)", borderRadius: 7, outline: "none",
  fontFamily: "var(--gx-font-body)",
};
