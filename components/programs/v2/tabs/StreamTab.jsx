"use client";
// tabs/StreamTab.jsx
//
// Unified activity stream for a program. Renders comments interleaved with
// every audit event (TIC changes, member changes, pathway declarations,
// output additions) newest-first, GitHub-PR-conversation style.
//
// Signed-in members can post a comment at the top; non-members see a quiet
// "sign in via BEE to join the conversation" prompt.

import { useState } from 'react';
import { pickLabel, t } from '../lib/i18n';
import { useProgramStream } from '../hooks/useProgramStream';
import { supabase } from '../lib/supabaseClient';
import { useEffect } from 'react';

const TIC_CHANGE_TYPE_LABEL = {
  tr: {
    completed: 'tamamladı',
    waived:    'waive etti',
    revisited: 'yeniden açtı',
    assigned:  'atadı',
    created:   'oluşturdu',
  },
  en: {
    completed: 'completed',
    waived:    'waived',
    revisited: 'reopened',
    assigned:  'assigned',
    created:   'created',
  },
};

export default function StreamTab({ programId, lang = 'tr' }) {
  const { events, loading, error, postComment } = useProgramStream(programId);
  const [me, setMe] = useState(null);
  const [meLoading, setMeLoading] = useState(true);

  // Resolve the current user's profile so the composer renders correctly.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) { setMe(null); setMeLoading(false); return; }
      const { data: prof } = await supabase
        .from('profiles')
        .select('id, full_name, researcher_id, role')
        .eq('id', user.id)
        .maybeSingle();
      let r = null;
      if (prof?.researcher_id) {
        const { data: rsr } = await supabase
          .from('researchers')
          .select('id, name')
          .eq('id', prof.researcher_id)
          .maybeSingle();
        r = rsr;
      }
      if (!cancelled) {
        setMe({ user, profile: prof, researcher: r });
        setMeLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <Skeleton />;
  if (error)   return <ErrorBox error={error} lang={lang} />;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        {me?.user ? (
          <Composer
            displayName={me.researcher?.name || me.profile?.full_name || me.user.email}
            onPost={(body) => postComment(body)}
            lang={lang}
          />
        ) : (
          <SignedOutPrompt lang={lang} />
        )}
      </div>

      {events.length === 0 ? (
        <Empty lang={lang} />
      ) : (
        <div className="space-y-2">
          {events.map((e) => <StreamItem key={`${e.kind}-${e.id}`} event={e} lang={lang} />)}
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

function Composer({ displayName, onPost, lang }) {
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  async function submit() {
    if (!body.trim()) return;
    setBusy(true); setErr(null);
    try {
      await onPost(body.trim());
      setBody('');
    } catch (e) {
      setErr(e.message || 'Failed to post');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Avatar name={displayName} />
        <span className="text-xs font-medium text-slate-700">{displayName}</span>
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder={lang === 'tr'
          ? 'Programa yorum bırak, soru sor veya ekip arkadaşını @bahset…'
          : 'Comment, ask a question, or @mention a teammate…'}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm resize-y focus:outline-none focus:border-emerald-500"
      />
      {err && (
        <div className="mt-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
          {err}
        </div>
      )}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[10px] text-slate-400">
          {body.length}/5000
        </span>
        <button
          onClick={submit}
          disabled={busy || !body.trim()}
          className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
            busy || !body.trim()
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-emerald-600 text-white hover:bg-emerald-700'
          }`}
        >
          {busy ? '…' : (lang === 'tr' ? 'Gönder' : 'Post')}
        </button>
      </div>
    </div>
  );
}

function SignedOutPrompt({ lang }) {
  return (
    <div className="text-center py-4">
      <div className="text-xs text-slate-500 mb-2">
        {lang === 'tr'
          ? 'Konuşmaya katılmak için BEE üzerinden giriş yap.'
          : 'Sign in via BEE to join the conversation.'}
      </div>
      <a
        href="/"
        className="inline-block rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5"
      >
        {lang === 'tr' ? 'BEE → Giriş' : 'BEE → Sign in'}
      </a>
    </div>
  );
}

function StreamItem({ event, lang }) {
  const { kind, at, payload } = event;
  if (kind === 'comment') return <CommentItem at={at} payload={payload} lang={lang} />;
  return <SystemEventItem kind={kind} at={at} payload={payload} lang={lang} />;
}

function CommentItem({ at, payload, lang }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 flex gap-3">
      <Avatar name={payload.author_name} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="font-medium text-slate-900 text-sm">{payload.author_name || '—'}</span>
          {payload.attached_tic_id && (
            <span className="text-[10px] uppercase tracking-wide font-semibold text-sky-700 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded">
              {payload.tic_label_tr || payload.tic_label_en || payload.attached_tic_id}
            </span>
          )}
          <span className="text-[10px] text-slate-400 ml-auto">{formatAgo(at, lang)}</span>
        </div>
        <div className="mt-1 text-sm text-slate-800 whitespace-pre-wrap">{payload.body}</div>
        {payload.edited && (
          <div className="mt-1 text-[10px] text-slate-400 italic">
            {lang === 'tr' ? 'düzenlendi' : 'edited'}
          </div>
        )}
      </div>
    </div>
  );
}

function SystemEventItem({ kind, at, payload, lang }) {
  const { line, icon, tint } = describeSystemEvent(kind, payload, lang);
  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm"
        style={{ background: tint + '22', color: tint }}
      >
        {icon}
      </span>
      <div className="flex-1 min-w-0 text-sm text-slate-700">{line}</div>
      <div className="text-[10px] text-slate-400">{formatAgo(at, lang)}</div>
    </div>
  );
}

function describeSystemEvent(kind, p, lang) {
  const who = p.changed_by_name || (lang === 'tr' ? 'biri' : 'someone');
  const ticName = p.tic_label_tr || p.tic_label_en || p.tic_id;
  const t = TIC_CHANGE_TYPE_LABEL[lang === 'tr' ? 'tr' : 'en'];

  if (kind === 'tic') {
    const verb = t[p.change_type] || p.change_type;
    return {
      icon: p.change_type === 'completed' ? '✓' : p.change_type === 'waived' ? '⊘' : p.change_type === 'revisited' ? '↻' : p.change_type === 'assigned' ? '👤' : '•',
      tint: p.change_type === 'completed' ? '#0F6E56' : p.change_type === 'waived' ? '#BA7517' : '#185FA5',
      line: <><strong>{who}</strong> {verb}: <em className="text-slate-900">{ticName}</em>{p.reason ? <span className="text-slate-500"> — {p.reason}</span> : null}</>,
    };
  }
  if (kind === 'output') {
    return {
      icon: '📦',
      tint: '#D85A30',
      line: <><strong>{who}</strong> {lang === 'tr' ? 'çıktı ekledi' : 'added an output'}{p.reason ? <span className="text-slate-500"> — {p.reason}</span> : null}</>,
    };
  }
  if (kind === 'member') {
    return {
      icon: '👥',
      tint: '#534AB7',
      line: <><strong>{who}</strong> {lang === 'tr' ? `üye ${p.change_type === 'created' ? 'davet etti' : 'güncelledi'}` : `${p.change_type} a member`}</>,
    };
  }
  if (kind === 'pathway') {
    return {
      icon: '🛤',
      tint: '#185FA5',
      line: <><strong>{who}</strong> {lang === 'tr' ? `pathway ${p.change_type === 'created' ? 'beyan etti' : p.change_type}` : `${p.change_type} a pathway`}</>,
    };
  }
  return {
    icon: '•',
    tint: '#888780',
    line: <><strong>{who}</strong> · {kind} · {p.change_type}</>,
  };
}

/* ────────────────────────────────────────────────────────────────────────── */

function Avatar({ name }) {
  const initial = (name || '?').charAt(0).toUpperCase();
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-sky-100 text-emerald-700 font-bold text-sm">
      {initial}
    </div>
  );
}

function formatAgo(at, lang) {
  if (!at) return '';
  const d = new Date(at);
  const ms = Date.now() - d.getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return lang === 'tr' ? 'az önce' : 'just now';
  if (min < 60) return lang === 'tr' ? `${min} dk önce` : `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return lang === 'tr' ? `${hr} sa önce` : `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return lang === 'tr' ? `${day} gün önce` : `${day}d ago`;
  return d.toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

function Empty({ lang }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
      {lang === 'tr'
        ? 'Henüz hiçbir aktivite veya yorum yok. İlk sözü sen söyle.'
        : 'No activity or comments yet. Start the conversation.'}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-2">
      <div className="h-32 rounded-xl bg-slate-100 animate-pulse" />
      <div className="h-16 rounded-xl bg-slate-100 animate-pulse" />
      <div className="h-16 rounded-xl bg-slate-100 animate-pulse" />
    </div>
  );
}

function ErrorBox({ error, lang }) {
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
      <div className="font-medium">{lang === 'tr' ? 'Stream yüklenemedi' : 'Stream failed to load'}</div>
      <div className="mt-1 text-xs opacity-80">{error.message}</div>
    </div>
  );
}
