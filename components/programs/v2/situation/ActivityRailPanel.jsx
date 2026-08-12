"use client";
// ActivityRailPanel — Phase 2, Ticket 2.
// GEOCON_PROGRAM_HABITAT_PHASE2_TICKETS_v1.md Ticket 2:
//   "Wire the Activity Rail slot to the existing stream data — same read,
//    new presentation (rail, not tab). Out of scope: posting comments from
//    this view (read-only for v1)."
//
// Reuses useProgramStream (same RPC as StreamTab) and StreamTab's own
// describeSystemEvent/formatAgo/Avatar helpers rather than re-deriving that
// logic — keeps the two views from drifting apart. No composer, no reply,
// no edit/delete, no presence bar: those stay in StreamTab.

import { useMemo } from "react";
import { useProgramStream } from "../hooks/useProgramStream";
import { describeSystemEvent, formatAgo, Avatar } from "../tabs/StreamTab";

const RAIL_LIMIT = 6;

export default function ActivityRailPanel({ programId, lang = "tr" }) {
  const { events, loading, error } = useProgramStream(programId, { limit: RAIL_LIMIT });
  const tr = lang === "tr";

  const recent = useMemo(() => (events || []).slice(0, RAIL_LIMIT), [events]);

  if (loading) {
    return (
      <div className="space-y-1.5">
        <div className="h-8 rounded-md bg-slate-100 animate-pulse" />
        <div className="h-8 rounded-md bg-slate-100 animate-pulse" />
        <div className="h-8 rounded-md bg-slate-100 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-[11px] text-rose-600">
        {tr ? "Etkinlik akışı yüklenemedi." : "Activity feed failed to load."}
      </p>
    );
  }

  if (recent.length === 0) {
    return (
      <p className="text-[11px] text-slate-400">
        {tr ? "Henüz etkinlik yok." : "No activity yet."}
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      {recent.map((e) => (
        <RailItem key={`${e.kind}-${e.id}`} event={e} lang={lang} />
      ))}
    </div>
  );
}

function RailItem({ event, lang }) {
  const { kind, at, payload } = event;

  if (kind === "comment") {
    const body = (payload.body || "").trim();
    const truncated = body.length > 80 ? body.slice(0, 80) + "…" : body;
    return (
      <div className="flex items-start gap-2">
        <Avatar name={payload.author_name} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            <span className="truncate text-[11.5px] font-medium text-slate-700">
              {payload.author_name || "—"}
            </span>
            <span className="shrink-0 text-[10px] text-slate-400">{formatAgo(at, lang)}</span>
          </div>
          <p className="truncate text-[11px] text-slate-500">{truncated}</p>
        </div>
      </div>
    );
  }

  const { line, icon, tint } = describeSystemEvent(kind, payload, lang);
  return (
    <div className="flex items-center gap-2">
      <span
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px]"
        style={{ background: tint + "22", color: tint }}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1 truncate text-[11px] text-slate-600">{line}</div>
      <span className="shrink-0 text-[10px] text-slate-400">{formatAgo(at, lang)}</span>
    </div>
  );
}
