// tabs/PathwaysTab.jsx
//
// Beyan edilmiş pathway'leri gösterir + library'den yeni pathway eklenir.

import { useState } from 'react';
import { t, pickLabel, pickDescription } from '../lib/i18n';
import { useProgramPathways } from '../hooks/useProgramPathways';
import PathwayCard from '../components/PathwayCard';
import Modal from '../components/Modal';

export default function PathwaysTab({ programId, lang = 'tr' }) {
  const { loading, error, declared, library, isOwner, declare, activate } =
    useProgramPathways(programId);
  const [pickerOpen, setPickerOpen] = useState(false);

  if (loading) return <Skeleton />;
  if (error)   return <ErrorBox error={error} lang={lang} />;

  // Pathways that are declared by the program, sorted by status urgency.
  const declaredItems = (declared ?? []).slice().sort((a, b) => {
    const order = { ready_to_activate: 0, active: 1, declared: 2, suggested: 3, realized: 4, abandoned: 5 };
    return (order[a.status] ?? 99) - (order[b.status] ?? 99);
  });

  // Filter library to those NOT yet declared.
  const declaredIds = new Set(declaredItems.filter((p) => !p.is_custom).map((p) => p.pathway_id));
  const availableLib = (library ?? []).filter((p) => !declaredIds.has(p.id));

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm text-slate-600">
          {lang === 'tr'
            ? 'Değer yolları programın hangi yönde ticarileşeceğini belirler. Foundation Gate açıldıktan sonra beyan edilebilir, Field & Lab Gate ile aktive edilir.'
            : 'Pathways set the program\'s commercialization direction. Declarable after Foundation Gate, activatable after Field & Lab Gate.'}
        </p>
        {isOwner && availableLib.length > 0 && (
          <button
            onClick={() => setPickerOpen(true)}
            className="rounded-md bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-3 py-1.5 shrink-0"
          >
            + {t('actionDeclare', lang)}
          </button>
        )}
      </div>

      {declaredItems.length === 0 ? (
        <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
          {lang === 'tr' ? 'Henüz pathway beyan edilmedi.' : 'No pathways declared yet.'}
        </div>
      ) : (
        <div className="space-y-2">
          {declaredItems.map((pw) => (
            <PathwayCard
              key={pw.id}
              pathway={pw}
              isOwner={isOwner}
              lang={lang}
              onActivate={activate}
            />
          ))}
        </div>
      )}

      {pickerOpen && (
        <PathwayPickerModal
          library={availableLib}
          lang={lang}
          onClose={() => setPickerOpen(false)}
          onPick={async (pathwayId) => {
            await declare({ pathwayId });
            setPickerOpen(false);
          }}
        />
      )}
    </div>
  );
}

function PathwayPickerModal({ library, onClose, onPick, lang }) {
  const [busy, setBusy] = useState(null);
  return (
    <Modal title={lang === 'tr' ? 'Pathway ekle' : 'Declare pathway'} onClose={onClose} size="lg">
      <div className="space-y-2 max-h-[60vh] overflow-y-auto">
        {library.length === 0 && (
          <div className="text-sm text-slate-500 py-4 text-center">
            {lang === 'tr' ? 'Eklenebilir pathway yok.' : 'No more pathways to declare.'}
          </div>
        )}
        {library.map((pw) => {
          const label = pickLabel(pw, lang);
          const desc  = pickDescription(pw, lang);
          return (
            <button
              key={pw.id}
              disabled={busy !== null}
              onClick={async () => {
                setBusy(pw.id);
                try { await onPick(pw.id); } finally { setBusy(null); }
              }}
              className="w-full text-left rounded-lg border border-slate-200 hover:border-sky-400 hover:bg-sky-50 px-3 py-2.5 transition disabled:opacity-50"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-slate-900">{label}</span>
                <span className="text-[10px] font-mono text-slate-400">{pw.id}</span>
                {pw.category && (
                  <span className="text-[10px] uppercase tracking-wide text-slate-500">
                    {pw.category}
                  </span>
                )}
              </div>
              {desc && <div className="text-xs text-slate-600 mt-0.5">{desc}</div>}
              {pw.required_tics && pw.required_tics.length > 0 && (
                <div className="mt-1.5 flex gap-1 flex-wrap">
                  {pw.required_tics.map((tid) => (
                    <span
                      key={tid}
                      className="text-[10px] font-mono rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-slate-600"
                    >
                      {tid}
                    </span>
                  ))}
                </div>
              )}
            </button>
          );
        })}
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
