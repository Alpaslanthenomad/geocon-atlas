// tabs/OutputsTab.jsx
//
// Programın çıktılarını gösterir + yeni çıktı eklenir.
// İlk çıktı tipi: cons.habitat_reinforcement (Conservation çarkından çıkıp output'a geçti).

import { useState } from 'react';
import { t } from '../lib/i18n';
import { useProgramOutputs } from '../hooks/useProgramOutputs';
import OutputCard from '../components/OutputCard';
import Modal from '../components/Modal';

export default function OutputsTab({ programId, lang = 'tr' }) {
  const { loading, error, outputs, isOwner, addOutput } = useProgramOutputs(programId);
  const [addOpen, setAddOpen] = useState(false);

  if (loading) return <Skeleton />;
  if (error)   return <ErrorBox error={error} lang={lang} />;

  // Group by category for visual organization
  const grouped = {};
  for (const o of outputs) {
    const cat = o.is_custom
      ? (o.custom_category ?? 'other')
      : (o.definition?.category ?? o.category ?? 'other');
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(o);
  }
  const categories = Object.keys(grouped);

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm text-slate-600">
          {lang === 'tr'
            ? 'Programın somut çıktıları: koruma eylemleri, bilimsel yayınlar, pathway sonuçları, IP başvuruları.'
            : 'Concrete program outputs: conservation actions, scientific publications, pathway results, IP filings.'}
        </p>
        {isOwner && (
          <button
            onClick={() => setAddOpen(true)}
            className="rounded-md bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-3 py-1.5 shrink-0"
          >
            + {t('actionAddOutput', lang)}
          </button>
        )}
      </div>

      {outputs.length === 0 ? (
        <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
          {lang === 'tr' ? 'Henüz çıktı yok.' : 'No outputs yet.'}
        </div>
      ) : (
        categories.map((cat) => (
          <section key={cat}>
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">
              {cat.replace('_', ' ')}
              <span className="ml-2 text-xs font-normal text-slate-500">{grouped[cat].length}</span>
            </h3>
            <div className="space-y-2">
              {grouped[cat].map((o) => (
                <OutputCard key={o.id} output={o} lang={lang} />
              ))}
            </div>
          </section>
        ))
      )}

      {addOpen && (
        <AddOutputModal
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

// ─────────────────────────────────────────────────────────────────────────────
// AddOutputModal — minimum-viable form. Full picker for output_definitions
// library can be added later; for now allows free text entry of output_type
// (must match a definition id or use is_custom path).
// ─────────────────────────────────────────────────────────────────────────────

function AddOutputModal({ onClose, onSubmit, lang }) {
  const [outputType,  setOutputType]  = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const [customCat,   setCustomCat]   = useState('other');
  const [isCustom,    setIsCustom]    = useState(false);
  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [pathwayId,   setPathwayId]   = useState('');
  const [evidenceLink,setEvidenceLink]= useState('');
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState(null);

  const submit = async () => {
    setErr(null);
    if (!title.trim()) {
      setErr(lang === 'tr' ? 'Başlık zorunlu' : 'Title is required');
      return;
    }
    if (!isCustom && !outputType.trim()) {
      setErr(lang === 'tr' ? 'Çıktı tipi seçin veya custom kullanın' : 'Pick a type or use custom');
      return;
    }
    if (isCustom && !customLabel.trim()) {
      setErr(lang === 'tr' ? 'Custom etiketi zorunlu' : 'Custom label required');
      return;
    }
    try {
      setBusy(true);
      await onSubmit({
        outputType:    isCustom ? null : outputType.trim(),
        customLabel:   isCustom ? customLabel.trim() : null,
        customCategory:isCustom ? customCat : null,
        title:         title.trim(),
        description:   description.trim() || null,
        pathwayId:     pathwayId.trim() || null,
        evidenceLink:  evidenceLink.trim() || null,
      });
    } catch (e) {
      setErr(e.message ?? 'Error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={t('actionAddOutput', lang)} onClose={onClose} size="lg">
      <div className="space-y-3">
        <div className="flex gap-2 text-sm">
          <button
            type="button"
            onClick={() => setIsCustom(false)}
            className={`flex-1 rounded-md border px-3 py-1.5 ${!isCustom
              ? 'border-sky-500 bg-sky-50 text-sky-700 font-medium'
              : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}
          >
            {lang === 'tr' ? 'Kütüphane' : 'Library'}
          </button>
          <button
            type="button"
            onClick={() => setIsCustom(true)}
            className={`flex-1 rounded-md border px-3 py-1.5 ${isCustom
              ? 'border-sky-500 bg-sky-50 text-sky-700 font-medium'
              : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}
          >
            Custom
          </button>
        </div>

        {!isCustom ? (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {lang === 'tr' ? 'Çıktı tipi (output_definition id)' : 'Output type (output_definition id)'}
            </label>
            <input
              value={outputType}
              onChange={(e) => setOutputType(e.target.value)}
              placeholder="conservation.habitat_reinforcement"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
            <p className="text-xs text-slate-500 mt-1">
              {lang === 'tr' ? '19 kütüphane çıktı tipinden biri' : 'One of the 19 library output types'}
            </p>
          </div>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {lang === 'tr' ? 'Custom etiket' : 'Custom label'}
              </label>
              <input
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {lang === 'tr' ? 'Kategori' : 'Category'}
              </label>
              <select
                value={customCat}
                onChange={(e) => setCustomCat(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              >
                <option value="conservation_action">conservation_action</option>
                <option value="scientific_output">scientific_output</option>
                <option value="pathway_output">pathway_output</option>
                <option value="ip_filing">ip_filing</option>
                <option value="community_engagement">community_engagement</option>
                <option value="other">other</option>
              </select>
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {lang === 'tr' ? 'Başlık' : 'Title'} <span className="text-rose-500">*</span>
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {lang === 'tr' ? 'Açıklama (opsiyonel)' : 'Description (optional)'}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {lang === 'tr' ? 'Pathway (opsiyonel)' : 'Pathway (optional)'}
            </label>
            <input
              value={pathwayId}
              onChange={(e) => setPathwayId(e.target.value)}
              placeholder="ornamental"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {lang === 'tr' ? 'Kanıt bağlantısı' : 'Evidence link'}
            </label>
            <input
              type="url"
              value={evidenceLink}
              onChange={(e) => setEvidenceLink(e.target.value)}
              placeholder="https://…"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
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
            disabled={busy}
            className="rounded-md bg-slate-900 hover:bg-slate-800 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {busy ? '…' : t('actionSave', lang)}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function Skeleton() {
  return (
    <div className="space-y-2">
      <div className="h-20 rounded-xl bg-slate-100 animate-pulse" />
      <div className="h-20 rounded-xl bg-slate-100 animate-pulse" />
    </div>
  );
}

function ErrorBox({ error, lang }) {
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
      <div className="font-medium">{lang === 'tr' ? 'Yükleme hatası' : 'Load error'}</div>
      <div className="mt-1 text-xs opacity-80">{error.message}</div>
    </div>
  );
}
