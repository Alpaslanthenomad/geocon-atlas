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

import { useProgramFoundation } from '../hooks/useProgramFoundation';
import { useProgramMembers } from '../hooks/useProgramMembers';
import TicTree from '../components/TicTree';

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

  const treeProps = {
    childrenOf, isOwner, members, commentCounts, lang,
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

      <StudioMount
        programId={programId}
        lang={lang}
        gateOpen={gateOpen}
        anyRouteProven={anyRouteProven}
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

// The Studio is mounted as the room's active work surface — not a menu item.
function StudioMount({ programId, lang, gateOpen, anyRouteProven }) {
  const T = (tr, en) => (lang === 'tr' ? tr : en);
  const status = anyRouteProven
    ? T('En az bir çoğaltım yolu kanıtlandı.', 'At least one propagation route is proven.')
    : gateOpen
      ? T('Kapı açık — in-vitro trial başlat.', 'Gate open — start an in-vitro trial.')
      : T('Kapı henüz açık değil — yine de taslak trial başlatabilirsin.', 'Gate not open yet — you can still start a draft trial.');

  return (
    <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/40 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-slate-900">Propagation Studio</h3>
          <p className="mt-1 text-[13px] text-slate-600">
            {T('Denemeleri kaydet, gözlemleri yaz, kilometre taşlarını kanıta yükselt.',
               'Log trials, record observations, promote milestones to evidence.')}
          </p>
          <div className="mt-2 text-[12px] text-slate-600">
            <span className="font-medium">{T('Durum: ', 'Status: ')}</span>
            <span className="text-slate-500">{status}</span>
          </div>
        </div>
        <a
          href={`/geocon/programs/${programId}/propagation`}
          className="shrink-0 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          {T('Studyoyu aç', 'Open Studio')}
        </a>
      </div>
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
