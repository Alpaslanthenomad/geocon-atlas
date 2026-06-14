// components/RoomWorkbench.jsx
//
// The shared "Workbench" shell for every program room. Presentational only — each
// room passes its own biological copy and wires its primary action to an EXISTING
// modal/RPC. Product principle (locked):
//   Room starts work · Studio validates work · TIC cards explain proof structure.
// The Workbench is the PRIORITIZED ENTRY (the next thing to do, surfaced at the top),
// not a replacement for the TIC cards below it.

export default function RoomWorkbench({ lang = 'tr', question, today, deeper, children, advances }) {
  const T = (tr, en) => (lang === 'tr' ? tr : en);
  return (
    <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/30 p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">
          {T('Çalışma masası', 'Workbench')}
        </div>
        {deeper || null}
      </div>

      {question && (
        <div className="mt-1.5 text-[13px] text-slate-600">
          <span className="font-medium text-slate-700">{T('Ana soru: ', 'Question: ')}</span>{question}
        </div>
      )}

      <div className="mt-2">
        <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{T('Bugünkü iş', 'Today')}</div>
        <div className="text-[15px] font-semibold leading-snug text-slate-900">{today}</div>
      </div>

      {children && <div className="mt-3">{children}</div>}

      {advances && <div className="mt-3 text-[12px] text-slate-500">{advances}</div>}
    </div>
  );
}
