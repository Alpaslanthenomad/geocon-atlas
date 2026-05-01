// components/RevisitModal.jsx
//
// "Esnek geri dönüş prensibi" — completed/waived tic'i revisit et.
// Plan A başarısız → Plan B'ye geçiş için kullanılır.

import { useState } from 'react';
import Modal from './Modal';
import { pickLabel, t } from '../lib/i18n';

export default function RevisitModal({ tic, onClose, onSubmit, lang = 'tr' }) {
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
    <Modal title={`${t('actionRevisit', lang)}: ${ticLabel}`} onClose={onClose}>
      <div className="space-y-3">
        <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2.5 text-sm text-sky-900">
          {lang === 'tr'
            ? <><strong>Esnek geri dönüş.</strong> Bu tic yeniden açılacak (status: <code>in_progress</code>). Önceki tamamlanma kaydı audit\'te tutulur. Foundation tier\'daysa diğer kapılar sarı uyarıya geçer ama kapanmaz — owner sorumluluğu.</>
            : <><strong>Flexible revisit.</strong> This tic will be re-opened (status: <code>in_progress</code>). The previous completion is preserved in audit. If foundation-tier, other gates show a yellow warning but don\'t auto-close — owner responsibility.</>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {t('reasonRequired', lang)}
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder={lang === 'tr'
              ? 'Örn: doku kültürü protokolü 6 ay denendi, başarısız → tohum bankası rotasına geçiş'
              : 'e.g. tissue culture protocol failed after 6 months → switching to seed bank route'}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
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
            className="rounded-md bg-sky-600 hover:bg-sky-700 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {busy ? '…' : t('actionRevisit', lang)}
          </button>
        </div>
      </div>
    </Modal>
  );
}
