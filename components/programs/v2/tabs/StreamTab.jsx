"use client";
// tabs/StreamTab.jsx
//
// Unified activity stream for a program. Renders comments interleaved with
// every audit event newest-first. Threaded replies, inline edit/delete on own
// comments, reply composer per thread.

import { useEffect, useMemo, useState } from 'react';
import { useProgramStream } from '../hooks/useProgramStream';
import { supabase } from '../lib/supabaseClient';

const TIC_CHANGE_TYPE_LABEL = {
  tr: { completed: 'tamamladı', waived: 'waive etti', revisited: 'yeniden açtı', assigned: 'atadı', created: 'oluşturdu' },
  en: { completed: 'completed',  waived: 'waived',     revisited: 'reopened',     assigned: 'assigned', created: 'created' },
};

export default function StreamTab({ programId, lang = 'tr' }) {
  const { events, loading, error, postComment, refetch } = useProgramStream(programId);
  const [me, setMe] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) { setMe(null); return; }
      const { data: prof } = await supabase
        .from('profiles').select('id, full_name, researcher_id').eq('id', user.id).maybeSingle();
      let r = null;
      if (prof?.researcher_id) {
        const { data: rsr } = await supabase
          .from('researchers').select('id, name').eq('id', prof.researcher_id).maybeSingle();
        r = rsr;
      }
      if (!cancelled) setMe({ user, profile: prof, researcher: r });
    })();
    return () => { cancelled = true; };
  }, []);

  // Build thread structure: separate top-level entries from replies-to-comments
  const { topLevel, repliesByParent } = useMemo(() => {
    const repliesByParent = new Map();
    const topLevel = [];
    for (const e of events) {
      if (e.kind === 'comment' && e.payload.parent_id) {
        const arr = repliesByParent.get(e.payload.parent_id) || [];
        arr.push(e);
        repliesByParent.set(e.payload.parent_id, arr);
      } else {
        topLevel.push(e);
      }
    }
    // Replies oldest → newest under their parent
    for (const arr of repliesByParent.values()) arr.reverse();
    return { topLevel, repliesByParent };
  }, [events]);

  const myUserId = me?.user?.id;

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

      {topLevel.length === 0 ? (
        <Empty lang={lang} />
      ) : (
        <div className="space-y-2">
          {topLevel.map((e) => (
            <StreamItem
              key={`${e.kind}-${e.id}`}
              event={e}
              replies={e.kind === 'comment' ? (repliesByParent.get(e.id) || []) : []}
              myUserId={myUserId}
              onReply={me?.user ? (body) => postComment(body, { parentId: e.id }) : null}
              onChange={refetch}
              lang={lang}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

function Composer({ displayName, onPost, lang, autoFocus = false, placeholder, onCancel }) {
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  async function submit() {
    if (!body.trim()) return;
    setBusy(true); setErr(null);
    try {
      await onPost(body.trim());
      setBody('');
      if (onCancel) onCancel();
    } catch (e) {
      setErr(e.message || 'Failed to post');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {displayName && (
        <div className="flex items-center gap-2 mb-2">
          <Avatar name={displayName} />
          <span className="text-xs font-medium text-slate-700">{displayName}</span>
        </div>
      )}
      <textarea
        value={body}
        autoFocus={autoFocus}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder={placeholder || (lang === 'tr'
          ? 'Programa yorum bırak, soru sor veya ekip arkadaşını @bahset…'
          : 'Comment, ask a question, or @mention a teammate…')}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm resize-y focus:outline-none focus:border-emerald-500"
      />
      {err && (
        <div className="mt-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">{err}</div>
      )}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[10px] text-slate-400">{body.length}/5000</span>
        <div className="flex gap-2">
          {onCancel && (
            <button onClick={onCancel} type="button" className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
              {lang === 'tr' ? 'İptal' : 'Cancel'}
            </button>
          )}
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
    </div>
  );
}

function SignedOutPrompt({ lang }) {
  return (
    <div className="text-center py-4">
      <div className="text-xs text-slate-500 mb-2">
        {lang === 'tr' ? 'Konuşmaya katılmak için BEE üzerinden giriş yap.' : 'Sign in via BEE to join the conversation.'}
      </div>
      <a href="/" className="inline-block rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5">
        {lang === 'tr' ? 'BEE → Giriş' : 'BEE → Sign in'}
      </a>
    </div>
  );
}

function StreamItem({ event, replies, myUserId, onReply, onChange, lang }) {
  const { kind } = event;
  if (kind === 'comment') {
    return (
      <CommentItem
        event={event}
        replies={replies}
        myUserId={myUserId}
        onReply={onReply}
        onChange={onChange}
        lang={lang}
      />
    );
  }
  return <SystemEventItem kind={kind} at={event.at} payload={event.payload} lang={lang} />;
}

function CommentItem({ event, replies, myUserId, onReply, onChange, lang, indent = false }) {
  const { at, payload, id } = event;
  const isMine = myUserId && payload.author_user_id === myUserId;
  const [editing, setEditing] = useState(false);
  const [replying, setReplying] = useState(false);
  const [showReplies, setShowReplies] = useState(true);

  const replyCount = (replies || []).length;

  return (
    <div className={indent ? 'pl-9 border-l-2 border-slate-100' : ''}>
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

          {editing ? (
            <EditForm
              initialBody={payload.body}
              id={id}
              onDone={() => { setEditing(false); onChange?.(); }}
              onCancel={() => setEditing(false)}
              lang={lang}
            />
          ) : (
            <>
              <div className="mt-1 text-sm text-slate-800 whitespace-pre-wrap">{payload.body}</div>
              {payload.edited && (
                <div className="mt-1 text-[10px] text-slate-400 italic">{lang === 'tr' ? 'düzenlendi' : 'edited'}</div>
              )}
              <div className="mt-2 flex gap-3 text-[11px]">
                {onReply && !indent && (
                  <button onClick={() => setReplying((r) => !r)} className="text-slate-500 hover:text-emerald-700">
                    {lang === 'tr' ? 'Yanıtla' : 'Reply'}
                  </button>
                )}
                {isMine && (
                  <>
                    <button onClick={() => setEditing(true)} className="text-slate-500 hover:text-sky-700">
                      {lang === 'tr' ? 'Düzenle' : 'Edit'}
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm(lang === 'tr' ? 'Bu yorumu silmek istediğinden emin misin?' : 'Delete this comment?')) return;
                        const { error } = await supabase
                          .from('program_comments')
                          .update({ deleted: true, updated_at: new Date().toISOString() })
                          .eq('id', id);
                        if (!error) onChange?.();
                      }}
                      className="text-slate-500 hover:text-rose-700"
                    >
                      {lang === 'tr' ? 'Sil' : 'Delete'}
                    </button>
                  </>
                )}
                {replyCount > 0 && (
                  <button onClick={() => setShowReplies((s) => !s)} className="text-slate-500 hover:text-emerald-700 ml-auto">
                    {showReplies
                      ? (lang === 'tr' ? `${replyCount} yanıtı gizle` : `Hide ${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}`)
                      : (lang === 'tr' ? `${replyCount} yanıtı göster` : `Show ${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}`)}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {replying && (
        <div className="mt-2 pl-9">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <Composer
              onPost={async (body) => { await onReply(body); setReplying(false); }}
              onCancel={() => setReplying(false)}
              autoFocus
              placeholder={lang === 'tr'
                ? `${payload.author_name || ''} adlı kullanıcıya yanıt yaz…`
                : `Reply to ${payload.author_name || 'comment'}…`}
              lang={lang}
            />
          </div>
        </div>
      )}

      {showReplies && replies && replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {replies.map((r) => (
            <CommentItem
              key={r.id}
              event={r}
              replies={[]}
              myUserId={myUserId}
              onReply={null}
              onChange={onChange}
              lang={lang}
              indent
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EditForm({ initialBody, id, onDone, onCancel, lang }) {
  const [body, setBody] = useState(initialBody);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  async function save() {
    if (!body.trim()) return;
    setBusy(true); setErr(null);
    const { error } = await supabase
      .from('program_comments')
      .update({ body: body.trim(), edited: true, updated_at: new Date().toISOString() })
      .eq('id', id);
    setBusy(false);
    if (error) { setErr(error.message); return; }
    onDone();
  }

  return (
    <div className="mt-1">
      <textarea
        value={body}
        autoFocus
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm resize-y focus:outline-none focus:border-sky-500"
      />
      {err && <div className="mt-1 text-xs text-rose-700">{err}</div>}
      <div className="mt-2 flex justify-end gap-2">
        <button onClick={onCancel} type="button" className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
          {lang === 'tr' ? 'İptal' : 'Cancel'}
        </button>
        <button
          onClick={save}
          disabled={busy || !body.trim() || body.trim() === initialBody.trim()}
          className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
            busy || !body.trim() || body.trim() === initialBody.trim()
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-sky-600 text-white hover:bg-sky-700'
          }`}
        >
          {busy ? '…' : (lang === 'tr' ? 'Kaydet' : 'Save')}
        </button>
      </div>
    </div>
  );
}

function SystemEventItem({ kind, at, payload, lang }) {
  const { line, icon, tint } = describeSystemEvent(kind, payload, lang);
  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm" style={{ background: tint + '22', color: tint }}>
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
  const verbDict = TIC_CHANGE_TYPE_LABEL[lang === 'tr' ? 'tr' : 'en'];

  if (kind === 'tic') {
    const verb = verbDict[p.change_type] || p.change_type;
    return {
      icon: p.change_type === 'completed' ? '✓' : p.change_type === 'waived' ? '⊘' : p.change_type === 'revisited' ? '↻' : p.change_type === 'assigned' ? '👤' : '•',
      tint: p.change_type === 'completed' ? '#0F6E56' : p.change_type === 'waived' ? '#BA7517' : '#185FA5',
      line: <><strong>{who}</strong> {verb}: <em className="text-slate-900">{ticName}</em>{p.reason ? <span className="text-slate-500"> — {p.reason}</span> : null}</>,
    };
  }
  if (kind === 'output') {
    return { icon: '📦', tint: '#D85A30',
      line: <><strong>{who}</strong> {lang === 'tr' ? 'çıktı ekledi' : 'added an output'}{p.reason ? <span className="text-slate-500"> — {p.reason}</span> : null}</> };
  }
  if (kind === 'member') {
    return { icon: '👥', tint: '#534AB7',
      line: <><strong>{who}</strong> {lang === 'tr' ? `üye ${p.change_type === 'created' ? 'davet etti' : 'güncelledi'}` : `${p.change_type} a member`}</> };
  }
  if (kind === 'pathway') {
    return { icon: '🛤', tint: '#185FA5',
      line: <><strong>{who}</strong> {lang === 'tr' ? `pathway ${p.change_type === 'created' ? 'beyan etti' : p.change_type}` : `${p.change_type} a pathway`}</> };
  }
  return { icon: '•', tint: '#888780', line: <><strong>{who}</strong> · {kind} · {p.change_type}</> };
}

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
      {lang === 'tr' ? 'Henüz hiçbir aktivite veya yorum yok. İlk sözü sen söyle.' : 'No activity or comments yet. Start the conversation.'}
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
