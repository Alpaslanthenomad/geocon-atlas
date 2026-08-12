"use client";
// GovernanceBoundaryPanel — Phase 2, Ticket 3.
// GEOCON_PROGRAM_HABITAT_PHASE2_TICKETS_v1.md Ticket 3:
//   "Show member roles + visibility state in the Governance slot.
//    MemberAgreementPanel data stays member-gated exactly as today (per
//    CLAUDE.md non-negotiable #5 — PII/NDA gating unchanged)."
//
// Reuses useProgramMembers (same RPC as ContributorsTab) and the existing
// MemberCard component rather than re-deriving role/visibility rendering.
// getProgramMembersFull already applies server-side member gating — this
// view adds no new gating logic and no new fields beyond what
// ContributorsTab already surfaces. No invite, no accept/reject: those stay
// in ContributorsTab.

import { useMemo } from "react";
import { useProgramMembers } from "../hooks/useProgramMembers";
import { getVisMeta } from "../lib/visibility";

const RAIL_LIMIT = 4;

export default function GovernanceBoundaryPanel({ programId, lang = "tr" }) {
  const { members, loading, error } = useProgramMembers(programId);
  const tr = lang === "tr";

  const { active, pendingCount } = useMemo(() => {
    const list = members ?? [];
    return {
      active: list.filter((m) => m.status !== "requested").slice(0, RAIL_LIMIT),
      pendingCount: list.filter((m) => m.status === "requested").length,
    };
  }, [members]);

  const remaining = Math.max(
    0,
    (members ?? []).filter((m) => m.status !== "requested").length - active.length
  );

  if (loading) {
    return (
      <div className="space-y-1.5">
        <div className="h-10 rounded-md bg-slate-100 animate-pulse" />
        <div className="h-10 rounded-md bg-slate-100 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-[11px] text-rose-600">
        {tr ? "Üyelik verisi yüklenemedi." : "Membership data failed to load."}
      </p>
    );
  }

  if (active.length === 0) {
    return (
      <p className="text-[11px] text-slate-400">
        {tr ? "Henüz kayıtlı üye yok." : "No registered members yet."}
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      {active.map((m) => (
        <CompactMemberRow key={m.id} member={m} lang={lang} />
      ))}
      {(remaining > 0 || pendingCount > 0) && (
        <p className="pt-0.5 text-[10px] text-slate-400">
          {remaining > 0 &&
            (tr ? `+${remaining} üye daha` : `+${remaining} more member${remaining === 1 ? "" : "s"}`)}
          {remaining > 0 && pendingCount > 0 && " · "}
          {pendingCount > 0 &&
            (tr
              ? `${pendingCount} bekleyen katılım isteği`
              : `${pendingCount} pending join request${pendingCount === 1 ? "" : "s"}`)}
        </p>
      )}
    </div>
  );
}

// Compact single-line member row for the rail. MemberCard (avatar block +
// affiliation + status) is heavier than this density calls for, so this
// stays a thin, deliberately smaller row — name, role, visibility only.
function CompactMemberRow({ member, lang }) {
  const tr = lang === "tr";
  const name =
    member.display_name ??
    member.researcher_name ??
    member.external_name ??
    member.user_email ??
    "—";

  return (
    <div className="flex items-center gap-2">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-300 text-[10px] font-bold text-slate-600">
        {name.charAt(0).toUpperCase()}
      </div>
      <span className="min-w-0 flex-1 truncate text-[11.5px] text-slate-700">{name}</span>
      <RoleTag role={member.role} lang={lang} />
      {member.visibility && <VisDot level={member.visibility} tr={tr} />}
    </div>
  );
}

const ROLE_LABEL = {
  owner: { tr: "Sahip", en: "Owner" },
  conservation: { tr: "Koruma", en: "Conservation" },
  science: { tr: "Bilim", en: "Science" },
  pathway: { tr: "Pathway", en: "Pathway" },
  governance: { tr: "Yönetişim", en: "Governance" },
  support: { tr: "Destek", en: "Support" },
  observer: { tr: "Gözlemci", en: "Observer" },
};

function RoleTag({ role, lang }) {
  const meta = ROLE_LABEL[role] ?? ROLE_LABEL.support;
  return (
    <span className="shrink-0 text-[10px] text-slate-400">
      {lang === "tr" ? meta.tr : meta.en}
    </span>
  );
}

// Minimal visibility indicator — reuses lib/visibility's getVisMeta so the
// label always matches the same source of truth as VisibilityBadge, just
// rendered as a compact label instead of the full pill.
function VisDot({ level, tr }) {
  const meta = getVisMeta(level);
  const label = tr ? meta.labelTr : meta.labelEn;
  return (
    <span title={tr ? meta.descTr : meta.descEn} className="shrink-0 text-[9px] uppercase tracking-wide text-slate-300">
      {label}
    </span>
  );
}
