"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const STATUS_STYLES = {
  on_track:        { color: "#5DCAA5", bg: "rgba(93, 202, 165, 0.12)", label: "On Track" },
  needs_attention: { color: "#FCDE5A", bg: "rgba(252, 222, 90, 0.12)", label: "Needs Attention" },
  at_risk:         { color: "#ED827E", bg: "rgba(237, 130, 126, 0.12)", label: "At Risk" },
  unknown:         { color: "#9aa6ad", bg: "rgba(154, 166, 173, 0.12)", label: "Unknown" },
};

const RING_COLORS = {
  x: "#5DCAA5",
  y: "#AFA9EC",
  z: "#FAC775",
};

export default function ProgramHealthCard({ programId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (!programId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    (async () => {
      const { data: result, error: rpcError } = await supabase.rpc(
        "get_program_health_assessment",
        { p_program_id: programId }
      );
      if (cancelled) return;
      if (rpcError) {
        setError(rpcError);
      } else {
        setData(result);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [programId]);

  if (loading) {
    return (
      <div
        className="p-5 text-sm italic text-neutral-400"
        style={{ background: "#0d1419", borderRadius: 12 }}
      >
        Loading health assessment...
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="p-5 text-sm"
        style={{ background: "#0d1419", borderRadius: 12, color: "#ED827E" }}
      >
        Could not load health assessment: {error.message}
      </div>
    );
  }

  if (!data) return null;

  const statusKey = STATUS_STYLES[data.status] ? data.status : "unknown";
  const statusStyle = STATUS_STYLES[statusKey];
  const rings = data.metrics?.rings ?? {};
  const signals = Array.isArray(data.signals) ? data.signals : [];
  const watch = Array.isArray(data.watch) ? data.watch : [];

  return (
    <div
      className="p-5 text-neutral-100"
      style={{ background: "#0d1419", borderRadius: 12 }}
    >
      {/* A — Status badge + summary */}
      <div className="flex flex-wrap items-center gap-3">
        <span
          className="px-3 py-1 text-xs font-semibold uppercase tracking-wide"
          style={{
            background: statusStyle.bg,
            color: statusStyle.color,
            borderRadius: 12,
          }}
        >
          {statusStyle.label}
        </span>
        {data.summary && (
          <span className="text-sm text-neutral-400">{data.summary}</span>
        )}
      </div>

      {/* B — Three ring cards */}
      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        {["x", "y", "z"].map((key) => {
          const ring = rings[key];
          if (!ring) return null;
          const ringColor = RING_COLORS[key];
          return (
            <div
              key={key}
              className="p-4"
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                borderRadius: 12,
                border: "1px solid rgba(255, 255, 255, 0.06)",
              }}
            >
              <div
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: ringColor }}
              >
                {ring.short}
              </div>
              <div className="mt-1 text-xs text-neutral-400">{ring.name}</div>
              <div className="mt-3 flex items-baseline gap-2">
                <span
                  className="text-3xl font-bold"
                  style={{ color: ringColor }}
                >
                  {ring.pct}%
                </span>
                {ring.state && (
                  <span
                    className="text-sm italic text-neutral-300"
                    style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                  >
                    {ring.state}
                  </span>
                )}
              </div>
              <div className="mt-2 text-xs text-neutral-500">
                {ring.done} / {ring.total} tics complete
              </div>
            </div>
          );
        })}
      </div>

      {/* C — Signals + Watch */}
      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div
          className="p-4"
          style={{
            background: "rgba(93, 202, 165, 0.05)",
            borderRadius: 12,
            border: "1px solid rgba(93, 202, 165, 0.15)",
          }}
        >
          <div
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "#5DCAA5" }}
          >
            Signals
          </div>
          {signals.length === 0 ? (
            <div className="mt-2 text-sm text-neutral-500">—</div>
          ) : (
            <ul className="mt-2 space-y-1 text-sm text-neutral-200">
              {signals.map((s, i) => (
                <li key={i}>
                  <span style={{ color: "#5DCAA5" }}>•</span> {s}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div
          className="p-4"
          style={{
            background: "rgba(252, 222, 90, 0.05)",
            borderRadius: 12,
            border: "1px solid rgba(252, 222, 90, 0.15)",
          }}
        >
          <div
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "#FCDE5A" }}
          >
            Watch
          </div>
          {watch.length === 0 ? (
            <div className="mt-2 text-sm text-neutral-500">—</div>
          ) : (
            <ul className="mt-2 space-y-1 text-sm text-neutral-200">
              {watch.map((w, i) => (
                <li key={i}>
                  <span style={{ color: "#FCDE5A" }}>•</span> {w}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* D — Footer */}
      <div className="mt-5 text-xs text-neutral-500">
        Computed at {data.computed_at} · rule v{data.rule_version}
      </div>
    </div>
  );
}
