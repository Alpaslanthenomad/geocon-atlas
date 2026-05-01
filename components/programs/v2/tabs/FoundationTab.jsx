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
import GateBanner from '../components/GateBanner';
import TicCard from '../components/TicCard';

export default function FoundationTab({ programId, lang = 'tr' }) {
  const { loading, error, gates, ticsByTier, isOwner, complete, waive, revisit } =
    useProgramFoundation(programId);

  if (loading) return <Skeleton />;
  if (error)   return <ErrorBox error={error} lang={lang} />;

  const foundationTics = ticsByTier.foundation;
  const consTics = foundationTics.filter((t) => t.wheel_type === 'conservation');
  const sciTics  = foundationTics.filter((t) => t.wheel_type === 'science');

  return (
    <div className="space-y-5">
      <GateBanner gate={gates?.foundation} kind="foundation" lang={lang} />

      <Intro lang={lang} />

      {consTics.length > 0 && (
        <Section title={t('wheelConservation', lang)} accent="emerald">
          {consTics.map((tic) => (
            <TicCard
              key={tic.tic_id}
              tic={tic}
              isOwner={isOwner}
              lang={lang}
              onComplete={complete}
              onWaive={waive}
              onRevisit={revisit}
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
              lang={lang}
              onComplete={complete}
              onWaive={waive}
              onRevisit={revisit}
            />
          ))}
        </Section>
      )}

      {foundationTics.length === 0 && (
        <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
          {lang === 'tr' ? 'Foundation tier\'da tic bulunamadı.' : 'No foundation tier tics found.'}
        </div>
      )}
    </div>
  );
}

function Intro({ lang }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
      {lang === 'tr'
        ? <>
            <strong>Foundation</strong> üç zorunlu tic'in tamamlandığı ön onay eşiğidir.
            Geçildikten sonra program <em>pre-approved</em> olur ve değer yolları (pathway) beyan edilebilir.
            Asıl iş <strong>Field &amp; Lab</strong> sekmesinde devam eder.
          </>
        : <>
            <strong>Foundation</strong> is the pre-approval threshold of three required tics.
            Once passed, the program is <em>pre-approved</em> and pathways can be declared.
            The deeper work continues in the <strong>Field &amp; Lab</strong> tab.
          </>}
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
