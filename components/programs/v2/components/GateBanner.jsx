// components/GateBanner.jsx
//
// Displays a single gate's status (foundation or field_lab).
// Pass the gate object from the RPC: { passed, required_count, satisfied_count, missing_tics, cons_complete, sci_complete }

import { t } from '../lib/i18n';

export default function GateBanner({ gate, kind = 'foundation', lang = 'tr' }) {
  if (!gate) return null;

  const passed   = gate.passed ?? false;
  const total    = gate.required_count ?? 0;
  const done     = gate.satisfied_count ?? 0;
  const missing  = gate.missing_tics ?? [];
  const titleKey = kind === 'foundation' ? 'foundationGate' : 'fieldLabGate';
  const title    = t(titleKey, lang);

  const bg     = passed ? 'bg-emerald-50'   : 'bg-amber-50';
  const border = passed ? 'border-emerald-200' : 'border-amber-200';
  const icon   = passed ? '✓' : '◔';
  const iconBg = passed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700';
  const pct    = total > 0 ? Math.round((done / total) * 100) : 0;
  const barCls = passed ? 'bg-emerald-500' : 'bg-amber-500';

  return (
    <div className={`rounded-xl border ${border} ${bg} p-4`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-full text-lg font-bold ${iconBg}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <h3 className="font-semibold text-slate-900">{title}</h3>
            <span className="text-sm text-slate-600">
              {done} / {total} {t('gateProgress', lang)}
            </span>
          </div>

          <div className="mt-2 h-1.5 w-full rounded-full bg-white/60 overflow-hidden">
            <div className={`h-full ${barCls} transition-all`} style={{ width: `${pct}%` }} />
          </div>

          <p className="mt-2 text-sm text-slate-700">
            {passed ? t('gatePassed', lang) : t('gateNotPassed', lang)}
            {!passed && missing.length > 0 && (
              <>
                {' · '}
                <span className="text-slate-500">
                  {lang === 'tr' ? 'eksik:' : 'missing:'} {missing.join(', ')}
                </span>
              </>
            )}
          </p>

          {/* Per-wheel breakdown */}
          {(gate.cons_complete !== undefined || gate.sci_complete !== undefined) && (
            <div className="mt-2 flex gap-2 flex-wrap text-xs">
              {gate.cons_complete !== undefined && (
                <WheelChip done={gate.cons_complete} label={t('wheelConservation', lang)} />
              )}
              {gate.sci_complete !== undefined && (
                <WheelChip done={gate.sci_complete} label={t('wheelScience', lang)} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WheelChip({ done, label }) {
  const cls = done
    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
    : 'bg-slate-100 text-slate-700 border-slate-300';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${cls}`}>
      <span aria-hidden>{done ? '●' : '○'}</span>
      {label}
    </span>
  );
}
