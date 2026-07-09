"use client";
// InitialProgramSituation — GEOCON Sprint 1A (read-only).
// BEE Layer 1: conservation qualification operating picture.
// Sits above ProgramCockpit; does not replace rooms, engine, or DeepTech route.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../../lib/supabase";

const STAGES = [
  { key: "foundation", tr: "Foundation", en: "Foundation" },
  { key: "field_lab", tr: "Field & Lab", en: "Field & Lab" },
  { key: "propagation", tr: "Propagation", en: "Propagation" },
  { key: "deployment", tr: "Output", en: "Output" },
];

const STATUS_LABEL = {
  designing: { tr: "Tasarlanıyor", en: "Designing" },
  draft: { tr: "Taslak", en: "Draft" },
  active: { tr: "Aktif", en: "Active" },
  gate_ready: { tr: "Kapı hazır", en: "Gate ready" },
  producing: { tr: "Üretim", en: "Producing" },
  realized: { tr: "Gerçekleşti", en: "Realized" },
  paused: { tr: "Duraklatıldı", en: "Paused" },
  abandoned: { tr: "Bırakıldı", en: "Abandoned" },
};

// Mission Strip must not surface Layer 3 / commercial phrasing from legacy program fields.
const UNSAFE_MISSION_PATTERNS = [
  /\bcommercial\b/i,
  /\bcommerce\b/i,
  /\bmarket\b/i,
  /value\s*pathway/i,
  /\blicens/i,
  /\binvestment\b/i,
  /\bventure\b/i,
  /product\s*pathway/i,
  /commercial\s*pathway/i,
  /abs[-\s]*compliant\s*commercial/i,
  /\bticari\b/i,
  /\bdeğer\s*yolu/i,
  /\byatırım\b/i,
  /\bexchange\b/i,
  /\bbiovalue\b/i,
];

function isMissionTextBoundarySafe(text) {
  if (!text || !String(text).trim()) return false;
  return !UNSAFE_MISSION_PATTERNS.some((re) => re.test(String(text)));
}

function buildMissionSentence({ whyText, speciesName, lang }) {
  const tr = lang === "tr";
  const target = speciesName || (tr ? "hedef tür" : "target taxon");

  const defaultTr =
    `Bu program ${target} için bilimsel temel ve koruma nitelendirmesi oluşturuyor. ` +
    "Kimlik, tehdit bağlamı ve kanıt temeli üzerinde güvenli ilerleme sürüyor; " +
    "çoğaltım hazırlığı ve kamuya güvenli çıktı incelemesi henüz açık sınırlar.";
  const defaultEn =
    `This program is building scientific grounding and conservation qualification for ${target}. ` +
    "Work continues on identity, threat context, and evidence basis with safe progression; " +
    "propagation readiness and public-safe output review remain closed horizons.";

  const unsafeSourceTr =
    "Kaynak metin sınır-güvenli GEOCON diline uygun değil; " +
    "program bilimsel temel, koruma baskısı ve kanıt planlaması üzerinde ilerliyor.";
  const unsafeSourceEn =
    "Source text is not boundary-safe for GEOCON Layer 1; " +
    "the program advances scientific grounding, conservation pressure, and evidence planning.";

  if (whyText && isMissionTextBoundarySafe(whyText)) {
    return tr
      ? `Bu program ${target} için bilimsel temel oluşturuyor. ${whyText}`
      : `This program is building scientific grounding for ${target}. ${whyText}`;
  }

  if (whyText && !isMissionTextBoundarySafe(whyText)) {
    return tr
      ? `${defaultTr} ${unsafeSourceTr}`
      : `${defaultEn} ${unsafeSourceEn}`;
  }

  return tr ? defaultTr : defaultEn;
}

function evLabel(avg, lang) {
  const n = Number(avg) || 0;
  if (n <= 0) return lang === "tr" ? "henüz yok" : "not yet established";
  if (n < 0.25) return lang === "tr" ? "zayıf sinyal" : "weak signal";
  if (n < 0.5) return lang === "tr" ? "sınırlı sinyal" : "bounded signal";
  if (n < 0.75) return lang === "tr" ? "destekleyici sinyal" : "supportive signal";
  return lang === "tr" ? "güçlü sinyal" : "strong signal";
}

function SectionLabel({ children }) {
  return (
    <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">
      {children}
    </div>
  );
}

function Panel({ children, className = "" }) {
  return (
    <div className={`rounded-lg border border-slate-200 bg-slate-50/80 px-3.5 py-3 ${className}`}>
      {children}
    </div>
  );
}

export default function InitialProgramSituation({
  programId,
  program = {},
  lang = "tr",
  isMember = false,
}) {
  const [loading, setLoading] = useState(true);
  const [programRow, setProgramRow] = useState(null);
  const [stages, setStages] = useState(null);
  const [tics, setTics] = useState([]);

  useEffect(() => {
    if (!programId) return;
    let on = true;
    setLoading(true);
    Promise.all([
      supabase
        .from("programs")
        .select(
          "program_name, status, why_this_program, strategic_rationale, primary_blocker, what_is_missing, species_id"
        )
        .eq("id", programId)
        .maybeSingle(),
      ...STAGES.map((s) =>
        supabase.rpc("get_program_stage_status", { p_program_id: programId, p_stage: s.key })
      ),
      supabase.rpc("get_program_foundation_status", { p_program_id: programId }),
    ])
      .then((res) => {
        if (!on) return;
        setProgramRow(res[0]?.data || null);
        const st = STAGES.map((s, i) => ({ ...s, ...(res[i + 1]?.data || {}) }));
        setStages(st);
        setTics(res[STAGES.length + 1]?.data?.tics || []);
      })
      .catch(() => {})
      .finally(() => {
        if (on) setLoading(false);
      });
    return () => {
      on = false;
    };
  }, [programId]);

  const derived = useMemo(() => {
    if (!stages) return null;

    const active =
      stages.find((s) => s.gate_status === "blocked") ||
      stages.find((s) => s.gate_status === "empty" && (s.required_total || 0) === 0) ||
      stages[stages.length - 1];

    const stageLabel = active ? (lang === "tr" ? active.tr : active.en) : null;
    const nextId = active?.next_required_tic;
    const nextTic = nextId ? tics.find((t) => t.tic_id === nextId) : null;
    const nextLabel = nextTic
      ? lang === "tr"
        ? nextTic.label_tr || nextTic.label_en
        : nextTic.label_en || nextTic.label_tr
      : null;

    let blocker = null;
    let blockerWhy = null;
    if (active?.gate_status === "blocked") {
      if (active.block_reason === "evidence_weak") {
        blocker =
          lang === "tr"
            ? `${stageLabel} aşamasında kanıt sinyali henüz yeterli değil`
            : `Evidence signal is not yet sufficient at the ${stageLabel} stage`;
        blockerWhy =
          lang === "tr"
            ? "Kanıt gücü kapı geçişi için henüz yeterli değil; planlama ve toplama devam edebilir."
            : "Evidence strength is below the gate threshold; planning and collection may continue.";
      } else {
        blocker =
          lang === "tr"
            ? `${stageLabel} aşamasında zorunlu işler tamamlanmadı`
            : `Required work in ${stageLabel} is incomplete`;
        blockerWhy =
          lang === "tr"
            ? "Önkoşul işler tamamlanmadan sonraki güvenli adımlar açılmaz."
            : "Prerequisite work must be addressed before later safe steps open.";
      }
    }

    const dbBlocker = programRow?.primary_blocker?.trim();
    const dbMissing = programRow?.what_is_missing?.trim();
    if (dbBlocker && !blocker) blocker = dbBlocker;
    if (dbMissing && !blockerWhy) blockerWhy = dbMissing;

    const statusKey = (programRow?.status || "designing").toLowerCase();
    const statusText = STATUS_LABEL[statusKey]?.[lang] || statusKey;

    const foundationPassed = stages.find((s) => s.key === "foundation")?.gate_status === "passed";
    const fieldPassed = stages.find((s) => s.key === "field_lab")?.gate_status === "passed";
    const propagationPassed = stages.find((s) => s.key === "propagation")?.gate_status === "passed";
    const deploymentPassed = stages.find((s) => s.key === "deployment")?.gate_status === "passed";

    const biologicalActive = !foundationPassed || !fieldPassed || active?.key === "foundation" || active?.key === "field_lab";
    const propagationOpen = foundationPassed && fieldPassed;
    const outputOpen = propagationPassed;

    let nextSafe =
      lang === "tr"
        ? "Hedef kimlik, koruma bağlamı ve kanıt planlaması üzerinde çalışmaya devam edilebilir."
        : "Target identity, conservation context, and evidence planning may continue.";
    if (nextLabel) {
      nextSafe =
        lang === "tr"
          ? `Şu an güvenli odak: ${nextLabel} (planlama ve iç gözden geçirme; kanıt onayı değil).`
          : `Current safe focus: ${nextLabel} (planning and internal review; not evidence approval).`;
    }

    const evidenceState = evLabel(active?.avg_evidence_strength, lang);
    const avgStrength = Number(active?.avg_evidence_strength) || 0;
    const showTranslationNote = Boolean(
      foundationPassed || avgStrength >= 0.25
    );

    return {
      active,
      stageLabel,
      statusText,
      blocker,
      blockerWhy,
      nextSafe,
      evidenceState,
      biologicalActive,
      propagationOpen,
      propagationPassed,
      outputOpen,
      deploymentPassed,
      showTranslationNote,
    };
  }, [stages, tics, programRow, lang]);

  const title =
    program.title ??
    program.name ??
    programRow?.program_name ??
    (lang === "tr" ? "Program" : "Program");
  const speciesName = program.species_name || null;

  const whyText =
    programRow?.why_this_program?.trim() ||
    programRow?.strategic_rationale?.trim() ||
    null;

  const missionSentence = useMemo(
    () => buildMissionSentence({ whyText, speciesName, lang }),
    [whyText, speciesName, lang]
  );

  if (loading) {
    return (
      <div className="mb-4 h-40 rounded-xl border border-slate-200 bg-slate-50 animate-pulse" />
    );
  }

  const tr = lang === "tr";

  return (
    <section
      className="mb-4 rounded-xl border border-slate-300 bg-white"
      aria-label={tr ? "Program durumu" : "Program situation"}
    >
      <div className="border-b border-slate-200 px-4 py-2.5">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          {tr ? "Program durumu" : "Program situation"}
        </div>
        <p className="mt-0.5 text-[11px] text-slate-400">
          {tr ? "Salt okunur işletim özeti — nitelendirme yüzeyi" : "Read-only operating summary — qualification surface"}
        </p>
      </div>

      <div className="space-y-4 px-4 py-4">
        {/* A. Mission Strip */}
        <div>
          <SectionLabel>{tr ? "Görev özeti" : "Mission"}</SectionLabel>
          <h3 className="text-base font-semibold text-slate-900 leading-snug">{title}</h3>
          {speciesName && (
            <p className="mt-0.5 text-sm italic text-slate-600">
              {tr ? "Hedef çekirdek:" : "Target core:"} {speciesName}
              <span className="not-italic text-slate-400"> · {tr ? "tek takson" : "single taxon"}</span>
            </p>
          )}
          <p className="mt-2 text-[13px] leading-relaxed text-slate-700">{missionSentence}</p>
        </div>

        {/* B. Program State Summary */}
        <Panel>
          <SectionLabel>{tr ? "Güncel işletim durumu" : "Current operating state"}</SectionLabel>
          <dl className="grid gap-2 text-[13px] sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">{tr ? "Durum" : "Status"}</dt>
              <dd className="font-medium text-slate-900">
                {derived?.statusText || (tr ? "Henüz belirlenmedi" : "Not yet established")}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">{tr ? "Aktif aşama" : "Active stage"}</dt>
              <dd className="font-medium text-slate-900">
                {derived?.stageLabel || (tr ? "Henüz belirlenmedi" : "Not yet established")}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">{tr ? "Kanıt sinyali" : "Evidence signal"}</dt>
              <dd className="font-medium text-slate-700">
                {derived?.evidenceState || (tr ? "Henüz belirlenmedi" : "Not yet established")}
                <span className="ml-1 text-[11px] font-normal text-slate-400">
                  ({tr ? "onay değil" : "not approval"})
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">{tr ? "Bilimsel temel katmanı" : "Scientific grounding"}</dt>
              <dd className="font-medium text-slate-900">
                {derived?.biologicalActive
                  ? tr ? "Aktif" : "Active"
                  : tr ? "İlerleme kaydedildi" : "Progress recorded"}
              </dd>
            </div>
          </dl>
        </Panel>

        {/* C. Blocker / Still Possible */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Panel className={derived?.blocker ? "border-rose-200 bg-rose-50/40" : ""}>
            <SectionLabel>{tr ? "Engel" : "Blocked"}</SectionLabel>
            {derived?.blocker ? (
              <>
                <p className="text-[13px] font-medium text-rose-900">{derived.blocker}</p>
                {derived.blockerWhy && (
                  <p className="mt-1.5 text-[12px] leading-relaxed text-rose-800/90">{derived.blockerWhy}</p>
                )}
              </>
            ) : (
              <p className="text-[13px] text-slate-600">
                {tr ? "Belirgin bir engel kaydı yok." : "No prominent blocker on record."}
              </p>
            )}
          </Panel>
          <Panel className="border-emerald-100 bg-emerald-50/30">
            <SectionLabel>{tr ? "Hâlâ mümkün olan" : "Still possible"}</SectionLabel>
            <p className="text-[13px] leading-relaxed text-slate-700">{derived?.nextSafe}</p>
            <ul className="mt-2 space-y-1 text-[12px] text-slate-600">
              <li>{tr ? "Yapılandırılmış planlama ve iç gözden geçirme" : "Structured planning and internal review"}</li>
              <li>{tr ? "Koruma bağlamı ve kimlik çalışması" : "Conservation context and identity work"}</li>
              {isMember && (
                <li>{tr ? "Ekip içi notlar (üye alanı)" : "Internal team notes (member area)"}</li>
              )}
            </ul>
          </Panel>
        </div>

        {/* D. Evidence / Claim Boundary */}
        <Panel className="border-slate-300">
          <SectionLabel>{tr ? "Kanıt / iddia sınırı" : "Evidence / claim boundary"}</SectionLabel>
          <p className="text-[12px] leading-relaxed text-slate-600">
            {tr
              ? "Kanıt sinyali iddia onayı değildir. TIC tamamlanması iddia doğruluğu anlamına gelmez. Eksik veya planlanmış kanıt, tamamlanmış kanıt gibi gösterilmez."
              : "An evidence signal is not claim approval. TIC completion is not claim truth. Missing or planned evidence must not appear as completed evidence."}
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 text-[12px]">
            <div>
              <div className="font-semibold text-slate-700">{tr ? "Şu an izinli" : "Allowed now"}</div>
              <ul className="mt-1 list-disc pl-4 text-slate-600 space-y-0.5">
                <li>{tr ? "Yapılandırılmış planlama" : "Structured planning"}</li>
                <li>{tr ? "İç gözden geçirme" : "Internal review"}</li>
                <li>{tr ? "Bilimsel temel çalışması" : "Grounding work"}</li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-slate-700">{tr ? "Şu an yasak" : "Forbidden now"}</div>
              <ul className="mt-1 list-disc pl-4 text-slate-600 space-y-0.5">
                <li>{tr ? "Çıktı yayınlama" : "Publishing output"}</li>
                <li>{tr ? "İddia onayı" : "Claim approval"}</li>
                <li>{tr ? "Deneme başlatma" : "Starting a trial"}</li>
                <li>{tr ? "Ticari devir / değer yolu" : "Commercial handoff / value pathway"}</li>
              </ul>
            </div>
          </div>
        </Panel>

        {/* E. Safe Progression Horizons */}
        <div>
          <SectionLabel>{tr ? "Güvenli ilerleme ufukları" : "Safe progression horizons"}</SectionLabel>
          <p className="mb-2 text-[11px] text-slate-400">
            {tr ? "Yönlendirme etiketleri — eylem değil" : "Orientation labels only — not actions"}
          </p>
          <div className="flex flex-wrap gap-2">
            <HorizonChip
              label={tr ? "Biyolojik planlama" : "Biological planning"}
              active={derived?.biologicalActive}
              lang={lang}
            />
            <HorizonChip
              label={tr ? "Çoğaltım hazırlığı" : "Propagation readiness"}
              active={derived?.propagationOpen && !derived?.propagationPassed}
              locked={!derived?.propagationOpen}
              lang={lang}
            />
            <HorizonChip
              label={tr ? "Kamuya güvenli çıktı incelemesi" : "Public-safe output review"}
              locked={!derived?.outputOpen}
              lang={lang}
            />
          </div>
        </div>

        {/* F. Translation Boundary Signal */}
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-3.5 py-2.5">
          <SectionLabel>{tr ? "Çeviri sınırı" : "Translation boundary"}</SectionLabel>
          <p className="text-[12px] leading-relaxed text-slate-500">
            {derived?.showTranslationNote
              ? tr
                ? "GEOCON sinyali yeterince çerçevelenirse, ileride ayrı bir teknik çeviri incelemesi gerekebilir. Bu bir yürütme veya değer taahhüdü değildir."
                : "If the GEOCON signal becomes sufficiently framed, a separate technical translation review may become relevant later. This is not an execution or value commitment."
              : tr
                ? "Teknik çeviri incelemesi henür gündemde değil; önce bilimsel temel ve sınır-güvenli ilerleme gerekir."
                : "Technical translation review is not yet on the agenda; scientific grounding and boundary-safe progression come first."}
          </p>
          {derived?.showTranslationNote && (
            <Link
              href={`/geocon/programs/${programId}/deeptech`}
              className="mt-2 inline-block text-[11px] text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline"
            >
              {tr ? "Çeviri sınırı notu (salt okunur taslak)" : "Translation boundary note (read-only draft)"}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

function HorizonChip({ label, active = false, locked = false, lang = "tr" }) {
  const tr = lang === "tr";
  let cls =
    "rounded-md border px-2.5 py-1 text-[11px] font-medium ";
  if (locked) {
    cls += "border-slate-200 bg-slate-100/80 text-slate-400";
  } else if (active) {
    cls += "border-slate-300 bg-white text-slate-700";
  } else {
    cls += "border-slate-200 bg-slate-50 text-slate-500";
  }
  const suffix = locked ? (tr ? " · kilitli" : " · locked") : active ? (tr ? " · aktif" : " · active") : "";
  return (
    <span className={cls} aria-disabled="true">
      {label}
      <span className="font-normal">{suffix}</span>
    </span>
  );
}
