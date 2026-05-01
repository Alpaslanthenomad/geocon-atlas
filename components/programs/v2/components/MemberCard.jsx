// components/MemberCard.jsx

import VisibilityBadge from './VisibilityBadge';

const ROLE_META = {
  owner:          { tr: 'Sahip',           en: 'Owner',         cls: 'bg-rose-100 text-rose-800 border-rose-300' },
  conservation:   { tr: 'Koruma',          en: 'Conservation',  cls: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  science:        { tr: 'Bilim',           en: 'Science',       cls: 'bg-sky-100 text-sky-800 border-sky-300' },
  pathway:        { tr: 'Pathway',         en: 'Pathway',       cls: 'bg-violet-100 text-violet-800 border-violet-300' },
  governance:     { tr: 'Yönetişim',       en: 'Governance',    cls: 'bg-slate-100 text-slate-700 border-slate-300' },
  support:        { tr: 'Destek',          en: 'Support',       cls: 'bg-stone-100 text-stone-700 border-stone-300' },
  observer:       { tr: 'Gözlemci',        en: 'Observer',      cls: 'bg-amber-100 text-amber-800 border-amber-300' },
};

export default function MemberCard({ member, lang = 'tr' }) {
  const role = member.role ?? 'support';
  const meta = ROLE_META[role] ?? ROLE_META.support;
  const name = member.display_name
    ?? member.researcher_name
    ?? member.external_name
    ?? member.user_email
    ?? member.researcher_id
    ?? '—';
  const affiliation = member.affiliation ?? member.external_org ?? null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 flex items-center gap-3">
      <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 text-slate-600 font-bold flex items-center justify-center">
        {name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-slate-900 truncate">{name}</span>
          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${meta.cls}`}>
            {meta[lang] ?? meta.en}
          </span>
          {member.visibility && (
            <VisibilityBadge level={member.visibility} lang={lang} size="xs" />
          )}
        </div>
        {affiliation && (
          <div className="text-xs text-slate-500 truncate mt-0.5">{affiliation}</div>
        )}
        {member.status && member.status !== 'accepted' && (
          <div className="text-[10px] uppercase tracking-wide font-semibold text-amber-700 mt-0.5">
            {member.status}
          </div>
        )}
      </div>
    </div>
  );
}
