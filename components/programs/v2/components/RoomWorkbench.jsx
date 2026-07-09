// components/RoomWorkbench.jsx
//
// Bounded secondary work shell for program rooms. Presentational only — each room
// passes its own copy and wires actions to EXISTING modals/RPCs.
// Room starts work · Studio validates work · TIC cards explain proof structure.

export default function RoomWorkbench({ lang = 'tr', question, today, deeper, children, advances }) {
  const T = (tr, en) => (lang === 'tr' ? tr : en);
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[10px] font-medium uppercase tracking-widest text-slate-500">
            {T('Sınırlı çalışma alanı', 'Bounded work area')}
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
            {T(
              'Bu alan yalnızca mevcut aşamada izin verilen destekleyici işlemleri gösterir. Resmi durum, engel ve ilerleme yorumu Program Durumu yüzeyi tarafından belirlenir.',
              'This area only shows supporting actions allowed in the current stage. Official status, blocker, and progression read are determined by the Program Situation surface.'
            )}
          </p>
        </div>
        {deeper || null}
      </div>

      {question && (
        <div className="mt-2 text-[13px] text-slate-600">
          <span className="font-medium text-slate-600">{T('Ana soru: ', 'Question: ')}</span>{question}
        </div>
      )}

      <div className="mt-2">
        <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{T('Aşama çalışma notu', 'Stage work note')}</div>
        <div className="text-[14px] font-medium leading-snug text-slate-800">{today}</div>
      </div>

      {children && (
        <div className="mt-3">
          {children}
          <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
            {T(
              'İşlem yapmak, kanıtın onaylandığı veya programın ilerlediği anlamına gelmez.',
              'Taking an action does not mean evidence is approved or the program has advanced.'
            )}
          </p>
        </div>
      )}

      {advances && <div className="mt-2 text-[12px] text-slate-500">{advances}</div>}
    </div>
  );
}
