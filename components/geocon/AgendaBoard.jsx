"use client";
// AgendaBoard — the Venn priority agenda (v0). Surfaces the money-blind
// get_species_priority score: least-known x highest-potential species, scored by
// Gap (inverse completeness) x Urgency (threat/endemism/trend) x Potential
// (scientific metabolite signal — never money). Venn sets the agenda; the expert
// circle ranks. v0 = the computed ranked board (nominate/re-rank is a later slice).

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

const IUCN_TINT = {
  EX: "#3a3a38", EW: "#3a3a38", CR: "#C0392B", EN: "#E67E22", VU: "#E0A800",
  NT: "#7BA05B", LC: "#6FA76F", DD: "#9aa0a6", NE: "#9aa0a6",
};

export default function AgendaBoard() {
  const [region, setRegion] = useState("TR");
  const [endemicOnly, setEndemicOnly] = useState(true);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let on = true;
    setLoading(true); setErr(null);
    supabase
      .rpc("get_species_priority", { p_region: region.trim() || null, p_endemic_only: endemicOnly, p_limit: 50 })
      .then(({ data, error }) => {
        if (!on) return;
        if (error) setErr(error.message); else setRows(data || []);
        setLoading(false);
      });
    return () => { on = false; };
  }, [region, endemicOnly]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="text-xl font-bold text-slate-900">Öncelik Gündemi</h1>
      <p className="mt-1 max-w-2xl text-sm text-slate-600">
        En az bilinen × en çok potansiyel. Skor = <b>boşluk</b> × <b>aciliyet</b> × <b>bilimsel potansiyel</b> —
        para-kör. Venn gündemi belirler; davetli uzman çevresi sıralar.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <label className="text-[12px] text-slate-600">
          Bölge:{" "}
          <input
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="TR"
            className="w-28 rounded-md border border-slate-300 px-2 py-1 text-sm"
          />
          <span className="ml-1 text-[10px] text-slate-400">ISO kodu (TR) veya bölge adı</span>
        </label>
        <label className="inline-flex items-center gap-1.5 text-[12px] text-slate-600">
          <input type="checkbox" checked={endemicOnly} onChange={(e) => setEndemicOnly(e.target.checked)} />
          sadece endemik
        </label>
        <span className="ml-auto text-[11px] text-slate-400">{rows.length} aday</span>
      </div>

      {loading ? (
        <div className="mt-4 space-y-2">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />)}
        </div>
      ) : err ? (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{err}</div>
      ) : rows.length === 0 ? (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
          Bu filtreyle aday bulunamadı. Bölge kodunu (ör. TR) veya endemik filtresini değiştir.
        </div>
      ) : (
        <ol className="mt-4 space-y-2">
          {rows.map((r, i) => (
            <li key={r.species_id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[11px] font-semibold text-slate-300">#{i + 1}</span>
                    <Link
                      href={`/geocon/species/${r.species_id}`}
                      className="truncate font-semibold italic text-slate-900 no-underline hover:text-emerald-700"
                      style={{ fontFamily: "Georgia, serif" }}
                    >
                      {r.accepted_name}
                    </Link>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                    <span>{r.family} · {r.genus}</span>
                    {r.iucn_status && (
                      <span className="rounded px-1.5 py-0.5 text-[9px] font-bold text-white" style={{ background: IUCN_TINT[r.iucn_status] || "#9aa0a6" }}>
                        {r.iucn_status}
                      </span>
                    )}
                    {r.endemic && <span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700">endemik</span>}
                    {r.genus_has_chemistry && <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700">kimya potansiyeli</span>}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-2xl font-bold leading-none text-slate-900">{r.priority_score}</div>
                  <div className="text-[9px] uppercase tracking-wide text-slate-400">öncelik</div>
                </div>
              </div>
              <div className="mt-2.5 space-y-1">
                <LensBar label="Boşluk" value={r.gap_score} color="#0EA5E9" />
                <LensBar label="Aciliyet" value={r.urgency_score} color="#E0563E" />
                <LensBar label="Potansiyel" value={r.potential_score} color="#1A9E75" />
              </div>
            </li>
          ))}
        </ol>
      )}

      <p className="mt-4 text-[11px] text-slate-400">
        Potansiyel para-kör bir bilimsel sinyaldir (potansiyel, fiyat değil). Fonlama/değerlendirme ayrı bir aşamada,
        Venn/Exchange tarafında yapılır.
      </p>
    </div>
  );
}

function LensBar({ label, value, color }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 text-[10px] text-slate-400">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }} />
      </div>
      <span className="w-6 text-right text-[10px] tabular-nums text-slate-500">{value}</span>
    </div>
  );
}
