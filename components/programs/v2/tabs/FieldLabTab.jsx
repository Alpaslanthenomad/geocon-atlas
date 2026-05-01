// tabs/FieldLabTab.jsx
//
// FIELD & LAB TIER — 9 tic (4 zorunlu + 5 pathway-required):
//   Conservation: baseline_assessment, material_secured, viability_check (opt)
//   Science:      specimen_documented, morphological_characterization,
//                 metabolite_profiling, phenology, genetic, ecological_niche (opt)
//
// Bu kapı geçilmeden pathway aktive edilemez.

import { t } from '../lib/i18n';
import { useProgramFoundation } from '../hooks/useProgramFoundation';
import GateBanner from '../components/GateBanner';
import TicCard from '../components/TicCard';

export default function FieldLabTab({ programId, lang = 'tr' }) {
  const { loading, error, gates, ticsByTier, isOwner, complete, waive, revisit } =
    useProgramFoundation(programId);

  if (loading) return <Skeleton />;
  if (error)   return <ErrorBox error={error} lang={lang} />;

  const fieldLabTics = ticsByTier.field_lab;

  // Split into required and optional/pathway-unlock for visual grouping
  const requiredTics = fieldLabTics.filter((tic) => tic.field_lab_gate_required || tic.gate_required);
  const optionalTics = fieldLabTics.filter((tic) => !tic.field_lab_gate_required && !tic.gate_required);

  const consRequired = requiredTics.filter((t) => t.wheel_type === 'conservation');
  const sciRequired  = requiredTics.filter((t) => t.wheel_type === 'science');
  const consOptional = optionalTics.filter((t) => t.wheel_type === 'conservation');
  const sciOptional  = optionalTics.filter((t) => t.wheel_type === 'science');

  return (
    <div className="space-y-5">
      <GateBanner gate={gates?.field_lab} kind="field_lab" lang={lang} />

      <Intro lang={lang} />

      {(consRequired.length + sciRequired.length) > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">
            {lang === 'tr' ? 'Zorunlu tic\'ler' : 'Required tics'}
          </h3>
          <div className="space-y-3">
            {consRequired.length > 0 && (
              <Section title={t('wheelConservation', lang)} accent="emerald">
                {consRequired.map((tic) => (
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
            {sciRequired.length > 0 && (
              <Section title={t('wheelScience', lang)} accent="sky">
                {sciRequired.map((tic) => (
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
          </div>
        </div>
      )}

      {(consOptional.length + sciOptional.length) > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">
            {lang === 'tr' ? 'Pathway tetikleyici (opsiyonel)' : 'Pathway-unlocking (optional)'}
          </h3>
          <p className="text-xs text-slate-500 mb-2">
            {lang === 'tr'
              ? 'Bu tic\'ler kapı için zorunlu değil ama belirli pathway\'leri aktive etmek için gereklidir.'
              : 'Not gate-required, but needed to activate specific pathways.'}
          </p>
          <div className="space-y-3">
            {consOptional.length > 0 && (
              <Section title={t('wheelConservation', lang)} accent="emerald">
                {consOptional.map((tic) => (
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
            {sciOptional.length > 0 && (
              <Section title={t('wheelScience', lang)} accent="sky">
                {sciOptional.map((tic) => (
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
          </div>
        </div>
      )}

      {fieldLabTics.length === 0 && (
        <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
          {lang === 'tr' ? 'Field & Lab tier\'da tic bulunamadı.' : 'No field & lab tier tics found.'}
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
            <strong>Field &amp; Lab</strong> programın asıl iş katmanıdır. Foundation Gate ile paralel çalışılabilir,
            ancak pathway aktive etmek için bu kapının da açık olması gerekir.
            Opsiyonel tic'ler ise pathway-spesifik kilitleri açar (ör. <code>sci.metabolite_profiling</code> → pharma/cosmetic).
          </>
        : <>
            <strong>Field &amp; Lab</strong> is the program's main work layer. Can run in parallel with Foundation,
            but this gate must pass before any pathway can activate.
            Optional tics unlock pathway-specific paths (e.g. <code>sci.metabolite_profiling</code> → pharma/cosmetic).
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
      <h4 className="flex items-center gap-2 text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        {title}
      </h4>
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
