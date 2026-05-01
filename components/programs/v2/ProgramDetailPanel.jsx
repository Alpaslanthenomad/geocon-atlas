// ProgramDetailPanel.jsx
//
// GEOCON · Program Detay Paneli v2 (1 May 2026)
//
// Yeni sıfırdan yazma — eski 1100+ satır panel yerine her tab kendi component'i.
// Çift çark mimarisi: Foundation tab ayrı, Field & Lab tab ayrı.
//
// Props:
//   - program       : { id, title?, ... }   — required
//   - lang          : 'tr' | 'en'           — default 'tr'
//   - onClose       : () => void            — optional, shows X button when provided
//   - initialTab    : tab key               — default 'foundation'
//
// Usage:
//   <ProgramDetailPanel program={selectedProgram} lang="tr" onClose={handleClose} />

import { useState } from 'react';
import { t } from './lib/i18n';
import FoundationTab    from './tabs/FoundationTab';
import FieldLabTab      from './tabs/FieldLabTab';
import PathwaysTab      from './tabs/PathwaysTab';
import ContributorsTab  from './tabs/ContributorsTab';
import OutputsTab       from './tabs/OutputsTab';

const TABS = [
  { key: 'foundation',   labelKey: 'tabFoundation',   Component: FoundationTab },
  { key: 'field_lab',    labelKey: 'tabFieldLab',     Component: FieldLabTab },
  { key: 'pathways',     labelKey: 'tabPathways',     Component: PathwaysTab },
  { key: 'contributors', labelKey: 'tabContributors', Component: ContributorsTab },
  { key: 'outputs',      labelKey: 'tabOutputs',      Component: OutputsTab },
];

export default function ProgramDetailPanel({
  program,
  lang = 'tr',
  onClose,
  initialTab = 'foundation',
}) {
  const [activeTab, setActiveTab] = useState(initialTab);

  if (!program?.id) {
    return (
      <div className="p-6 text-sm text-slate-500">
        {lang === 'tr' ? 'Program bulunamadı.' : 'Program not found.'}
      </div>
    );
  }

  const Active = TABS.find((tb) => tb.key === activeTab)?.Component ?? FoundationTab;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <header className="border-b border-slate-200 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-slate-900 truncate">
              {program.title ?? program.name ?? `Program ${program.id?.slice(0, 8)}`}
            </h2>
            {program.species_name && (
              <p className="text-sm text-slate-500 italic mt-0.5">{program.species_name}</p>
            )}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 shrink-0"
              aria-label="Close"
              title={t('actionClose', lang)}
            >
              ✕
            </button>
          )}
        </div>

        {/* Tab strip */}
        <nav className="mt-4 flex gap-1 -mb-4 overflow-x-auto" role="tablist">
          {TABS.map((tb) => {
            const isActive = tb.key === activeTab;
            return (
              <button
                key={tb.key}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tb.key)}
                className={`shrink-0 px-3 py-2 text-sm font-medium border-b-2 transition ${
                  isActive
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {t(tb.labelKey, lang)}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Tab content */}
      <main className="flex-1 overflow-y-auto px-5 py-5">
        <Active programId={program.id} lang={lang} />
      </main>
    </div>
  );
}
