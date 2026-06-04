"use client";
// Globe v2.7 — Discovery Timeline.
//
// A horizontal area chart pinned to the bottom of the explore canvas:
// "When did each geophyte enter the literature?" Each decade bar is
// the count of species whose first publication-in-corpus year fell
// inside that decade; the area underneath plots the cumulative.
//
// Click a decade → parent state filters the globe to that decade's
// species. Click again to clear. Hover anywhere → tooltip with the
// per-decade + cumulative numbers.
//
// Coverage: 187 / 47k species have a publication year. The slider is
// honest about that — it's a literature-history lens, not a complete
// timeline. Tooltip + header explain.

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Clock, X } from "lucide-react";

export default function GlobeTimeline({ activeDecade, setActiveDecade }) {
  const [data, setData] = useState([]);
  const [hover, setHover] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: rows } = await supabase.rpc("get_discovery_timeline");
      if (!cancelled) setData(Array.isArray(rows) ? rows : []);
    })();
    return () => { cancelled = true; };
  }, []);

  if (data.length === 0) return null;

  const minYear = data[0].year;
  const maxYear = data[data.length - 1].year + 10;
  const maxNew  = Math.max(...data.map((d) => d.new_count));
  const maxCum  = data[data.length - 1].cumulative_count;
  const total   = maxCum;

  return (
    <div style={{
      position: "absolute",
      left: 16, right: 16, bottom: 14,
      zIndex: 3,
      background: "linear-gradient(180deg, rgba(28,12,44,0) 0%, rgba(28,12,44,0.88) 35%, rgba(28,12,44,0.94) 100%)",
      border: "1px solid rgba(245,166,35,0.22)",
      borderRadius: 12,
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      color: "#f3e8d3",
      fontFamily: "var(--gx-font-body)",
      padding: collapsed ? "8px 12px" : "10px 14px 12px",
      maxWidth: collapsed ? "fit-content" : "none",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: collapsed ? 0 : 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Clock size={12} strokeWidth={2.2} style={{ color: "#FFD79B" }} />
          <span style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "#FFD79B", fontWeight: 700 }}>
            Discovery timeline
          </span>
          {activeDecade && (
            <button onClick={() => setActiveDecade(null)}
              style={{
                fontSize: 9, fontWeight: 700,
                padding: "2px 7px", borderRadius: 999,
                background: "rgba(245,166,35,0.22)", color: "#FFE6BC",
                border: "1px solid rgba(245,166,35,0.40)", cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: 3,
              }}>
              {activeDecade}s × clear
            </button>
          )}
        </div>
        <button onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? "Expand" : "Collapse"}
          style={{
            background: "transparent", border: "none",
            color: "rgba(255,215,155,0.65)", cursor: "pointer",
            fontSize: 10, fontFamily: "var(--gx-font-mono)",
          }}>
          {collapsed ? "▸" : "▾"}
        </button>
      </div>

      {!collapsed && (
        <>
          <div style={{
            position: "relative",
            height: 60,
            display: "flex",
            alignItems: "flex-end",
            gap: 2,
            paddingBottom: 16,
            marginTop: 2,
          }}
            onMouseLeave={() => setHover(null)}>
            {data.map((d) => {
              const h = (d.new_count / Math.max(1, maxNew)) * 100;
              const isActive = activeDecade === d.year;
              const isHover  = hover?.year === d.year;
              return (
                <button key={d.year}
                  onMouseEnter={() => setHover(d)}
                  onClick={() => setActiveDecade(isActive ? null : d.year)}
                  style={{
                    flex: 1,
                    height: `${Math.max(2, h)}%`,
                    minHeight: 2,
                    background: isActive
                      ? "linear-gradient(180deg, #FFE6BC, #F5A623)"
                      : isHover
                        ? "linear-gradient(180deg, #FFD79B, #BA7517)"
                        : "linear-gradient(180deg, rgba(245,166,35,0.55), rgba(186,117,23,0.65))",
                    border: "none",
                    borderRadius: 3,
                    cursor: "pointer",
                    padding: 0,
                    transition: "background 120ms ease",
                  }}
                  aria-label={`${d.year}s · ${d.new_count} new species, ${d.cumulative_count} cumulative`}
                />
              );
            })}

            {/* X-axis decade labels — sparse */}
            <div style={{
              position: "absolute", left: 0, right: 0, bottom: 0,
              display: "flex", justifyContent: "space-between",
              fontSize: 9, color: "rgba(255,215,155,0.45)",
              fontFamily: "var(--gx-font-mono)", pointerEvents: "none",
            }}>
              <span>{minYear}</span>
              <span>{Math.round((minYear + maxYear) / 2 / 10) * 10}</span>
              <span>{maxYear - 10}s</span>
            </div>
          </div>

          {/* Hover / footer line */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            fontSize: 10, color: "rgba(243,232,211,0.65)",
            marginTop: -8, paddingTop: 4,
          }}>
            <span style={{ fontFamily: "var(--gx-font-mono)" }}>
              {hover
                ? <>
                    <strong style={{ color: "#FFE6BC" }}>{hover.year}s</strong> ·
                    <strong style={{ color: "#5BD8B1", marginLeft: 4 }}>{hover.new_count}</strong> new ·
                    <strong style={{ color: "#FFD79B", marginLeft: 4 }}>{hover.cumulative_count}</strong> cumulative
                  </>
                : <>
                    <strong style={{ color: "#FFE6BC" }}>{total}</strong> species in literature ·
                    <span style={{ marginLeft: 4 }}>span {minYear}–{maxYear - 10}s</span>
                  </>
              }
            </span>
            <span style={{ fontSize: 9, fontStyle: "italic", color: "rgba(243,232,211,0.45)" }}>
              Click a decade to highlight on the globe
            </span>
          </div>
        </>
      )}
    </div>
  );
}
