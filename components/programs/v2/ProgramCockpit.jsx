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

// Stage-derived "opportunity" — what completing the active stage's gate unlocks.
const STAGE_OPP = {
  foundation:  { tr: "Bu kapı geçilince program ön-onay alır ve değer yolları beyan edilebilir.", en: "Passing this gate pre-approves the program and unlocks value pathways." },
  field_lab:   { tr: "Bu kapı geçilince bir değer yolu (pathway) aktive edilebilir.", en: "Passing this gate lets a value pathway activate." },
  propagation: { tr: "Bu adım, türü doğaya geri kazandırma yolunu açar.", en: "This step opens the path to returning the species to the wild." },
  deployment:  { tr: "Bu adım, korunma çıktısını (restorasyon) tamamlar.", en: "This step completes the conservation outcome (restoration)." },
};

// A tic LABEL is a finished state ("Taxonomic identity verified"). As the CURRENT MISSION it
// must read as work TO DO, not as already done — so phrase it imperatively.
const MISSION_VERB = {
  "cons.threat_analysis":              { tr: "Tehdit analizini tamamla", en: "Complete the threat analysis" },
  "cons.ex_situ_strategy":             { tr: "Ex situ koruma stratejisini tanımla", en: "Define the ex-situ strategy" },
  "sci.taxonomy_verified":             { tr: "Taksonomik kimliği doğrula", en: "Verify the taxonomic identity" },
  "cons.baseline_assessment":          { tr: "Popülasyon temel değerlendirmesini yap", en: "Do the baseline population assessment" },
  "cons.material_secured":             { tr: "Koruma materyalini güvenceye al", en: "Secure conservation material" },
  "cons.viability_check":              { tr: "Materyal canlılığını doğrula", en: "Verify material viability" },
  "sci.specimen_documented":           { tr: "Örnek / voucher belgele", en: "Document the specimen / voucher" },
  "sci.morphological_characterization":{ tr: "Morfolojik karakterizasyonu yap", en: "Do the morphological characterization" },
};

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
  const [speciesId, setSpeciesId] = useState(null);

  useEffect(() => {
    if (!programId) return;
    let on = true;
    Promise.all([
      ...STAGES.map((s) => supabase.rpc("get_program_stage_status", { p_program_id: programId, p_stage: s.key })),
      supabase.rpc("get_program_foundation_status", { p_program_id: programId }),
      supabase.rpc("get_program_outputs", { p_program_id: programId, p_pathway_id: null }),
      supabase.from("programs").select("species_id").eq("id", programId).maybeSingle(),
    ]).then((res) => {
      if (!on) return;
      const st = res.slice(0, STAGES.length).map((x, i) => ({ ...STAGES[i], ...(x.data || {}) }));
      setStages(st);
      setTics(res[STAGES.length]?.data?.tics || []);
      setOutputCount(res[STAGES.length + 1]?.data?.count ?? 0);
      setSpeciesId(res[STAGES.length + 3]?.data?.species_id || null);
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
  const nextDesc = nextTic ? (lang === "tr" ? (nextTic.description_tr || nextTic.description_en) : (nextTic.description_en || nextTic.description_tr)) : null;
  const opportunity = active ? (STAGE_OPP[active.key]?.[lang] || null) : null;

  // Most recent verified work (recent evidence).
  const recent = [...tics]
    .filter((t) => t.status === "completed" && t.completed_at)
    .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))[0];
  const recentLabel = recent ? (lang === "tr" ? (recent.label_tr || recent.label_en) : (recent.label_en || recent.label_tr)) : null;

  // Studio Launcher (Sprint 2) — role × objective entry points into the work surfaces.
  // The first DEEP studio (Propagation) is built next; these are entry points for now.
  const STUDIOS = [
    { label: lang === "tr" ? "Çoğaltım Stüdyosu" : "Propagation Studio", hint: lang === "tr" ? "denemeler · canlı log · kanıta terfi" : "trials · live log · promote to evidence", href: `/geocon/programs/${programId}/propagation` },
    { label: lang === "tr" ? "Tez Stüdyosu" : "Thesis Studio", href: "/geocon/thesis" },
    { label: lang === "tr" ? "Saha Stüdyosu" : "Field Studio", href: "/geocon/field" },
    { label: lang === "tr" ? "Grant Stüdyosu" : "Grant Studio", href: "/geocon/grant-studio" },
  ].filter(Boolean);

  let mission;
  if (nextId) {
    mission = (MISSION_VERB[nextId] && MISSION_VERB[nextId][lang]) || (lang === "tr" ? `${nextLabel} — tamamla` : `Complete: ${nextLabel}`);
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

      {/* Mission narrative — why this matters + what completing it unlocks */}
      {(nextDesc || opportunity) && (
        <div className="mt-2.5 max-w-2xl space-y-1 text-[12.5px] leading-relaxed">
          {nextDesc && (
            <p className="text-slate-600">
              <span className="font-medium text-slate-500">{lang === "tr" ? "Neden: " : "Why: "}</span>{nextDesc}
            </p>
          )}
          {opportunity && (
            <p className="text-emerald-800">
              <span className="font-medium">{lang === "tr" ? "Tamamlanınca açılır: " : "What this unlocks: "}</span>{opportunity}
            </p>
          )}
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

      {/* Studio Launcher — role × objective entry into the work surfaces */}
      <div className="mt-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
          {lang === "tr" ? "Stüdyolar" : "Studios"}
        </div>
        <div className="flex flex-wrap gap-2">
          {STUDIOS.map((w) => (
            <a
              key={w.href}
              href={w.href}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 transition no-underline"
              title={w.hint || ""}
            >
              {w.label}
              <span className="text-slate-300">→</span>
            </a>
          ))}
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
