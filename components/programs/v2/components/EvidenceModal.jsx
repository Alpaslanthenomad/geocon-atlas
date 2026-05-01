// components/EvidenceModal.jsx
//
// Used for completing a tic. If tic.evidence_required is true, evidence_type is mandatory.
// evidence_options come from the RPC payload (per tic).

import { useState } from 'react';
import Modal from './Modal';
import { pickLabel, t } from '../lib/i18n';

export default function EvidenceModal({ tic, onClose, onSubmit, lang = 'tr' }) {
  const [link,  setLink]  = useState(tic.evidence_link  ?? '');
  const [type,  setType]  = useState(tic.evidence_type  ?? '');
  const [notes, setNotes] = useState(tic.evidence_notes ?? '');
  const [busy,  setBusy]  = useState(false);
  const [err,   setErr]   = useState(null);

  const opts = tic.evidence_options ?? [];
  const evidenceRequired = tic.evidence_required;
  const ticLabel = pickLabel(tic, lang);

  const submit = async () => {
    setErr(null);
    if (evidenceRequired && !type) {
      setErr(lang === 'tr' ? 'Kanıt tipi zorunlu' : 'Evidence type is required');
      return;
    }
    try {
      setBusy(true);
      await onSubmit({ link: link || null, type: type || null, notes: notes || null });
    } catch (e) {
      setErr(e.message ?? 'Error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={`${t('actionComplete', lang)}: ${ticLabel}`}
      onClose={onClose}
      size="md"
    >
      <div className="space-y-3">
        {opts.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t('evidenceType', lang)}
              {evidenceRequired && <span className="text-rose-500 ml-1">*</span>}
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            >
              <option value="">— {lang === 'tr' ? 'seçin' : 'select'} —</option>
              {opts.map((o) => (
                <option key={o.evidence_type} value={o.evidence_type}>
                  {o.evidence_type}
                  {o.notes ? ` — ${o.notes}` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {t('evidenceLink', lang)}
          </label>
          <input
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://…"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {t('evidenceNotes', lang)}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
        </div>

        {err && (
          <div className="rounded bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
            {err}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            disabled={busy}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {t('actionCancel', lang)}
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="rounded-md bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {busy ? '…' : t('actionSave', lang)}
          </button>
        </div>
      </div>
    </Modal>
  );
}
