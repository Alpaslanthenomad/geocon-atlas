// tabs/FieldLabTab.jsx
//
// FIELD & LAB — the program's main work layer, surfaced as a stage Room.
// Required proofs gate this stage; optional ones unlock specific pathways.
// Proofs are grouped by biological MEANING (not required/optional, not cons/sci):
//   1. Material & Access         — baseline · material secured · viability
//   2. Biological Documentation  — specimen/voucher · morphology · phenology
//   3. Advanced Characterization — genetic · metabolite · ecological niche
// Anything outside those three (e.g. restoration plan) falls into "Other work".
//
// Before the Foundation gate passes, the room is in PREVIEW: proof cards render
// read-only so the biological roadmap is visible, but nothing counts as official
// progress yet. (Money-blind throughout; advanced characterization is scientific,
// never product/value framing.)

import { useProgramFoundation } from '../hooks/useProgramFoundation';
import { useProgramMembers } from '../hooks/useProgramMembers';
import TicCard from '../components/TicCard';

const BUCKETS = [
  { key: 'material',      tr: 'Materyal ve Erişim',    en: 'Material & Access',
    ids: ['cons.baseline_assessment', 'cons.material_secured', 'cons.viability_check'] },
  { key: 'documentation', tr: 'Biyolojik Belgeleme',   en: 'Biological Documentation',
    ids: ['sci.specimen_documented', 'sci.morphological_characterization', 'sci.phenology_documented'] },
  { key: 'advanced',      tr: 'İleri Karakterizasyon', en: 'Advanced Characterization',
    ids: ['sci.genetic_characterization', 'sci.metabolite_profiling', 'sci.ecological_niche'] },
];

export default function FieldLabTab({ programId, lang = 'tr' }) {
  const { loading, error, gates, ticsByTier, isOwner, complete, waive, revisit, assign, setStatus, commentCounts } =
    useProgramFoundation(programId);
  const { members } = useProgramMembers(programId);

  if (loading) return <Skeleton />;
  if (error)   return <ErrorBox error={error} lang={lang} />;

  const fieldLabTics = ticsByTier.field_lab || [];
  const byId = Object.fromEntries(fieldLabTics.map((tc) => [tc.tic_id, tc]));

  // Foundation must pass before Field & Lab counts as validated work; until then
  // the room is a read-only preview (cards visible, actions hidden).
  const foundationPassed = gates?.foundation?.passed ?? false;
  const preview = !foundationPassed;

  // These tics share tier 'field_lab' but belong to later stages, so they live in
  // their own rooms — keep Field & Lab as the pure biological record:
  //   prop.* + stock_ready  → Propagation Room
  //   restoration_plan      → Output / Deployment Room ("Deployment readiness")
  const belongsElsewhere = (id) =>
    id.startsWith('prop.') || id === 'cons.stock_ready_for_restoration' || id === 'cons.restoration_plan_defined';

  const claimed = new Set();
  const bucketGroups = BUCKETS.map((b) => {
    const tics = b.ids.map((id) => byId[id]).filter(Boolean);
    tics.forEach((tc) => claimed.add(tc.tic_id));
    return { ...b, tics };
  });
  // Safety net for any future field_lab tic not in a bucket (none today).
  const otherTics = fieldLabTics.filter((tc) => !claimed.has(tc.tic_id) && !belongsElsewhere(tc.tic_id));

  const cardProps = (tic) => ({
    key: tic.tic_id,
    tic,
    isOwner: preview ? false : isOwner,
    members,
    commentCount: commentCounts?.[tic.tic_id] || 0,
    lang,
    onComplete: complete,
    onWaive: waive,
    onRevisit: revisit,
    onAssign: assign,
    onSetStatus: setStatus,
  });

  return (
    <div className="space-y-5">
      <RoomHeader gate={gates?.field_lab} preview={preview} tics={fieldLabTics} lang={lang} />

      {preview && <PreviewNote lang={lang} />}

      <div className="space-y-4">
        {bucketGroups.map((b) =>
          b.tics.length > 0 ? (
            <BucketSection key={b.key} title={lang === 'tr' ? b.tr : b.en}>
              {b.tics.map((tic) => <TicCard {...cardProps(tic)} />)}
            </BucketSection>
          ) : null
        )}

        {otherTics.length > 0 && (
          <BucketSection title={lang === 'tr' ? 'Diğer çalışma' : 'Other work'}>
            {otherTics.map((tic) => <TicCard {...cardProps(tic)} />)}
          </BucketSection>
        )}
      </div>

      {fieldLabTics.length === 0 && (
        <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
          {lang === 'tr' ? 'Bu aşamada kanıt bulunamadı.' : 'No proofs found for this stage.'}
        </div>
      )}
    </div>
  );
}

// Field & Lab as a stage Room — answers the same 5 questions from the gate data.
// Adds a "preview" room state for when Foundation hasn't passed yet.
function RoomHeader({ gate, preview, tics, lang }) {
  const T = (tr, en) => (lang === 'tr' ? tr : en);
  const passed     = gate?.passed ?? false;
  const total      = gate?.required_count ?? 0;
  const done       = gate?.satisfied_count ?? 0;
  const missingIds = gate?.missing_tics ?? [];
  const missing    = missingIds.map((id) => {
    const tt = tics.find((t) => t.tic_id === id);
    return tt ? (lang === 'tr' ? (tt.label_tr || tt.label_en) : (tt.label_en || tt.label_tr)) : id;
  });
  const missingCount = Math.max(0, total - done);

  let stateMeta;
  if (preview) {
    stateMeta = { label: T('Foundation bekleniyor — ön izleme modunda', 'Foundation pending — preview mode'), bg: '#EEF2F6', c: '#475569' };
  } else if (passed) {
    stateMeta = { label: T('Geçildi', 'Passed'), bg: '#DCFCE7', c: '#166534' };
  } else {
    stateMeta = { label: T(`Engellendi — ${missingCount} gerekli kanıt eksik`,
                           `Blocked — ${missingCount} required proof${missingCount === 1 ? '' : 's'} missing`),
                  bg: '#FEF3C7', c: '#92400E' };
  }

  const SURFACES = [
    T('Saha Studyosu', 'Field Studio'),
    T('Örnek / Voucher', 'Specimen / Voucher'),
    T('Morfoloji', 'Morphology'),
    T('Genetik / Fenoloji', 'Genetic / Phenology'),
  ];

  return (
    <div className="rounded-2xl border-2 border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-900">Field &amp; Lab</h2>
        <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: stateMeta.bg, color: stateMeta.c }}>
          {stateMeta.label}{!preview ? ` · ${done}/${total}` : ''}
        </span>
      </div>

      <p className="mt-2 text-[13px] leading-relaxed text-slate-600">
        <span className="font-medium text-slate-700">{T('Amaç: ', 'Purpose: ')}</span>
        {T('Canlı materyal, saha kaydı ve temel biyolojik karakterizasyon güvenilir biçimde oluşturuldu mu? Programın asıl bilimsel kaydı burada kurulur.',
           'Is living material, the field record and core biological characterization reliably established? This is where the program’s core scientific record is built.')}
      </p>

      {preview ? (
        <div className="mt-2 text-[13px] text-slate-500">
          {T('Foundation geçilince bu aşama doğrulanmış ilerleme olarak açılır.',
             'Once Foundation passes, this stage opens as validated progress.')}
        </div>
      ) : (!passed && missing.length > 0 && (
        <div className="mt-2 text-[13px]">
          <span className="font-medium text-slate-500">{T('Eksik olan: ', 'Still missing: ')}</span>
          <span className="text-rose-700">{missing.join(' · ')}</span>
        </div>
      ))}

      <div className="mt-3">
        <div className="mb-1 text-[11px] font-medium text-slate-500">{T('Bu aşamada çalışacağın yerler', 'Where you work in this stage')}</div>
        <div className="flex flex-wrap items-center gap-1.5">
          {SURFACES.map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-500">
              {s}<span className="text-[9px] uppercase tracking-wide text-slate-400">{T('yakında', 'soon')}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-[12px] text-slate-600">
        <span className="font-medium">{T('Bu kapı geçilince: ', 'When this gate passes: ')}</span>
        {T('Çoğaltım çalışmaları doğrulanmış aşama olarak açılır.',
           'Propagation work opens as a validated stage.')}
      </div>
    </div>
  );
}

function PreviewNote({ lang }) {
  const tr = lang === 'tr';
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] text-slate-600">
      <span className="mr-2 inline-block rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {tr ? 'Ön izleme' : 'Preview'}
      </span>
      {tr
        ? 'Foundation Gate bekleniyor — bu kanıtlar şimdilik ön izleme modunda. Resmi ilerleme olarak tamamlanamaz; Foundation geçilince düzenlenebilir hale gelir.'
        : 'Foundation Gate pending — these proofs are in preview. They can’t be completed as official progress yet; they become editable once Foundation passes.'}
    </div>
  );
}

function BucketSection({ title, children }) {
  return (
    <section>
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{title}</h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Skeleton() {
  return (
    <div className="space-y-3">
      <div className="h-28 rounded-xl bg-slate-100 animate-pulse" />
      <div className="h-20 rounded-xl bg-slate-100 animate-pulse" />
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
