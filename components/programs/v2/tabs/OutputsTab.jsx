"use client";
// tabs/OutputsTab.jsx
//
// Top: PM-declared program outputs (via add_program_output / get_program_outputs RPC).
// Bottom: derived intelligence — related publications + species metabolites
// (helpful context but not "outputs" the PM has declared).

import { useEffect, useState } from 'react';
import { useProgramOutputs } from '../hooks/useProgramOutputs';
import { useProgramPathways } from '../hooks/useProgramPathways';
import { supabase } from '../lib/supabaseClient';
import { t } from '../lib/i18n';
import AddOutputModal from '../components/AddOutputModal';

export default function OutputsTab({ programId, lang = 'tr' }) {
  const { loading, error, outputs, isOwner, addOutput, refetch } = useProgramOutputs(programId);
  const { declared: declaredPathways } = useProgramPathways(programId);

  const [pubs, setPubs] = useState([]);
  const [metabolites, setMetabolites] = useState([]);
  const [derivedLoading, setDerivedLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  // Derived intelligence — publications + species metabolites
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

  return (
    <div className="space-y-6">

      {/* Declared outputs */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-900">
            {lang === 'tr' ? 'Program çıktıları' : 'Program outputs'}
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
          <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
            {error.message}
          </div>
        )}

        {!loading && !error && outputs.length === 0 && (
          <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
            {lang === 'tr'
              ? 'Henüz çıktı kaydedilmedi. Program ilerledikçe yayın, varyete, veri seti ve protokoller çıktı olarak eklenir.'
              : 'No outputs recorded yet. As the program progresses, publications, varieties, datasets, and protocols are added.'}
          </div>
        )}

        {!loading && !error && outputs.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-2">
            {outputs.map((o) => <OutputCard key={o.id} o={o} lang={lang} />)}
          </div>
        )}
      </section>

      {/* Derived intelligence */}
      {!derivedLoading && (pubs.length > 0 || metabolites.length > 0) && (
        <section className="pt-4 border-t border-slate-100">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-3">
            {lang === 'tr' ? 'İlgili kaynaklar (otomatik)' : 'Related sources (auto)'}
          </div>

          {pubs.length > 0 && (
            <div className="mb-4">
              <SectionHeader title={lang === 'tr' ? 'Yayınlar' : 'Publications'} count={pubs.length} />
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
                        🔗 {p.doi}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {metabolites.length > 0 && (
            <div>
              <SectionHeader title={lang === 'tr' ? 'Metabolitler' : 'Metabolites'} count={metabolites.length} />
              <div className="text-[11px] text-slate-500 italic mb-2">
                {lang === 'tr'
                  ? 'Programın ana türünden türetildi'
                  : "Derived from the program's primary species"}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {metabolites.slice(0, 24).map((m) => (
                  <div key={m.id} className="rounded-md border border-slate-200 bg-white p-2.5">
                    <div className="font-medium text-sm text-slate-900">{m.compound_name || '(unnamed)'}</div>
                    {m.compound_class && (
                      <div className="text-[11px] text-slate-500 mt-0.5">{m.compound_class}</div>
                    )}
                    {m.cas_number && (
                      <div className="text-[10px] text-slate-400 mt-0.5 font-mono">CAS {m.cas_number}</div>
                    )}
                  </div>
                ))}
              </div>
              {metabolites.length > 24 && (
                <div className="text-[11px] text-slate-400 mt-2">
                  +{metabolites.length - 24} {lang === 'tr' ? 'daha' : 'more'}
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

function OutputCard({ o, lang }) {
  const label = o.label || o.custom_label || o.output_type || '(untitled)';
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-slate-900 truncate">{o.title || label}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {label}
            {o.category && <span> · {o.category}</span>}
            {o.pathway_label && <span> · {o.pathway_label}</span>}
          </div>
          {o.description && (
            <div className="text-xs text-slate-600 mt-1.5 line-clamp-3">{o.description}</div>
          )}
          {o.evidence_link && (
            <a
              href={o.evidence_link.startsWith('http') ? o.evidence_link : `https://${o.evidence_link}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-1.5 text-[11px] text-sky-600 hover:underline truncate max-w-full"
            >
              🔗 {o.evidence_link}
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
