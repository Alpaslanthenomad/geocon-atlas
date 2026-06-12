"use client";
// PropagationStudio — the first work surface ("Studio"). Canonical user: the tissue-culture
// researcher. It tests the hypothesis Work -> Insight -> Evidence -> TIC -> Progress -> Credit.
// Layout priority (per review): the LIVE LOG is the centre, not the trial list.

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "../../../../lib/supabase";

// method keys MUST match the propagation_trial.method CHECK constraint.
const METHODS = [
  { key: "in_vitro",         tr: "In vitro", en: "In vitro" },
  { key: "cutting",          tr: "Çelik",    en: "Cutting" },
  { key: "division",         tr: "Bölme",    en: "Division" },
  { key: "seed_germination", tr: "Tohum",    en: "Seed" },
];
function methodLabel(m, lang) {
  const x = METHODS.find((z) => z.key === m);
  return x ? (lang === "tr" ? x.tr : x.en) : m;
}

// kind -> colour + label
const KIND = {
  observation:   { tr: "Gözlem",        en: "Observation",   c: "#475569", bg: "#F1F5F9" },
  decision:      { tr: "Karar",         en: "Decision",      c: "#1E40AF", bg: "#DBEAFE" },
  revision:      { tr: "Revizyon",      en: "Revision",      c: "#92400E", bg: "#FEF3C7" },
  contamination: { tr: "Kontaminasyon", en: "Contamination", c: "#9F1239", bg: "#FFE4E6" },
  anomaly:       { tr: "Anomali",       en: "Anomaly",       c: "#6D28D9", bg: "#EDE9FE" },
  milestone:     { tr: "Milestone",     en: "Milestone",     c: "#166534", bg: "#DCFCE7" },
};
const KIND_ORDER = ["observation", "decision", "revision", "contamination", "anomaly", "milestone"];

// milestone tics offered per method
const MILESTONES = {
  in_vitro: [
    { tic: "prop.invitro.explant", tr: "Eksplant kuruldu",        en: "Explant established" },
    { tic: "prop.invitro.sterile", tr: "Aseptik kültür sağlandı", en: "Aseptic culture achieved" },
    { tic: "prop.invitro.rooting", tr: "Köklenme sağlandı",       en: "Rooting achieved" },
  ],
  cutting:          [{ tic: "prop.vegetative", tr: "Vejetatif çoğaltım", en: "Vegetative propagation" }],
  division:         [{ tic: "prop.vegetative", tr: "Vejetatif çoğaltım", en: "Vegetative propagation" }],
  seed_germination: [{ tic: "prop.seed",       tr: "Tohumla çoğaltım",   en: "Seed propagation" }],
};
const FAIL_REASONS = ["contamination", "browning", "hyperhydricity", "no_response", "necrosis", "rooting_failure", "other"];
const STATUS_LABEL = {
  draft: "Taslak", active: "Aktif", paused: "Duraklatıldı", failed: "Başarısız",
  completed: "Tamamlandı", promoted: "Kanıta terfi", archived: "Arşiv",
};

export default function PropagationStudio({ programId, lang = "tr" }) {
  const [data, setData] = useState(null);       // { is_member, trials }
  const [speciesId, setSpeciesId] = useState(null);
  const [programName, setProgramName] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  // composer
  const [kind, setKind] = useState("observation");
  const [note, setNote] = useState("");
  const [asInsight, setAsInsight] = useState(false);

  const T = (tr, en) => (lang === "tr" ? tr : en);

  const refetch = useCallback(async () => {
    const { data: r } = await supabase.rpc("get_program_propagation", { p_program_id: programId });
    setData(r || { is_member: false, trials: [] });
    return r;
  }, [programId]);

  useEffect(() => {
    if (!programId) return;
    let on = true;
    (async () => {
      const [{ data: prog }, r] = await Promise.all([
        supabase.from("programs").select("species_id, program_name").eq("id", programId).maybeSingle(),
        supabase.rpc("get_program_propagation", { p_program_id: programId }),
      ]);
      if (!on) return;
      setSpeciesId(prog?.species_id || null);
      setProgramName(prog?.program_name || "");
      const res = r || { is_member: false, trials: [] };
      setData(res);
      if (res.trials?.length && !selectedId) setSelectedId(res.trials[0].id);
    })();
    return () => { on = false; };
  }, [programId]); // eslint-disable-line

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(null), 4000); };

  async function createTrial(method) {
    setBusy(true);
    const { data: id, error } = await supabase.rpc("add_propagation_trial", {
      p_program_id: programId, p_species_id: speciesId, p_method: method,
      p_treatment: null, p_n_started: null, p_source_ref: null,
    });
    setBusy(false);
    if (error) return flash(T("Deneme oluşturulamadı: " + error.message, "Could not create: " + error.message));
    await refetch();
    if (id) setSelectedId(id);
  }

  async function addEntry() {
    if (!note.trim() || !selectedId) return;
    setBusy(true);
    const { error } = await supabase.rpc("add_trial_log_entry", {
      p_trial_id: selectedId, p_kind: kind, p_note: note.trim(),
      p_is_insight: asInsight, p_milestone_tic_id: null,
    });
    setBusy(false);
    if (error) return flash(T("Kayıt eklenemedi: " + error.message, "Could not add: " + error.message));
    setNote(""); setAsInsight(false);
    await refetch();
  }

  async function toggleInsight(logId, current) {
    await supabase.rpc("set_trial_log_insight", { p_log_id: logId, p_is_insight: !current });
    await refetch();
  }

  async function saveCounts(trial, nStarted, nSucceeded) {
    const s = Number(nStarted), su = Number(nSucceeded);
    if (s < 0 || su < 0) return flash(T("Sayılar negatif olamaz.", "Counts cannot be negative."));
    if (su > s) return flash(T("Başarılı sayısı başlatılandan büyük olamaz.", "Succeeded cannot exceed started."));
    await supabase.rpc("update_trial_counts", { p_trial_id: trial.id, p_n_started: s || 0, p_n_succeeded: su || 0 });
    await refetch();
  }

  async function setStatus(trialId, status, failureReason = null) {
    await supabase.rpc("set_trial_status", { p_trial_id: trialId, p_status: status, p_failure_reason: failureReason });
    await refetch();
  }

  async function promote(trialId, tic) {
    setBusy(true);
    const { data: res, error } = await supabase.rpc("promote_trial_to_evidence", { p_trial_id: trialId, p_tic_id: tic });
    setBusy(false);
    if (error) return flash(T("Terfi başarısız: " + error.message, "Promote failed: " + error.message));
    await refetch();
    flash(T(
      `Kanıta terfi edildi — güç ${res?.evidence_strength}. Kredi: ${res?.credit || "—"}. Program ilerledi.`,
      `Promoted to evidence — strength ${res?.evidence_strength}. Credit: ${res?.credit || "—"}. Program advanced.`));
  }

  if (!data) return <div className="p-8 text-sm text-slate-500">{T("Yükleniyor…", "Loading…")}</div>;

  if (!data.is_member) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <Link href={`/geocon/programs/${programId}`} className="text-sm text-emerald-700 no-underline">&larr; {T("Programa dön", "Back to program")}</Link>
        <h1 className="mt-3 text-xl font-semibold text-slate-900">{T("Çoğaltım Stüdyosu", "Propagation Studio")}</h1>
        <p className="mt-2 text-sm text-slate-500">{T("Bu çalışma yüzeyi program üyelerine açıktır.", "This work surface is for program members.")}</p>
      </div>
    );
  }

  const trials = data.trials || [];
  const trial = trials.find((t) => t.id === selectedId) || trials[0] || null;
  const milestones = trial ? (MILESTONES[trial.method] || []) : [];

  return (
    <div className="mx-auto max-w-5xl p-5 md:p-7">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/geocon/programs/${programId}`} className="text-xs text-emerald-700 no-underline">&larr; {T("Program", "Program")}</Link>
          <h1 className="text-xl font-semibold text-slate-900 truncate">{T("Çoğaltım Stüdyosu", "Propagation Studio")}</h1>
          {programName && <p className="text-xs text-slate-500 truncate">{programName}</p>}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {METHODS.map((m) => (
            <button key={m.key} disabled={busy} onClick={() => createTrial(m.key)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 disabled:opacity-50">
              + {T(m.tr, m.en)}
            </button>
          ))}
        </div>
      </div>

      {msg && <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-[13px] text-emerald-900">{msg}</div>}

      {trials.length === 0 ? (
        <div className="mt-8 rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center">
          <p className="text-sm font-medium text-slate-700">{T("Henüz deneme yok.", "No trials yet.")}</p>
          <p className="mt-1 text-xs text-slate-500">{T("Yukarıdan bir yöntem seçerek ilk denemeni başlat. Çalışman programı ilerletecek.", "Start your first trial with a method above. Your work will advance the program.")}</p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_220px] gap-5">
          {/* MAIN — the live trial (the centre) */}
          <div className="min-w-0 order-2 md:order-1">
            {trial && <TrialWork
              key={trial.id} trial={trial} lang={lang} busy={busy} milestones={milestones}
              kind={kind} setKind={setKind} note={note} setNote={setNote}
              asInsight={asInsight} setAsInsight={setAsInsight}
              onAddEntry={addEntry} onToggleInsight={toggleInsight}
              onSaveCounts={saveCounts} onSetStatus={setStatus} onPromote={promote} T={T} />}
          </div>

          {/* Compact trial selector (not the main surface) */}
          <aside className="order-1 md:order-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">{T("Denemeler", "Trials")}</div>
            <div className="space-y-1.5">
              {trials.map((t) => {
                const sel = t.id === trial?.id;
                const rate = t.n_started ? Math.round((100 * (t.n_succeeded || 0)) / t.n_started) : null;
                return (
                  <button key={t.id} onClick={() => setSelectedId(t.id)}
                    className={`w-full text-left rounded-lg border px-3 py-2 text-xs transition ${sel ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-slate-800">{METHODS.find((m) => m.key === t.method)?.[lang === "tr" ? "tr" : "en"] || t.method}</span>
                      <span className="text-[10px] text-slate-400">{STATUS_LABEL[t.status] || t.status}</span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-500">
                      {rate != null ? `${t.n_succeeded || 0}/${t.n_started} · %${rate}` : T("sayım yok", "no counts")}
                      {" · "}{(t.logs?.length || 0)} {T("kayıt", "entries")}
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function TrialWork({ trial, lang, busy, milestones, kind, setKind, note, setNote, asInsight, setAsInsight,
                     onAddEntry, onToggleInsight, onSaveCounts, onSetStatus, onPromote, T }) {
  const [nStarted, setNStarted] = useState(trial.n_started ?? "");
  const [nSucceeded, setNSucceeded] = useState(trial.n_succeeded ?? "");
  const [promoteTic, setPromoteTic] = useState(milestones[0]?.tic || "");
  const [failReason, setFailReason] = useState("contamination");
  const rate = trial.n_started ? Math.round((100 * (trial.n_succeeded || 0)) / trial.n_started) : null;
  const logs = trial.logs || [];
  const insights = logs.filter((l) => l.is_insight);
  const promotedLog = logs.find((l) => l.kind === "milestone" && l.milestone_tic_id);
  const isPromoted = trial.status === "promoted";
  const isFailed = trial.status === "failed";

  return (
    <div>
      {/* 1. Current trial header + mini counts strip */}
      <div className="rounded-2xl border-2 border-emerald-100 bg-white p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">{T("Aktif deneme", "Current trial")}</div>
            <div className="text-lg font-semibold text-slate-900">{methodLabel(trial.method, lang)}{trial.treatment ? ` · ${trial.treatment}` : ""}</div>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">{STATUS_LABEL[trial.status] || trial.status}</span>
        </div>
        {/* mini counts strip — always in view while logging */}
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11.5px] text-slate-500">
          <span>{T("Başlatılan", "Started")}: <b className="text-slate-700">{trial.n_started ?? "—"}</b></span>
          <span>{T("Başarılı", "Succeeded")}: <b className="text-slate-700">{trial.n_succeeded ?? "—"}</b></span>
          {rate != null && <span>{T("Başarı", "Success")}: <b className="text-slate-700">%{rate}</b></span>}
          <span>{T("Kayıt", "Entries")}: <b className="text-slate-700">{logs.length}</b></span>
          <span>{T("İçgörü", "Insights")}: <b className="text-amber-600">{insights.length}</b></span>
        </div>
        {trial.created_by_name && <div className="mt-1 text-[11px] text-slate-400">{T("Başlatan", "Started by")}: {trial.created_by_name}</div>}
        {/* persistent credit badge — promoted trials */}
        {isPromoted && promotedLog && (
          <div className="mt-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-[12px] text-emerald-900">
            ✓ {T("Kanıta terfi edildi", "Promoted to evidence")} · {T("Kredi", "Credit")}: <b>{promotedLog.author_name || trial.created_by_name || "—"}</b>
          </div>
        )}
      </div>

      {/* 2. Live log timeline */}
      <div className="mt-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">{T("Canlı log", "Live log")}</div>
        {(trial.logs || []).length === 0 ? (
          <p className="text-xs text-slate-400 italic">{T("Henüz kayıt yok — ne yaptığını/gördüğünü ekle.", "No entries yet — log what you did or saw.")}</p>
        ) : (
          <ol className="relative border-l border-slate-200 pl-4 space-y-3">
            {trial.logs.map((l) => {
              const k = KIND[l.kind] || KIND.observation;
              return (
                <li key={l.id} className="relative">
                  <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full" style={{ background: k.c }} />
                  <div className="flex items-center gap-2">
                    <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold" style={{ color: k.c, background: k.bg }}>{lang === "tr" ? k.tr : k.en}</span>
                    {l.kind !== "milestone" && (
                      <button onClick={() => onToggleInsight(l.id, l.is_insight)} title={T("İçgörü olarak işaretle", "Mark as insight")}
                        className={`text-[11px] ${l.is_insight ? "text-amber-600 font-semibold" : "text-slate-300 hover:text-amber-500"}`}>
                        {l.is_insight ? T("◆ İçgörü", "◆ Insight") : T("◇ İçgörü", "◇ Insight")}
                      </button>
                    )}
                    <span className="text-[10px] text-slate-400 ml-auto">{l.author_name || ""}</span>
                  </div>
                  <p className="mt-0.5 text-[13px] text-slate-700 leading-snug">{l.note}</p>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {/* 3. Add entry composer */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {KIND_ORDER.filter((k) => k !== "milestone").map((k) => {
            const m = KIND[k]; const on = kind === k;
            return (
              <button key={k} onClick={() => setKind(k)}
                className="rounded-md px-2 py-1 text-[11px] font-medium border"
                style={on ? { color: m.c, background: m.bg, borderColor: m.c } : { color: "#64748b", background: "#fff", borderColor: "#e2e8f0" }}>
                {lang === "tr" ? m.tr : m.en}
              </button>
            );
          })}
        </div>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
          placeholder={T("Bugün ne oldu? (gözlem, karar, anomali…)", "What happened today? (observation, decision, anomaly…)")}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] text-slate-800 resize-y focus:outline-none focus:border-emerald-400" />
        <div className="mt-2 flex items-center justify-between gap-2">
          <label className="inline-flex items-center gap-1.5 text-[12px] text-slate-600 cursor-pointer">
            <input type="checkbox" checked={asInsight} onChange={(e) => setAsInsight(e.target.checked)} className="accent-amber-500" />
            {T("İçgörü olarak işaretle", "Mark as insight")}
          </label>
          <button onClick={onAddEntry} disabled={busy || !note.trim()}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-40">
            {T("Kaydet", "Add entry")}
          </button>
        </div>
      </div>

      {/* 4. Running counts / success rate */}
      <div className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 p-3">
        <label className="text-[11px] text-slate-500">{T("Başlatılan", "Started")}
          <input type="number" value={nStarted} onChange={(e) => setNStarted(e.target.value)}
            className="mt-0.5 block w-20 rounded-md border border-slate-200 px-2 py-1 text-sm" />
        </label>
        <label className="text-[11px] text-slate-500">{T("Başarılı", "Succeeded")}
          <input type="number" value={nSucceeded} onChange={(e) => setNSucceeded(e.target.value)}
            className="mt-0.5 block w-20 rounded-md border border-slate-200 px-2 py-1 text-sm" />
        </label>
        <button onClick={() => onSaveCounts(trial, nStarted, nSucceeded)} disabled={busy}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40">
          {T("Sayımı kaydet", "Save counts")}
        </button>
        {rate != null && <span className="text-sm font-semibold text-slate-900">{T("Başarı", "Success")}: %{rate}</span>}
      </div>

      {/* 5. Milestone / promote panel */}
      {milestones.length > 0 && (
        <div className="mt-4 rounded-xl border-2 border-emerald-100 bg-emerald-50/40 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 mb-2">{T("Milestone → kanıta terfi", "Milestone → promote to evidence")}</div>
          {isPromoted ? (
            <p className="text-[12px] text-emerald-800">{T("Bu deneme zaten kanıta terfi edildi.", "This trial has already been promoted to evidence.")}</p>
          ) : isFailed ? (
            <p className="text-[12px] text-rose-700">{T("Başarısız deneme kanıta terfi edilemez (ama veri olarak kalır).", "A failed trial cannot be promoted (but it stays as data).")}</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <select value={promoteTic} onChange={(e) => setPromoteTic(e.target.value)}
                  className="rounded-lg border border-slate-200 px-2 py-1.5 text-[13px] text-slate-800">
                  {milestones.map((m) => <option key={m.tic} value={m.tic}>{lang === "tr" ? m.tr : m.en}</option>)}
                </select>
                <button onClick={() => onPromote(trial.id, promoteTic)} disabled={busy || !promoteTic}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-40">
                  {T("Kanıta terfi et", "Promote to evidence")}
                </button>
                <span className="text-[11px] text-slate-500">{T("Programı ilerletir; sana kredi verilir.", "Advances the program; you get the credit.")}</span>
              </div>
              <p className="mt-1.5 text-[11px] text-slate-400">{T("Listede yoksa şimdilik Gözlem/Anomali olarak ekle.", "Milestone not listed? Add it as an observation or anomaly for now.")}</p>
            </>
          )}
        </div>
      )}

      {/* status / failure controls */}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px]">
        <span className="text-slate-400">{T("Durum:", "Status:")}</span>
        {["active", "paused", "completed", "archived"].map((s) => (
          <button key={s} onClick={() => onSetStatus(trial.id, s)} className="rounded border border-slate-200 px-2 py-0.5 text-slate-600 hover:bg-slate-50">{STATUS_LABEL[s]}</button>
        ))}
        <span className="text-slate-300">|</span>
        <select value={failReason} onChange={(e) => setFailReason(e.target.value)} className="rounded border border-slate-200 px-1.5 py-0.5 text-slate-600">
          {FAIL_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <button onClick={() => onSetStatus(trial.id, "failed", failReason)} className="rounded border border-rose-200 px-2 py-0.5 text-rose-700 hover:bg-rose-50">{T("Başarısız", "Failed")}</button>
      </div>

      {/* Insights discovered (Studio-local for now) */}
      {insights.length > 0 && (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50/50 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 mb-2">{T("Keşfedilen içgörüler", "Insights discovered")}</div>
          <ul className="space-y-1.5">
            {insights.map((l) => (
              <li key={l.id} className="text-[13px] text-slate-700"><span className="text-amber-600">◆</span> {l.note} <span className="text-[10px] text-slate-400">— {l.author_name}</span></li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
