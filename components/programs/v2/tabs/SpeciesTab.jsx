"use client";
// tabs/SpeciesTab.jsx
//
// Lists every species linked to a program — the primary one stored on
// programs.species_id plus any rows in program_species. Each card links
// straight into the species detail page. Owners get an inline "+ Add species"
// search that hits the species table directly.

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";

const IUCN_COLOR = {
  CR: "#FF1744", EN: "#FF9100", VU: "#FFD600",
  NT: "#80CBC4", LC: "#66BB6A", DD: "#B0BEC5", NE: "#78909C",
};

export default function SpeciesTab({ programId, lang = "tr" }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOwner, setIsOwner] = useState(false);

  async function refetch() {
    const { data, error: e } = await supabase.rpc("get_program_species", { p_program_id: programId });
    if (e) setError(e.message);
    setRows(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      supabase.rpc("get_program_species", { p_program_id: programId }),
      supabase.rpc("get_program_foundation_status", { p_program_id: programId }).catch(() => ({ data: null })),
    ]).then(([speciesResp, foundationResp]) => {
      if (cancelled) return;
      if (speciesResp.error) setError(speciesResp.error.message);
      setRows(Array.isArray(speciesResp.data) ? speciesResp.data : []);
      setIsOwner(!!foundationResp.data?.is_owner);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [programId]);

  if (loading) return <Skeleton />;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">
          {lang === "tr" ? "Programa bağlı türler" : "Linked species"} ({rows.length})
        </h3>
        <p className="text-xs text-slate-500">
          {lang === "tr"
            ? "Bu program tarafından kapsanan türler. Birincil tür programın ana hedefidir, ek bağlantılar pathway veya karşılaştırma türleri olabilir."
            : "Species covered by this program. The primary one is the main target; additional links can be pathway or comparison species."}
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
          {error}
        </div>
      )}

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
          {lang === "tr" ? "Henüz bağlı bir tür yok." : "No species linked yet."}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {rows.map((s) => (
            <SpeciesCard
              key={s.species_id}
              s={s}
              canRemove={isOwner && (s.role || "").toLowerCase() !== "primary"}
              onRemoved={refetch}
              programId={programId}
              lang={lang}
            />
          ))}
        </div>
      )}

      {isOwner && (
        <AddSpeciesForm programId={programId} onAdded={refetch} lang={lang} />
      )}
    </div>
  );
}

function SpeciesCard({ s, canRemove, onRemoved, programId, lang }) {
  const tierBg = IUCN_COLOR[s.iucn_status] || "#888";
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <Link href={`/geocon/species/${s.species_id}`} className="block">
        <div className="aspect-[16/10] bg-slate-100 relative">
          {s.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.thumbnail_url} alt={s.accepted_name || s.species_id} loading="lazy"
                 className="w-full h-full object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-slate-400">no image</div>
          )}
          {s.iucn_status && (
            <span className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                  style={{ background: tierBg }}>
              {s.iucn_status}
            </span>
          )}
          {(s.role || "").toLowerCase() === "primary" && (
            <span className="absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-700 text-white uppercase tracking-wide">
              {lang === "tr" ? "ana tür" : "primary"}
            </span>
          )}
        </div>
        <div className="p-3">
          <div className="font-serif italic font-bold text-slate-900 leading-tight">
            {s.accepted_name || s.species_id}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {s.family || "—"}
            {s.endemic && <span className="ml-2 text-emerald-700 font-semibold">endemic</span>}
            {s.composite_score != null && (
              <span className="ml-2">· score {Math.round(s.composite_score)}</span>
            )}
          </div>
        </div>
      </Link>
      {canRemove && (
        <button
          onClick={async () => {
            if (!confirm(lang === "tr" ? "Bu türü programdan kaldırılsın mı?" : "Remove this species from the program?")) return;
            const { error } = await supabase.rpc("remove_program_species", { p_program_id: programId, p_species_id: s.species_id });
            if (error) { alert(error.message); return; }
            onRemoved();
          }}
          className="w-full text-[10px] text-rose-700 hover:bg-rose-50 py-1.5 border-t border-slate-100"
        >
          {lang === "tr" ? "Türü kaldır" : "Unlink species"}
        </button>
      )}
    </div>
  );
}

function AddSpeciesForm({ programId, onAdded, lang }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open || q.trim().length < 2) { setResults([]); return; }
    let cancelled = false;
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from("species")
        .select("id, accepted_name, family, iucn_status, thumbnail_url")
        .ilike("accepted_name", `%${q.trim()}%`)
        .order("accepted_name")
        .limit(10);
      if (cancelled) return;
      setResults(data || []);
    }, 200);
    return () => { cancelled = true; clearTimeout(t); };
  }, [q, open]);

  async function pick(speciesId) {
    setBusy(true); setError(null);
    const { error } = await supabase.rpc("add_program_species", {
      p_program_id: programId, p_species_id: speciesId, p_role: "secondary",
    });
    setBusy(false);
    if (error) { setError(error.message); return; }
    setQ(""); setResults([]); setOpen(false);
    onAdded();
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      {!open ? (
        <button onClick={() => setOpen(true)} className="text-xs text-emerald-700 font-semibold">
          + {lang === "tr" ? "Tür ekle" : "Add species"}
        </button>
      ) : (
        <div>
          <div className="flex gap-2 items-center mb-2">
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={lang === "tr" ? "Tür adı ara…" : "Search species name…"}
              className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-500"
              disabled={busy}
            />
            <button onClick={() => { setOpen(false); setQ(""); }} className="text-xs text-slate-600">
              {lang === "tr" ? "İptal" : "Cancel"}
            </button>
          </div>
          {error && <div className="text-xs text-rose-700 mb-2">{error}</div>}
          <div className="max-h-60 overflow-auto flex flex-col gap-1">
            {results.map((r) => (
              <button
                key={r.id}
                onClick={() => pick(r.id)}
                disabled={busy}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-white text-left"
              >
                {r.thumbnail_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.thumbnail_url} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="font-serif italic text-sm text-slate-900 truncate">{r.accepted_name}</div>
                  <div className="text-[10px] text-slate-500">{r.family || "—"}{r.iucn_status && ` · ${r.iucn_status}`}</div>
                </div>
              </button>
            ))}
            {q.trim().length >= 2 && results.length === 0 && (
              <div className="text-xs text-slate-500 px-2 py-3">
                {lang === "tr" ? "Sonuç yok." : "No matches."}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-3">
      <div className="h-5 w-40 bg-slate-100 rounded animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[1,2,3].map((i) => <div key={i} className="h-44 bg-slate-100 rounded-xl animate-pulse" />)}
      </div>
    </div>
  );
}
