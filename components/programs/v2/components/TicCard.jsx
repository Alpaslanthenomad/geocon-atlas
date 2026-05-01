// components/TicCard.jsx
//
// Single tic row. Status-driven UI.
// Owners see action buttons (complete / waive / revisit). Non-owners see read-only.

import { useState } from 'react';
import { pickLabel, pickDescription, t } from '../lib/i18n';
import EvidenceModal from './EvidenceModal';
import WaiveModal from './WaiveModal';
import RevisitModal from './RevisitModal';

const STATUS_META = {
  pending:     { icon: '○', cls: 'text-slate-400 bg-slate-50 border-slate-200' },
  in_progress: { icon: '◔', cls: 'text-sky-700 bg-sky-50 border-sky-200' },
  completed:   { icon: '✓', cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  waived:      { icon: '⊘', cls: 'text-amber-700 bg-amber-50 border-amber-200' },
};

export default function TicCard({ tic, isOwner, onComplete, onWaive, onRevisit, lang = 'tr' }) {
  const [evOpen,  setEvOpen]  = useState(false);
  const [waOpen,  setWaOpen]  = useState(false);
  const [reOpen,  setReOpen]  = useState(false);

  const status   = tic.status ?? 'pending';
  const meta     = STATUS_META[status] ?? STATUS_META.pending;
  const label    = pickLabel(tic, lang);
  const desc     = pickDescription(tic, lang);
  const required = tic.foundation_gate_required || tic.field_lab_gate_required || tic.gate_required;
  const isCore   = tic.is_core;

  const canComplete = isOwner && (status === 'pending' || status === 'in_progress');
  const canWaive    = isOwner && status !== 'waived';
  const canRevisit  = isOwner && (status === 'completed' || status === 'waived');

  return (
    <>
      <div className={`rounded-xl border bg-white p-4 transition hover:border-slate-300`}>
        <div className="flex items-start gap-3">
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${meta.cls} text-base font-bold`}>
            {meta.icon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <h4 className="font-medium text-slate-900">{label}</h4>
              {isCore && (
                <span className="text-[10px] uppercase tracking-wide font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                  Core
                </span>
              )}
              {required && !isCore && (
                <span className="text-[10px] uppercase tracking-wide font-semibold text-slate-700 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
                  {lang === 'tr' ? 'Zorunlu' : 'Required'}
                </span>
              )}
              <span className="text-[10px] font-mono text-slate-400">{tic.tic_id}</span>
            </div>

            {desc && <p className="mt-1 text-sm text-slate-600">{desc}</p>}

            {/* Evidence summary if completed */}
            {status === 'completed' && (tic.evidence_type || tic.evidence_link) && (
              <div className="mt-2 text-xs text-slate-500 space-y-0.5">
                {tic.evidence_type && (
                  <div><span className="font-medium">{t('evidenceType', lang)}:</span> {tic.evidence_type}</div>
                )}
                {tic.evidence_link && (
                  <div className="truncate">
                    <a
                      href={tic.evidence_link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-600 hover:underline"
                    >
                      {tic.evidence_link}
                    </a>
                  </div>
                )}
                {tic.completed_at && (
                  <div className="text-slate-400">
                    {new Date(tic.completed_at).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US')}
                  </div>
                )}
              </div>
            )}

            {status === 'waived' && tic.waiver_reason && (
              <div className="mt-2 rounded bg-amber-50 border border-amber-200 px-2 py-1.5 text-xs text-amber-800">
                <span className="font-medium">Waive:</span> {tic.waiver_reason}
              </div>
            )}
          </div>

          {isOwner && (
            <div className="flex gap-1 shrink-0">
              {canComplete && (
                <button
                  onClick={() => setEvOpen(true)}
                  className="rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-2.5 py-1.5"
                >
                  {t('actionComplete', lang)}
                </button>
              )}
              {canRevisit && (
                <button
                  onClick={() => setReOpen(true)}
                  className="rounded-md border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium px-2.5 py-1.5"
                  title={lang === 'tr'
                    ? 'Plan A başarısız → Plan B\'ye geç'
                    : 'Plan A failed → switch to Plan B'}
                >
                  {t('actionRevisit', lang)}
                </button>
              )}
              {canWaive && status !== 'completed' && (
                <button
                  onClick={() => setWaOpen(true)}
                  className="rounded-md border border-amber-300 hover:bg-amber-50 text-amber-700 text-xs font-medium px-2.5 py-1.5"
                >
                  {t('actionWaive', lang)}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {evOpen && (
        <EvidenceModal
          tic={tic}
          lang={lang}
          onClose={() => setEvOpen(false)}
          onSubmit={async (evidence) => {
            await onComplete(tic.tic_id, evidence);
            setEvOpen(false);
          }}
        />
      )}
      {waOpen && (
        <WaiveModal
          tic={tic}
          lang={lang}
          onClose={() => setWaOpen(false)}
          onSubmit={async (reason) => {
            await onWaive(tic.tic_id, reason);
            setWaOpen(false);
          }}
        />
      )}
      {reOpen && (
        <RevisitModal
          tic={tic}
          lang={lang}
          onClose={() => setReOpen(false)}
          onSubmit={async (reason) => {
            await onRevisit(tic.tic_id, reason);
            setReOpen(false);
          }}
        />
      )}
    </>
  );
}
