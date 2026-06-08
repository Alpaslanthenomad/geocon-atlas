"use client";
// Chain footprint (Phase 4 + DEEP-D) — the 279-node chain reflected into a
// program. Three chain-DERIVED health rings (safeguard / knowledge / value,
// from the program species' evidenced coverage — additive, the live
// get_program_health_assessment is untouched), plus a species x spine matrix
// the program can CLAIM (a member clicks a cell to commit the program to fill
// that coordinate). Reuses get_program_species + get_species_chain; claims via
// claim_program_coordinate (membership-gated). Link names provisional.

import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../../../lib/supabase";
import { useToast } from "../../../ui";

const CLASS_COLOR = {
  bench_measured: "#0F6E56", field: "#1D9E75", literature: "#185FA5",
  imported: "#BA7517", inferred: "#9AA5AD",
};
const RINGS = [
  { key: "safeguard", labels: { tr: "Koruma", en: "Safeguard" }, color: "#1D9E75" },
  { key: "knowledge", labels: { tr: "Bilgi", en: "Knowledge" }, color: "#185FA5" },
  { key: "value", labels: { tr: "Değer", en: "Value" }, color: "#BA7517" },
];

export default function ChainFootprintTab({ programId, lang = "tr" }) {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [health, setHealth] = useState(null);
  const [claims, setClaims] = useState(new Set());

  const loadClaims = useCallback(() => {
    supabase.rpc("get_program_claims", { p_program_id: programId }).then(({ data: c }) =>
      setClaims(new Set((Array.isArray(c) ? c : []).map((x) => `${x.species_id}|${x.link}`))));
  }, [programId]);

  useEffect(() => {
    let on = true;
    (async () => {
      const [{ data: sp }, { data: h }] = await Promise.all([
        supabase.rpc("get_program_species", { p_program_id: programId }),
        supabase.rpc("get_program_chain_health", { p_program_id: programId }),
      ]);
      const species = Array.isArray(sp) ? sp : [];
      const rows = await Promise.all(species.map((s) =>
        supabase.rpc("get_species_chain", { p_species_id: s.species_id })
          .then((r) => ({ s, chain: Array.isArray(r.data) ? r.data : [] }))
      ));
      if (!on) return;
      const cols = (rows.find((r) => r.chain.length)?.chain || []).map((l) => ({ link: l.link, label: l.label }));
      setData({ cols, rows });
      setHealth(h || {});
    })().catch(() => { if (on) setData({ cols: [], rows: [] }); });
    loadClaims();
    return () => { on = false; };
  }, [programId, loadClaims]);

  async function toggleClaim(speciesId, link) {
    const key = `${speciesId}|${link}`;
    const claimed = claims.has(key);
    const { error } = await supabase.rpc(claimed ? "unclaim_program_coordinate" : "claim_program_coordinate",
      { p_program_id: programId, p_species_id: speciesId, p_link_path: link });
    if (error) { toast?.error?.(error.message); return; }
    loadClaims();
  }

  if (!data) return <div className="p-5 text-sm text-slate-500">{lang === "tr" ? "Yükleniyor…" : "Loading…"}</div>;
  if (!data.rows.length) return <div className="p-5 text-sm text-slate-500">{lang === "tr" ? "Bu programa henüz tür bağlı değil." : "No species linked to this program yet."}</div>;

  return (
    <div className="p-5">
      <p className="text-sm font-semibold text-slate-700">{lang === "tr" ? "Zincir ayak izi" : "Chain footprint"}</p>
      <p className="text-xs text-slate-400 mt-0.5 mb-4 max-w-xl">
        {lang === "tr"
          ? "Bu programın türlerinin zincir kapsaması. Üç halka kanıtlanmış kapsamadan türetilir. Matriste bir hücreye tıklayarak programı o koordinatı doldurmaya adarsın (üyeler)."
          : "This program's chain coverage. The three rings are derived from evidenced coverage. Click a matrix cell to commit the program to fill that coordinate (members)."}
      </p>

      {/* chain-derived health rings */}
      {health && (
        <div className="flex flex-wrap gap-4 mb-5">
          {RINGS.map((r) => {
            const pct = Math.max(0, Math.min(100, Number(health[r.key]) || 0));
            return (
              <div key={r.key} style={{ minWidth: 150, flex: "1 1 150px", maxWidth: 240 }}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-600">{r.labels[lang] || r.labels.en}</span>
                  <span className="text-slate-400">{pct}%</span>
                </div>
                <div style={{ height: 7, borderRadius: 4, background: "#eef2f5", overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: r.color, borderRadius: 4 }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="text-xs border-collapse">
          <thead>
            <tr>
              <th className="text-left font-semibold text-slate-500 px-2 py-1 align-bottom">{lang === "tr" ? "Tür" : "Species"}</th>
              {data.cols.map((c) => (
                <th key={c.link} className="px-1.5 py-1 font-medium text-slate-500 align-bottom">
                  <div style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", height: 84, whiteSpace: "nowrap" }}>{c.label}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map(({ s, chain }) => (
              <tr key={s.species_id} className="border-t border-slate-100">
                <td className="px-2 py-1.5 whitespace-nowrap">
                  <span className="italic text-slate-800">{s.accepted_name}</span>
                  {s.iucn_status && <span className="text-slate-400 ml-1">· {s.iucn_status}</span>}
                </td>
                {data.cols.map((c) => {
                  const cell = chain.find((l) => l.link === c.link);
                  const filled = cell && cell.fill_state !== "empty";
                  const claimed = claims.has(`${s.species_id}|${c.link}`);
                  return (
                    <td key={c.link} className="px-1.5 py-1.5">
                      <button
                        onClick={() => toggleClaim(s.species_id, c.link)}
                        title={`${c.label}: ${cell ? cell.fill_state : "empty"}${claimed ? " · claimed" : ""}`}
                        style={{
                          display: "block", width: 22, height: 14, borderRadius: 4, margin: "0 auto", cursor: "pointer", padding: 0,
                          background: filled ? (CLASS_COLOR[cell.evidence_class] || "#9AA5AD") : "transparent",
                          border: claimed ? "2px solid #3C3489" : (filled ? "1px solid transparent" : "1px dashed #cbd5e1"),
                          opacity: filled ? Math.max(0.55, Number(cell.fill_strength) || 0) : 1,
                        }}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-400 mt-3">
        {lang === "tr" ? "Mor çerçeve = programın adadığı koordinat." : "Violet outline = a coordinate the program has claimed."}
      </p>
    </div>
  );
}
