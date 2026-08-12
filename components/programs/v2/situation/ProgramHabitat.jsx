"use client";
// ProgramHabitat — Phase 2, Ticket 1 (pure scaffold, no data).
// GEOCON_TARGET_REBASE_PLAN.md Section 5B: target regions replacing
// room-first navigation. This ticket renders the 10 labeled region slots
// only — no RPC calls, no real content. Wiring each slot to existing hooks
// is Tickets 2–8 (see GEOCON_PROGRAM_HABITAT_PHASE2_TICKETS_v1.md).
//
// Mount: below InitialProgramSituation, above the legacy ProgramCockpit
// workspace, behind a "habitat preview" toggle. Does not replace or remove
// Cockpit, tabs, or routes (repo reality != target architecture).

import { useState } from "react";
import ActivityRailPanel from "./ActivityRailPanel";

const REGIONS = [
  {
    key: "target_core",
    tr: "Hedef Çekirdek",
    en: "Target Core",
    descTr: "Tür/program odak nesnesi, misyon, kapsam.",
    descEn: "Species/program focal object, mission, scope.",
    ticket: 4,
  },
  {
    key: "scientific_grounding",
    tr: "Bilimsel Temel Katmanı",
    en: "Scientific Grounding Layer",
    descTr: "Tür gerçekleri, taksonomi, IUCN, köken bilgisi.",
    descEn: "Species facts, taxonomy, IUCN, provenance.",
    ticket: 8,
  },
  {
    key: "governance_boundary",
    tr: "Yönetişim / Dil Sınırı",
    en: "Governance / Language Boundary",
    descTr: "Üye rolleri, görünürlük, anlaşmalar, iddia dili kuralları.",
    descEn: "Member roles, visibility, agreements, claim language rules.",
    ticket: 3,
  },
  {
    key: "evidence_signal_node",
    tr: "Kanıt Sinyali Düğümü",
    en: "Evidence Signal Node",
    descTr: "Kanıt gücü, sinyaller, ön koşullar — skor tahtası değil.",
    descEn: "Evidence strength, signals, prerequisites — not a scoreboard.",
    ticket: 6,
  },
  {
    key: "safe_progression_horizons",
    tr: "Güvenli İlerleme Ufukları",
    en: "Safe Progression Horizons",
    descTr: "Şimdi ve sonra güvenle ilerlenebilecekler.",
    descEn: "What may proceed now vs. later.",
    ticket: 7,
  },
  {
    key: "translation_boundary",
    tr: "Çeviri Sınırı",
    en: "Translation Boundary",
    descTr: "Nitelendirilmiş sinyalin Layer 2'ye kontrollü teslimi.",
    descEn: "Controlled handoff signal when a qualified signal needs Layer 2 framing.",
    ticket: 5,
  },
  {
    key: "context_inspector",
    tr: "Bağlam İnceleyici",
    en: "Context Inspector",
    descTr: "Kısıtlar, kaynaklar, boşluklar üzerinde detaya inme.",
    descEn: "Drill-down on constraints, sources, gaps.",
    ticket: null,
  },
  {
    key: "activity_rail",
    tr: "Etkinlik Şeridi",
    en: "Activity Rail",
    descTr: "Üye etkinliği (mevcut Stream'den).",
    descEn: "Member activity (from Stream).",
    ticket: 2,
  },
  {
    key: "constraint_workbench",
    tr: "Kısıt Tabanlı Çalışma Alanı",
    en: "Constraint-based Workbench",
    descTr: "Kısıtlarla sınırlanan çalışma yüzeyleri — genel görev panosu değil.",
    descEn: "Work surfaces gated by constraints — not a generic task board.",
    ticket: null,
  },
  {
    key: "cross_wp_integrity",
    tr: "WP-Arası Bütünlük",
    en: "Cross-WP Integrity",
    descTr: "İş Paketleri arası tutarlılık kontrolleri.",
    descEn: "Cross–Work Package consistency checks.",
    ticket: null,
  },
];

export default function ProgramHabitat({ programId, lang = "tr" }) {
  const [open, setOpen] = useState(false);
  const tr = lang === "tr";

  return (
    <div className="px-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-left text-[13px] font-medium text-slate-600 hover:bg-slate-50"
        aria-expanded={open}
      >
        <span>{tr ? "Habitat önizleme (deneysel)" : "Habitat preview (experimental)"}</span>
        <span className="text-slate-400">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/40 p-4">
          <p className="mb-3 text-[12px] leading-relaxed text-slate-500">
            {tr
              ? "Bu, GEOCON Program Habitat'ının erken iskeletidir. Aşağıdaki bölgeler henüz veri taşımıyor; her biri ayrı bir sonraki adımda mevcut verilere bağlanacak. Bu görünüm mevcut çalışma alanının yerini almaz."
              : "This is an early scaffold of the GEOCON Program Habitat. The regions below carry no data yet; each will be wired to existing data in a separate next step. This view does not replace the workspace below."}
          </p>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {REGIONS.map((r) => {
              const isWired = r.key === "activity_rail" && programId;
              return (
                <div
                  key={r.key}
                  className={
                    isWired
                      ? "rounded-lg border border-slate-200 bg-white px-3.5 py-3"
                      : "rounded-lg border border-dashed border-slate-300 bg-white px-3.5 py-3"
                  }
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[12.5px] font-medium text-slate-700">
                      {tr ? r.tr : r.en}
                    </span>
                    {!isWired && (
                      <span className="text-[10px] text-slate-400">
                        {r.ticket
                          ? `Ticket ${r.ticket}`
                          : tr
                            ? "karar bekliyor"
                            : "pending decision"}
                      </span>
                    )}
                  </div>

                  {isWired ? (
                    <div className="mt-2">
                      <ActivityRailPanel programId={programId} lang={lang} />
                    </div>
                  ) : (
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                      {tr ? r.descTr : r.descEn}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
