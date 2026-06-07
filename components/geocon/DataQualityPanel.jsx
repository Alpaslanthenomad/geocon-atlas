"use client";
// Data Integrity DI-1 — admin data-quality dashboard.
//
// Surfaces the honest state of the species corpus: average completeness,
// stub count, curated count (the north-star metric), and per-field
// coverage bars. "You can't improve what you can't see." This is the
// measurement layer of the upper-segment data-integrity program.

import { useEffect, useState } from "react";
import { Gauge, RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";
import { useToast } from "../ui";

const FIELDS = [
  { key: "family",           label: "Family" },
  { key: "genus",            label: "Genus" },
  { key: "authority",        label: "Authority" },
  { key: "iucn_real",        label: "IUCN status (real)" },
  { key: "native_countries", label: "Native countries" },
  { key: "geophyte_type",    label: "Geophyte type" },
  { key: "discovery_year",   label: "Discovery year" },
];

export default function DataQualityPanel() {
  const { profile } = useAuthContext();
  const isAdmin = profile?.role === "admin";
  const toast = useToast();
  const [d, setD] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recomputing, setRecomputing] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("data_quality_summary");
      if (error) throw error;
      setD(data || null);
    } catch (e) {
      toast.error("DQ özeti yüklenemedi", { detail: e?.message });
    } finally { setLoading(false); }
  }
  useEffect(() => { if (isAdmin) load(); /* eslint-disable-next-line */ }, [isAdmin]);

  async function recompute() {
    setRecomputing(true);
    try {
      await supabase.rpc("recompute_all_completeness");
      toast.success("Completeness yeniden hesaplandı");
      load();
    } catch (e) {
      toast.error("Hesaplanamadı", { detail: e?.message });
    } finally { setRecomputing(false); }
  }

  if (!isAdmin) return null;

  const total = d?.total || 0;
  const cov = d?.coverage || {};

  return (
    <section style={{
      marginTop: 14, padding: "var(--gx-card-pad)",
      background: "var(--gx-card-bg)",
      border: "1px solid var(--gx-card-border)",
      borderRadius: "var(--gx-card-radius)",
    }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <div>
          <div className="gx-overline">Data integrity</div>
          <h2 style={{
            fontFamily: "var(--gx-font-display)", fontSize: 18, fontWeight: 700,
            color: "var(--gx-ink)", margin: 0, display: "inline-flex", alignItems: "center", gap: 8,
          }}>
            <Gauge size={16} strokeWidth={1.85} style={{ color: "var(--gx-accent-violet)" }} />
            Species data quality
          </h2>
        </div>
        <button onClick={recompute} disabled={recomputing} className="gx-btn"
          style={{
            fontSize: 11, fontWeight: 700, padding: "6px 12px",
            background: "transparent", color: "var(--gx-ink-soft)",
            border: "1px solid var(--gx-border-soft)", borderRadius: 7, cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: 5,
          }}>
          <RefreshCw size={11} strokeWidth={2} style={recomputing ? { animation: "gx-shimmer 1s linear infinite" } : undefined} />
          {recomputing ? "Hesaplanıyor…" : "Recompute"}
        </button>
      </div>

      {loading ? (
        <div className="gx-skeleton" style={{ height: 120 }} />
      ) : !d ? (
        <div style={{ fontSize: 12, color: "var(--gx-ink-muted)" }}>Veri yok.</div>
      ) : (
        <>
          {/* Headline tiles */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8, marginBottom: 14 }}>
            <Tile label="Avg completeness" value={`${d.avg_completeness}/100`} tint="var(--gx-accent-violet)" />
            <Tile label="Curated (≥70)" value={(d.curated || 0).toLocaleString()} tint="var(--gx-success)"
              sub="north-star metric" Icon={CheckCircle2} />
            <Tile label="Stubs (<45)" value={(d.stubs || 0).toLocaleString()} tint="var(--gx-warning)"
              sub={`${Math.round(100 * (d.stubs || 0) / Math.max(1, total))}% of corpus`} Icon={AlertTriangle} />
            <Tile label="Total species" value={total.toLocaleString()} tint="var(--gx-ink-soft)" />
            <Tile label="Genera" value={(d.distinct_genera || 0).toLocaleString()} tint="var(--gx-ink-soft)" />
          </div>

          {/* Coverage bars */}
          <div className="gx-overline" style={{ marginBottom: 8 }}>Field coverage</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {FIELDS.map((f) => {
              const n = cov[f.key] || 0;
              const pct = total ? Math.round(100 * n / total) : 0;
              const tint = pct >= 80 ? "var(--gx-success)" : pct >= 30 ? "var(--gx-warning)" : "var(--gx-danger)";
              return (
                <div key={f.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 11, color: "var(--gx-ink-soft)", width: 130, flexShrink: 0 }}>{f.label}</span>
                  <div style={{ flex: 1, height: 8, background: "var(--gx-surface-3)", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: tint, borderRadius: 999, transition: "width 0.3s" }} />
                  </div>
                  <span style={{ fontSize: 10, fontFamily: "var(--gx-font-mono)", color: "var(--gx-ink-muted)", width: 78, textAlign: "right", flexShrink: 0 }}>
                    {n.toLocaleString()} · {pct}%
                  </span>
                </div>
              );
            })}
          </div>

          <p style={{ fontSize: 10, color: "var(--gx-ink-faint)", marginTop: 12, lineHeight: 1.5, fontStyle: "italic" }}>
            Kuzey yıldızı: <strong>curated (≥70) kayıt sayısı</strong>. Stub'ları
            azaltmanın yolu: gerçek IUCN statüsü (Wikidata/IUCN), dağılım (GBIF
            occurrence), geophyte type ve discovery year alanlarını doğrulanmış
            kaynaklardan doldurmak. genus → name'den türetildi (provenance: derived).
          </p>
        </>
      )}
    </section>
  );
}

function Tile({ label, value, sub, tint, Icon }) {
  return (
    <div style={{
      padding: 11, borderRadius: 9,
      background: "var(--gx-surface-2)", border: "1px solid var(--gx-border-soft)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 9, color: "var(--gx-ink-muted)", letterSpacing: 0.4, textTransform: "uppercase", fontWeight: 700 }}>
        {Icon && <Icon size={10} strokeWidth={2} style={{ color: tint }} />}
        {label}
      </div>
      <div style={{ fontFamily: "var(--gx-font-display)", fontSize: 22, fontWeight: 700, color: "var(--gx-ink)", marginTop: 3, lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 9, color: tint, marginTop: 3, fontWeight: 600 }}>{sub}</div>}
    </div>
  );
}
