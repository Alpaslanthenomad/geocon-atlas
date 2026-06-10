"use client";
// components/geocon/AnalysisPane.jsx
//
// The Thesis Workbench statistical-analysis tool. A researcher imports their data
// (CSV/XLSX) and runs the core battery of an empirical geophyte thesis -- entirely
// inside GEOCON, no R/SPSS/Excel. Every run is persisted with the dataset hash +
// method + parameters + library versions (reproducible), and the interpretation
// uses [EKLE:] for anything the researcher must confirm (never auto-asserted).

import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import * as ss from "simple-statistics";
import jstatpkg from "jstat";
import { ResponsiveContainer, ComposedChart, Scatter, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ErrorBar, ReferenceLine } from "recharts";
import { supabase } from "../../lib/supabase";

const jStat = jstatpkg.jStat || jstatpkg;
const SS_VER = "simple-statistics 7", JSTAT_VER = "jstat 1.9";

/* ---------- pure stats ---------- */
const num = (rows, col) => rows.map((r) => Number(r[col])).filter((v) => Number.isFinite(v));
const tP2 = (t, df) => 2 * (1 - jStat.studentt.cdf(Math.abs(t), df));

function descriptives(x) {
  // sample SD/variance (n-1) -- the conventional descriptive for a research sample
  return { n: x.length, mean: ss.mean(x), median: ss.median(x), sd: ss.sampleStandardDeviation(x), variance: ss.sampleVariance(x), min: ss.min(x), max: ss.max(x), q1: ss.quantile(x, 0.25), q3: ss.quantile(x, 0.75) };
}
function welchT(a, b) {
  // sample variance (n-1) is required for inferential statistics, not population variance
  const ma = ss.mean(a), mb = ss.mean(b), va = ss.sampleVariance(a), vb = ss.sampleVariance(b), na = a.length, nb = b.length;
  const se = Math.sqrt(va / na + vb / nb);
  const t = (ma - mb) / se;
  const df = Math.pow(va / na + vb / nb, 2) / (Math.pow(va / na, 2) / (na - 1) + Math.pow(vb / nb, 2) / (nb - 1));
  const sp = Math.sqrt(((na - 1) * va + (nb - 1) * vb) / (na + nb - 2));
  const d = (ma - mb) / sp;
  const ciHalf = jStat.studentt.inv(0.975, df) * se;
  return { t, df, p: tP2(t, df), d, meanDiff: ma - mb, ci: [ma - mb - ciHalf, ma - mb + ciHalf], ma, mb, na, nb };
}
function anova(groups) {
  const all = groups.flat(), grand = ss.mean(all), k = groups.length, N = all.length;
  let ssb = 0, ssw = 0;
  groups.forEach((g) => { const m = ss.mean(g); ssb += g.length * Math.pow(m - grand, 2); g.forEach((v) => (ssw += Math.pow(v - m, 2))); });
  const dfb = k - 1, dfw = N - k, F = (ssb / dfb) / (ssw / dfw);
  return { F, dfb, dfw, p: 1 - jStat.centralF.cdf(F, dfb, dfw), etaSq: ssb / (ssb + ssw), k, N };
}
function ranks(arr) { const s = arr.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]); const out = Array(arr.length); s.forEach((p, i) => (out[p[1]] = i + 1)); return out; }
function corr(x, y, method) {
  const xr = method === "spearman" ? ranks(x) : x, yr = method === "spearman" ? ranks(y) : y;
  const r = ss.sampleCorrelation(xr, yr), n = x.length, t = r * Math.sqrt((n - 2) / (1 - r * r));
  return { r, n, t, df: n - 2, p: tP2(t, n - 2) };
}
function regression(x, y) {
  const data = x.map((xi, i) => [xi, y[i]]);
  const { m, b } = ss.linearRegression(data), line = ss.linearRegressionLine({ m, b });
  const r = ss.sampleCorrelation(x, y), n = x.length, res = x.map((xi, i) => y[i] - line(xi));
  const se = Math.sqrt(ss.sum(res.map((e) => e * e)) / (n - 2) / ss.sum(x.map((xi) => Math.pow(xi - ss.mean(x), 2))));
  const t = m / se;
  return { m, b, r2: r * r, n, t, df: n - 2, p: tP2(t, n - 2) };
}

const fnum = (v, d = 3) => (Number.isFinite(v) ? Number(v).toFixed(d) : "—");
const sig = (p) => (p < 0.05 ? "istatistiksel olarak anlamlı" : "anlamlı değil") + " (α=0.05)";

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

const METHODS = [
  { k: "descriptives", l: "Descriptives" },
  { k: "ttest", l: "t-test (two-sample)" },
  { k: "anova", l: "One-way ANOVA" },
  { k: "correlation", l: "Correlation" },
  { k: "regression", l: "Linear regression" },
];

export default function AnalysisPane({ thesisId }) {
  const [ds, setDs] = useState(null); // {name, columns, rows, hash, id}
  const [busy, setBusy] = useState(false);
  const [method, setMethod] = useState("descriptives");
  const [colA, setColA] = useState("");
  const [colB, setColB] = useState("");
  const [result, setResult] = useState(null);
  const [runs, setRuns] = useState([]);
  const [err, setErr] = useState(null);

  useEffect(() => {
    supabase.rpc("list_thesis_analysis_runs", { p_thesis_id: thesisId }).then(({ data }) => setRuns(Array.isArray(data) ? data : [])).catch(() => {});
  }, [thesisId]);

  const numericCols = useMemo(() => {
    if (!ds) return [];
    return ds.columns.filter((c) => ds.rows.filter((r) => Number.isFinite(Number(r[c]))).length >= ds.rows.length * 0.6);
  }, [ds]);

  async function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(null); setBusy(true);
    try {
      const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });
      if (!rows.length) throw new Error("Boş dosya / no rows");
      const columns = Object.keys(rows[0]);
      const hash = await sha256(JSON.stringify(rows));
      let id = null;
      try {
        const { data } = await supabase.rpc("save_thesis_dataset", { p_thesis_id: thesisId, p_name: file.name, p_columns: columns, p_row_count: rows.length, p_content_hash: hash, p_rows: rows.length <= 20000 ? rows : null });
        id = data || null;
      } catch (_) {}
      setDs({ name: file.name, columns, rows, hash, id });
      setColA(""); setColB(""); setResult(null);
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  async function run() {
    setErr(null);
    try {
      if (!ds) throw new Error("Önce veri içe aktar");
      let out = null, params = {};
      if (method === "descriptives") {
        const x = num(ds.rows, colA);
        if (x.length < 2) throw new Error("Sayısal bir sütun seç (en az 2 değer)");
        out = { kind: "descriptives", col: colA, ...descriptives(x), chart: { kind: "hist", values: x.slice(0, 3000) } };
        params = { column: colA };
      } else if (method === "ttest") {
        const groups = groupBy(ds.rows, colB, colA);
        const keys = Object.keys(groups);
        if (keys.length !== 2) throw new Error("Gruplama sütunu tam 2 düzey içermeli (bulunan: " + keys.length + ")");
        out = { kind: "ttest", value: colA, group: colB, levels: keys, ...welchT(groups[keys[0]], groups[keys[1]]), chart: { kind: "groups", bars: groupBars(groups, keys) } };
        params = { value: colA, group: colB };
      } else if (method === "anova") {
        const groups = groupBy(ds.rows, colB, colA);
        const arr = Object.values(groups).filter((g) => g.length >= 2);
        if (arr.length < 3) throw new Error("ANOVA için ≥3 grup (her biri ≥2 değer)");
        out = { kind: "anova", value: colA, group: colB, levels: Object.keys(groups), ...anova(arr), chart: { kind: "groups", bars: groupBars(groups, Object.keys(groups)) } };
        params = { value: colA, group: colB };
      } else if (method === "correlation") {
        const { x, y } = pairXY(ds.rows, colA, colB);
        if (x.length < 3) throw new Error("İki sayısal sütun seç (≥3 eşleşen değer)");
        out = { kind: "correlation", x: colA, y: colB, pearson: corr(x, y, "pearson"), spearman: corr(x, y, "spearman"), chart: { kind: "scatter", points: x.map((xi, i) => ({ x: xi, y: y[i] })).slice(0, 1500) } };
        params = { x: colA, y: colB };
      } else if (method === "regression") {
        const { x, y } = pairXY(ds.rows, colA, colB);
        if (x.length < 3) throw new Error("X ve Y sayısal sütunları seç (≥3 eşleşen değer)");
        const reg = regression(x, y);
        out = { kind: "regression", x: colA, y: colB, ...reg, chart: { kind: "scatter", points: x.map((xi, i) => ({ x: xi, y: y[i] })).slice(0, 1500), line: { x0: ss.min(x), x1: ss.max(x), m: reg.m, b: reg.b } } };
        params = { x: colA, y: colB };
      }
      setResult(out);
      // persist (reproducible run)
      try {
        await supabase.rpc("save_thesis_analysis_run", {
          p_thesis_id: thesisId, p_dataset_id: ds.id, p_method: method,
          p_input_columns: [colA, colB].filter(Boolean), p_parameters: params, p_results: out,
          p_versions: { simple_statistics: SS_VER, jstat: JSTAT_VER }, p_dataset_hash: ds.hash,
        });
        supabase.rpc("list_thesis_analysis_runs", { p_thesis_id: thesisId }).then(({ data }) => setRuns(Array.isArray(data) ? data : [])).catch(() => {});
      } catch (_) {}
    } catch (e) { setErr(e.message); setResult(null); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ fontSize: 12.5, color: "var(--gx-ink-soft)", lineHeight: 1.6 }}>
        Veriyi içe aktar, bir test seç, sonucu al — hepsi GEOCON içinde. Her koşu veri-hash'i, yöntem ve kütüphane sürümleriyle <strong>tekrarlanabilir</strong> kaydedilir. Yorumlar <code>[EKLE:]</code> ile işaretli; hiçbir şey otomatik fact yapılmaz.
      </div>

      {/* import */}
      <div style={{ padding: "14px 16px", borderRadius: 12, background: "var(--gx-surface)", border: "1px dashed var(--gx-border)" }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--gx-ink)", cursor: "pointer" }}>
          {busy ? "İşleniyor…" : ds ? "Başka veri seç" : "CSV / XLSX içe aktar"}
          <input type="file" accept=".csv,.xlsx,.xls" onChange={onFile} style={{ display: "none" }} />
        </label>
        {ds && (
          <div style={{ fontSize: 11, color: "var(--gx-ink-muted)", marginTop: 6 }}>
            {ds.name} · {ds.rows.length} satır · {ds.columns.length} sütun · hash {ds.hash.slice(0, 12)}…{ds.id ? " · kaydedildi" : ""}
          </div>
        )}
      </div>

      {ds && (
        <div style={{ padding: "14px 16px", borderRadius: 12, background: "var(--gx-surface)", border: "1px solid var(--gx-border-soft)", display: "flex", flexDirection: "column", gap: 12 }}>
          <Row label="Yöntem">
            <select value={method} onChange={(e) => { setMethod(e.target.value); setResult(null); }} style={sel}>
              {METHODS.map((m) => <option key={m.k} value={m.k}>{m.l}</option>)}
            </select>
          </Row>
          <Row label={method === "ttest" || method === "anova" ? "Değer (sayısal)" : method === "descriptives" ? "Sütun (sayısal)" : "X (sayısal)"}>
            <select value={colA} onChange={(e) => setColA(e.target.value)} style={sel}>
              <option value="">—</option>
              {numericCols.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Row>
          {method !== "descriptives" && (
            <Row label={method === "ttest" || method === "anova" ? "Grup (kategorik)" : "Y (sayısal)"}>
              <select value={colB} onChange={(e) => setColB(e.target.value)} style={sel}>
                <option value="">—</option>
                {(method === "ttest" || method === "anova" ? ds.columns : numericCols).map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Row>
          )}
          <button onClick={run} disabled={!colA || (method !== "descriptives" && !colB)} style={runBtn(!(!colA || (method !== "descriptives" && !colB)))}>Analiz et →</button>
        </div>
      )}

      {err && <div style={{ fontSize: 12, color: "var(--gx-danger, #c0392b)", padding: "8px 12px", borderRadius: 8, background: "rgba(192,57,43,0.08)" }}>{err}</div>}

      {result && <ResultCard r={result} />}

      {runs.length > 0 && (
        <div style={{ marginTop: 4 }}>
          <div style={{ fontSize: 10.5, letterSpacing: 1, textTransform: "uppercase", color: "var(--gx-ink-muted)", fontWeight: 700, marginBottom: 8 }}>Geçmiş koşular ({runs.length}) · tekrarlanabilir</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {runs.slice(0, 8).map((r) => (
              <div key={r.id} style={{ fontSize: 11.5, color: "var(--gx-ink-soft)", padding: "7px 10px", borderRadius: 8, background: "var(--gx-surface-sunken, rgba(0,0,0,0.02))", border: "1px solid var(--gx-border-soft)", display: "flex", justifyContent: "space-between", gap: 8 }}>
                <span><strong>{r.method}</strong> · {(r.input_columns || []).join(", ")}</span>
                <span style={{ color: "var(--gx-ink-muted)", fontFamily: "ui-monospace, monospace" }}>{(r.dataset_hash || "").slice(0, 8)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ResultCard({ r }) {
  const lines = interpret(r);
  return (
    <div style={{ padding: "16px 18px", borderRadius: 12, background: "var(--gx-surface)", border: "1px solid var(--gx-border-soft)", borderLeft: "3px solid var(--gx-success)" }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--gx-success)", marginBottom: 10 }}>Result</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 8 }}>
        {statCells(r).map((c) => (
          <div key={c.k} style={{ padding: "8px 10px", borderRadius: 8, background: "var(--gx-surface-sunken, rgba(0,0,0,0.02))" }}>
            <div style={{ fontSize: 9, color: "var(--gx-ink-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>{c.k}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--gx-ink)", fontFamily: "ui-monospace, monospace" }}>{c.v}</div>
          </div>
        ))}
      </div>
      {r.chart && <Figure chart={r.chart} />}
      <div style={{ fontSize: 12.5, color: "var(--gx-ink-soft)", lineHeight: 1.6, marginTop: 12 }}>
        {lines.map((l, i) => <div key={i} style={{ marginTop: i ? 4 : 0 }}>{l}</div>)}
      </div>
    </div>
  );
}

const groupBars = (groups, keys) => keys.map((k) => ({ name: String(k), mean: ss.mean(groups[k]), sd: groups[k].length >= 2 ? ss.sampleStandardDeviation(groups[k]) : 0, n: groups[k].length }));

function histBins(vals, n = 12) {
  if (!vals || !vals.length) return [];
  const mn = ss.min(vals), mx = ss.max(vals), w = (mx - mn) / n || 1;
  const bins = Array.from({ length: n }, (_, i) => ({ name: (mn + i * w).toFixed(1), count: 0 }));
  vals.forEach((v) => { let i = Math.floor((v - mn) / w); if (i >= n) i = n - 1; if (i < 0) i = 0; bins[i].count++; });
  return bins;
}

function Figure({ chart }) {
  const c = chart || {};
  const wrap = (el) => <div style={{ marginTop: 14, height: 220 }}>{el}</div>;
  if (c.kind === "scatter") {
    const line = c.line ? [{ x: c.line.x0, y: c.line.m * c.line.x0 + c.line.b }, { x: c.line.x1, y: c.line.m * c.line.x1 + c.line.b }] : null;
    return wrap(
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart margin={{ top: 8, right: 12, bottom: 4, left: -8 }}>
          <CartesianGrid stroke="rgba(0,0,0,0.06)" />
          <XAxis type="number" dataKey="x" tick={{ fontSize: 10 }} />
          <YAxis type="number" dataKey="y" tick={{ fontSize: 10 }} />
          <Tooltip cursor={{ stroke: "rgba(0,0,0,0.1)" }} />
          <Scatter data={c.points} fill="#1B5E20" fillOpacity={0.6} />
          {line && <Line data={line} dataKey="y" stroke="#B8860B" dot={false} strokeWidth={2} isAnimationActive={false} legendType="none" />}
        </ComposedChart>
      </ResponsiveContainer>
    );
  }
  if (c.kind === "groups") {
    return wrap(
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={c.bars} margin={{ top: 8, right: 12, bottom: 4, left: -8 }}>
          <CartesianGrid stroke="rgba(0,0,0,0.06)" />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Bar dataKey="mean" fill="#1B5E20" radius={[3, 3, 0, 0]}>
            <ErrorBar dataKey="sd" width={4} strokeWidth={1.2} stroke="#7a5713" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }
  if (c.kind === "hist") {
    return wrap(
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={histBins(c.values)} margin={{ top: 8, right: 12, bottom: 4, left: -8 }}>
          <CartesianGrid stroke="rgba(0,0,0,0.06)" />
          <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={1} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Bar dataKey="count" fill="#1A237E" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }
  return null;
}

function statCells(r) {
  if (r.kind === "descriptives") return [["n", r.n], ["mean", fnum(r.mean)], ["median", fnum(r.median)], ["SD", fnum(r.sd)], ["min", fnum(r.min)], ["max", fnum(r.max)], ["Q1", fnum(r.q1)], ["Q3", fnum(r.q3)]].map(([k, v]) => ({ k, v }));
  if (r.kind === "ttest") return [["t", fnum(r.t)], ["df", fnum(r.df, 1)], ["p", fnum(r.p, 4)], ["mean Δ", fnum(r.meanDiff)], ["Cohen d", fnum(r.d)], ["95% CI", fnum(r.ci[0], 2) + "…" + fnum(r.ci[1], 2)]].map(([k, v]) => ({ k, v }));
  if (r.kind === "anova") return [["F", fnum(r.F)], ["df", r.dfb + ", " + r.dfw], ["p", fnum(r.p, 4)], ["η²", fnum(r.etaSq)], ["groups", r.k], ["N", r.N]].map(([k, v]) => ({ k, v }));
  if (r.kind === "correlation") return [["Pearson r", fnum(r.pearson.r)], ["p", fnum(r.pearson.p, 4)], ["Spearman ρ", fnum(r.spearman.r)], ["p", fnum(r.spearman.p, 4)], ["n", r.pearson.n]].map(([k, v]) => ({ k, v }));
  if (r.kind === "regression") return [["slope", fnum(r.m)], ["intercept", fnum(r.b)], ["R²", fnum(r.r2)], ["t", fnum(r.t)], ["p", fnum(r.p, 4)], ["n", r.n]].map(([k, v]) => ({ k, v }));
  return [];
}

function interpret(r) {
  if (r.kind === "descriptives") return [`${r.col}: ortalama ${fnum(r.mean)} (SD ${fnum(r.sd)}, n=${r.n}).`, "[EKLE: dağılımın biyolojik/koruma yorumu]"];
  if (r.kind === "ttest") return [`${r.value}, ${r.group} grupları arasında (${r.levels.join(" vs ")}): t(${fnum(r.df, 1)}) = ${fnum(r.t)}, p = ${fnum(r.p, 4)} — ${sig(r.p)}. Etki büyüklüğü Cohen's d = ${fnum(r.d)}.`, "[EKLE: bulgunun biyolojik anlamı + örneklem sınırları]"];
  if (r.kind === "anova") return [`${r.value}, ${r.k} grup arasında: F(${r.dfb}, ${r.dfw}) = ${fnum(r.F)}, p = ${fnum(r.p, 4)} — ${sig(r.p)} (η² = ${fnum(r.etaSq)}).`, "[EKLE: post-hoc ikili karşılaştırmalar (Tukey HSD) sonraki sürümde] · [EKLE: yorum]"];
  if (r.kind === "correlation") return [`${r.x} ↔ ${r.y}: Pearson r = ${fnum(r.pearson.r)} (p = ${fnum(r.pearson.p, 4)}), Spearman ρ = ${fnum(r.spearman.r)} (p = ${fnum(r.spearman.p, 4)}).`, "[EKLE: korelasyon nedensellik değildir — yorum]"];
  if (r.kind === "regression") return [`${r.y} ~ ${r.x}: eğim ${fnum(r.m)} (p = ${fnum(r.p, 4)}), R² = ${fnum(r.r2)} — varyansın %${fnum(r.r2 * 100, 1)}'i açıklanıyor.`, "[EKLE: model varsayımları (doğrusallık, artıklar) + yorum]"];
  return [];
}

function groupBy(rows, groupCol, valueCol) {
  const out = {};
  rows.forEach((r) => {
    const g = r[groupCol], v = Number(r[valueCol]);
    if (g == null || g === "" || !Number.isFinite(v)) return;
    (out[g] = out[g] || []).push(v);
  });
  return out;
}
function pairXY(rows, xc, yc) {
  const x = [], y = [];
  rows.forEach((r) => { const a = Number(r[xc]), b = Number(r[yc]); if (Number.isFinite(a) && Number.isFinite(b)) { x.push(a); y.push(b); } });
  return { x, y };
}

function Row({ label, children }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <span style={{ fontSize: 11.5, color: "var(--gx-ink-muted)", minWidth: 130 }}>{label}</span>
      {children}
    </label>
  );
}
const sel = { fontSize: 13, padding: "7px 10px", borderRadius: 8, border: "1px solid var(--gx-border)", background: "var(--gx-surface)", color: "var(--gx-ink)", minWidth: 180 };
const runBtn = (on) => ({ alignSelf: "flex-start", fontSize: 12.5, fontWeight: 700, color: on ? "#fff" : "var(--gx-ink-muted)", background: on ? "var(--gx-success)" : "var(--gx-surface-sunken, rgba(0,0,0,0.05))", border: "none", padding: "9px 16px", borderRadius: 9, cursor: on ? "pointer" : "not-allowed", marginTop: 4 });
