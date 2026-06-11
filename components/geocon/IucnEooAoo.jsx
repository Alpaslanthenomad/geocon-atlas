"use client";
// EOO / AOO calculator — IUCN Red List Criterion B parameters.
//   EOO (Extent of Occurrence) = area of the minimum convex polygon around the
//     occurrence points (km^2).
//   AOO (Area of Occupancy)    = number of occupied 2x2 km grid cells x 4 km^2.
// PRIVACY: the raw coordinates are parsed + computed CLIENT-SIDE only and are
// NEVER stored. Only the computed EOO/AOO aggregates + the point count are saved.

import { useMemo, useState } from "react";
import { Calculator, Save, MapPin } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useToast } from "../ui";

// Andrew's monotone-chain convex hull on projected {x,y} km points.
function convexHull(pts) {
  if (pts.length < 3) return pts.slice();
  const p = pts.slice().sort((a, b) => a.x - b.x || a.y - b.y);
  const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower = [];
  for (const pt of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], pt) <= 0) lower.pop();
    lower.push(pt);
  }
  const upper = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const pt = p[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], pt) <= 0) upper.pop();
    upper.push(pt);
  }
  lower.pop(); upper.pop();
  return lower.concat(upper);
}
function polyArea(h) {
  let a = 0;
  for (let i = 0; i < h.length; i++) { const j = (i + 1) % h.length; a += h[i].x * h[j].y - h[j].x * h[i].y; }
  return Math.abs(a) / 2;
}

function parsePoints(raw) {
  const out = [];
  for (const line of (raw || "").split(/\r?\n/)) {
    const m = line.match(/(-?\d+(?:\.\d+)?)[ ,\t]+(-?\d+(?:\.\d+)?)/);
    if (!m) continue;
    const lat = parseFloat(m[1]), lon = parseFloat(m[2]);
    if (Number.isFinite(lat) && Number.isFinite(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      out.push({ lat, lon });
    }
  }
  return out;
}

function compute(points) {
  if (!points.length) return null;
  const lat0 = points.reduce((s, p) => s + p.lat, 0) / points.length;
  const lon0 = points.reduce((s, p) => s + p.lon, 0) / points.length;
  const kx = 111.320 * Math.cos((lat0 * Math.PI) / 180), ky = 110.574;
  const proj = points.map((p) => ({ x: (p.lon - lon0) * kx, y: (p.lat - lat0) * ky }));
  // AOO: distinct 2x2 km cells
  const cells = new Set(proj.map((p) => `${Math.floor(p.x / 2)}_${Math.floor(p.y / 2)}`));
  const aoo = cells.size * 4;
  // EOO: convex-hull area (>=3 points; else 0)
  const eoo = proj.length >= 3 ? polyArea(convexHull(proj)) : 0;
  return { n: points.length, eoo, aoo, cells: cells.size };
}

// Criterion-B category suggestion from EOO (B1) and AOO (B2) thresholds.
function suggestCategory({ eoo, aoo }) {
  const fromEoo = eoo > 0 ? (eoo < 100 ? "CR" : eoo < 5000 ? "EN" : eoo < 20000 ? "VU" : null) : null;
  const fromAoo = aoo > 0 ? (aoo < 10 ? "CR" : aoo < 500 ? "EN" : aoo < 2000 ? "VU" : null) : null;
  const rank = { CR: 3, EN: 2, VU: 1 };
  const best = [fromEoo, fromAoo].filter(Boolean).sort((a, b) => rank[b] - rank[a])[0] || null;
  return { fromEoo, fromAoo, best };
}

export default function IucnEooAoo({ assessmentId, value, locked, onSaved }) {
  const toast = useToast();
  const [raw, setRaw] = useState("");
  const [saving, setSaving] = useState(false);
  const points = useMemo(() => parsePoints(raw), [raw]);
  const result = useMemo(() => compute(points), [points]);
  const suggestion = useMemo(() => (result ? suggestCategory(result) : null), [result]);

  const saved = value && (value.eoo_km2 != null || value.aoo_km2 != null);

  async function save() {
    if (!result) return;
    setSaving(true);
    try {
      const { error } = await supabase.rpc("save_iucn_parameters", {
        p_id: assessmentId,
        p_eoo_km2: Number(result.eoo.toFixed(2)),
        p_aoo_km2: Number(result.aoo.toFixed(2)),
        p_n: result.n,
      });
      if (error) throw error;
      toast.success("EOO/AOO kaydedildi");
      onSaved?.();
    } catch (e) {
      toast.error("Kaydedilemedi", { detail: e?.message });
    } finally {
      setSaving(false);
    }
  }

  const stat = { display: "flex", flexDirection: "column", gap: 2, padding: "8px 12px", background: "var(--gx-surface-2)", border: "1px solid var(--gx-border-soft)", borderRadius: 8, minWidth: 120 };
  const statNum = { fontSize: 18, fontWeight: 600, color: "var(--gx-ink)", fontFamily: "var(--gx-font-mono)" };
  const statLbl = { fontSize: 10, color: "var(--gx-ink-muted)", textTransform: "uppercase", letterSpacing: 0.4 };

  return (
    <section style={{ marginBottom: 16, padding: 14, background: "var(--gx-card-bg)", border: "1px solid var(--gx-card-border)", borderRadius: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
        <Calculator size={14} strokeWidth={2.1} style={{ color: "var(--gx-accent-azure)" }} />
        <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--gx-ink)" }}>EOO / AOO — Kriter B parametreleri</h3>
      </div>
      <p style={{ margin: "0 0 10px", fontSize: 11, color: "var(--gx-ink-muted)", lineHeight: 1.6 }}>
        Occurrence noktalarını (her satıra <span style={{ fontFamily: "var(--gx-font-mono)" }}>enlem, boylam</span>) yapıştır.
        Hesaplama tarayıcıda yapılır; <strong>ham koordinatlar saklanmaz</strong> — yalnız EOO/AOO kaydedilir.
      </p>

      {saved && (
        <div style={{ marginBottom: 10, fontSize: 11, color: "var(--gx-ink-soft)" }}>
          Kayıtlı: EOO <strong>{value.eoo_km2?.toLocaleString?.()}</strong> km² · AOO <strong>{value.aoo_km2?.toLocaleString?.()}</strong> km² · {value.occurrence_n} nokta
        </div>
      )}

      {!locked && (
        <>
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={"36.812, 34.641\n37.058, 35.321\n36.402, 33.998"}
            rows={5}
            style={{ width: "100%", resize: "vertical", fontFamily: "var(--gx-font-mono)", fontSize: 12, padding: 8,
                     background: "var(--gx-surface-1)", border: "1px solid var(--gx-border-soft)", borderRadius: 8, color: "var(--gx-ink)" }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "6px 0 12px", fontSize: 11, color: "var(--gx-ink-muted)" }}>
            <MapPin size={12} strokeWidth={2} /> {points.length} geçerli nokta okundu
          </div>

          {result && (
            <>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                <div style={stat}><span style={statNum}>{result.eoo >= 1 ? Math.round(result.eoo).toLocaleString() : result.eoo.toFixed(2)}</span><span style={statLbl}>EOO km²</span></div>
                <div style={stat}><span style={statNum}>{result.aoo.toLocaleString()}</span><span style={statLbl}>AOO km² ({result.cells} hücre)</span></div>
                <div style={stat}>
                  <span style={{ ...statNum, color: suggestion?.best ? "var(--gx-warning)" : "var(--gx-ink-muted)" }}>{suggestion?.best || "—"}</span>
                  <span style={statLbl}>Kriter B önerisi</span>
                </div>
              </div>
              <p style={{ margin: "0 0 12px", fontSize: 10, color: "var(--gx-ink-faint)", lineHeight: 1.6 }}>
                Eşikler: EOO (B1) &lt;100 CR · &lt;5.000 EN · &lt;20.000 VU; AOO (B2) &lt;10 CR · &lt;500 EN · &lt;2.000 VU.
                Kriter B ayrıca a/b/c alt-koşullarından ≥2 gerektirir — kategoriyi yine sen onaylarsın.
              </p>
              <button onClick={save} disabled={saving}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", fontSize: 12, fontWeight: 600,
                         background: "var(--gx-accent-azure)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
                <Save size={11} strokeWidth={2.2} /> {saving ? "Kaydediliyor…" : "Değerlendirmeye kaydet"}
              </button>
            </>
          )}
        </>
      )}
    </section>
  );
}
