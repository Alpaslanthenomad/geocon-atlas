// tabs/PropagationTab.jsx
//
// PROPAGATION — the stage Room where the first real work surface (the Propagation
// Studio) is mounted. Unlike the other rooms this is NOT a checklist: it shows the
// ROUTE LOGIC — In vitro / Vegetative / Seed as alternative propagation routes
// (any one suffices) — and mounts the Studio as the room's active work surface,
// with the gate state visible.
//
// Draft trials are allowed before the gates open; official TIC advancement is
// governed by the engine's gate/state rules. Money-blind throughout.

import { useState, useEffect } from 'react';
import { useProgramFoundation } from '../hooks/useProgramFoundation';
import { useProgramMembers } from '../hooks/useProgramMembers';
import { supabase } from '../lib/supabaseClient';
import TicTree from '../components/TicTree';

const METHOD_LABEL = {
  in_vitro: { tr: 'In vitro', en: 'In vitro' },
  cutting: { tr: 'Çelik', en: 'Cutting' },
  division: { tr: 'Bölme', en: 'Division' },
  seed_germination: { tr: 'Tohum', en: 'Seed' },
};
const LOG_KINDS = [
  { key: 'observation', tr: 'Gözlem', en: 'Observation' },
  { key: 'decision', tr: 'Karar', en: 'Decision' },
  { key: 'revision', tr: 'Revizyon', en: 'Revision' },
  { key: 'contamination', tr: 'Kontaminasyon', en: 'Contamination' },
  { key: 'anomaly', tr: 'Anomali', en: 'Anomaly' },
];

export default function PropagationTab({ programId, lang = 'tr' }) {
  const { loading, error, gates, ticsByTier, isOwner, complete, waive, revisit, assign, setStatus, commentCounts } =
    useProgramFoundation(programId);
  const { members } = useProgramMembers(programId);

  if (loading) return <Skeleton />;
  if (error)   return <ErrorBox error={error} lang={lang} />;

  const allTics = ticsByTier.field_lab || [];
  const propTics = allTics.filter((tc) => tc.tic_id.startsWith('prop.'));

  // Build the route tree (prop.route = OR root → in vitro [AND] / vegetative / seed).
  const childrenOf = {};
  propTics.forEach((tc) => {
    if (tc.parent_tic_id) (childrenOf[tc.parent_tic_id] = childrenOf[tc.parent_tic_id] || []).push(tc);
  });
  Object.values(childrenOf).forEach((arr) => arr.sort((a, b) => (a.display_order || 0) - (b.display_order || 0)));
  const treeRoots = propTics.filter((tc) => tc.child_logic && !tc.parent_tic_id);

  const routeRoot       = propTics.find((tc) => tc.tic_id === 'prop.route');
  const anyRouteProven  = !!routeRoot?.effective_done;
  const foundationPassed = gates?.foundation?.passed ?? false;
  const fieldLabPassed   = gates?.field_lab?.passed ?? false;
  const gateOpen         = foundationPassed && fieldLabPassed;

  // The next propagation proof a route step would advance (for the workbench).
  const propLeaves = propTics.filter((tc) => !tc.child_logic && tc.parent_tic_id);
  const nextProof = propLeaves.find((tc) => tc.status !== 'completed' && tc.status !== 'waived');
  const nextProofLabel = nextProof ? (lang === 'tr' ? (nextProof.label_tr || nextProof.label_en) : (nextProof.label_en || nextProof.label_tr)) : null;

  // Until the earlier gates pass, official TIC completion is closed — the route
  // cards are read-only (isOwner=false). Draft work still happens in the Studio.
  const treeProps = {
    childrenOf, isOwner: gateOpen ? isOwner : false, members, commentCounts, lang,
    onComplete: complete, onWaive: waive, onRevisit: revisit, onAssign: assign, onSetStatus: setStatus,
  };

  return (
    <div className="space-y-5">
      <RoomHeader
        lang={lang}
        anyRouteProven={anyRouteProven}
        foundationPassed={foundationPassed}
        fieldLabPassed={fieldLabPassed}
      />

      <PropagationWorkbench
        programId={programId}
        lang={lang}
        gateOpen={gateOpen}
        anyRouteProven={anyRouteProven}
        nextProofLabel={nextProofLabel}
      />

      {treeRoots.length > 0 ? (
        <div>
          <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {lang === 'tr' ? 'Çoğaltım yolları' : 'Propagation routes'}
          </h3>
          <p className="mb-2 text-[11px] text-slate-400">
            {lang === 'tr'
              ? 'Herhangi bir yol yeterli — biri başarısız olursa diğerine geçebilirsin.'
              : 'Any one route suffices — if one fails, switch to another.'}
          </p>
          {!gateOpen && (
            <p className="mb-2 text-[11px] text-slate-500">
              {lang === 'tr'
                ? 'Önceki kapılar geçilmeden bu kanıtlar resmi olarak tamamlanamaz (salt-görünür). Şimdilik Studio’da taslak deneme yürütebilirsin.'
                : 'Until the earlier gates pass, these proofs can’t be completed as official progress (read-only). For now you can run a draft trial in the Studio.'}
            </p>
          )}
          <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
            {treeRoots.map((root) => <TicTree key={root.tic_id} node={root} {...treeProps} />)}
          </div>
        </div>
      ) : (
        <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
          {lang === 'tr' ? 'Bu program için çoğaltım yolu tanımlı değil.' : 'No propagation routes defined for this program.'}
        </div>
      )}

    </div>
  );
}

function RoomHeader({ lang, anyRouteProven, foundationPassed, fieldLabPassed }) {
  const T = (tr, en) => (lang === 'tr' ? tr : en);

  let stateMeta;
  if (anyRouteProven) {
    stateMeta = { label: T('Geçildi — en az bir yol kanıtlandı', 'Passed — at least one route proven'), bg: '#DCFCE7', c: '#166534' };
  } else if (!foundationPassed) {
    stateMeta = { label: T('Foundation bekleniyor — taslak trial’lara izin var', 'Foundation pending — draft trials allowed'), bg: '#EEF2F6', c: '#475569' };
  } else if (!fieldLabPassed) {
    stateMeta = { label: T('Field & Lab bekleniyor — taslak modda', 'Field & Lab pending — draft mode'), bg: '#EEF2F6', c: '#475569' };
  } else {
    stateMeta = { label: T('Açık — henüz kanıtlanmış yol yok', 'Open — no proven route yet'), bg: '#FEF3C7', c: '#92400E' };
  }

  return (
    <div className="rounded-2xl border-2 border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-900">{T('Çoğaltım', 'Propagation')}</h2>
        <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: stateMeta.bg, color: stateMeta.c }}>
          {stateMeta.label}
        </span>
      </div>

      <p className="mt-2 text-[13px] leading-relaxed text-slate-600">
        <span className="font-medium text-slate-700">{T('Amaç: ', 'Purpose: ')}</span>
        {T('Bu tür için uygulanabilir ve kanıtlanabilir bir çoğaltım yolu var mı? Bir yol başarısız olursa diğeri denenir.',
           'Is there an applicable, provable propagation route for this species? If one route fails, another is tried.')}
      </p>

      <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-[12px] text-slate-600">
        <span className="font-medium">{T('Bu kapı geçilince: ', 'When this gate passes: ')}</span>
        {T('Çıktı / Deployment aşaması açılır.', 'The Output / Deployment stage opens.')}
      </div>
    </div>
  );
}

// The room's WORKBENCH — the user begins real work here (start a trial, log an
// observation) without leaving the room. Draft work is allowed before the gate
// opens; the full Studio stays a deeper page for counts / promote / insights.
function PropagationWorkbench({ programId, lang, gateOpen, nextProofLabel }) {
  const T = (tr, en) => (lang === 'tr' ? tr : en);
  const [data, setData] = useState(null);            // { is_member, trials }
  const [speciesId, setSpeciesId] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [method, setMethod] = useState('in_vitro');
  const [logKind, setLogKind] = useState('observation');
  const [logNote, setLogNote] = useState('');

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(null), 3500); };
  const refetch = async () => {
    const { data: r } = await supabase.rpc('get_program_propagation', { p_program_id: programId });
    const res = r || { is_member: false, trials: [] };
    setData(res);
    return res;
  };

  useEffect(() => {
    let on = true;
    (async () => {
      const [{ data: prog }, { data: r }] = await Promise.all([
        supabase.from('programs').select('species_id').eq('id', programId).maybeSingle(),
        supabase.rpc('get_program_propagation', { p_program_id: programId }),
      ]);
      if (!on) return;
      setSpeciesId(prog?.species_id || null);
      const res = r || { is_member: false, trials: [] };
      setData(res);
      if (res.trials?.length) setActiveId(res.trials[0].id);
    })();
    return () => { on = false; };
  }, [programId]);

  const trials = data?.trials || [];
  const activeTrial = trials.find((t) => t.id === activeId) || trials[0] || null;
  const methodLabel = (m) => (METHOD_LABEL[m] ? (lang === 'tr' ? METHOD_LABEL[m].tr : METHOD_LABEL[m].en) : m);

  const today = !data
    ? T('Yükleniyor…', 'Loading…')
    : !data.is_member
      ? T('Bu çalışma alanı program üyelerine açıktır.', 'This work surface is for program members.')
      : trials.length === 0
        ? T('Bir in-vitro çoğaltım denemesi başlat — taslak çalışma, ileride kanıta dönüşür.', 'Start an in-vitro propagation trial — draft work that becomes evidence later.')
        : T('Mevcut denemene gözlem ekle ya da yeni deneme başlat — taslak log ileride kanıtı destekler.', 'Add an observation or start a new trial — a draft log backs the evidence later.');

  const rate = activeTrial && activeTrial.n_started ? Math.round((100 * (activeTrial.n_succeeded || 0)) / activeTrial.n_started) : 0;

  async function startTrial() {
    setBusy(true);
    const { data: id, error } = await supabase.rpc('add_propagation_trial', {
      p_program_id: programId, p_species_id: speciesId, p_method: method,
      p_treatment: null, p_n_started: null, p_source_ref: null,
    });
    setBusy(false);
    if (error) return flash(T('Deneme oluşturulamadı: ', 'Could not create: ') + error.message);
    setShowNew(false);
    await refetch();
    if (id) setActiveId(id);
    flash(T('Deneme başlatıldı.', 'Trial started.'));
  }

  async function addLog() {
    if (!logNote.trim() || !activeTrial) return;
    setBusy(true);
    const { error } = await supabase.rpc('add_trial_log_entry', {
      p_trial_id: activeTrial.id, p_kind: logKind, p_note: logNote.trim(),
      p_is_insight: false, p_milestone_tic_id: null,
    });
    setBusy(false);
    if (error) return flash(T('Kayıt eklenemedi: ', 'Could not add: ') + error.message);
    setLogNote('');
    await refetch();
    flash(T('Gözlem eklendi.', 'Observation added.'));
  }

  return (
    <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/30 p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">{T('Çalışma masası', 'Workbench')}</div>
        <a href={`/geocon/programs/${programId}/propagation`} className="text-[12px] font-medium text-emerald-700 no-underline hover:underline">
          {T('Tam stüdyoda derinleş →', 'Go deeper in the Studio →')}
        </a>
      </div>

      <div className="mt-1.5 text-[13px] text-slate-600">
        <span className="font-medium text-slate-700">{T('Ana soru: ', 'Question: ')}</span>
        {T('Bu tür için kanıtlanabilir bir çoğaltım yolu var mı?', 'Is a provable propagation route established for this species?')}
      </div>
      <div className="mt-2">
        <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{T('Bugünkü iş', 'Today')}</div>
        <div className="text-[15px] font-semibold leading-snug text-slate-900">{today}</div>
      </div>

      {/* Work area — begin work right here */}
      {data?.is_member && (
        <div className="mt-3 rounded-xl border border-emerald-100 bg-white p-3">
          {trials.length === 0 || showNew ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[12px] text-slate-500">{T('Yöntem:', 'Method:')}</span>
              <select value={method} onChange={(e) => setMethod(e.target.value)} className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
                {Object.keys(METHOD_LABEL).map((k) => <option key={k} value={k}>{methodLabel(k)}</option>)}
              </select>
              <button onClick={startTrial} disabled={busy} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                {T('Deneme başlat', 'Start trial')}
              </button>
              {trials.length > 0 && (
                <button onClick={() => setShowNew(false)} className="text-[12px] text-slate-500 hover:underline">{T('Vazgeç', 'Cancel')}</button>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              {/* Trial summary — counts are read-only here; editing happens in the Studio. */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-slate-600">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 font-medium">{methodLabel(activeTrial.method)}</span>
                <span><span className="text-slate-400">{T('Başlatılan', 'Started')}:</span> {activeTrial.n_started ?? 0}</span>
                <span><span className="text-slate-400">{T('Başarılı', 'Succeeded')}:</span> {activeTrial.n_succeeded ?? 0}</span>
                <span><span className="text-slate-400">{T('Oran', 'Rate')}:</span> {rate}%</span>
                <a href={`/geocon/programs/${programId}/propagation`} className="text-emerald-700 no-underline hover:underline">{T('Stüdyoda güncelle', 'Update in Studio')}</a>
                <button onClick={() => setShowNew(true)} className="ml-auto text-emerald-700 hover:underline">{T('+ yeni deneme', '+ new trial')}</button>
              </div>
              {/* Quick log — the low-friction working entry */}
              <div className="flex flex-wrap items-center gap-2">
                <select value={logKind} onChange={(e) => setLogKind(e.target.value)} className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
                  {LOG_KINDS.map((k) => <option key={k.key} value={k.key}>{lang === 'tr' ? k.tr : k.en}</option>)}
                </select>
                <input
                  value={logNote}
                  onChange={(e) => setLogNote(e.target.value)}
                  placeholder={T('Gözlem / karar yaz…', 'Write an observation / decision…')}
                  className="min-w-[160px] flex-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:outline-none"
                />
                <button onClick={addLog} disabled={busy || !logNote.trim()} className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
                  {T('Log ekle', 'Add log')}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                {T('Bir aşama hazır olunca kanıta dönüştürme (terfi) Stüdyo’da yapılır.', 'When a milestone is ready, promoting it to evidence is done in the Studio.')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* What this advances — where today's work plugs into the program */}
      {nextProofLabel && (
        <div className="mt-3 text-[12px] text-slate-500">
          {gateOpen ? (
            <>{T('Bu iş şunu ilerletir: ', 'This advances: ')}<span className="font-medium text-slate-700">{nextProofLabel}</span> → {T('Program ilerlemesi', 'Program progress')}</>
          ) : (
            <>{T('Hazır olunca şu kanıta dönüşür: ', 'When ready, it becomes the proof: ')}<span className="font-medium text-slate-700">{nextProofLabel}</span> <span className="text-slate-400">({T('resmi ilerleme kapı açılınca', 'official progress once the gate opens')})</span></>
          )}
        </div>
      )}

      {msg && <div className="mt-2 text-[12px] text-emerald-800">{msg}</div>}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-3">
      <div className="h-28 rounded-xl bg-slate-100 animate-pulse" />
      <div className="h-24 rounded-xl bg-slate-100 animate-pulse" />
      <div className="h-32 rounded-xl bg-slate-100 animate-pulse" />
    </div>
  );
}

function ErrorBox({ error, lang }) {
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
      <div className="font-medium">{lang === 'tr' ? 'Yükleme hatası' : 'Load error'}</div>
      <div className="mt-1 text-xs opacity-80">{error.message}</div>
    </div>
  );
}
