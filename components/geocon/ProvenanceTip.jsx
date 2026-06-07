"use client";
// v4.1-b — Field provenance tooltip.
//
// Pure inline ⓘ marker next to a species field. On hover (or click on
// touch) it pops a small panel listing every recorded version of that
// field: source (wikidata / iucn_api / manual_edit / openalex / …),
// recorded value, and timestamp. Newest first.
//
// Backed by the get_field_provenance(species_id, field) RPC, which
// reads the species_field_provenance table (populated automatically
// on harvest cron + species edit acceptance trigger).
//
// Lazy-loaded: only fetches when the user actually hovers the marker,
// so 47k species detail mounts don't fire 6 RPCs each.

import { useState, useRef, useEffect } from "react";
import { Info } from "lucide-react";
import { supabase } from "../../lib/supabase";

const SOURCE_LABEL = {
  wikidata:     "Wikidata",
  iucn_api:     "IUCN API",
  openalex:     "OpenAlex",
  gbif:         "GBIF",
  gbif_distribution: "GBIF native distribution",
  manual_edit:  "Manual edit (admin)",
  edit_accepted:"Community edit (accepted)",
  import:       "Initial import",
  catalogue_of_life: "Catalogue of Life",
  plantnet:     "Pl@ntNet",
  inaturalist:  "iNaturalist",
  derived_from_name: "Derived from name",
  inferred:     "Inferred from genus · unverified",
};

export default function ProvenanceTip({ speciesId, field, align = "right" }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(false);
  const closeTimer = useRef(null);

  async function ensureLoaded() {
    if (rows !== null || loading) return;
    setLoading(true);
    try {
      const { data } = await supabase.rpc("get_field_provenance", {
        p_species_id: speciesId,
        p_field: field,
      });
      setRows(Array.isArray(data) ? data : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  function show() {
    clearTimeout(closeTimer.current);
    setOpen(true);
    ensureLoaded();
  }
  function hide() {
    closeTimer.current = setTimeout(() => setOpen(false), 180);
  }
  useEffect(() => () => clearTimeout(closeTimer.current), []);

  if (!speciesId || !field) return null;

  return (
    <span style={{ position: "relative", display: "inline-flex", verticalAlign: "middle" }}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); ensureLoaded(); }}
        aria-label={`Source for ${field}`}
        style={{
          width: 16, height: 16, padding: 0,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          border: "none", background: "transparent",
          color: "var(--gx-ink-muted)",
          cursor: "pointer",
          opacity: 0.55,
          marginLeft: 4,
        }}>
        <Info size={11} strokeWidth={2.2} />
      </button>

      {open && (
        <div role="tooltip"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            ...(align === "left" ? { left: 0 } : { right: 0 }),
            zIndex: 60,
            width: 280,
            padding: 10,
            background: "var(--gx-card-bg)",
            border: "1px solid var(--gx-border)",
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
            color: "var(--gx-ink)",
            fontFamily: "var(--gx-font-body)",
          }}>
          <div className="gx-overline" style={{ marginBottom: 6, fontSize: 8 }}>
            Provenance · {field}
          </div>
          {loading ? (
            <div style={{ fontSize: 11, color: "var(--gx-ink-muted)", fontStyle: "italic" }}>
              Loading…
            </div>
          ) : !rows || rows.length === 0 ? (
            <div style={{ fontSize: 11, color: "var(--gx-ink-muted)", lineHeight: 1.4 }}>
              No recorded source yet. Field value is either the initial
              import or a manual edit that predates provenance tracking.
            </div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 7 }}>
              {rows.slice(0, 6).map((p, i) => (
                <li key={i} style={{
                  paddingBottom: 6,
                  borderBottom: i < Math.min(rows.length, 6) - 1 ? "1px dashed var(--gx-border-soft)" : "none",
                }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, fontSize: 10 }}>
                    <strong style={{ color: "var(--gx-accent-violet)", fontWeight: 700, fontFamily: "var(--gx-font-mono)" }}>
                      {SOURCE_LABEL[p.source] || p.source || "unknown"}
                    </strong>
                    <span style={{ color: "var(--gx-ink-muted)", marginLeft: "auto", fontSize: 9 }}>
                      {p.recorded_at ? new Date(p.recorded_at).toLocaleDateString() : ""}
                    </span>
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: "var(--gx-ink-soft)",
                    fontFamily: "var(--gx-font-mono)",
                    marginTop: 2,
                    wordBreak: "break-word",
                  }}>
                    {p.recorded_value || <em style={{ opacity: 0.6 }}>(empty)</em>}
                  </div>
                  {p.source_ref && (
                    <a href={p.source_ref} target="_blank" rel="noopener noreferrer"
                      style={{
                        fontSize: 10, color: "var(--gx-accent-azure)",
                        textDecoration: "none", marginTop: 3, display: "inline-block",
                      }}>
                      ref →
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </span>
  );
}
