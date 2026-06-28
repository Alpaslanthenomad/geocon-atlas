"use client";
// DeepTechStudio — Sprint 1A local draft (DeepTech Translation Case).
// Shared technical translation layer; launched from a Program context, not a Program room.
// Editable in-browser only — no DB, RPCs, runs, samples, batches, or evidence promotion.

import { useState } from "react";
import Link from "next/link";

const EDITABLE_FIELDS = [
  {
    key: "sourceSignal",
    tr: "Kaynak Sinyal",
    en: "Source Signal",
    trPlaceholder: "[EKLE:] Programa giren ham sinyal — saha gözlemi, literatür özeti veya ön analiz ipucu.",
    enPlaceholder: "[ADD:] Raw signal entering the program — field observation, literature summary, or preliminary assay hint.",
  },
  {
    key: "translationObject",
    tr: "Çeviri Nesnesi",
    en: "Translation Object",
    trPlaceholder: "[EKLE:] Sinyalin teknik nesneye nasıl çevrildiği — örn. belirli bir metabolit profili sorusu, morfolojik varyant, veya protokol varsayımı.",
    enPlaceholder: "[ADD:] How the signal becomes a technical object — e.g. a metabolite profile question, morphological variant, or protocol assumption.",
  },
  {
    key: "technicalQuestion",
    tr: "Teknik Soru",
    en: "Technical Question",
    trPlaceholder: "[EKLE:] Yanıtlanabilir teknik soru — kontrollü deneme öncesi akıl yürütme hedefi.",
    enPlaceholder: "[ADD:] Answerable technical question — the reasoning target before any controlled trial.",
  },
  {
    key: "methodRoute",
    tr: "Yöntem Rotası",
    en: "Method Route",
    trPlaceholder: "[EKLE:] Aday yöntem rotası (ör. HPLC profil, morfolojik matris, ekstraksiyon taslağı). Seçim kanıt üretmez.",
    enPlaceholder: "[ADD:] Candidate method route (e.g. HPLC profile, morphological matrix, extraction sketch). Selection does not produce evidence.",
  },
  {
    key: "traceabilityContext",
    tr: "İzlenebilirlik Bağlamı",
    en: "Traceability Context",
    trPlaceholder: "[EKLE:] Tür/program bağlantısı, kaynak türü, bilinen boşluklar — provenance etiketli.",
    enPlaceholder: "[ADD:] Species/program anchor, source kind, known gaps — provenance-labelled.",
  },
];

const EMPTY_DRAFT = {
  sourceSignal: "",
  translationObject: "",
  technicalQuestion: "",
  methodRoute: "",
  traceabilityContext: "",
};

const CONTRACT_POINTS = [
  "DeepTech is a technical reasoning instrument, not a lab execution system.",
  "Method Route selected does not produce technical evidence.",
  "No controlled run exists in this MVP.",
  "TCR is a technical state, not a score.",
];

function hasText(value) {
  return Boolean(value && String(value).trim());
}

function computeTcr(draft) {
  const obj = hasText(draft.translationObject);
  const q = hasText(draft.technicalQuestion);
  const route = hasText(draft.methodRoute);
  const trace = hasText(draft.traceabilityContext);

  if (!obj || !q) return "tcr-0";
  if (route && trace) return "tcr-2-preview";
  return "tcr-1";
}

function nextSafeStep(draft, lang) {
  const T = (tr, en) => (lang === "tr" ? tr : en);
  if (!hasText(draft.translationObject)) {
    return T("Çeviri Nesnesini tanımla.", "Define the Translation Object.");
  }
  if (!hasText(draft.technicalQuestion)) {
    return T("Teknik Soruyu tanımla.", "Define the Technical Question.");
  }
  if (!hasText(draft.methodRoute)) {
    return T("Aday bir Yöntem Rotası seç veya tanımla.", "Select or describe a candidate Method Route.");
  }
  if (!hasText(draft.traceabilityContext)) {
    return T("İzlenebilirlik bağlamını netleştir.", "Clarify traceability context.");
  }
  return T(
    "Kalıcılık Sprint 1B'de gelmeden önce taslağı gözden geçir.",
    "Review the draft before persistence is introduced in Sprint 1B."
  );
}

function tcrLabel(state, lang) {
  const T = (tr, en) => (lang === "tr" ? tr : en);
  if (state === "tcr-0") {
    return {
      label: "TCR-0",
      body: T(
        "Çeviri Nesnesi veya Teknik Soru henüz tanımlanmadı. (TCR bir skor değil, teknik durumdur.)",
        "Translation Object or Technical Question not yet defined. (TCR is a technical state, not a score.)"
      ),
    };
  }
  if (state === "tcr-1") {
    return {
      label: "TCR-1",
      body: T(
        "Çeviri Nesnesi ve Teknik Soru taslakta mevcut. Yöntem Rotası veya İzlenebilirlik Bağlamı eksik. (TCR bir skor değil, teknik durumdur.)",
        "Translation Object and Technical Question are drafted. Method Route or Traceability Context still missing. (TCR is a technical state, not a score.)"
      ),
    };
  }
  return {
    label: T("TCR-2 (önizleme)", "TCR-2 (preview)"),
    body: T(
      "Dört alan taslakta dolu — yalnızca akıl yürütme önizlemesi; kanıt veya yürütme ima etmez. TCR-3 kapsam dışı.",
      "All four framing fields are drafted — reasoning preview only; does not imply evidence or execution. TCR-3 is out of scope."
    ),
  };
}

const BOUNDARY = {
  tr: "Deneme, koşu, örnek, parti, kanıt terfisi, değer yolu veya ticari yüzey yok. Yöntem rotası seçimi teknik kanıt üretmez.",
  en: "No experiment, run, sample, batch, evidence promotion, value pathway, or commercial surface. Method route selection does not produce technical evidence.",
};

export default function DeepTechStudio({ programId, lang = "tr" }) {
  const T = (tr, en) => (lang === "tr" ? tr : en);
  const [draft, setDraft] = useState(EMPTY_DRAFT);

  const tcr = computeTcr(draft);
  const tcrDisplay = tcrLabel(tcr, lang);
  const nextStep = nextSafeStep(draft, lang);

  function setField(key, value) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function resetDraft() {
    setDraft(EMPTY_DRAFT);
  }

  return (
    <div className="mx-auto max-w-3xl p-5 md:p-7">
      <header className="mb-6">
        <Link
          href={`/geocon/programs/${programId}`}
          className="text-xs text-emerald-700 no-underline hover:underline"
        >
          &larr; {T("Programa dön", "Back to Program")}
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-slate-900">
          DeepTech Translation Case — Draft
        </h1>
        <p className="mt-1 text-[13px] text-slate-600">
          {T("İlk Teknik Durum", "Initial Technical Situation")}
          {programId ? (
            <span className="text-slate-400"> · {String(programId).slice(0, 8)}…</span>
          ) : null}
        </p>
        <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] text-slate-700">
          {T(
            "Bu ekran bir GEOCON Program bağlamından açılır; ancak DeepTech ayrı bir teknik çeviri katmanıdır.",
            "This screen is launched from a GEOCON Program context, but DeepTech is a separate technical translation layer."
          )}
        </p>
        <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-900">
          {T(
            "Bu Sprint 1A taslağı yalnızca tarayıcı içinde düzenlenir; henüz veritabanına kaydedilmez.",
            "This Sprint 1A draft is editable in the browser only; it is not saved to the database yet."
          )}
        </p>
        <p className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] text-slate-700">
          DeepTech is a technical reasoning instrument, not a lab execution system.
        </p>
      </header>

      <nav className="mb-6 flex flex-wrap gap-2" aria-label={T("İzin verilen eylemler", "Allowed actions")}>
        <Link
          href={`/geocon/programs/${programId}`}
          className="inline-flex rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 no-underline hover:border-emerald-300 hover:bg-emerald-50"
        >
          {T("Programa dön", "Back to Program")}
        </Link>
        <a
          href="#situation"
          className="inline-flex rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 no-underline hover:bg-emerald-100"
        >
          {T("Teknik durumu gözden geçir", "Review technical situation")}
        </a>
        <a
          href="#contract"
          className="inline-flex rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 no-underline hover:border-emerald-300 hover:bg-emerald-50"
        >
          {T("Sözleşmeyi oku", "Read contract")}
        </a>
        <button
          type="button"
          onClick={resetDraft}
          className="inline-flex rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50"
        >
          {T("Yerel taslağı sıfırla", "Reset local draft")}
        </button>
      </nav>

      <div id="situation" className="space-y-4 scroll-mt-6">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {T("İlk Teknik Durum", "Initial Technical Situation")}
        </h2>

        {EDITABLE_FIELDS.map((field) => (
          <section
            key={field.key}
            className="rounded-xl border border-slate-200 bg-white p-4"
          >
            <label
              htmlFor={`deeptech-${field.key}`}
              className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700"
            >
              {T(field.tr, field.en)}
            </label>
            <textarea
              id={`deeptech-${field.key}`}
              value={draft[field.key]}
              onChange={(e) => setField(field.key, e.target.value)}
              placeholder={T(field.trPlaceholder, field.enPlaceholder)}
              rows={3}
              className="mt-2 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-200"
            />
          </section>
        ))}

        <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
            {T("Güncel TCR Durumu", "Current TCR State")}
          </h3>
          <p className="mt-2 text-sm font-medium text-slate-800">{tcrDisplay.label}</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">{tcrDisplay.body}</p>
        </section>

        <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
            {T("Sonraki Güvenli Teknik Adım", "Next Safe Technical Step")}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">{nextStep}</p>
        </section>

        <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
            {T("Sınır Özeti", "Boundary Summary")}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{T(BOUNDARY.tr, BOUNDARY.en)}</p>
        </section>
      </div>

      <aside
        id="contract"
        className="mt-8 scroll-mt-6 rounded-xl border-2 border-slate-200 bg-slate-50 p-5"
      >
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {T("DeepTech MVP Sözleşmesi", "DeepTech MVP Contract")}
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          {CONTRACT_POINTS.map((line) => (
            <li key={line} className="flex gap-2">
              <span className="text-slate-400 shrink-0">—</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[12px] text-slate-500">
          {T(
            "Tam sözleşme: docs/architecture/DEEPTECH-MVP-CONTRACT.md",
            "Full contract: docs/architecture/DEEPTECH-MVP-CONTRACT.md"
          )}
        </p>
      </aside>
    </div>
  );
}
