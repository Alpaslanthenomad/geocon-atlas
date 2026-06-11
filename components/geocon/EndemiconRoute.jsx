"use client";
// EndemiCon — the public endemic-conservation lens. A single-country native range is the
// endemic signal (7,130 geophytes); the headline gap is the ~6,700 with no IUCN assessment.
// Public, money-blind, in the locked brand language (green + serif + radial).

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { flag } from "../../lib/atlas/format";
import { IUCN_COLORS } from "../../lib/iucn";

const R = 18;
const CIRC = 2 * Math.PI * R;
const CONS = "#639922";

function Ring({ fill }) {
  const vis = Math.max(0, Math.min(1, (fill || 0) / 100)) * CIRC;
  return (
    <svg width="46" height="46" viewBox="0 0 46 46" style={{ flexShrink: 0 }} aria-hidden="true">
      <circle cx="23" cy="23" r={R} fill="none" stroke="var(--gx-border-soft)" strokeWidth="4.5" />
      <circle cx="23" cy="23" r={R} fill="none" stroke={CONS} strokeWidth="4.5" strokeLinecap="round"
        strokeDasharray={`${vis.toFixed(1)} ${CIRC.toFixed(1)}`} transform="rotate(-90 23 23)" />
      <text x="23" y="27" textAnchor="middle" fontSize="12" fill="var(--gx-ink)">{fill}</text>
    </svg>
  );
}

function Stat({ value, label, tint }) {
  return (
    <div style={{ background: "var(--gx-surface-2)", borderRadius: 10, padding: "12px 14px", flex: "1 1 130px", minWidth: 120 }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: tint || "var(--gx-ink)" }}>{Number(value || 0).toLocaleString()}</div>
      <div style={{ fontSize: 11.5, color: "var(--gx-ink-soft)", marginTop: 2 }}>{label}</div>
    </div>
  );
}

export default function EndemiconRoute() {
  const [stats, setStats] = useState(null);
  const [countries, setCountries] = useState([]);
  const [species, setSpecies] = useState(null);
  const [country, setCountry] = useState(null);
  const [threatenedOnly, setThreatenedOnly] = useState(false);

  useEffect(() => {
    supabase.rpc("get_endemicon_stats").then(({ data }) => setStats(data || null)).catch(() => {});
    supabase.rpc("list_endemicon_countries").then(({ data }) => setCountries(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  useEffect(() => {
    setSpecies(null);
    supabase.rpc("list_endemicon_species", { p_country: country, p_threatened_only: threatenedOnly, p_limit: 30, p_offset: 0 })
      .then(({ data }) => setSpecies(Array.isArray(data) ? data : []))
      .catch(() => setSpecies([]));
  }, [country, threatenedOnly]);

  const chipBase = { fontSize: 12, padding: "5px 11px", borderRadius: 999, cursor: "pointer", border: "1px solid var(--gx-border-soft)", background: "var(--gx-surface-2)", color: "var(--gx-ink-soft)" };
  const chipActive = { background: "#0F6E56", color: "#fff", border: "1px solid #0F6E56" };

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto" }}>
      <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid var(--gx-card-border)", marginBottom: 18 }}>
        <div style={{ background: "#0F6E56", padding: "clamp(20px, 5vw, 26px) clamp(18px, 5vw, 28px)" }}>
          <div style={{ fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase", color: "#9FE1CB", marginBottom: 7 }}>VENN BioVentures · koruma girişimi</div>
          <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic", fontSize: "clamp(26px, 8vw, 32px)", lineHeight: 1.05, color: "#fff", marginBottom: 10 }}>EndemiCon</div>
          <div style={{ fontSize: 14, color: "#E1F5EE", maxWidth: 620, lineHeight: 1.6 }}>
            Yalnız tek bir ülkede yetişen — başka hiçbir yerde olmayan — geofitler. Kaybedilirlerse geri gelmezler. EndemiCon, bu endemiklerin korunma boşluğunu görünür kılar.
          </div>
        </div>
        {stats && (
          <div style={{ background: "var(--gx-card-bg)", padding: "14px 16px", display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Stat value={stats.endemic_total} label="endemik geofit" />
            <Stat value={stats.threatened} label="tehdit altında" tint="#A32D2D" />
            <Stat value={stats.unassessed} label="hiç değerlendirilmemiş" tint="#854F0B" />
            <Stat value={stats.countries} label="ülke" />
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
        <button onClick={() => setCountry(null)} style={{ ...chipBase, ...(country === null ? chipActive : {}) }}>Tümü</button>
        {countries.slice(0, 14).map((c) => (
          <button key={c.country} onClick={() => setCountry(c.country)} style={{ ...chipBase, ...(country === c.country ? chipActive : {}) }}>
            {flag ? flag(c.country) : ""} {c.country} · {c.endemics}
          </button>
        ))}
        <label style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--gx-ink-soft)", cursor: "pointer", padding: "4px 2px" }}>
          <input type="checkbox" checked={threatenedOnly} onChange={(e) => setThreatenedOnly(e.target.checked)} style={{ width: 16, height: 16 }} />
          yalnız tehdit altındakiler
        </label>
      </div>

      {species === null ? (
        <div style={{ fontSize: 12, color: "var(--gx-ink-muted)" }}>Yükleniyor…</div>
      ) : species.length === 0 ? (
        <div style={{ fontSize: 12.5, color: "var(--gx-ink-muted)", padding: 16 }}>Bu filtreyle endemik bulunamadı.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 240px), 1fr))", gap: 12 }}>
          {species.map((s) => {
            const iucnColor = IUCN_COLORS[s.iucn] || "#888780";
            const threat = ["CR", "EN", "VU"].includes(s.iucn);
            return (
              <Link key={s.species_id} href={`/geocon/species/${s.species_id}`}
                style={{ display: "flex", gap: 12, alignItems: "center", textDecoration: "none", background: "var(--gx-card-bg)", border: "1px solid var(--gx-card-border)", borderRadius: 12, padding: "0.85rem 1rem" }}>
                <Ring fill={s.cons_fill} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic", fontSize: 14.5, color: "var(--gx-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: "var(--gx-ink-faint)" }}>{flag ? flag(s.country) : ""} {s.country}</span>
                    {s.iucn && s.iucn !== "—" && (
                      <span style={{ fontSize: 9.5, fontWeight: 700, color: "#fff", background: iucnColor, padding: "1px 6px", borderRadius: 4 }}>{s.iucn}</span>
                    )}
                    {(!s.iucn || s.iucn === "—") && (
                      <span style={{ fontSize: 9.5, fontWeight: 600, color: "#854F0B", background: "#FAEEDA", padding: "1px 6px", borderRadius: 4 }}>değerlendirilmemiş</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
