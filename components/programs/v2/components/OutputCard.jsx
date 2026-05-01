// components/OutputCard.jsx

import VisibilityBadge from './VisibilityBadge';
import { pickLabel } from '../lib/i18n';

const CATEGORY_META = {
  conservation_action:   { tr: 'Koruma eylemi',   en: 'Conservation action',   cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  scientific_output:     { tr: 'Bilimsel çıktı',  en: 'Scientific output',     cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  pathway_output:        { tr: 'Pathway çıktısı', en: 'Pathway output',        cls: 'bg-violet-50 text-violet-700 border-violet-200' },
  ip_filing:             { tr: 'Fikri mülkiyet',  en: 'IP filing',             cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  community_engagement:  { tr: 'Topluluk',        en: 'Community',             cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  other:                 { tr: 'Diğer',           en: 'Other',                 cls: 'bg-slate-50 text-slate-700 border-slate-200' },
};

export default function OutputCard({ output, lang = 'tr' }) {
  const def = output.definition ?? null;
  const category = output.is_custom
    ? (output.custom_category ?? 'other')
    : (def?.category ?? output.category ?? 'other');
  const catMeta = CATEGORY_META[category] ?? CATEGORY_META.other;
  const typeLabel = output.is_custom
    ? output.custom_label
    : (def ? pickLabel(def, lang) : output.output_type);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${catMeta.cls}`}>
              {catMeta[lang] ?? catMeta.en}
            </span>
            {output.pathway_id && (
              <span className="text-[10px] font-mono text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
                {output.pathway_id}
              </span>
            )}
            {output.visibility && <VisibilityBadge level={output.visibility} lang={lang} size="xs" />}
          </div>
          <h4 className="mt-1.5 font-semibold text-slate-900">{output.title}</h4>
          {typeLabel && typeLabel !== output.title && (
            <div className="text-xs text-slate-500 mt-0.5">{typeLabel}</div>
          )}
          {output.description && (
            <p className="mt-1.5 text-sm text-slate-600 whitespace-pre-wrap">{output.description}</p>
          )}
          {output.evidence_link && (
            <div className="mt-2 truncate">
              <a
                href={output.evidence_link}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-sky-600 hover:underline"
              >
                {output.evidence_link}
              </a>
            </div>
          )}
        </div>
        <div className="text-xs text-slate-400 shrink-0">
          {output.recorded_at && new Date(output.recorded_at).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US')}
        </div>
      </div>
    </div>
  );
}
