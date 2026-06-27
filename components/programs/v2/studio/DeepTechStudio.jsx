"use client";
// DeepTechStudio — Sprint 0 static shell (DeepTech Translation Case).
// Shared technical translation layer; launched from a Program context, not a Program room.
// No trials, runs, samples, batches, evidence promotion, or pathway logic.

import Link from "next/link";

const SECTIONS = [
  {
    key: "source_signal",
    tr: "Kaynak Sinyal",
    en: "Source Signal",
    trBody: "[EKLE:] Programa giren ham sinyal — saha gözlemi, literatür özeti veya ön analiz ipucu.",
    enBody: "[ADD:] Raw signal entering the program — field observation, literature summary, or preliminary assay hint.",
  },
  {
    key: "translation_object",
    tr: "Çeviri Nesnesi",
    en: "Translation Object",
    trBody: "[EKLE:] Sinyalin teknik nesneye nasıl çevrildiği — örn. belirli bir metabolit profili sorusu, morfolojik varyant, veya protokol varsayımı.",
    enBody: "[ADD:] How the signal becomes a technical object — e.g. a metabolite profile question, morphological variant, or protocol assumption.",
  },
  {
    key: "technical_question",
    tr: "Teknik Soru",
    en: "Technical Question",
    trBody: "[EKLE:] Yanıtlanabilir teknik soru — kontrollü deneme öncesi akıl yürütme hedefi.",
    enBody: "[ADD:] Answerable technical question — the reasoning target before any controlled trial.",
  },
  {
    key: "method_route",
    tr: "Yöntem Rotası",
    en: "Method Route",
    trBody: "[EKLE:] Aday yöntem rotası (ör. HPLC profil, morfolojik matris, ekstraksiyon taslağı). Seçim kanıt üretmez.",
    enBody: "[ADD:] Candidate method route (e.g. HPLC profile, morphological matrix, extraction sketch). Selection does not produce evidence.",
  },
  {
    key: "traceability",
    tr: "İzlenebilirlik Bağlamı",
    en: "Traceability Context",
    trBody: "[EKLE:] Tür/program bağlantısı, kaynak türü, bilinen boşluklar — provenance etiketli.",
    enBody: "[ADD:] Species/program anchor, source kind, known gaps — provenance-labelled.",
  },
  {
    key: "tcr_state",
    tr: "Güncel TCR Durumu",
    en: "Current TCR State",
    trBody: "TCR-0 — Kaynak sinyal alındı; teknik durum henüz çerçevelenmedi. (TCR bir skor değil, teknik durumdur.)",
    enBody: "TCR-0 — Source signal received; technical situation not yet framed. (TCR is a technical state, not a score.)",
  },
  {
    key: "next_step",
    tr: "Sonraki Güvenli Teknik Adım",
    en: "Next Safe Technical Step",
    trBody: "Teknik durumu gözden geçir; çeviri nesnesi ve teknik soruyu netleştir. Kontrollü deneme başlatma — bu MVP kapsamı dışında.",
    enBody: "Review the technical situation; clarify the translation object and technical question. Starting a controlled trial is outside this MVP.",
  },
  {
    key: "boundary",
    tr: "Sınır Özeti",
    en: "Boundary Summary",
    trBody: "Deneme, koşu, örnek, parti, kanıt terfisi, değer yolu veya ticari yüzey yok. Yöntem rotası seçimi teknik kanıt üretmez.",
    enBody: "No experiment, run, sample, batch, evidence promotion, value pathway, or commercial surface. Method route selection does not produce technical evidence.",
  },
];

const CONTRACT_POINTS = [
  "DeepTech is a technical reasoning instrument, not a lab execution system.",
  "Method Route selected does not produce technical evidence.",
  "No controlled run exists in this MVP.",
  "TCR is a technical state, not a score.",
];

export default function DeepTechStudio({ programId, lang = "tr" }) {
  const T = (tr, en) => (lang === "tr" ? tr : en);

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
      </nav>

      <div id="situation" className="space-y-4 scroll-mt-6">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {T("İlk Teknik Durum", "Initial Technical Situation")}
        </h2>
        {SECTIONS.map((s) => (
          <section
            key={s.key}
            className="rounded-xl border border-slate-200 bg-white p-4"
          >
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
              {T(s.tr, s.en)}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {T(s.trBody, s.enBody)}
            </p>
          </section>
        ))}
      </div>

      <aside
        id="contract"
        className="mt-8 scroll-mt-6 rounded-xl border-2 border-slate-200 bg-slate-50 p-5"
      >
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {T("DeepTech MVP Sözleşmesi (Sprint 0)", "DeepTech MVP Contract (Sprint 0)")}
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
