"use client";
// GenusSiblings — small horizontal strip of other species in the same
// genus, each with its thumbnail. This brings back the "more photos
// per species" feeling the old modal had via genus-fallback rendering.
// Self-hides when there are no siblings or no images at all.

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { IUCN_TINT } from "../../lib/iucn";

export default function GenusSiblings({ speciesId, genus }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!speciesId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.rpc("list_genus_siblings", {
        p_species_id: speciesId,
        p_limit: 12,
      });
      if (cancelled) return;
      setRows(Array.isArray(data) ? data : []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [speciesId]);

  if (loading) return null;
  if (rows.length === 0) return null;

  // Hide entirely if no sibling has any image — the strip is purely visual.
  const withImage = rows.filter((r) => r.thumbnail_url || r.photo_url);
  if (withImage.length === 0) return null;

  return (
    <section style={{
      marginTop: 18,
      padding: 16,
      background: "var(--gx-surface)",
      border: "1px solid var(--gx-border)",
      borderRadius: "var(--gx-radius-4)",
    }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
        <h2 style={{
          fontFamily: "var(--gx-font-serif)",
          fontSize: 18,
          fontWeight: 700,
          color: "var(--gx-ink)",
          margin: 0,
        }}>
          Others in <em>{genus || "this genus"}</em>
        </h2>
        <span style={{ fontSize: 11, color: "var(--gx-ink-muted)" }}>
          {rows.length} sibling{rows.length === 1 ? "" : "s"}
        </span>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
        gap: 10,
      }}>
        {rows.map((r) => (
          <Link key={r.id} href={`/geocon/species/${r.id}`}
            style={{
              display: "block",
              textDecoration: "none",
              color: "inherit",
              border: "1px solid var(--gx-border-soft)",
              borderRadius: "var(--gx-radius-3)",
              overflow: "hidden",
              background: "var(--gx-surface-2)",
            }}>
            <div style={{
              aspectRatio: "1/1",
              background: "var(--gx-surface-3)",
              backgroundImage: (r.photo_url || r.thumbnail_url)
                ? `url(${r.photo_url || r.thumbnail_url})`
                : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
              position: "relative",
            }}>
              {r.iucn_status && (
                <span style={{
                  position: "absolute",
                  top: 6, right: 6,
                  fontSize: 8, fontWeight: 700, letterSpacing: 0.4,
                  padding: "2px 5px",
                  borderRadius: 4,
                  background: IUCN_TINT[r.iucn_status] || "#ccc",
                  color: "#1a0d2e",
                }}>
                  {r.iucn_status}
                </span>
              )}
              {!(r.photo_url || r.thumbnail_url) && (
                <div style={{
                  position: "absolute", inset: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, color: "var(--gx-ink-faint)", letterSpacing: 0.6,
                }}>
                  no image
                </div>
              )}
            </div>
            <div style={{
              padding: "6px 8px",
              fontFamily: "var(--gx-font-serif)",
              fontStyle: "italic",
              fontSize: 11,
              fontWeight: 600,
              color: "var(--gx-ink)",
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {r.accepted_name}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
