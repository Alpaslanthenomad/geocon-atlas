// tabs/FoundationTab.jsx
//
// FOUNDATION TIER — 3 zorunlu tic (ön onay eşiği):
//   1. cons.threat_analysis
//   2. cons.ex_situ_strategy
//   3. sci.taxonomy_verified
//
// Bu kapı geçilince program "pre-approved" olur (pathway declare edilebilir).
// Field & Lab Gate ayrı bir kapı, ayrı tab'da.

import { t } from '../lib/i18n';
import { useProgramFoundation } from '../hooks/useProgramFoundation';
import { useProgramMembers } from '../hooks/useProgramMembers';
import TicCard from '../components/TicCard';

export default function FoundationTab({ programId, lang = 'tr' }) {
  const { loading, error, gates, ticsByTier, isOwner, complete, waive, revisit, assign, setStatus, commentCounts } =
    useProgramFoundation(programId);
  const { members } = useProgramMembers(programId);

  if (loading) return <Skeleton />;
  if (error)   return <ErrorBox error={error} lang={lang} />;

  const foundationTics = ticsByTier.foundation;
  const consTics = foundationTics.filter((t) => t.wheel_type === 'conservation');
  const sciTics  = foundationTics.filter((t) => t.wheel_type === 'science');

  return (
    <div className="space-y-5">
      <RoomHeader gate={gates?.foundation} tics={foundationTics} lang={lang} />

      <div>
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
          {lang === 'tr' ? 'Gerekli kanıtlar' : 'Required proofs'}
        </h3>
        <div className="space-y-4">
          {consTics.length > 0 && (
            <Section title={t('wheelConservation', lang)} accent="emerald">
              {consTics.map((tic) => (
                <TicCard
                  key={tic.tic_id}
                  tic={tic}
                  isOwner={isOwner}
                  members={members}
                  commentCount={commentCounts?.[tic.tic_id] || 0}
                  lang={lang}
                  onComplete={complete}
                  onWaive={waive}
                  onRevisit={revisit}
                  onAssign={assign}
                  onSetStatus={setStatus}
                />
              ))}
            </Section>
          )}

          {sciTics.length > 0 && (
            <Section title={t('wheelScience', lang)} accent="sky">
              {sciTics.map((tic) => (
                <TicCard
                  key={tic.tic_id}
                  tic={tic}
                  isOwner={isOwner}
                  members={members}
                  commentCount={commentCounts?.[tic.tic_id] || 0}
                  lang={lang}
                  onComplete={complete}
                  onWaive={waive}
                  onRevisit={revisit}
                  onAssign={assign}
                  onSetStatus={setStatus}
                />
              ))}
            </Section>
          )}
        </div>
      </div>

      {foundationTics.length === 0 && (
        <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
          {lang === 'tr' ? 'Bu aşamada gerekli kanıt bulunamadı.' : 'No required proofs found for this stage.'}
        </div>
      )}
    </div>
  );
}

// Foundation as a stage "Room" — answers the 5 questions (purpose / state / blocking /
// where you work / what unlocks) from the existing gate + tic data. No new entities.
function RoomHeader({ gate, tics, lang }) {
  const T = (tr, en) => (lang === 'tr' ? tr : en);
  const passed     = gate?.passed ?? false;
  const total      = gate?.required_count ?? tics.filter((t) => t.is_required).length;
  const done       = gate?.satisfied_count ?? 0;
  const missingIds = gate?.missing_tics ?? [];
  const missing    = missingIds.map((id) => {
    const tt = tics.find((t) => t.tic_id === id);
    return tt ? (lang === 'tr' ? (tt.label_tr || tt.label_en) : (tt.label_en || tt.label_tr)) : id;
  });
  // Room State (GPT's state vocabulary). Foundation is the first room — never "locked";
  // it is either "passed" or "blocked — N required proofs missing".
  const missingCount = Math.max(0, total - done);
  const stateMeta = passed
    ? { label: T('Geçildi', 'Passed'), bg: '#DCFCE7', c: '#166534' }
    : { label: T(`Engellendi — ${missingCount} gerekli kanıt eksik`,
                 `Blocked — ${missingCount} required proof${missingCount === 1 ? '' : 's'} missing`),
        bg: '#FEF3C7', c: '#92400E' };

  // Work surfaces: Taxonomy is actionable now (its proof lives in this room); the other
  // two are planned/coming. Shown "Available now / Coming" per the review.
  const SURFACE_NOW  = [T('Taksonomi', 'Taxonomy')];
  const SURFACE_SOON = [T('Kanıt incelemesi', 'Evidence review'), T('Koruma stratejisi', 'Conservation strategy')];

  return (
    <div className="rounded-2xl border-2 border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-900">Foundation</h2>
        <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: stateMeta.bg, color: stateMeta.c }}>
          {stateMeta.label} · {done}/{total}
        </span>
      </div>

      <p className="mt-2 text-[13px] leading-relaxed text-slate-600">
        <span className="font-medium text-slate-700">{T('Amaç: ', 'Purpose: ')}</span>
        {T('Bu programın tür kimliği, tehdit gerekçesi ve koruma stratejisi güvenilir mi? Foundation, programın meşru başlangıç zeminidir.',
           'Is the program’s species identity, threat rationale and conservation strategy trustworthy? Foundation is the program’s legitimate starting ground.')}
      </p>

      {!passed && missing.length > 0 && (
        <div className="mt-2 text-[13px]">
          <span className="font-medium text-slate-500">{T('Eksik olan: ', 'Still missing: ')}</span>
          <span className="text-rose-700">{missing.join(' · ')}</span>
        </div>
      )}

      <div className="mt-3">
        <div className="mb-1 text-[11px] font-medium text-slate-500">{T('Bu aşamada çalışacağın yerler', 'Where you work in this stage')}</div>
        <div className="flex flex-wrap items-center gap-1.5">
          {SURFACE_NOW.map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
              {s}<span className="text-[9px] uppercase tracking-wide text-emerald-600">{T('şimdi', 'now')}</span>
            </span>
          ))}
          {SURFACE_SOON.map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-500">
              {s}<span className="text-[9px] uppercase tracking-wide text-slate-400">{T('yakında', 'soon')}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-[12px] text-slate-600">
        <span className="font-medium">{T('Bu kapı geçilince: ', 'When this gate passes: ')}</span>
        {T('Field & Lab çalışmaları açılır.', 'Field & Lab work opens.')}
      </div>
    </div>
  );
}

function Section({ title, children, accent = 'slate' }) {
  const dot = {
    emerald: 'bg-emerald-500',
    sky:     'bg-sky-500',
    violet:  'bg-violet-500',
    slate:   'bg-slate-400',
  }[accent];
  return (
    <section>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Skeleton() {
  return (
    <div className="space-y-3">
      <div className="h-24 rounded-xl bg-slate-100 animate-pulse" />
      <div className="h-20 rounded-xl bg-slate-100 animate-pulse" />
      <div className="h-20 rounded-xl bg-slate-100 animate-pulse" />
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
