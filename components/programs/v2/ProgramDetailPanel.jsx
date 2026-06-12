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

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { t } from './lib/i18n';
import ProgramCockpit   from './ProgramCockpit';
import HeroPanel        from './HeroPanel';
import VennHero         from './VennHero';
import FoundationTab    from './tabs/FoundationTab';
import FieldLabTab      from './tabs/FieldLabTab';
import PropagationTab   from './tabs/PropagationTab';
import PathwaysTab      from './tabs/PathwaysTab';
import SpeciesTab       from './tabs/SpeciesTab';
import ContributorsTab  from './tabs/ContributorsTab';
import OutputsTab       from './tabs/OutputsTab';
import StreamTab        from './tabs/StreamTab';

const TABS = [
  { key: 'foundation',   labelKey: 'tabFoundation',   Component: FoundationTab },
  { key: 'field_lab',    labelKey: 'tabFieldLab',     Component: FieldLabTab },
  { key: 'propagation',  labelKey: 'tabPropagation',  Component: PropagationTab },
  { key: 'pathways',     labelKey: 'tabPathways',     Component: PathwaysTab },
  { key: 'species',      labelKey: 'tabSpecies',      Component: SpeciesTab },
  { key: 'contributors', labelKey: 'tabContributors', Component: ContributorsTab },
  { key: 'outputs',      labelKey: 'tabOutputs',      Component: OutputsTab },
  { key: 'stream',       labelKey: 'tabStream',       Component: StreamTab },
];

// The four stage Rooms are the program's spine (the execution line). The rest are
// supporting context — collapsed into a secondary "More" group so they don't read
// as peers of the rooms.
const PRIMARY_TAB_KEYS = ['foundation', 'field_lab', 'propagation', 'outputs'];

export default function ProgramDetailPanel({
  program,
  lang = 'tr',
  onClose,
  initialTab = 'foundation',
  tabFromUrl = false,        // true when the route pinned a tab via ?tab=
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isMember, setIsMember] = useState(false);   // owner or active member sees the interior (Stream)
  const [moreOpen, setMoreOpen] = useState(false);
  const [userPicked, setUserPicked] = useState(false);
  const moreRef = useRef(null);

  // A tab the user chose by hand — stops the auto-jump from overriding them.
  const pickTab = useCallback((key) => { setUserPicked(true); setActiveTab(key); setMoreOpen(false); }, []);

  // The cockpit reports the program's active room; open into it unless the URL
  // pinned a tab or the user already picked one.
  const onResolveActiveTab = useCallback((key) => {
    setActiveTab((cur) => (tabFromUrl || userPicked ? cur : key));
  }, [tabFromUrl, userPicked]);

  useEffect(() => {
    if (!program?.id) return;
    let on = true;
    supabase.rpc("fn_program_can_see_interior", { p_program_id: program.id })
      .then(({ data }) => { if (on) setIsMember(!!data); }).catch(() => {});
    return () => { on = false; };
  }, [program?.id]);

  // Close the "More" menu on an outside click.
  useEffect(() => {
    if (!moreOpen) return;
    const onDown = (e) => { if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [moreOpen]);

  if (!program?.id) {
    return (
      <div className="p-6 text-sm text-slate-500">
        {lang === 'tr' ? 'Program bulunamadı.' : 'Program not found.'}
      </div>
    );
  }

  // Stream is the internal activity feed (audit reasons, member changes) — members only.
  const visibleTabs = TABS.filter((tb) => tb.key !== 'stream' || isMember);
  const Active = visibleTabs.find((tb) => tb.key === activeTab)?.Component ?? FoundationTab;

  // The four stage rooms stay as primary tabs; everything else lives under "More".
  const primaryTabs     = visibleTabs.filter((tb) => PRIMARY_TAB_KEYS.includes(tb.key));
  const secondaryTabs   = visibleTabs.filter((tb) => !PRIMARY_TAB_KEYS.includes(tb.key));
  const activeSecondary = secondaryTabs.find((tb) => tb.key === activeTab);

  return (
    <div className="bg-white">
      {/* Compact program header */}
      <header className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold text-slate-900">
            {program.title ?? program.name ?? `Program ${program.id?.slice(0, 8)}`}
          </h2>
          {program.species_name && (
            <p className="mt-0.5 text-[13px] italic text-slate-500">{program.species_name}</p>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
            title={t('actionClose', lang)}
          >
            ✕
          </button>
        )}
      </header>

      {/* Compact cockpit strip — "where am I" (mission · stage · progress) */}
      <div className="px-5">
        <ProgramCockpit
          programId={program.id}
          lang={lang}
          compact
          onGoToTab={pickTab}
          showActivity={isMember}
          onResolveActiveTab={onResolveActiveTab}
        />
      </div>

      {/* Sticky primary room tabs — the program's main navigation (the spine) */}
      <nav
        className="sticky z-20 flex items-center gap-1 overflow-x-auto border-b border-slate-200 bg-white/95 px-5 backdrop-blur"
        style={{ top: 56 }}
        role="tablist"
      >
        {primaryTabs.map((tb) => {
          const isActive = tb.key === activeTab;
          return (
            <button
              key={tb.key}
              role="tab"
              aria-selected={isActive}
              onClick={() => pickTab(tb.key)}
              className={`shrink-0 px-3 py-2.5 text-sm font-medium border-b-2 transition ${
                isActive
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {t(tb.labelKey, lang)}
            </button>
          );
        })}

        {secondaryTabs.length > 0 && (
          <div className="relative shrink-0" ref={moreRef}>
            <button
              type="button"
              aria-haspopup="true"
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen((o) => !o)}
              className={`inline-flex items-center gap-1 px-3 py-2.5 text-sm font-medium border-b-2 transition ${
                activeSecondary
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {activeSecondary ? t(activeSecondary.labelKey, lang) : (lang === 'tr' ? 'Daha fazla' : 'More')}
              <span aria-hidden className="text-[10px] leading-none">▾</span>
            </button>
            {moreOpen && (
              <div className="absolute right-0 z-30 mt-1 min-w-[160px] overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                {secondaryTabs.map((tb) => {
                  const isActive = tb.key === activeTab;
                  return (
                    <button
                      key={tb.key}
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => pickTab(tb.key)}
                      className={`block w-full px-3 py-2 text-left text-sm transition ${
                        isActive ? 'bg-slate-50 font-semibold text-slate-900' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {t(tb.labelKey, lang)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Active room — the first real content (the program opens into this) */}
      <main className="px-5 py-5">
        <Active programId={program.id} lang={lang} />

        {/* Secondary intelligence — Venn progress + program context, collapsed by default */}
        <Collapsible
          className="mt-8"
          title={lang === 'tr' ? 'Program detayları — Venn ilerlemesi ve bağlam' : 'Program details — Venn progress & context'}
        >
          <div className="space-y-4 pt-3">
            <VennHero programId={program.id} lang={lang} />
            <HeroPanel programId={program.id} />
          </div>
        </Collapsible>
      </main>
    </div>
  );
}

function Collapsible({ title, children, className = '' }) {
  const [open, setOpen] = useState(false);
  return (
    <section className={`rounded-xl border border-slate-200 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        {title}
        <span aria-hidden className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && <div className="border-t border-slate-100 px-4 pb-4">{children}</div>}
    </section>
  );
}
