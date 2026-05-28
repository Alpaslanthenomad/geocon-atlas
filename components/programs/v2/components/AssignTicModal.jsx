"use client";
// components/AssignTicModal.jsx
//
// Owner picks a program member to assign a tic to (or unassign), plus an optional due date.

import { useState } from 'react';
import Modal from './Modal';
import { pickLabel, t } from '../lib/i18n';

function memberDisplay(m) {
  return (
    m.display_name ||
    m.researcher_name ||
    m.profile_full_name ||
    m.external_name ||
    m.external_email ||
    m.user_email ||
    '—'
  );
}

export default function AssignTicModal({ tic, members = [], lang = 'tr', onClose, onSubmit }) {
  const initial = tic.assignee_member_id || '';
  const initialDue = tic.due_date || '';
  const [memberId, setMemberId] = useState(initial);
  const [dueDate, setDueDate] = useState(initialDue);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Only members who are still actively part of the program can be assigned.
  // Filter out withdrawn/declined statuses if present.
  const activeMembers = (members || []).filter(
    (m) => !m.status || ['active', 'invited', 'accepted'].includes(m.status)
  );

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        assigneeMemberId: memberId || null,
        dueDate: dueDate || null,
      });
    } catch (e) {
      setError(e.message || 'Atama başarısız');
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title={lang === 'tr' ? 'Görev ata' : 'Assign task'}
      onClose={onClose}
    >
      <div className="space-y-3">
        <div className="rounded-md bg-slate-50 border border-slate-200 px-3 py-2 text-xs">
          <div className="font-medium text-slate-900">{pickLabel(tic, lang)}</div>
          <div className="font-mono text-slate-500 mt-0.5">{tic.tic_id}</div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {lang === 'tr' ? 'Atanan' : 'Assignee'}
          </label>
          <select
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm bg-white"
          >
            <option value="">{lang === 'tr' ? '— atanmamış —' : '— unassigned —'}</option>
            {activeMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {memberDisplay(m)} {m.role ? `· ${m.role}` : ''}
              </option>
            ))}
          </select>
          {activeMembers.length === 0 && (
            <div className="mt-1 text-[11px] text-amber-700">
              {lang === 'tr'
                ? 'Bu programda henüz üye yok. Önce Ekip sekmesinden davet et.'
                : 'No members yet. Invite from the Contributors tab first.'}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {lang === 'tr' ? 'Son tarih (opsiyonel)' : 'Due date (optional)'}
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
          />
        </div>

        {error && (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            {t('actionCancel', lang)}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
              submitting
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-sky-600 text-white hover:bg-sky-700'
            }`}
          >
            {submitting ? t('loading', lang) : t('actionSave', lang)}
          </button>
        </div>
      </div>
    </Modal>
  );
}
