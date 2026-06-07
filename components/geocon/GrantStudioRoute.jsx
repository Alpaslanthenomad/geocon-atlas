"use client";
// /geocon/grant-studio — Grant Studio (Proje Yazım Stüdyosu), Phase 0.
//
// Prepare funding proposals (TÜBİTAK, Horizon Europe, KOSGEB…) grounded in
// a GEOCON program. Templates are structured from PUBLIC funder guidelines;
// proposals are private working documents. No AI in Phase 0 — manual draft.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText, Plus, X, Landmark, Workflow, ArrowRight, FileSignature,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";
import { useToast } from "../ui";
import { EmptyState, MiniBar } from "../shared";

const STATUS_META = {
  draft:      { label: "Taslak",         tint: "var(--gx-ink-muted)" },
  in_review:  { label: "İncelemede",     tint: "var(--gx-info)" },
  submitted:  { label: "Gönderildi",     tint: "var(--gx-accent-azure)" },
  awarded:    { label: "Kabul",          tint: "var(--gx-success)" },
  rejected:   { label: "Reddedildi",     tint: "var(--gx-accent-rose)" },
};

const COUNTRY_FLAG = { TR: "Türkiye", EU: "AB", CL: "Şili", US: "ABD" };

export default function GrantStudioRoute() {
  const { user, loading: authLoading } = useAuthContext();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [autoProgram, setAutoProgram] = useState("");

  useEffect(() => {
    // ?program=<id> deep-link from a program page → open the new-proposal
    // panel with that program preselected.
    if (typeof window === "undefined") return;
    const prog = new URLSearchParams(window.location.search).get("program");
    if (prog) { setAutoProgram(prog); setShowNew(true); }
  }, []);

  async function load() {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("list_my_grant_proposals");
      if (error) throw error;
      setRows(Array.isArray(data) ? data : []);
    } catch { setRows([]); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  if (authLoading || loading) {
    return <div style={{ padding: 30, textAlign: "center", color: "var(--gx-ink-muted)", fontSize: 12 }}>Loading…</div>;
  }
  if (!user) {
    return (
      <div style={{ maxWidth: 540, margin: "60px auto", padding: 40, background: "var(--gx-card-bg)", border: "1px solid var(--gx-card-border)", borderRadius: "var(--gx-card-radius)", textAlign: "center" }}>
        <FileSignature size={28} strokeWidth={1.5} style={{ color: "var(--gx-ink-muted)", marginBottom: 8 }} />
        <h1 style={{ fontFamily: "var(--gx-font-display)", fontSize: 22, margin: 0, color: "var(--gx-ink)" }}>Stüdyoyu açmak için giriş yap</h1>
        <Link href="/" style={{ display: "inline-block", marginTop: 16, padding: "8px 14px", fontSize: 12, fontWeight: 600, background: "var(--gx-success)", color: "#fff", borderRadius: 7, textDecoration: "none" }}>Giriş</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", paddingBottom: 60 }}>
      <header style={{ marginBottom: 18 }}>
        <div className="gx-overline">Proje Yazım Stüdyosu</div>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <h1 className="gx-h1" style={{ margin: "2px 0 0" }}>Fon başvurularını programlarından hazırla</h1>
          <button onClick={() => setShowNew(true)} style={{
            display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 14px", fontSize: 12, fontWeight: 700,
            background: "var(--gx-success)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", flexShrink: 0 }}>
            <Plus size={13} strokeWidth={2.2} /> Yeni başvuru
          </button>
        </div>
        <p style={{ fontSize: 12.5, color: "var(--gx-ink-muted)", marginTop: 8, maxWidth: 680, lineHeight: 1.5 }}>
          TÜBİTAK, Horizon Europe, KOSGEB gibi programların yapılarına göre bölüm bölüm hazırla.
          Başvurun <strong>özel çalışma belgendir</strong> — sadece sen görürsün.
        </p>
        <div style={{ fontSize: 10, color: "var(--gx-ink-faint)", marginTop: 4, fontStyle: "italic" }}>
          Şablonlar kamuya açık program kılavuzlarının yapısından türetilmiştir; GEOCON bu kurumlara bağlı veya onları temsil eden bir kuruluş değildir.
        </div>
      </header>

      {showNew && <NewProposalPanel initialProgramId={autoProgram} onClose={() => setShowNew(false)} />}

      {rows.length === 0 ? (
        <EmptyState icon="○" title="Henüz başvuru yok"
          hint="Yukarıdan 'Yeni başvuru' ile bir fon programı seç, bir programına bağla ve bölümleri doldurmaya başla." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {rows.map((p) => {
            const st = STATUS_META[p.status] || STATUS_META.draft;
            const pct = p.sections_total > 0 ? Math.round((p.sections_done / p.sections_total) * 100) : 0;
            return (
              <Link key={p.id} href={`/geocon/grant-studio/${p.id}`} style={{
                display: "block", padding: "var(--gx-card-pad)", textDecoration: "none",
                background: "var(--gx-card-bg)", border: "1px solid var(--gx-card-border)", borderRadius: "var(--gx-card-radius)" }}>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6, alignItems: "center" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 9, fontWeight: 700, letterSpacing: 0.4, padding: "2px 8px", borderRadius: 999,
                    background: "color-mix(in srgb, var(--gx-info) 12%, var(--gx-surface-2))", color: "var(--gx-info)", fontFamily: "var(--gx-font-mono)" }}>
                    <Landmark size={10} strokeWidth={2} /> {p.funder} · {p.program_code}
                  </span>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                    background: `color-mix(in srgb, ${st.tint} 14%, transparent)`, color: st.tint, fontFamily: "var(--gx-font-mono)" }}>{st.label}</span>
                  {p.program_name && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 9, color: "var(--gx-ink-faint)", fontFamily: "var(--gx-font-mono)" }}>
                      <Workflow size={10} strokeWidth={1.9} /> {p.program_name}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--gx-ink)", fontFamily: "var(--gx-font-display)" }}>{p.title}</div>
                  <ArrowRight size={14} strokeWidth={1.9} style={{ color: "var(--gx-ink-faint)", flexShrink: 0 }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <div style={{ flex: 1 }}><MiniBar value={p.sections_done} max={Math.max(p.sections_total, 1)} color="var(--gx-success)" h={5} /></div>
                  <span style={{ fontSize: 9, color: "var(--gx-ink-muted)", fontFamily: "var(--gx-font-mono)", flexShrink: 0 }}>{p.sections_done}/{p.sections_total} ({pct}%)</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NewProposalPanel({ onClose, initialProgramId }) {
  const router = useRouter();
  const toast = useToast();
  const [templates, setTemplates] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [tplId, setTplId] = useState(null);
  const [programId, setProgramId] = useState(initialProgramId || "");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const [t, p] = await Promise.all([
        supabase.rpc("list_grant_templates"),
        supabase.rpc("list_programs_filtered", { p_search: null, p_status: null, p_module: null, p_entry_mode: null, p_country: null, p_mine_only: true, p_limit: 100 }),
      ]);
      setTemplates(Array.isArray(t.data) ? t.data : []);
      setPrograms(Array.isArray(p.data) ? p.data : []);
    })();
  }, []);

  async function create() {
    if (!tplId) { toast.warning("Bir fon programı seç"); return; }
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("create_grant_proposal", {
        p_template_id: tplId, p_program_id: programId || null, p_title: title.trim() || null,
      });
      if (error) throw error;
      toast.success("Başvuru oluşturuldu");
      router.push(`/geocon/grant-studio/${data}`);
    } catch (e) { toast.error("Oluşturulamadı", { detail: e?.message || String(e) }); }
    finally { setBusy(false); }
  }

  return (
    <div style={{ marginBottom: 18, padding: 16, background: "var(--gx-surface-2)", border: "1px solid var(--gx-border-soft)", borderRadius: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--gx-ink-muted)" }}>Yeni başvuru</span>
        <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--gx-ink-faint)" }}><X size={15} /></button>
      </div>

      <Label>1 · Fon programı</Label>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8, marginBottom: 14 }}>
        {templates.map((t) => {
          const active = tplId === t.id;
          return (
            <button key={t.id} onClick={() => setTplId(t.id)} style={{
              textAlign: "left", padding: 11, borderRadius: 9, cursor: "pointer",
              background: active ? "color-mix(in srgb, var(--gx-success) 10%, var(--gx-surface))" : "var(--gx-surface)",
              border: `1.5px solid ${active ? "var(--gx-success)" : "var(--gx-border-soft)"}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                <Landmark size={12} strokeWidth={2} style={{ color: "var(--gx-info)" }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--gx-ink)" }}>{t.funder} · {t.program_code}</span>
              </div>
              <div style={{ fontSize: 10.5, color: "var(--gx-ink-muted)", lineHeight: 1.3 }}>{t.program_name}</div>
              <div style={{ fontSize: 9, color: "var(--gx-ink-faint)", marginTop: 4, fontFamily: "var(--gx-font-mono)" }}>
                {COUNTRY_FLAG[t.funder_country] || t.funder_country} · {t.sections_total} bölüm
              </div>
            </button>
          );
        })}
      </div>

      <Label>2 · Program (opsiyonel — başvuruyu bir programına bağla)</Label>
      <select value={programId} onChange={(e) => setProgramId(e.target.value)} style={{ ...inp, marginBottom: 14, maxWidth: 420 }}>
        <option value="">— Program seçme —</option>
        {programs.map((p) => <option key={p.id} value={p.id}>{p.program_name || p.program_code}</option>)}
      </select>

      <Label>3 · Başlık</Label>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="örn. Anadolu geofitleri için in-situ koruma projesi" style={{ ...inp, marginBottom: 14 }} />

      <button onClick={create} disabled={busy} style={{
        padding: "9px 16px", fontSize: 12, fontWeight: 700, background: "var(--gx-success)", color: "#fff",
        border: "none", borderRadius: 8, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>
        {busy ? "Oluşturuluyor…" : "Oluştur ve yazmaya başla →"}
      </button>
    </div>
  );
}

function Label({ children }) {
  return <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--gx-ink-muted)", marginBottom: 6 }}>{children}</div>;
}
const inp = { width: "100%", padding: "8px 11px", fontSize: 12, background: "var(--gx-surface)", color: "var(--gx-ink)", border: "1px solid var(--gx-border-soft)", borderRadius: 7, boxSizing: "border-box" };
