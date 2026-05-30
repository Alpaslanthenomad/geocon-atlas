"use client";
// /geocon/compare — side-by-side comparison of any two species.
// Each slot has its own picker (search_species_fulltext) and resolves
// independently. Selection persists via the URL query.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { GlassCard } from "../shared";

const IUCN_TINT = {
  CR: "#FF8B96", EN: "#FFB870", VU: "#FFE875",
  NT: "#B2DFDB", LC: "#A5D6A7", DD: "#CFD8DC", NE: "#90A4AE",
};

export default function CompareRoute({ initialA, initialB }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [a, setA] = useState(initialA || sp?.get("a") || "");
  const [b, setB] = useState(initialB || sp?.get("b") || "");

  // Keep URL in sync without forcing reload
  useEffect(() => {
    const usp = new URLSearchParams();
    if (a) usp.set("a", a);
    if (b) usp.set("b", b);
    const next = `/geocon/compare${usp.toString() ? "?" + usp.toString() : ""}`;
    router.replace(next, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a, b]);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 60 }}>
      <div className="gx-rise" style={{ marginBottom: 14 }}>
        <h1 style={{
          fontFamily: "var(--gx-font-serif)",
          fontSize: 30,
          fontWeight: 700,
          color: "var(--gx-ink)",
          margin: 0,
          letterSpacing: -0.6,
        }}>
          Compare species
        </h1>
        <div style={{ fontSize: 12, color: "var(--gx-ink-muted)", marginTop: 4 }}>
          Pick two species to see their atlas signal side by side.
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
        gap: 14,
      }}>
        <Slot label="A" id={a} onPick={setA} />
        <Slot label="B" id={b} onPick={setB} />
      </div>

      {a && b && a === b && (
        <div style={{ marginTop: 14, padding: 12, background: "var(--gx-surface-2)", border: "1px dashed var(--gx-border)", borderRadius: 10, fontSize: 12, color: "var(--gx-ink-muted)" }}>
          Both slots point to the same species — pick something different in B.
        </div>
      )}
    </div>
  );
}

function Slot({ label, id, onPick }) {
  const [species, setSpecies] = useState(null);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!id) { setSpecies(null); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("species")
        .select("id, accepted_name, common_name, family, genus, iucn_status, country_focus, thumbnail_url, composite_score, geocon_module")
        .eq("id", id)
        .maybeSingle();
      if (cancelled) return;
      setSpecies(data || null);
    })();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    const q = query.trim();
    if (!open || q.length < 2) { setHits([]); return; }
    let cancelled = false;
    const t = setTimeout(async () => {
      const { data } = await supabase.rpc("search_species_fulltext", { p_query: q, p_limit: 8 });
      if (cancelled) return;
      setHits(Array.isArray(data) ? data : []);
    }, 150);
    return () => { cancelled = true; clearTimeout(t); };
  }, [query, open]);

  return (
    <GlassCard style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{
          fontFamily: "var(--gx-font-display)",
          fontSize: 22,
          fontWeight: 900,
          color: "var(--gx-accent-bee-warm)",
        }}>
          {label}
        </div>
        {species && (
          <button
            onClick={() => { onPick(""); setSpecies(null); setQuery(""); setOpen(true); }}
            className="gx-btn"
            style={{ fontSize: 10, padding: "3px 8px", color: "var(--gx-ink-muted)", background: "transparent", border: "1px solid var(--gx-border-soft)", borderRadius: 6, cursor: "pointer" }}
          >
            Change
          </button>
        )}
      </div>

      {!species && (
        <div style={{ position: "relative" }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder="Search species — name, genus, family…"
            style={{
              width: "100%",
              padding: "10px 12px",
              fontSize: 13,
              background: "var(--gx-surface-2)",
              color: "var(--gx-ink)",
              border: "1px solid var(--gx-border-soft)",
              borderRadius: 8,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          {open && hits.length > 0 && (
            <div style={{
              position: "absolute",
              left: 0, right: 0, top: 42,
              maxHeight: 280,
              overflow: "auto",
              background: "var(--gx-surface)",
              border: "1px solid var(--gx-border)",
              borderRadius: 10,
              boxShadow: "var(--gx-shadow-2)",
              zIndex: 5,
            }}>
              {hits.map((h) => (
                <button
                  key={h.id}
                  onClick={() => { onPick(h.id); setOpen(false); setQuery(""); }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "9px 12px",
                    background: "transparent",
                    border: "none",
                    borderBottom: "1px solid var(--gx-border-soft)",
                    cursor: "pointer",
                    color: "var(--gx-ink)",
                  }}
                >
                  <div style={{ fontFamily: "var(--gx-font-serif)", fontStyle: "italic", fontSize: 13, fontWeight: 700 }}>
                    {h.accepted_name}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--gx-ink-muted)", marginTop: 2 }}>
                    {h.family || "—"} {h.iucn_status && `· ${h.iucn_status}`}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {species && (
        <SlotDetail species={species} />
      )}
    </GlassCard>
  );
}

function SlotDetail({ species }) {
  return (
    <div>
      <div style={{
        height: 180,
        borderRadius: 12,
        background: species.thumbnail_url
          ? `linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(0,0,0,0.45) 100%), url(${species.thumbnail_url})`
          : "var(--gx-surface-3)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        alignItems: "flex-end",
        padding: 12,
      }}>
        {species.iucn_status && (
          <span style={{
            fontSize: 10, fontWeight: 700,
            padding: "3px 9px", borderRadius: 999,
            background: IUCN_TINT[species.iucn_status] || "#ccc",
            color: "#1a0d2e",
          }}>
            {species.iucn_status}
          </span>
        )}
      </div>

      <h2 style={{
        fontFamily: "var(--gx-font-serif)",
        fontStyle: "italic",
        fontSize: 22,
        fontWeight: 700,
        color: "var(--gx-ink)",
        margin: "12px 0 2px",
        lineHeight: 1.2,
      }}>
        {species.accepted_name}
      </h2>
      {species.common_name && (
        <div style={{ fontSize: 12, color: "var(--gx-ink-muted)", marginBottom: 8 }}>{species.common_name}</div>
      )}

      <table style={{ width: "100%", fontSize: 12, color: "var(--gx-ink)", borderCollapse: "collapse" }}>
        <tbody>
          <Row label="Family"        value={species.family} />
          <Row label="Genus"         value={species.genus} />
          <Row label="Country"       value={species.country_focus} />
          <Row label="Composite"     value={species.composite_score} />
          <Row label="GEOCON module" value={species.geocon_module} />
        </tbody>
      </table>

      <Link
        href={`/geocon/species/${species.id}`}
        style={{
          display: "block",
          marginTop: 12,
          padding: "8px 12px",
          textAlign: "center",
          fontSize: 11,
          fontWeight: 700,
          color: "var(--gx-accent-bio-green)",
          border: "1px solid var(--gx-border-soft)",
          borderRadius: 8,
          textDecoration: "none",
        }}
      >
        Open full atlas page →
      </Link>
    </div>
  );
}

function Row({ label, value }) {
  if (value == null || value === "") return null;
  return (
    <tr style={{ borderTop: "1px solid var(--gx-border-soft)" }}>
      <td style={{ padding: "6px 0", color: "var(--gx-ink-muted)", fontSize: 11, fontWeight: 600, width: "45%" }}>{label}</td>
      <td style={{ padding: "6px 0", textAlign: "right" }}>{String(value)}</td>
    </tr>
  );
}
