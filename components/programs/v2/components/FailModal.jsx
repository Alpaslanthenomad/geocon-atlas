// components/FailModal.jsx
//
// Record a non-completing status on a tic — failure as data. The founder's
// principle: a route that was tried and failed, hit a blocker, or was dropped
// for another approach is still information worth keeping. Sets one of
// blocked / attempted_failed / replaced_by_alternative + an optional note
// (money/PII-blind, enforced server-side).

import { useState } from 'react';
import Modal from './Modal';
import { pickLabel } from '../lib/i18n';

const OPTIONS = [
  {
    key: 'blocked',
    tr: { label: 'Bloklu', hint: 'Dış bir bağımlılık ilerlemeyi durduruyor' },
    en: { label: 'Blocked', hint: 'An external dependency is holding this up' },
  },
  {
    key: 'attempted_failed',
    tr: { label: 'Denendi, başarısız', hint: 'Yöntem uygulandı ama işe yaramadı' },
    en: { label: 'Attempted, failed', hint: 'The approach was tried and did not work' },
  },
  {
    key: 'replaced_by_alternative',
    tr: { label: 'Alternatifle değiştirildi', hint: 'Bu yol bırakıldı, başka bir yola geçildi' },
    en: { label: 'Replaced by alternative', hint: 'This route was dropped for another' },
  },
];

export default function FailModal({ tic, onClose, onSubmit, lang = 'tr' }) {
  const [status, setStatus] = useState('attempted_failed');
  const [note, setNote]     = useState('');
  const [busy, setBusy]     = useState(false);
  const [err, setErr]       = useState(null);

  const ticLabel = pickLabel(tic, lang);

  const submit = async () => {
    setErr(null);
    try {
      setBusy(true);
      await onSubmit({ status, note: note.trim() || null });
    } catch (e) {
      setErr(e.message ?? 'Error');
    } finally {
      setBusy(false);
    }
  };

  const title = lang === 'tr' ? `Durum kaydet: ${ticLabel}` : `Record status: ${ticLabel}`;

  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-3">
        <p className="text-sm text-slate-600">
          {lang === 'tr'
            ? 'Başarısızlık da veridir — bu tic\'in durumunu kayda geç. Audit kalıcıdır.'
            : 'Failure is data — record the state of this tic. The audit log is permanent.'}
        </p>

        <div className="space-y-1.5">
          {OPTIONS.map((o) => {
            const on = status === o.key;
            const c = o[lang === 'tr' ? 'tr' : 'en'];
            return (
              <button
                key={o.key}
                type="button"
                onClick={() => setStatus(o.key)}
                className={`w-full text-left rounded-md border px-3 py-2 transition ${
                  on
                    ? 'border-rose-400 bg-rose-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className={`text-sm font-medium ${on ? 'text-rose-800' : 'text-slate-800'}`}>
                  {c.label}
                </div>
                <div className="text-xs text-slate-500">{c.hint}</div>
              </button>
            );
          })}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {lang === 'tr' ? 'Not (opsiyonel)' : 'Note (optional)'}
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder={lang === 'tr'
              ? 'Örn: in-vitro hattı kontaminasyon nedeniyle başarısız; vejetatif yola geçildi'
              : 'e.g. in-vitro route failed to contamination; switched to the vegetative route'}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
          />
          <div className="mt-1 text-xs text-slate-400">
            {lang === 'tr'
              ? 'Para tutarı veya iletişim bilgisi yazmayın.'
              : 'No money figures or contact details.'}
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
            {lang === 'tr' ? 'Vazgeç' : 'Cancel'}
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="rounded-md bg-rose-600 hover:bg-rose-700 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {busy ? '…' : (lang === 'tr' ? 'Kaydet' : 'Record')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
