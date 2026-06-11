// components/TicCard.jsx
//
// Single tic row. Status-driven UI.
// Owners see action buttons (complete / waive / revisit). Non-owners see read-only.

import { useState } from 'react';
import { pickLabel, pickDescription, t } from '../lib/i18n';
import EvidenceModal from './EvidenceModal';
import WaiveModal from './WaiveModal';
import RevisitModal from './RevisitModal';
import AssignTicModal from './AssignTicModal';
import FailModal from './FailModal';

function formatDate(d, lang) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return d;
  }
}

function isOverdue(d) {
  if (!d) return false;
  const due = new Date(d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
}

const STATUS_META = {
  pending:     { icon: '○', cls: 'text-slate-400 bg-slate-50 border-slate-200' },
  in_progress: { icon: '◔', cls: 'text-sky-700 bg-sky-50 border-sky-200' },
  completed:   { icon: '✓', cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  waived:      { icon: '⊘', cls: 'text-amber-700 bg-amber-50 border-amber-200' },
  blocked:                 { icon: '⊝', cls: 'text-orange-700 bg-orange-50 border-orange-200' },
  attempted_failed:        { icon: '✕', cls: 'text-rose-700 bg-rose-50 border-rose-200' },
  replaced_by_alternative: { icon: '⇄', cls: 'text-slate-600 bg-slate-50 border-slate-300' },
};

// Non-completing "failure as data" statuses — shown with their reason note.
const FAIL_LABEL = {
  blocked:                 { tr: 'Bloklu',                   en: 'Blocked' },
  attempted_failed:        { tr: 'Denendi, başarısız',       en: 'Attempted, failed' },
  replaced_by_alternative: { tr: 'Alternatifle değiştirildi', en: 'Replaced by alternative' },
};

export default function TicCard({ tic, isOwner, members = [], commentCount = 0, onComplete, onWaive, onRevisit, onAssign, onSetStatus, lang = 'tr' }) {
  const [evOpen,  setEvOpen]  = useState(false);
  const [waOpen,  setWaOpen]  = useState(false);
  const [reOpen,  setReOpen]  = useState(false);
  const [asOpen,  setAsOpen]  = useState(false);
  const [faOpen,  setFaOpen]  = useState(false);

  const status   = tic.status ?? 'pending';
  const meta     = STATUS_META[status] ?? STATUS_META.pending;
  const label    = pickLabel(tic, lang);
  const desc     = pickDescription(tic, lang);
  const required = tic.foundation_gate_required || tic.field_lab_gate_required || tic.gate_required;
  const isCore   = tic.is_core;
  const isFail   = status === 'blocked' || status === 'attempted_failed' || status === 'replaced_by_alternative';

  const canComplete = isOwner && (status === 'pending' || status === 'in_progress' || isFail);
  const canWaive    = isOwner && status !== 'waived';
  const canRevisit  = isOwner && (status === 'completed' || status === 'waived');
  // Failure-as-data: record a blocker / failed attempt / replacement while the
  // tic is still open (not completed, not waived).
  const canFail     = isOwner && !!onSetStatus && status !== 'completed' && status !== 'waived';

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
              {commentCount > 0 && (
                <span
                  title={lang === 'tr' ? `${commentCount} yorum` : `${commentCount} comments`}
                  className="text-[10px] font-semibold text-sky-700 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded inline-flex items-center gap-1"
                >
                  💬 {commentCount}
                </span>
              )}
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

            {isFail && (
              <div className="mt-2 rounded bg-rose-50 border border-rose-200 px-2 py-1.5 text-xs text-rose-800">
                <span className="font-medium">{FAIL_LABEL[status][lang === 'tr' ? 'tr' : 'en']}</span>
                {tic.status_note ? `: ${tic.status_note}` : ''}
              </div>
            )}

            {(tic.assignee_member_id || tic.due_date) && (
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                {tic.assignee_member_id && (
                  <span className="inline-flex items-center gap-1 text-slate-600">
                    <span className="text-slate-400">👤</span>
                    {tic.assignee_name || (lang === 'tr' ? 'atanan' : 'assignee')}
                  </span>
                )}
                {tic.due_date && (
                  <span className={`inline-flex items-center gap-1 ${
                    isOverdue(tic.due_date) && status !== 'completed' && status !== 'waived'
                      ? 'text-rose-700 font-semibold'
                      : 'text-slate-600'
                  }`}>
                    <span className="text-slate-400">📅</span>
                    {formatDate(tic.due_date, lang)}
                    {isOverdue(tic.due_date) && status !== 'completed' && status !== 'waived' && (
                      <span className="ml-1 text-[10px] uppercase">
                        {lang === 'tr' ? 'gecikti' : 'overdue'}
                      </span>
                    )}
                  </span>
                )}
              </div>
            )}
          </div>

          {isOwner && (
            <div className="flex gap-1 shrink-0 flex-wrap justify-end">
              {canComplete && (
                <button
                  onClick={() => setEvOpen(true)}
                  className="rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-2.5 py-1.5"
                >
                  {t('actionComplete', lang)}
                </button>
              )}
              {onAssign && status !== 'completed' && status !== 'waived' && (
                <button
                  onClick={() => setAsOpen(true)}
                  className="rounded-md border border-sky-300 hover:bg-sky-50 text-sky-700 text-xs font-medium px-2.5 py-1.5"
                >
                  {tic.assignee_member_id
                    ? (lang === 'tr' ? 'Yeniden ata' : 'Reassign')
                    : (lang === 'tr' ? 'Ata' : 'Assign')}
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
              {canFail && (
                <button
                  onClick={() => setFaOpen(true)}
                  className="rounded-md border border-rose-300 hover:bg-rose-50 text-rose-700 text-xs font-medium px-2.5 py-1.5"
                  title={lang === 'tr'
                    ? 'Bloklu / başarısız / değiştirildi olarak işaretle'
                    : 'Mark blocked / failed / replaced'}
                >
                  {lang === 'tr' ? 'Sorun' : 'Issue'}
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
      {asOpen && onAssign && (
        <AssignTicModal
          tic={tic}
          members={members}
          lang={lang}
          onClose={() => setAsOpen(false)}
          onSubmit={async (opts) => {
            await onAssign(tic.tic_id, opts);
            setAsOpen(false);
          }}
        />
      )}
      {faOpen && onSetStatus && (
        <FailModal
          tic={tic}
          lang={lang}
          onClose={() => setFaOpen(false)}
          onSubmit={async ({ status, note }) => {
            await onSetStatus(tic.tic_id, { status, note });
            setFaOpen(false);
          }}
        />
      )}
    </>
  );
}
