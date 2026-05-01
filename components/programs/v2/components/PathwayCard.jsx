// components/PathwayCard.jsx

import { useState } from 'react';
import { pickLabel, pickDescription, t } from '../lib/i18n';

const STATUS_META = {
  declared:           { label: { tr: 'Beyan edildi',    en: 'Declared' },           cls: 'bg-slate-100 text-slate-700 border-slate-200' },
  ready_to_activate:  { label: { tr: 'Aktif hazır',     en: 'Ready to activate' },  cls: 'bg-sky-100 text-sky-800 border-sky-300' },
  active:             { label: { tr: 'Aktif',           en: 'Active' },             cls: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  realized:           { label: { tr: 'Gerçekleşti',     en: 'Realized' },           cls: 'bg-violet-100 text-violet-800 border-violet-300' },
  abandoned:          { label: { tr: 'Terk edildi',     en: 'Abandoned' },          cls: 'bg-stone-100 text-stone-700 border-stone-300' },
  suggested:          { label: { tr: 'AI önerdi',       en: 'AI suggested' },       cls: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200' },
};

export default function PathwayCard({ pathway, isOwner, onActivate, lang = 'tr' }) {
  const [busy,   setBusy]   = useState(false);
  const [feedback, setFb]   = useState(null);

  const status = pathway.status ?? 'declared';
  const meta   = STATUS_META[status] ?? STATUS_META.declared;
  const label  = pathway.is_custom ? pathway.custom_label : pickLabel(pathway.definition ?? pathway, lang);
  const desc   = pathway.is_custom ? pathway.custom_description : pickDescription(pathway.definition ?? pathway, lang);
  const required = pathway.required_tics ?? pathway.definition?.required_tics ?? [];
  const prereqMet = pathway.prerequisite_status === 'met';

  const canActivate = isOwner && (status === 'declared' || status === 'ready_to_activate');

  const handleActivate = async () => {
    setFb(null);
    setBusy(true);
    try {
      const r = await onActivate(pathway.is_custom
        ? `custom:${pathway.id}`
        : (pathway.pathway_id ?? pathway.id));
      if (r?.success === false) {
        // Friendly error from RPC
        const msg = r.error === 'foundation_gate_not_passed'
          ? (lang === 'tr' ? 'Foundation Gate kapalı' : 'Foundation gate not passed')
          : r.error === 'pathway_prerequisites_not_met'
            ? (lang === 'tr' ? 'Pathway ön koşulları sağlanmadı' : 'Pathway prerequisites not met')
            : r.message ?? r.error;
        const missing = r.missing_tics?.length ? ` — ${r.missing_tics.join(', ')}` : '';
        setFb({ kind: 'error', text: msg + missing });
      } else {
        setFb({ kind: 'ok', text: lang === 'tr' ? 'Aktive edildi' : 'Activated' });
      }
    } catch (e) {
      setFb({ kind: 'error', text: e.message ?? 'Error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-slate-900">{label}</h4>
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${meta.cls}`}>
              {meta.label[lang] ?? meta.label.en}
            </span>
            {pathway.origin && (
              <span className="text-[10px] uppercase tracking-wide font-semibold text-slate-500">
                {pathway.origin}
              </span>
            )}
            {pathway.is_custom && (
              <span className="text-[10px] uppercase tracking-wide font-semibold text-violet-700 bg-violet-50 border border-violet-200 px-1.5 py-0.5 rounded">
                Custom
              </span>
            )}
          </div>
          {desc && <p className="mt-1 text-sm text-slate-600">{desc}</p>}

          {required.length > 0 && (
            <div className="mt-2 flex gap-1 flex-wrap">
              {required.map((tid) => (
                <span
                  key={tid}
                  className="text-[10px] font-mono rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-slate-600"
                >
                  {tid}
                </span>
              ))}
            </div>
          )}

          {pathway.prerequisite_status && (
            <div className="mt-2 text-xs">
              <span className="text-slate-500">{lang === 'tr' ? 'Ön koşul:' : 'Prereq:'}</span>{' '}
              <span className={prereqMet ? 'text-emerald-700 font-medium' : 'text-amber-700 font-medium'}>
                {pathway.prerequisite_status}
              </span>
            </div>
          )}
        </div>

        {canActivate && (
          <button
            onClick={handleActivate}
            disabled={busy}
            className="rounded-md bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-sm font-medium px-3 py-1.5 shrink-0"
          >
            {busy ? '…' : t('actionActivate', lang)}
          </button>
        )}
      </div>

      {feedback && (
        <div className={`mt-3 rounded px-3 py-2 text-sm ${
          feedback.kind === 'ok'
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border border-rose-200 text-rose-800'
        }`}>
          {feedback.text}
        </div>
      )}
    </div>
  );
}
