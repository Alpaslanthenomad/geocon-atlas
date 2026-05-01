// components/WaiveModal.jsx

import { useState } from 'react';
import Modal from './Modal';
import { pickLabel, t } from '../lib/i18n';

export default function WaiveModal({ tic, onClose, onSubmit, lang = 'tr' }) {
  const [reason, setReason] = useState('');
  const [busy,   setBusy]   = useState(false);
  const [err,    setErr]    = useState(null);

  const ticLabel = pickLabel(tic, lang);

  const submit = async () => {
    setErr(null);
    if (reason.trim().length < 10) {
      setErr(lang === 'tr'
        ? 'Gerekçe en az 10 karakter olmalı'
        : 'Reason must be at least 10 characters');
      return;
    }
    try {
      setBusy(true);
      await onSubmit(reason.trim());
    } catch (e) {
      setErr(e.message ?? 'Error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={`${t('actionWaive', lang)}: ${ticLabel}`} onClose={onClose}>
      <div className="space-y-3">
        <p className="text-sm text-slate-600">
          {lang === 'tr'
            ? 'Bu tic\'i waive etme nedeninizi açıkça belirtin. Audit kaydı kalıcıdır.'
            : 'Explain clearly why this tic is being waived. The audit log is permanent.'}
        </p>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {t('reasonRequired', lang)}
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder={lang === 'tr'
              ? 'Örn: bu tür için doku kültürü protokolü mevcut değil, in situ koruma uygulandı'
              : 'e.g. tissue culture protocol unavailable for this species, in situ preservation applied'}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          />
          <div className="mt-1 text-xs text-slate-500 text-right">
            {reason.trim().length} / 10+
          </div>
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
            disabled={busy || reason.trim().length < 10}
            className="rounded-md bg-amber-600 hover:bg-amber-700 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {busy ? '…' : t('actionWaive', lang)}
          </button>
        </div>
      </div>
    </Modal>
  );
}
