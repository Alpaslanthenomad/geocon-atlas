"use client";
// Bahçe Phase 0 — opportunity detail workspace (admin-only).
//
// Sections:
//   1. Header — title, stage, status, frozen provenance summary
//   2. Edit panel — application, need, stage, status
//   3. Pitch outline — auto-drafted from provenance (generate_pitch_outline)
//   4. Matchmaking — ranked investors with fit_score, add-to-pipeline
//   5. Pipeline — kanban-ish list grouped by stage

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Sprout, FileText, Users, Sparkles, Plus, Check,
  ShieldAlert, ExternalLink, Copy,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";
import { useToast } from "../ui";
import Markdown from "./Markdown";
import { SkeletonList } from "../shared/Skeleton";

const PIPELINE_STAGES = ["matched","intro","nda","meeting","diligence","term_sheet","closed","passed"];
const STAGE_TINT = {
  matched: "var(--gx-ink-muted)", intro: "var(--gx-accent-azure)",
  nda: "var(--gx-accent-violet)", meeting: "var(--gx-accent-violet)",
  diligence: "var(--gx-warning)", term_sheet: "var(--gx-success)",
  closed: "var(--gx-success)", passed: "var(--gx-danger)",
};

export default function VentureDetailRoute({ opportunityId }) {
  const { profile, loading: authLoading } = useAuthContext();
  const isAdmin = profile?.role === "admin";
  const toast = useToast();
  const [opp, setOpp] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_bridge_opportunity", { p_id: opportunityId });
      if (error) throw error;
      setOpp(data || null);
    } catch (e) {
      toast.error("Yüklenemedi", { detail: e?.message });
    } finally { setLoading(false); }
  }
  useEffect(() => { if (isAdmin) load(); /* eslint-disable-next-line */ }, [isAdmin, opportunityId]);

  if (authLoading || (isAdmin && loading)) return <SkeletonList rows={5} rowHeight={70} />;
  if (!isAdmin) return <Forbidden />;
  if (!opp) return <div style={{ padding: 40, textAlign: "center", color: "var(--gx-ink-muted)" }}>Fırsat bulunamadı.</div>;

  const prov = opp.provenance_snapshot || {};
  const sp = prov.species || {};
  const oc = prov.outcome || {};

  return (
    <main style={{ maxWidth: 920, margin: "0 auto", padding: "20px 16px 60px" }}>
      <Link href="/exchange/desk" style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        fontSize: 11, color: "var(--gx-ink-soft)", textDecoration: "none", marginBottom: 14,
      }}>
        <ArrowLeft size={11} strokeWidth={2} /> The Garden
      </Link>

      <header style={{ marginBottom: 16 }}>
        <div className="gx-overline" style={{ color: "#0F6E56" }}>Opportunity · internal</div>
        <h1 style={{
          fontFamily: "var(--gx-font-display)", fontSize: 26, fontWeight: 700,
          letterSpacing: "-0.02em", color: "var(--gx-ink)", margin: "2px 0 8px 0",
          display: "inline-flex", alignItems: "center", gap: 10,
        }}>
          <Sprout size={19} strokeWidth={1.85} style={{ color: "#1D9E75" }} />
          {opp.title}
        </h1>
        {/* Provenance summary — frozen evidence from GEOCON */}
        <div style={{
          padding: 11, borderRadius: 9,
          background: "color-mix(in srgb, #0F6E56 6%, var(--gx-card-bg))",
          border: "1px solid var(--gx-card-border)",
          fontSize: 11, color: "var(--gx-ink-soft)", lineHeight: 1.6,
        }}>
          <strong style={{ color: "#0F6E56" }}>Frozen provenance</strong> ·{" "}
          {sp.name && (
            <Link href={`/geocon/species/${encodeURIComponent(sp.id)}`}
              style={{ fontFamily: "var(--gx-font-serif)", fontStyle: "italic", color: "var(--gx-accent-azure)", textDecoration: "none" }}>
              {sp.name}
            </Link>
          )}
          {sp.iucn_status && <> · IUCN {sp.iucn_status}</>}
          {oc.title && <> · outcome "{oc.title}" ({oc.verification})</>}
          {typeof oc.endorsements === "number" && <> · {oc.endorsements} endorsements</>}
        </div>
      </header>

      <EditPanel opp={opp} onSaved={load} />
      <PitchPanel opportunityId={opportunityId} />
      <MatchPanel opportunityId={opportunityId} />
    </main>
  );
}

function EditPanel({ opp, onSaved }) {
  const toast = useToast();
  const [f, setF] = useState({
    title: opp.title || "",
    application: opp.commercial_application_md || "",
    need_kind: opp.need_kind || "funding",
    stage: opp.stage || "idea",
    status: opp.status || "draft",
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const { error } = await supabase.rpc("update_bridge_opportunity", {
        p_id: opp.id, p_title: f.title, p_application_md: f.application,
        p_need_kind: f.need_kind, p_stage: f.stage, p_status: f.status,
      });
      if (error) throw error;
      toast.success("Kaydedildi");
      onSaved();
    } catch (e) { toast.error("Kayıt başarısız", { detail: e?.message }); }
    finally { setSaving(false); }
  }

  return (
    <section style={card}>
      <div className="gx-overline" style={{ marginBottom: 8 }}>Opportunity detail</div>
      <input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} style={{ ...inp, fontWeight: 700, marginBottom: 8 }} />
      <textarea rows={4} value={f.application} onChange={(e) => setF({ ...f, application: e.target.value })}
        placeholder="Ticari uygulama nedir? (markdown)" style={{ ...inp, resize: "vertical", marginBottom: 8 }} />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Select label="Need" value={f.need_kind} opts={["funding","partner","license","grant"]} onChange={(v) => setF({ ...f, need_kind: v })} />
        <Select label="Stage" value={f.stage} opts={["idea","prototype","pilot","scaling"]} onChange={(v) => setF({ ...f, stage: v })} />
        <Select label="Status" value={f.status} opts={["draft","active","parked","closed"]} onChange={(v) => setF({ ...f, status: v })} />
      </div>
      <button onClick={save} disabled={saving}
        style={{ marginTop: 10, padding: "8px 16px", fontSize: 12, fontWeight: 700,
                 background: "#0F6E56", color: "#fff", border: "none", borderRadius: 7,
                 cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
        {saving ? "Kaydediliyor…" : "Kaydet"}
      </button>
    </section>
  );
}

function PitchPanel({ opportunityId }) {
  const toast = useToast();
  const [md, setMd] = useState(null);
  const [loading, setLoading] = useState(false);

  async function gen() {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("generate_pitch_outline", { p_id: opportunityId });
      if (error) throw error;
      setMd(data || "");
    } catch (e) { toast.error("Üretilemedi", { detail: e?.message }); }
    finally { setLoading(false); }
  }

  function copy() {
    if (md) { navigator.clipboard?.writeText(md); toast.success("Panoya kopyalandı"); }
  }

  return (
    <section style={card}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
        <div className="gx-overline" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Sparkles size={11} strokeWidth={2} style={{ color: "var(--gx-accent-violet)" }} /> Pitch outline
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {md && (
            <button onClick={copy} style={ghostSm}>
              <Copy size={10} strokeWidth={2} /> Kopyala
            </button>
          )}
          <button onClick={gen} disabled={loading} style={primarySm}>
            <FileText size={10} strokeWidth={2.2} /> {loading ? "…" : md ? "Yeniden üret" : "Taslak üret"}
          </button>
        </div>
      </div>
      {md ? (
        <div style={{
          padding: 12, background: "var(--gx-surface-2)",
          border: "1px solid var(--gx-border-soft)", borderRadius: 8,
        }}>
          <Markdown>{md}</Markdown>
        </div>
      ) : (
        <p style={{ fontSize: 11, color: "var(--gx-ink-muted)", fontStyle: "italic", margin: 0 }}>
          Provenance'tan otomatik bir deck iskeleti üretilir (6 bölüm). Düzenleyip
          gönderebilirsin — GEOCON kanıt zinciri zaten dolu gelir.
        </p>
      )}
    </section>
  );
}

function MatchPanel({ opportunityId }) {
  const toast = useToast();
  const [matches, setMatches] = useState([]);
  const [pipeline, setPipeline] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [m, p] = await Promise.all([
        supabase.rpc("match_investors_for_opportunity", { p_opp_id: opportunityId }),
        supabase.rpc("list_opportunity_pipeline", { p_opp_id: opportunityId }),
      ]);
      setMatches(Array.isArray(m.data) ? m.data : []);
      setPipeline(Array.isArray(p.data) ? p.data : []);
    } catch (e) { toast.error("Yüklenemedi", { detail: e?.message }); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [opportunityId]);

  async function addToPipeline(investorId) {
    try {
      const { error } = await supabase.rpc("set_pipeline_stage", {
        p_opp_id: opportunityId, p_investor_id: investorId, p_stage: "matched", p_notes_md: null,
      });
      if (error) throw error;
      load();
    } catch (e) { toast.error("Eklenemedi", { detail: e?.message }); }
  }

  async function moveStage(investorId, stage) {
    try {
      await supabase.rpc("set_pipeline_stage", { p_opp_id: opportunityId, p_investor_id: investorId, p_stage: stage, p_notes_md: null });
      load();
    } catch (e) { toast.error("Güncellenemedi", { detail: e?.message }); }
  }

  async function removeInv(investorId) {
    try {
      await supabase.rpc("remove_from_pipeline", { p_opp_id: opportunityId, p_investor_id: investorId });
      load();
    } catch (e) { toast.error("Çıkarılamadı", { detail: e?.message }); }
  }

  return (
    <section style={card}>
      <div className="gx-overline" style={{ marginBottom: 10, display: "inline-flex", alignItems: "center", gap: 6 }}>
        <Users size={11} strokeWidth={2} /> Matchmaking & pipeline
      </div>

      {loading ? <SkeletonList rows={3} rowHeight={48} /> : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Candidates */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--gx-ink-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
              Candidates ({matches.filter((m) => !m.already_in_pipeline).length})
            </div>
            {matches.filter((m) => !m.already_in_pipeline).length === 0 ? (
              <Empty text="CRM'e yatırımcı ekle, eşleştirme burada çıkar." />
            ) : (
              <ul style={listReset}>
                {matches.filter((m) => !m.already_in_pipeline).slice(0, 12).map((m) => (
                  <li key={m.investor_id} style={miniRow}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--gx-ink)" }}>{m.name}</div>
                      <div style={{ fontSize: 10, color: "var(--gx-ink-muted)" }}>
                        {m.fund || m.kind}{m.impact_focus ? " · impact" : ""}
                      </div>
                    </div>
                    <span title="fit score" style={{
                      fontFamily: "var(--gx-font-mono)", fontWeight: 700, fontSize: 12,
                      color: m.fit_score >= 60 ? "var(--gx-success)" : m.fit_score >= 30 ? "var(--gx-warning)" : "var(--gx-ink-muted)",
                    }}>{m.fit_score}</span>
                    <button onClick={() => addToPipeline(m.investor_id)} title="Pipeline'a ekle"
                      style={iconBtn}><Plus size={12} strokeWidth={2.4} /></button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Pipeline */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--gx-ink-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
              In pipeline ({pipeline.length})
            </div>
            {pipeline.length === 0 ? (
              <Empty text="Adaylardan + ile ekle." />
            ) : (
              <ul style={listReset}>
                {pipeline.map((p) => (
                  <li key={p.investor_id} style={{ ...miniRow, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--gx-ink)" }}>{p.name}</div>
                      {p.contact_email && (
                        <a href={`mailto:${p.contact_email}`} style={{ fontSize: 10, color: "var(--gx-accent-azure)", textDecoration: "none" }}>
                          {p.contact_email}
                        </a>
                      )}
                      {p.warm_intro_path && <div style={{ fontSize: 9, color: "var(--gx-ink-muted)", fontStyle: "italic" }}>{p.warm_intro_path}</div>}
                    </div>
                    <select value={p.pipeline_stage} onChange={(e) => moveStage(p.investor_id, e.target.value)}
                      style={{
                        fontSize: 10, padding: "3px 6px", borderRadius: 6,
                        background: `color-mix(in srgb, ${STAGE_TINT[p.pipeline_stage]} 16%, transparent)`,
                        color: STAGE_TINT[p.pipeline_stage], fontWeight: 700,
                        border: `1px solid ${STAGE_TINT[p.pipeline_stage]}`,
                        fontFamily: "var(--gx-font-mono)",
                      }}>
                      {PIPELINE_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button onClick={() => removeInv(p.investor_id)} title="Çıkar" style={{ ...iconBtn, color: "var(--gx-danger)" }}>×</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function Forbidden() {
  return (
    <div style={{ maxWidth: 460, margin: "80px auto", padding: 30, textAlign: "center",
                  background: "var(--gx-danger-soft)", color: "var(--gx-danger)",
                  border: "1px solid var(--gx-danger)", borderRadius: 12 }}>
      <ShieldAlert size={26} strokeWidth={1.6} style={{ marginBottom: 6 }} />
      <div style={{ fontFamily: "var(--gx-font-display)", fontSize: 18, fontWeight: 700 }}>Internal workspace</div>
    </div>
  );
}

function Select({ label, value, opts, onChange }) {
  return (
    <div>
      <div style={{ fontSize: 9, color: "var(--gx-ink-muted)", marginBottom: 2, textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.4 }}>{label}</div>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={inp}>
        {opts.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
function Empty({ text }) {
  return <div style={{ fontSize: 11, color: "var(--gx-ink-muted)", fontStyle: "italic", padding: "10px 0" }}>{text}</div>;
}

const card = { padding: 14, marginTop: 12, background: "var(--gx-card-bg)", border: "1px solid var(--gx-card-border)", borderRadius: 11 };
const inp = { padding: "7px 9px", fontSize: 12, width: "100%", boxSizing: "border-box",
  background: "var(--gx-surface)", color: "var(--gx-ink)", border: "1px solid var(--gx-border-soft)", borderRadius: 7, outline: "none", fontFamily: "var(--gx-font-body)" };
const listReset = { listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 };
const miniRow = { display: "flex", alignItems: "center", gap: 8, padding: "7px 9px", background: "var(--gx-surface-2)", border: "1px solid var(--gx-border-soft)", borderRadius: 7 };
const iconBtn = { width: 24, height: 24, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 6, border: "1px solid var(--gx-border-soft)", background: "transparent", color: "var(--gx-ink-soft)", cursor: "pointer", fontSize: 14, flexShrink: 0 };
const primarySm = { display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, padding: "5px 10px", background: "var(--gx-accent-violet)", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" };
const ghostSm = { display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, padding: "5px 10px", background: "transparent", color: "var(--gx-ink-soft)", border: "1px solid var(--gx-border-soft)", borderRadius: 6, cursor: "pointer" };
