// components/VisibilityBadge.jsx

import { getVisMeta } from '../lib/visibility';

export default function VisibilityBadge({ level, lang = 'tr', size = 'sm' }) {
  const meta = getVisMeta(level);
  const labelKey = lang === 'tr' ? 'labelTr' : 'labelEn';
  const sizeCls =
    size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' :
    size === 'md' ? 'px-2.5 py-1 text-sm' :
                    'px-2 py-0.5 text-xs';

  return (
    <span
      title={lang === 'tr' ? meta.descTr : meta.descEn}
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${meta.cls} ${sizeCls}`}
    >
      <span aria-hidden>{meta.icon}</span>
      <span>{meta[labelKey]}</span>
    </span>
  );
}
