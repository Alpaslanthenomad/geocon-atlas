"use client";
// THE BOOK experience v1 — the species "gearbox" signature header.
// F-direction hero (the green brand block) + a radial graphic of the 5 work-areas, each ring
// filled by an honest evidence-presence score (money-blind; the Değer/value ring counts public
// phytochemistry activity, never the internal bioactivity potentials). Data: get_species_gearbox.

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";
import { useToast } from "../ui";
import { IUCN_LABEL } from "../../lib/iucn";

const POS = [
  { cx: 190, cy: 65, lx: 190, ly: 31 },
  { cx: 295, cy: 141, lx: 295, ly: 186 },
  { cx: 255, cy: 264, lx: 255, ly: 308 },
  { cx: 125, cy: 264, lx: 125, ly: 308 },
  { cx: 85, cy: 141, lx: 85, ly: 186 },
];
const R = 26;
const CIRC = 2 * Math.PI * R;

export default function SpeciesGearbox({ speciesId }) {
  const { user } = useAuthContext();
  const toast = useToast();
  const [g, setG] = useState(null);
  const [took, setTook] = useState({});

  async function take(areaKey) {
    try {
      const { error } = await supabase.rpc("add_position", { p_species_id: speciesId, p_area_key: areaKey });
      if (error) throw error;
      setTook((t) => ({ ...t, [areaKey]: true }));
      toast.success("Pozisyon alındı — çalışma masanda");
    } catch (e) { toast.error("Eklenemedi", { detail: e?.message }); }
  }

  useEffect(() => {
    if (!speciesId) return;
    let cancelled = false;
    supabase.rpc("get_species_gearbox", { p_species_id: speciesId })
      .then(({ data }) => { if (!cancelled) setG(data || null); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [speciesId]);

  if (!g) return null;
  const areas = Array.isArray(g.areas) ? g.areas : [];
  const gap = areas.length ? areas.reduce((m, a) => (a.fill < m.fill ? a : m), areas[0]) : null;
  const tagline = [g.family, g.endemic ? "endemik" : null, g.country].filter(Boolean).join(" · ");
  const showIucn = g.iucn && g.iucn !== "—";

  return (
    <section style={{ borderRadius: 14, overflow: "hidden", border: "1px solid var(--gx-card-border)", marginBottom: 18 }}>
      <div style={{ background: "#0F6E56", padding: "20px 24px" }}>
        {tagline && (
          <div style={{ fontSize: 11, letterSpacing: 0.7, textTransform: "uppercase", color: "#9FE1CB", marginBottom: 6 }}>{tagline}</div>
        )}
        <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic", fontSize: "clamp(22px, 6.5vw, 26px)", lineHeight: 1.1, color: "#fff", marginBottom: showIucn ? 11 : 0, wordBreak: "break-word" }}>
          {g.name}
        </div>
        {showIucn && (
          <span style={{ fontSize: 12, fontWeight: 700, color: "#04342C", background: "#9FE1CB", padding: "3px 11px", borderRadius: 999 }}>
            {g.iucn}{IUCN_LABEL[g.iucn] ? ` · ${IUCN_LABEL[g.iucn]}` : ""}
          </span>
        )}
      </div>

      <div style={{ background: "var(--gx-card-bg)", padding: "10px 16px 16px" }}>
        <svg viewBox="0 0 380 332" style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} aria-hidden="true">
          {POS.map((p, i) => (
            <line key={`l${i}`} x1="190" y1="175" x2={p.cx} y2={p.cy} stroke="var(--gx-border-soft)" strokeWidth="1.5" />
          ))}
          <circle cx="190" cy="175" r="22" fill="var(--gx-surface-2)" stroke="var(--gx-border-soft)" strokeWidth="0.5" />
          <text x="190" y="181" textAnchor="middle" fontSize="16" fill="#0F6E56">✿</text>
          {areas.map((a, i) => {
            const p = POS[i];
            if (!p) return null;
            const vis = Math.max(0, Math.min(1, (a.fill || 0) / 100)) * CIRC;
            return (
              <g key={a.key}>
                <circle cx={p.cx} cy={p.cy} r={R} fill="none" stroke="var(--gx-border-soft)" strokeWidth="6" />
                <circle cx={p.cx} cy={p.cy} r={R} fill="none" stroke={a.color} strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={`${vis.toFixed(1)} ${CIRC.toFixed(1)}`} transform={`rotate(-90 ${p.cx} ${p.cy})`} />
                <text x={p.cx} y={p.cy + 4} textAnchor="middle" fontSize="11" fill="var(--gx-ink-soft)">{a.fill}%</text>
                <text x={p.lx} y={p.ly} textAnchor="middle" fontSize="12" fill="var(--gx-ink)">{a.label}</text>
              </g>
            );
          })}
        </svg>
        {gap && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, padding: "9px 12px", background: "#FAEEDA", borderRadius: 8 }}>
            <span style={{ fontSize: 12.5, color: "#854F0B" }}>en büyük boşluk: <strong style={{ fontWeight: 700 }}>{gap.label} %{gap.fill}</strong> — buradan başla</span>
          </div>
        )}
        {user && areas.length > 0 && (
          <div style={{ marginTop: 11 }}>
            <div style={{ fontSize: 11, color: "var(--gx-ink-soft)", marginBottom: 6 }}>Bu türde pozisyon al — çalışma masana ekle:</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {areas.map((a) => (
                <button key={a.key} onClick={() => take(a.key)} disabled={!!took[a.key]}
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 600,
                           padding: "7px 12px", borderRadius: 999, cursor: took[a.key] ? "default" : "pointer",
                           background: "var(--gx-surface-2)", color: a.color, border: `1px solid ${a.color}40`, opacity: took[a.key] ? 0.5 : 1 }}>
                  <span style={{ width: 7, height: 7, borderRadius: 999, background: a.color }} />
                  {a.label}{took[a.key] ? " ✓" : ""}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
