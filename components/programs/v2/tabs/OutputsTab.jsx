"use client";
// tabs/OutputsTab.jsx
//
// OUTPUT / DEPLOYMENT — the final stage Room: where the program's work turns into
// usable, verifiable results. Three layers:
//   1. Deployment readiness — the restoration plan + stock TICs (moved here from
//      Field & Lab / Propagation; "what do we do with the material now?").
//   2. Program outputs — PM-declared outputs grouped by Venn dimension
//      (Conservation / Knowledge / Value potentials), money-blind.
//   3. Related sources (auto) — publications + species metabolites for context.
//   4. Downstream review — verified outputs are "available for downstream review",
//      never "market/product/investment ready". Exchange translates that later.

import { useEffect, useState } from 'react';
import { useProgramOutputs } from '../hooks/useProgramOutputs';
import { useProgramPathways } from '../hooks/useProgramPathways';
import { useProgramFoundation } from '../hooks/useProgramFoundation';
import { supabase } from '../lib/supabaseClient';
import { t } from '../lib/i18n';
import AddOutputModal from '../components/AddOutputModal';
import RoomWorkbench from '../components/RoomWorkbench';
import TicCard from '../components/TicCard';

const DEPLOYMENT_TIC_IDS = ['cons.restoration_plan_defined', 'cons.stock_ready_for_restoration'];

const OUTPUT_GROUPS = [
  { dim: 'safeguard', tr: 'Koruma çıktıları',     en: 'Conservation outputs' },
  { dim: 'knowledge', tr: 'Bilgi çıktıları',      en: 'Knowledge outputs' },
  { dim: 'value',     tr: 'Değer potansiyelleri', en: 'Value potentials' },
];

export default function OutputsTab({ programId, lang = 'tr' }) {
  const { loading, error, outputs, isOwner, addOutput } = useProgramOutputs(programId);
  const { declared: declaredPathways } = useProgramPathways(programId);
  const fnd = useProgramFoundation(programId);

  const [pubs, setPubs] = useState([]);
  const [metabolites, setMetabolites] = useState([]);
  const [derivedLoading, setDerivedLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const T = (tr, en) => (lang === 'tr' ? tr : en);

  // Derived intelligence — publications + species metabolites (context, not declared outputs).
  useEffect(() => {
    let alive = true;
    async function load() {
      setDerivedLoading(true);
      try {
        const [ppRes, progRes] = await Promise.all([
          supabase
            .from('program_publications')
            .select('publication:publication_id(id, title, doi, year, journal, authors)')
            .eq('program_id', programId)
            .limit(200),
          supabase
            .from('programs')
            .select('species_id')
            .eq('id', programId)
            .maybeSingle(),
        ]);
        if (!alive) return;
        setPubs((ppRes.data || []).map((r) => r.publication).filter(Boolean));
        if (progRes.data?.species_id) {
          const { data: metRows } = await supabase
            .from('metabolites')
            .select('id, compound_name, compound_class, cas_number, reported_activity')
            .eq('species_id', progRes.data.species_id)
            .order('confidence', { ascending: false, nullsFirst: false })
            .limit(200);
          if (alive) setMetabolites(metRows || []);
        }
      } catch (e) {
        console.warn('[OutputsTab] derived load error', e?.message);
      } finally {
        if (alive) setDerivedLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [programId]);

  // Deployment-readiness TICs (moved here from Field & Lab / Propagation).
  const flTics = fnd.ticsByTier?.field_lab || [];
  const deploymentTics = DEPLOYMENT_TIC_IDS.map((id) => flTics.find((tc) => tc.tic_id === id)).filter(Boolean);

  // Group declared outputs by Venn dimension.
  const grouped   = OUTPUT_GROUPS.map((g) => ({ ...g, items: outputs.filter((o) => o.definition?.dimension === g.dim) }));
  const ungrouped = outputs.filter((o) => !o.definition?.dimension);
  const evidencedCount = outputs.filter((o) => o.evidence_link).length;

  // Room state (Output / Deployment).
  const fieldLabPassed = fnd.gates?.field_lab?.passed ?? false;
  let stateMeta;
  if (!fieldLabPassed)       stateMeta = { label: T('Önceki aşamalar bekleniyor — ön izleme', 'Earlier stages pending — preview'), bg: '#EEF2F6', c: '#475569' };
  else if (evidencedCount)   stateMeta = { label: T('Doğrulanmış çıktı var', 'Verified output present'),                          bg: '#DCFCE7', c: '#166534' };
  else if (outputs.length)   stateMeta = { label: T('Çıktı izleniyor', 'Outputs being tracked'),                                  bg: '#E0F2FE', c: '#075985' };
  else                       stateMeta = { label: T('Açık — henüz çıktı yok', 'Open — no outputs yet'),                           bg: '#EEF2F6', c: '#475569' };

  const ticProps = (tic) => ({
    tic,
    isOwner: fnd.isOwner,
    commentCount: fnd.commentCounts?.[tic.tic_id] || 0,
    lang,
    onComplete: fnd.complete,
    onWaive: fnd.waive,
    onRevisit: fnd.revisit,
    onAssign: fnd.assign,
    onSetStatus: fnd.setStatus,
  });

  return (
    <div className="space-y-5">
      {/* Room header */}
      <div className="rounded-2xl border-2 border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900">{T('Çıktı / Deployment', 'Output / Deployment')}</h2>
          <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: stateMeta.bg, color: stateMeta.c }}>
            {stateMeta.label}
          </span>
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-slate-600">
          <span className="font-medium text-slate-700">{T('Amaç: ', 'Purpose: ')}</span>
          {T('Bu program ne üretti ve bu çıktılar doğrulanmış kullanıma / sonraki değerlendirmeye hazır mı?',
             'What did this program produce, and is any of it verified and ready for use / downstream review?')}
        </p>
        <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-[12px] text-slate-600">
          {T('Doğrulanmış, izlenebilir çıktılar sonraki değerlendirme için hazırdır. GEOCON parasal değer atamaz — bu, ayrı bir aşamanın işidir.',
             'Verified, traceable outputs are available for downstream review. GEOCON assigns no monetary value — that is a separate stage’s job.')}
        </div>
      </div>

      {/* Workbench — the prioritized entry: record an output (money-blind) */}
      <RoomWorkbench
        lang={lang}
        question={T('Bu program ne üretti ve doğrulanmış kullanıma hazır mı?',
                    'What did this program produce, and is any of it ready for verified use?')}
        today={T('Bir program çıktısı kaydet — koruma eylemi, protokol, yayın veya doğrulanmış varlık.',
                 'Record a program output — a conservation action, protocol, publication or verified asset.')}
        advances={T('Kanıt bağlantılı çıktılar programın doğrulanmış sonuç katmanını güçlendirir.',
                    'Evidence-linked outputs strengthen the program’s verified results layer.')}
      >
        {isOwner ? (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-emerald-100 bg-white p-3">
            <button onClick={() => setAddOpen(true)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700">
              {T('Çıktı ekle', 'Add output')}
            </button>
            <span className="text-[11px] text-slate-400">
              {T('Doğrulanmış çıktı, sonraki değerlendirme için hazır olabilir.', 'A verified output can become available for downstream review.')}
            </span>
          </div>
        ) : (
          <div className="text-[12px] text-slate-500">{T('Çıktı kaydetmek için program üyesi olmalısın.', 'You must be a program member to record an output.')}</div>
        )}
      </RoomWorkbench>

      {/* 1. Deployment readiness */}
      {deploymentTics.length > 0 && (
        <section>
          <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {T('Dağıtıma hazırlık', 'Deployment readiness')}
          </h3>
          <p className="mb-2 text-[11px] text-slate-400">
            {T('Bu tür ve materyalle sahada / ex situ / restorasyonda ne yapılacak?',
               'What happens to this species and material in the field / ex situ / restoration?')}
          </p>
          <div className="space-y-2">
            {deploymentTics.map((tic) => <TicCard key={tic.tic_id} {...ticProps(tic)} />)}
          </div>
        </section>
      )}

      {/* 2. Program outputs (declared), grouped by dimension */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">
            {T('Program çıktıları', 'Program outputs')}
            <span className="ml-2 text-xs font-normal text-slate-500">{outputs.length}</span>
          </h3>
          {isOwner && (
            <button
              onClick={() => setAddOpen(true)}
              className="rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5"
            >
              + {t('actionAddOutput', lang)}
            </button>
          )}
        </div>

        {loading && <Skeleton />}
        {error && (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">{error.message}</div>
        )}

        {!loading && !error && outputs.length === 0 && (
          <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
            {T('Henüz çıktı kaydedilmedi. Program ilerledikçe koruma eylemleri, protokoller, yayınlar ve doğrulanmış varlıklar buraya çıktı olarak eklenir.',
               'No outputs recorded yet. As the program advances, conservation actions, protocols, publications and verified assets are added here.')}
          </div>
        )}

        {!loading && !error && outputs.length > 0 && (
          <div className="space-y-4">
            {grouped.map((g) =>
              g.items.length > 0 ? (
                <div key={g.dim}>
                  <SectionHeader title={lang === 'tr' ? g.tr : g.en} count={g.items.length} />
                  <div className="grid gap-2 sm:grid-cols-2">
                    {g.items.map((o) => <OutputCard key={o.id} o={o} lang={lang} />)}
                  </div>
                </div>
              ) : null
            )}
            {ungrouped.length > 0 && (
              <div>
                <SectionHeader title={T('Diğer', 'Other')} count={ungrouped.length} />
                <div className="grid gap-2 sm:grid-cols-2">
                  {ungrouped.map((o) => <OutputCard key={o.id} o={o} lang={lang} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 3. Downstream review (money-blind) */}
      {evidencedCount > 0 && (
        <section className="rounded-xl border border-emerald-200 bg-emerald-50/40 px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800">
            {T('Sonraki değerlendirme', 'Downstream review')}
          </div>
          <p className="mt-1 text-[13px] text-slate-700">
            {lang === 'tr'
              ? `${evidencedCount} doğrulanmış çıktı, sonraki değerlendirme için hazır.`
              : `${evidencedCount} verified output available for downstream review.`}
          </p>
        </section>
      )}

      {/* 4. Related sources (auto) — derived intelligence */}
      {!derivedLoading && (pubs.length > 0 || metabolites.length > 0) && (
        <section className="pt-4 border-t border-slate-100">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-3">
            {T('İlgili kaynaklar (otomatik)', 'Related sources (auto)')}
          </div>

          {pubs.length > 0 && (
            <div className="mb-4">
              <SectionHeader title={T('Yayınlar', 'Publications')} count={pubs.length} />
              <div className="grid gap-2">
                {pubs.map((p) => (
                  <div key={p.id} className="rounded-md border border-slate-200 bg-white p-2.5">
                    <div className="font-medium text-sm text-slate-900">{p.title || '(untitled)'}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {p.authors && <span>{p.authors}</span>}
                      {p.year && <span> · {p.year}</span>}
                      {p.journal && <span> · {p.journal}</span>}
                    </div>
                    {p.doi && (
                      <a
                        href={p.doi.startsWith('http') ? p.doi : `https://doi.org/${p.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-1 text-[11px] text-sky-600 hover:underline"
                      >
                        {p.doi}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {metabolites.length > 0 && (
            <div>
              <SectionHeader title={T('Metabolitler', 'Metabolites')} count={metabolites.length} />
              <div className="text-[11px] text-slate-500 italic mb-2">
                {T('Programın ana türünden türetildi', "Derived from the program's primary species")}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {metabolites.slice(0, 24).map((m) => (
                  <div key={m.id} className="rounded-md border border-slate-200 bg-white p-2.5">
                    <div className="font-medium text-sm text-slate-900">{m.compound_name || '(unnamed)'}</div>
                    {m.compound_class && <div className="text-[11px] text-slate-500 mt-0.5">{m.compound_class}</div>}
                    {m.cas_number && <div className="text-[10px] text-slate-400 mt-0.5 font-mono">CAS {m.cas_number}</div>}
                  </div>
                ))}
              </div>
              {metabolites.length > 24 && (
                <div className="text-[11px] text-slate-400 mt-2">
                  +{metabolites.length - 24} {T('daha', 'more')}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {addOpen && (
        <AddOutputModal
          programId={programId}
          pathways={declaredPathways}
          lang={lang}
          onClose={() => setAddOpen(false)}
          onSubmit={async (opts) => {
            await addOutput(opts);
            setAddOpen(false);
          }}
        />
      )}
    </div>
  );
}

// Venn dimension an output advances: safeguard (X) / knowledge (Y) / value (Z).
const DIM_META = {
  safeguard: { tr: 'Koruma', en: 'Safeguard', cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  knowledge: { tr: 'Bilgi',  en: 'Knowledge', cls: 'text-sky-700 bg-sky-50 border-sky-200' },
  value:     { tr: 'Değer',  en: 'Value',     cls: 'text-amber-700 bg-amber-50 border-amber-200' },
};

function OutputCard({ o, lang }) {
  const defLabel = o.definition?.[lang === 'tr' ? 'label_tr' : 'label_en'];
  const label = o.label || defLabel || o.custom_label || o.output_type || '(untitled)';
  const category = o.definition?.category || o.custom_category;
  const dimMeta = o.definition?.dimension ? DIM_META[o.definition.dimension] : null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-slate-900 truncate">{o.title || label}</div>
          <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-1.5">
            {dimMeta && (
              <span className={`text-[10px] uppercase font-semibold border px-1.5 py-0.5 rounded ${dimMeta.cls}`}>
                {lang === 'tr' ? dimMeta.tr : dimMeta.en}
              </span>
            )}
            <span>{label}</span>
            {category && <span>· {category}</span>}
            {o.pathway_label && <span>· {o.pathway_label}</span>}
          </div>
          {o.description && <div className="text-xs text-slate-600 mt-1.5 line-clamp-3">{o.description}</div>}
          {o.evidence_link && (
            <a
              href={o.evidence_link.startsWith('http') ? o.evidence_link : `https://${o.evidence_link}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-1.5 text-[11px] text-sky-600 hover:underline truncate max-w-full"
            >
              {o.evidence_link}
            </a>
          )}
        </div>
        {o.visibility && (
          <span className="shrink-0 text-[10px] uppercase font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
            {o.visibility}
          </span>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ title, count }) {
  return (
    <div className="flex items-baseline justify-between border-b border-slate-100 pb-1.5 mb-2">
      <h4 className="text-sm font-medium text-slate-700">{title}</h4>
      {typeof count === 'number' && <span className="text-xs text-slate-500">{count}</span>}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <div className="h-20 rounded-xl bg-slate-100 animate-pulse" />
      <div className="h-20 rounded-xl bg-slate-100 animate-pulse" />
    </div>
  );
}
