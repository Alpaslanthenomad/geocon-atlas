"use client";
// components/AddOutputModal.jsx
//
// Picker that fetches output_definitions (library) + lets owner add a custom
// output. Submits via add_program_output RPC.

import { useEffect, useState } from 'react';
import Modal from './Modal';
import { pickLabel, pickDescription, t } from '../lib/i18n';
import { supabase } from '../lib/supabaseClient';

const VISIBILITY = [
  { v: 'workspace', label_tr: '🔒 Workspace', label_en: '🔒 Workspace' },
  { v: 'network',   label_tr: '👥 Network',    label_en: '👥 Network' },
  { v: 'public',    label_tr: '🌐 Public',     label_en: '🌐 Public' },
];

export default function AddOutputModal({ programId, pathways = [], lang = 'tr', onClose, onSubmit }) {
  const [defs, setDefs] = useState([]);
  const [loadingDefs, setLoadingDefs] = useState(true);
  const [defsError, setDefsError] = useState(null);

  const [mode, setMode]               = useState('library'); // 'library' | 'custom'
  const [chosenType, setChosenType]   = useState(null);      // output_definitions.id
  const [customLabel, setCustomLabel] = useState('');
  const [customCategory, setCustomCategory] = useState('');

  const [title, setTitle]               = useState('');
  const [description, setDescription]   = useState('');
  const [pathwayId, setPathwayId]       = useState('');
  const [evidenceLink, setEvidenceLink] = useState('');
  const [evidenceNotes, setEvidenceNotes] = useState('');
  const [visibility, setVisibility]     = useState('workspace');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error: e } = await supabase
        .from('output_definitions')
        .select('id, category, display_order, label_tr, label_en, description_tr, description_en, typical_pathways, default_visibility, active')
        .eq('active', true)
        .order('category')
        .order('display_order');
      if (cancelled) return;
      if (e) setDefsError(e.message);
      else setDefs(data || []);
      setLoadingDefs(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // Group library defs by category for display
  const grouped = defs.reduce((acc, d) => {
    (acc[d.category] = acc[d.category] || []).push(d);
    return acc;
  }, {});

  // When user picks a library type, prefill visibility from default_visibility
  function pickLibraryType(def) {
    setChosenType(def.id);
    if (def.default_visibility) setVisibility(def.default_visibility);
  }

  const canSubmit =
    title.trim().length > 0 &&
    ((mode === 'library' && chosenType) ||
     (mode === 'custom' && customLabel.trim().length > 0 && customCategory.trim().length > 0));

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      const opts = {
        title: title.trim(),
        description: description.trim() || null,
        pathwayId: pathwayId || null,
        evidenceLink: evidenceLink.trim() || null,
        evidenceNotes: evidenceNotes.trim() || null,
        visibility,
      };
      if (mode === 'library') {
        opts.outputType = chosenType;
      } else {
        opts.customLabel = customLabel.trim();
        opts.customCategory = customCategory.trim();
      }
      await onSubmit(opts);
    } catch (e) {
      setError(e.message || (lang === 'tr' ? 'Bir hata oluştu' : 'Something went wrong'));
      setSubmitting(false);
    }
  }

  return (
    <Modal title={t('actionAddOutput', lang)} onClose={onClose} size="lg">
      {/* Mode toggle */}
      <div className="mb-4 inline-flex rounded-md border border-slate-200 overflow-hidden">
        <button
          type="button"
          onClick={() => setMode('library')}
          className={`px-3 py-1.5 text-xs font-semibold ${mode === 'library' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'}`}
        >
          {lang === 'tr' ? 'Kütüphaneden' : 'From library'}
        </button>
        <button
          type="button"
          onClick={() => setMode('custom')}
          className={`px-3 py-1.5 text-xs font-semibold ${mode === 'custom' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'}`}
        >
          {lang === 'tr' ? 'Özel' : 'Custom'}
        </button>
      </div>

      {/* Type selection */}
      {mode === 'library' ? (
        <div className="mb-4 max-h-72 overflow-y-auto rounded-md border border-slate-200 p-2 bg-slate-50">
          {loadingDefs && <div className="p-3 text-xs text-slate-500">{t('loading', lang)}</div>}
          {defsError && <div className="p-3 text-xs text-rose-700">{defsError}</div>}
          {!loadingDefs && !defsError && Object.entries(grouped).map(([cat, list]) => (
            <div key={cat} className="mb-3 last:mb-0">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 px-2 mb-1">
                {cat}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {list.map((d) => {
                  const picked = chosenType === d.id;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => pickLibraryType(d)}
                      className={`text-left rounded-md border px-2.5 py-2 text-xs transition ${
                        picked
                          ? 'border-emerald-400 bg-emerald-50 text-emerald-900'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                      title={pickDescription(d, lang)}
                    >
                      <div className="font-medium">{pickLabel(d, lang)}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">
                        {pickDescription(d, lang)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-4 grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {lang === 'tr' ? 'Özel etiket' : 'Custom label'} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
              placeholder={lang === 'tr' ? 'Çıktı adı' : 'Output name'}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {lang === 'tr' ? 'Kategori' : 'Category'} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
              placeholder={lang === 'tr' ? 'örn. yayın, varyete' : 'e.g. publication, variety'}
            />
          </div>
        </div>
      )}

      {/* Common fields */}
      <div className="mb-3">
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          {lang === 'tr' ? 'Başlık' : 'Title'} <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
          placeholder={lang === 'tr' ? 'Çıktının başlığı' : 'Title of this output'}
        />
      </div>

      <div className="mb-3">
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          {lang === 'tr' ? 'Açıklama' : 'Description'}
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm resize-y"
          placeholder={lang === 'tr' ? 'Kısa açıklama' : 'Short description'}
        />
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Pathway</label>
          <select
            value={pathwayId}
            onChange={(e) => setPathwayId(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm bg-white"
          >
            <option value="">{lang === 'tr' ? '(seçilmedi)' : '(none)'}</option>
            {pathways.map((p) => (
              <option key={p.id ?? p.pathway_id} value={p.id ?? p.pathway_id}>
                {pickLabel(p, lang) || p.label || p.pathway_id}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {lang === 'tr' ? 'Görünürlük' : 'Visibility'}
          </label>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm bg-white"
          >
            {VISIBILITY.map((v) => (
              <option key={v.v} value={v.v}>
                {v[`label_${lang}`] || v.label_en}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-3">
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          {t('evidenceLink', lang)}
        </label>
        <input
          type="url"
          value={evidenceLink}
          onChange={(e) => setEvidenceLink(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
          placeholder="https://…"
        />
      </div>

      <div className="mb-3">
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          {t('evidenceNotes', lang)}
        </label>
        <textarea
          value={evidenceNotes}
          onChange={(e) => setEvidenceNotes(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm resize-y"
        />
      </div>

      {error && (
        <div className="mb-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
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
          disabled={!canSubmit || submitting}
          className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
            !canSubmit || submitting
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-emerald-600 text-white hover:bg-emerald-700'
          }`}
        >
          {submitting ? t('loading', lang) : t('actionSave', lang)}
        </button>
      </div>
    </Modal>
  );
}
