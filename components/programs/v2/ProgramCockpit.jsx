"use client";
// ProgramCockpit — Sprint 2, the felt layer.
//
// "Programs is the centre" makes this the top of the Program screen. It answers the
// one question a user actually has — "what are we trying to solve right now?" —
// DERIVED FROM THE ENGINE (active stage + next required tic + gate/evidence), not from
// the owner's manually-typed next_action. Plus Program Progress (the 2nd North-Star:
// verified TICs advanced). Money-blind; aggregate, so safe for non-members too. It sits
// above VennHero/HeroPanel as the hero; those stay below as the detail.

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

const STAGES = [
  { key: "foundation",  tr: "Foundation",  en: "Foundation" },
  { key: "field_lab",   tr: "Field & Lab", en: "Field & Lab" },
  { key: "propagation", tr: "Çoğaltım",    en: "Propagation" },
  { key: "deep_work",   tr: "Derin İş",    en: "Deep Work" },
  { key: "deployment",  tr: "Saha",        en: "Deployment" },
  { key: "governance",  tr: "Yönetişim",   en: "Governance" },
];

function ticLabel(id) {
  if (!id) return null;
  const tail = String(id).includes(".") ? String(id).split(".").slice(1).join(".") : id;
  const w = tail.replace(/_/g, " ");
  return w.charAt(0).toUpperCase() + w.slice(1);
}
function evLabel(avg, lang) {
  const n = Number(avg) || 0;
  if (n <= 0) return lang === "tr" ? "yok" : "none";
  if (n < 0.25) return lang === "tr" ? "zayıf" : "weak";
  if (n < 0.5)  return lang === "tr" ? "orta" : "moderate";
  if (n < 0.75) return lang === "tr" ? "güçlü" : "strong";
  return lang === "tr" ? "doğrulanmış" : "verified";
}

export default function ProgramCockpit({ programId, lang = "tr", onGoToTab, showActivity = false }) {
  const [stages, setStages] = useState(null);
  const [tics, setTics] = useState(null);
  const [outputCount, setOutputCount] = useState(0);

  useEffect(() => {
    if (!programId) return;
    let on = true;
    Promise.all([
      ...STAGES.map((s) => supabase.rpc("get_program_stage_status", { p_program_id: programId, p_stage: s.key })),
      supabase.rpc("get_program_foundation_status", { p_program_id: programId }),
      supabase.rpc("get_program_outputs", { p_program_id: programId, p_pathway_id: null }),
    ]).then((res) => {
      if (!on) return;
      const st = res.slice(0, STAGES.length).map((x, i) => ({ ...STAGES[i], ...(x.data || {}) }));
      setStages(st);
      setTics(res[STAGES.length]?.data?.tics || []);
      setOutputCount(res[STAGES.length + 1]?.data?.count ?? 0);
    }).catch(() => {});
    return () => { on = false; };
  }, [programId]);

  if (!stages || !tics) {
    return <div className="mb-5 h-32 rounded-2xl bg-slate-50 border border-slate-100 animate-pulse" />;
  }

  // Active stage = the frontier (first blocked), else first untouched, else last.
  const active = stages.find((s) => s.gate_status === "blocked")
    || stages.find((s) => s.gate_status === "empty" && (s.required_total || 0) === 0)
    || stages[stages.length - 1];
  const stageLabel = active ? (lang === "tr" ? active.tr : active.en) : "—";

  // Program Progress — verified TICs advanced (leaves only; groups are derived).
  const leaves = tics.filter((t) => !t.child_logic);
  const done = leaves.filter((t) => t.status === "completed" || t.status === "waived").length;
  const total = leaves.length;
  const pct = total > 0 ? Math.round((100 * done) / total) : 0;

  // The mission text — derived from the engine.
  const nextId = active?.next_required_tic;
  const nextTic = nextId ? (tics.find((t) => t.tic_id === nextId)) : null;
  const nextLabel = nextTic ? (lang === "tr" ? (nextTic.label_tr || nextTic.label_en) : (nextTic.label_en || nextTic.label_tr)) : ticLabel(nextId);
  const nextTab = nextTic?.tier === "foundation" ? "foundation" : "field_lab";

  // Most recent verified work (recent evidence).
  const recent = [...tics]
    .filter((t) => t.status === "completed" && t.completed_at)
    .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))[0];
  const recentLabel = recent ? (lang === "tr" ? (recent.label_tr || recent.label_en) : (recent.label_en || recent.label_tr)) : null;

  let mission;
  if (nextId) {
    mission = nextLabel;
  } else if (active?.gate_status === "blocked" && active?.block_reason === "evidence_weak") {
    mission = lang === "tr" ? `${stageLabel} kanıtını güçlendir` : `Strengthen the evidence in ${stageLabel}`;
  } else if (active?.gate_status === "passed") {
    mission = lang === "tr" ? "Kapılar geçildi — bir değer yolu aktive et" : "Gates passed — activate a value pathway";
  } else {
    mission = lang === "tr" ? `${stageLabel} sürüyor` : `${stageLabel} in progress`;
  }

  let blocker = null;
  if (active?.gate_status === "blocked") {
    blocker = active.block_reason === "evidence_weak"
      ? (lang === "tr" ? `Kanıt ${stageLabel} kapısını geçecek kadar güçlü değil` : `Evidence is too weak to pass the ${stageLabel} gate`)
      : (lang === "tr" ? `${stageLabel}'da zorunlu işler tamamlanmadı` : `Required work in ${stageLabel} is incomplete`);
  }

  return (
    <section className="mb-5 rounded-2xl border-2 border-emerald-100 bg-white p-5">
      {/* Current Mission — the hero (top ~30%) */}
      <div className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700 mb-1">
        {lang === "tr" ? "Şu anki misyon" : "Current mission"}
      </div>
      {nextTic && onGoToTab ? (
        <button
          onClick={() => onGoToTab(nextTab)}
          className="text-left text-xl font-semibold text-slate-900 leading-snug hover:text-emerald-700 transition inline-flex items-start gap-1.5"
          title={lang === "tr" ? "Bu adıma git" : "Go to this step"}
        >
          {mission}<span className="text-emerald-600 text-base mt-0.5">→</span>
        </button>
      ) : (
        <div className="text-xl font-semibold text-slate-900 leading-snug">{mission}</div>
      )}
      {blocker && (
        <div className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-rose-700">
          <span className="font-medium">{lang === "tr" ? "Engel:" : "Blocker:"}</span> {blocker}
        </div>
      )}

      {/* Metrics row — Program Progress (2nd North-Star) + stage + next + evidence */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg bg-slate-50 p-3">
          <div className="text-[11px] text-slate-500">{lang === "tr" ? "İlerleme" : "Progress"}</div>
          <div className="text-lg font-bold text-slate-900">{done}<span className="text-slate-400 text-sm"> / {total} TIC</span></div>
          <div className="mt-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <div className="text-[11px] text-slate-500">{lang === "tr" ? "Aşama" : "Stage"}</div>
          <div className="text-sm font-semibold text-slate-900 mt-0.5">{stageLabel}</div>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <div className="text-[11px] text-slate-500">{lang === "tr" ? "Sıradaki" : "Next"}</div>
          <div className="text-sm font-semibold text-slate-900 mt-0.5 truncate" title={nextLabel || ""}>
            {nextLabel || (lang === "tr" ? "—" : "—")}
          </div>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <div className="text-[11px] text-slate-500">{lang === "tr" ? "Kanıt" : "Evidence"}</div>
          <div className="text-sm font-semibold text-slate-900 mt-0.5">{evLabel(active?.avg_evidence_strength, lang)}</div>
        </div>
      </div>

      {/* At-a-glance strip — recent evidence · outputs · activity */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-slate-500">
        {recentLabel && (
          <span>
            <span className="text-slate-400">{lang === "tr" ? "Son kanıt:" : "Recent evidence:"}</span>{" "}
            <span className="text-slate-700">{recentLabel}</span>
          </span>
        )}
        <span>
          <span className="text-slate-400">{lang === "tr" ? "Çıktı:" : "Outputs:"}</span>{" "}
          <span className="text-slate-700">{outputCount}</span>
        </span>
        {onGoToTab && showActivity && (
          <button onClick={() => onGoToTab("stream")} className="text-emerald-700 hover:underline">
            {lang === "tr" ? "Ekip hareketi →" : "Team activity →"}
          </button>
        )}
      </div>
    </section>
  );
}
