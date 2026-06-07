"use client";
// Enriched header for the v2 ProgramDetailPanel.
// Renders stage, species/owner context, next-best-action, blocker cards
// and the existing ProgramHealthCardCompact in one block.

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import ProgramHealthCardCompact from "../ProgramHealthCardCompact";
import MemberAgreementPanel from "./MemberAgreementPanel";
import { useAuthContext } from "../../../lib/authContext";
import { IUCN_TINT } from "../../../lib/iucn";

const STAGE_PILL = {
  designing:  { bg: "#F3F4F6", color: "#6B7280", label: "Designing" },
  draft:      { bg: "#F3F4F6", color: "#6B7280", label: "Draft" },
  active:     { bg: "#DCFCE7", color: "#166534", label: "Active" },
  gate_ready: { bg: "#FEF3C7", color: "#92400E", label: "Gate Ready" },
  producing:  { bg: "#DBEAFE", color: "#1E40AF", label: "Producing" },
  realized:   { bg: "#E0E7FF", color: "#3730A3", label: "Realized" },
  paused:     { bg: "#F3F4F6", color: "#6B7280", label: "Paused" },
  abandoned:  { bg: "#FEE2E2", color: "#991B1B", label: "Abandoned" },
};

export default function HeroPanel({ programId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { researcher, profile } = useAuthContext();

  useEffect(() => {
    if (!programId) return;
    let cancelled = false;
    (async () => {
      try {
        const { data: program } = await supabase
          .from("programs")
          .select(`
            id, program_name, status, current_module, current_gate,
            risk_level, entry_mode, created_by, species_id,
            why_this_program, strategic_rationale,
            next_action, primary_blocker, what_is_missing
          `)
          .eq("id", programId)
          .maybeSingle();
        if (cancelled || !program) {
          if (!cancelled) setLoading(false);
          return;
        }
        const [spRes, ownerRes] = await Promise.all([
          program.species_id
            ? supabase.from("species").select("id, accepted_name, family, iucn_status, country").eq("id", program.species_id).maybeSingle()
            : Promise.resolve({ data: null }),
          program.created_by
            ? supabase.from("researchers").select("id, name, institution").eq("id", program.created_by).maybeSingle()
            : Promise.resolve({ data: null }),
        ]);
        if (cancelled) return;
        setData({ program, species: spRes?.data || null, owner: ownerRes?.data || null });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [programId]);

  if (loading || !data) {
    // Don't blank out the panel — render a minimal placeholder so the tab
    // strip stays in position. The compact card below will load on its own.
    return (
      <div className="space-y-3 mb-4">
        <ProgramHealthCardCompact programId={programId} />
      </div>
    );
  }

  const { program, species, owner } = data;
  const stage = (program.status || "designing").toLowerCase();
  const pill = STAGE_PILL[stage] || STAGE_PILL.designing;

  return (
    <div className="space-y-3 mb-4">
      {/* Context strip: stage + species + owner */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span
          className="rounded-full px-3 py-1 font-semibold uppercase tracking-wide"
          style={{ background: pill.bg, color: pill.color, letterSpacing: 0.4 }}
        >
          {pill.label}
        </span>
        {program.current_module && (
          <span className="text-slate-500">
            {program.current_module}
            {program.current_gate ? ` · ${program.current_gate}` : ""}
          </span>
        )}
        {species && (
          <Link
            href={`/geocon/species/${species.id}`}
            className="inline-flex items-center gap-1 italic text-slate-700 hover:text-slate-900 no-underline"
            style={{ fontFamily: "Georgia, serif" }}
          >
            🌱 {species.accepted_name}
            {species.family && <span className="not-italic text-slate-400 text-[11px]"> · {species.family}</span>}
            {species.iucn_status && (
              <span
                className="ml-1 rounded px-1.5 py-0.5 text-[9px] font-bold not-italic"
                style={{ background: IUCN_TINT[species.iucn_status] || "#eee", color: "#2c2c2a" }}
              >
                {species.iucn_status}
              </span>
            )}
          </Link>
        )}
        {owner && (
          <Link
            href={`/geocon/researchers/${owner.id}`}
            className="text-slate-500 hover:text-slate-700 no-underline"
          >
            · Owner: {owner.name}
          </Link>
        )}
        {program.entry_mode && (
          <span className="text-slate-400">· {program.entry_mode}</span>
        )}
      </div>

      {/* Next-best-action callout */}
      {program.next_action && (
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3"
          style={{
            background: "linear-gradient(180deg, #FFFBEC 0%, #FEF7DA 100%)",
            border: "1px solid #F4DC8B",
            borderLeft: "3px solid #B8860B",
          }}
        >
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
            style={{ background: "#FCDE5A" }}
          >
            <span className="text-sm font-bold text-slate-900">▶</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-0.5 text-[9px] font-semibold tracking-widest" style={{ color: "#8B6F00" }}>
              NEXT BEST ACTION
            </div>
            <div className="text-[13px] leading-snug font-medium text-slate-900">
              {program.next_action}
            </div>
          </div>
        </div>
      )}

      {/* Health card */}
      <ProgramHealthCardCompact programId={programId} />

      {/* Member Agreement panel — outsiders see existence pill only,
          members see contents, owner can edit. */}
      <MemberAgreementPanel
        programId={programId}
        isOwner={!!(researcher?.id && program?.created_by && researcher.id === program.created_by)}
      />

      {/* Blocker / missing pair */}
      {(program.primary_blocker || program.what_is_missing) && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {program.primary_blocker && (
            <div
              className="rounded-xl px-4 py-3"
              style={{
                background: "#FFF8F7",
                border: "1px solid #E5E5E0",
                borderLeft: "3px solid #ED827E",
              }}
            >
              <div className="mb-1 text-[9px] font-semibold tracking-widest" style={{ color: "#C9554F" }}>
                🚫 PRIMARY BLOCKER
              </div>
              <div className="text-[12px] leading-snug text-slate-700">
                {program.primary_blocker}
              </div>
            </div>
          )}
          {program.what_is_missing && (
            <div
              className="rounded-xl px-4 py-3"
              style={{
                background: "#FFFCF1",
                border: "1px solid #E5E5E0",
                borderLeft: "3px solid #FCDE5A",
              }}
            >
              <div className="mb-1 text-[9px] font-semibold tracking-widest" style={{ color: "#8B6F00" }}>
                ⚠ WHAT&apos;S MISSING
              </div>
              <div className="text-[12px] leading-snug text-slate-700">
                {program.what_is_missing}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Why / rationale */}
      {(program.why_this_program || program.strategic_rationale) && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          {program.why_this_program && (
            <div className="text-[13px] leading-snug text-slate-900">
              <span className="font-semibold text-slate-700">Why this program: </span>
              {program.why_this_program}
            </div>
          )}
          {program.strategic_rationale && (
            <div className="mt-1.5 text-[12px] leading-snug text-slate-500">
              <span className="font-semibold">Strategic rationale: </span>
              {program.strategic_rationale}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
