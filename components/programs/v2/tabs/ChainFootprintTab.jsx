"use client";
// Chain footprint (Phase 4) — the 279-node chain reflected into a program,
// read-only + additive. A matrix of this program's species x the knowledge-chain
// spine links (filled vs open), reusing get_program_species + get_species_chain.
// No schema change, no write-back: it just makes the program's chain coverage —
// the founder's "broken chain", scoped to a program — visible. Link names are
// provisional (the spine vocabulary is still deferred).

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";

const CLASS_COLOR = {
  bench_measured: "#0F6E56", field: "#1D9E75", literature: "#185FA5",
  imported: "#BA7517", inferred: "#9AA5AD",
};

export default function ChainFootprintTab({ programId, lang = "tr" }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    let on = true;
    (async () => {
      const { data: sp } = await supabase.rpc("get_program_species", { p_program_id: programId });
      const species = Array.isArray(sp) ? sp : [];
      const rows = await Promise.all(species.map((s) =>
        supabase.rpc("get_species_chain", { p_species_id: s.species_id })
          .then((r) => ({ s, chain: Array.isArray(r.data) ? r.data : [] }))
      ));
      if (!on) return;
      const cols = (rows.find((r) => r.chain.length)?.chain || []).map((l) => ({ link: l.link, label: l.label }));
      setData({ cols, rows });
    })().catch(() => { if (on) setData({ cols: [], rows: [] }); });
    return () => { on = false; };
  }, [programId]);

  if (!data) return <div className="p-5 text-sm text-slate-500">{lang === "tr" ? "Yükleniyor…" : "Loading…"}</div>;
  if (!data.rows.length) return <div className="p-5 text-sm text-slate-500">{lang === "tr" ? "Bu programa henüz tür bağlı değil." : "No species linked to this program yet."}</div>;

  return (
    <div className="p-5">
      <p className="text-sm font-semibold text-slate-700">{lang === "tr" ? "Zincir ayak izi" : "Chain footprint"}</p>
      <p className="text-xs text-slate-400 mt-0.5 mb-4 max-w-xl">
        {lang === "tr"
          ? "Bu programın türleri × bilgi zinciri halkaları (dolu / boş). Boş hücreler, programın doldurabileceği açık katkılardır. Halka isimleri geçici."
          : "This program's species × knowledge-chain links (filled / open). Empty cells are open contributions this program can fill. Link names provisional."}
      </p>
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
                  return (
                    <td key={c.link} className="px-1.5 py-1.5">
                      <div
                        title={`${c.label}: ${cell ? cell.fill_state : "empty"}`}
                        style={{
                          width: 20, height: 10, borderRadius: 3, margin: "0 auto",
                          background: filled ? (CLASS_COLOR[cell.evidence_class] || "#9AA5AD") : "transparent",
                          border: filled ? "none" : "1px dashed #cbd5e1",
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
    </div>
  );
}
