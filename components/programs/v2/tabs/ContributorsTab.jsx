"use client";
// tabs/ContributorsTab.jsx
//
// Lists members grouped by role; owner sees "+ Invite" to add new members.

import { useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import { useProgramMembers } from '../hooks/useProgramMembers';
import MemberCard from '../components/MemberCard';
import InviteMemberModal from '../../modals/InviteMemberModal';

export default function ContributorsTab({ programId, lang = 'tr' }) {
  const { loading, error, members, isOwner, refetch } = useProgramMembers(programId);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [busyId, setBusyId] = useState(null);

  // Pending join requests (owner reviews these) — kept out of the member groups.
  const pending = (members ?? []).filter((m) => m.status === 'requested');

  async function respondRequest(memberId, decision) {
    setBusyId(memberId);
    await supabase.rpc('respond_to_join_request', { p_program_id: programId, p_member_id: memberId, p_decision: decision }).catch(() => {});
    setBusyId(null);
    refetch();
  }

  // Group active members by role for clearer reading (requests excluded).
  const ROLE_ORDER = ['owner', 'conservation', 'science', 'pathway', 'governance', 'support', 'observer'];
  const grouped = ROLE_ORDER.map((role) => ({
    role,
    items: (members ?? []).filter((m) => m.role === role && m.status !== 'requested'),
  })).filter((g) => g.items.length > 0);

  // Anything left over (unknown roles)
  const known = new Set(ROLE_ORDER);
  const others = (members ?? []).filter((m) => !known.has(m.role) && m.status !== 'requested');
  if (others.length > 0) grouped.push({ role: 'other', items: others });

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-slate-600">
          {lang === 'tr'
            ? 'Programa kayıtlı tüm bireyler. Kurumlar Network\'e dahil değildir; bireyleri üzerinden katılırlar.'
            : 'All individuals registered to this program. Institutions are not part of the Network — they participate through their individuals.'}
        </p>
        {isOwner && (
          <button
            onClick={() => setInviteOpen(true)}
            className="shrink-0 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5"
          >
            {lang === 'tr' ? '+ Davet et' : '+ Invite'}
          </button>
        )}
      </div>

      {loading && <Skeleton />}
      {error && <ErrorBox error={error} lang={lang} />}

      {isOwner && pending.length > 0 && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-3">
          <h3 className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-2">
            {lang === 'tr' ? 'Katılma istekleri' : 'Join requests'}
            <span className="ml-2 font-normal">{pending.length}</span>
          </h3>
          <div className="space-y-2">
            {pending.map((m) => (
              <div key={m.member_id} className="flex items-start justify-between gap-3 rounded-lg bg-white border border-amber-100 px-3 py-2">
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-slate-800">{m.display_name}</div>
                  {m.invitation_message && <div className="text-[12px] text-slate-500 mt-0.5">{m.invitation_message}</div>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => respondRequest(m.member_id, 'approve')} disabled={busyId === m.member_id}
                    className="rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold px-2.5 py-1 disabled:opacity-60">
                    {lang === 'tr' ? 'Onayla' : 'Approve'}
                  </button>
                  <button onClick={() => respondRequest(m.member_id, 'decline')} disabled={busyId === m.member_id}
                    className="rounded-md border border-slate-200 text-slate-500 text-[11px] font-semibold px-2.5 py-1 disabled:opacity-60">
                    {lang === 'tr' ? 'Reddet' : 'Decline'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {!loading && !error && grouped.length === 0 && pending.length === 0 && (
        <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
          {lang === 'tr' ? 'Henüz üye yok.' : 'No members yet.'}
        </div>
      )}

      {!loading && !error && grouped.map((g) => (
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

      {inviteOpen && (
        <InviteMemberModal
          programId={programId}
          onClose={() => setInviteOpen(false)}
          onInvited={() => {
            setInviteOpen(false);
            refetch();
          }}
        />
      )}
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
