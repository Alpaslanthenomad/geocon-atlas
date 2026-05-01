// tabs/ContributorsTab.jsx
//
// Read-only listing for now. Member management UI will come in a later phase.

import { useProgramMembers } from '../hooks/useProgramMembers';
import MemberCard from '../components/MemberCard';

export default function ContributorsTab({ programId, lang = 'tr' }) {
  const { loading, error, members } = useProgramMembers(programId);

  if (loading) return <Skeleton />;
  if (error)   return <ErrorBox error={error} lang={lang} />;

  // Group by role for clearer reading.
  const ROLE_ORDER = ['owner', 'conservation', 'science', 'pathway', 'governance', 'support', 'observer'];
  const grouped = ROLE_ORDER.map((role) => ({
    role,
    items: (members ?? []).filter((m) => m.role === role),
  })).filter((g) => g.items.length > 0);

  // Anything left over (unknown roles)
  const known = new Set(ROLE_ORDER);
  const others = (members ?? []).filter((m) => !known.has(m.role));
  if (others.length > 0) grouped.push({ role: 'other', items: others });

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        {lang === 'tr'
          ? 'Programa kayıtlı tüm bireyler. Kurumlar Network\'e dahil değildir; bireyleri üzerinden katılırlar.'
          : 'All individuals registered to this program. Institutions are not part of the Network — they participate through their individuals.'}
      </p>

      {grouped.length === 0 && (
        <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
          {lang === 'tr' ? 'Henüz üye yok.' : 'No members yet.'}
        </div>
      )}

      {grouped.map((g) => (
        <section key={g.role}>
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">
            {g.role}
            <span className="ml-2 text-xs font-normal text-slate-500">{g.items.length}</span>
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {g.items.map((m, i) => (
              <MemberCard key={m.id ?? `${g.role}-${i}`} member={m} lang={lang} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <div className="h-16 rounded-xl bg-slate-100 animate-pulse" />
      <div className="h-16 rounded-xl bg-slate-100 animate-pulse" />
      <div className="h-16 rounded-xl bg-slate-100 animate-pulse" />
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
