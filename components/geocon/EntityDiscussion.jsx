"use client";
// EntityDiscussion — a single, reusable threaded discussion that snaps
// to any (kind, key) pair: species/country/family/genus/org/researcher.
// Backed by entity_threads + entity_messages + post_entity_message.
//
// Lightweight @mention parser: matches '@Genus_species' or '@Org name'
// against an autocomplete list resolved at submit time.

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";

export default function EntityDiscussion({ kind, entityKey, title = "Discussion" }) {
  const { user, profile, researcher } = useAuthContext();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [err, setErr] = useState(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.rpc("list_entity_messages", {
      p_kind: kind, p_key: entityKey, p_limit: 200,
    });
    if (!error) setMessages(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    if (!kind || !entityKey) return;
    load();
    // poll for fresh messages every 25s — cheap, and avoids per-thread
    // realtime channel sprawl.
    const t = setInterval(load, 25000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, entityKey]);

  async function post() {
    if (!draft.trim()) return;
    setPosting(true); setErr(null);
    try {
      // detect @mentions for future notification trigger
      const mentions = parseMentions(draft);
      const authorName =
        researcher?.name || profile?.full_name || user?.email?.split("@")[0] || "Member";
      const { error } = await supabase.rpc("post_entity_message", {
        p_kind: kind,
        p_key: entityKey,
        p_body: draft.trim(),
        p_parent_id: null,
        p_author_name: authorName,
        p_mentions: mentions,
      });
      if (error) throw error;
      setDraft("");
      await load();
    } catch (e) {
      setErr(e?.message || "Could not post");
    } finally {
      setPosting(false);
    }
  }

  return (
    <section style={{
      marginTop: 18,
      padding: 16,
      background: "var(--gx-surface)",
      border: "1px solid var(--gx-border)",
      borderRadius: "var(--gx-radius-4)",
    }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
        <h2 style={{
          fontFamily: "var(--gx-font-serif)",
          fontSize: 18,
          fontWeight: 700,
          color: "var(--gx-ink)",
          margin: 0,
        }}>
          {title} {messages.length > 0 && (
            <span style={{ color: "var(--gx-ink-muted)", fontSize: 13, fontWeight: 400 }}>· {messages.length}</span>
          )}
        </h2>
      </div>

      {loading ? (
        <div className="gx-skeleton" style={{ height: 60 }} />
      ) : messages.length === 0 ? (
        <div style={{ fontSize: 12, color: "var(--gx-ink-muted)", fontStyle: "italic", padding: "8px 0" }}>
          No discussion yet — be the first to share notes or a question.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {messages.map((m) => <Message key={m.id} m={m} />)}
        </div>
      )}

      {user ? (
        <div style={{ marginTop: 12 }}>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Share an observation, question, or @mention a colleague…"
            rows={3}
            style={{
              width: "100%",
              padding: "10px 12px",
              fontSize: 13,
              background: "var(--gx-surface-2)",
              color: "var(--gx-ink)",
              border: "1px solid var(--gx-border-soft)",
              borderRadius: 10,
              outline: "none",
              resize: "vertical",
              fontFamily: "inherit",
              boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
            <div style={{ fontSize: 10, color: "var(--gx-ink-muted)" }}>
              Markdown-light · use <code>@name</code> to mention someone
            </div>
            <button
              onClick={post}
              disabled={posting || !draft.trim()}
              className="gx-btn"
              style={{
                padding: "7px 14px",
                fontSize: 12,
                fontWeight: 700,
                background: "var(--gx-accent-bio-green)",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: posting ? "default" : "pointer",
                opacity: posting || !draft.trim() ? 0.55 : 1,
              }}
            >
              {posting ? "Posting…" : "Post"}
            </button>
          </div>
          {err && (
            <div style={{ marginTop: 6, fontSize: 11, color: "var(--gx-accent-rose)" }}>{err}</div>
          )}
        </div>
      ) : (
        <div style={{ marginTop: 10, padding: 10, background: "var(--gx-surface-2)", border: "1px dashed var(--gx-border)", borderRadius: 8, fontSize: 11, color: "var(--gx-ink-muted)" }}>
          Sign in via BEE to post.
        </div>
      )}
    </section>
  );
}

function Message({ m }) {
  return (
    <div style={{
      padding: 12,
      background: "var(--gx-surface-2)",
      border: "1px solid var(--gx-border-soft)",
      borderRadius: "var(--gx-radius-3)",
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--gx-ink)" }}>
          {m.author_name || "Member"}
        </span>
        <span style={{ fontSize: 10, color: "var(--gx-ink-muted)" }}>
          {timeAgo(m.created_at)}
        </span>
      </div>
      <div style={{ fontSize: 13, color: "var(--gx-ink)", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
        {renderBody(m.body_md)}
      </div>
    </div>
  );
}

function renderBody(text) {
  // simple @mention highlighting; markdown left as plain text for safety.
  const parts = text.split(/(@[\w][\w\s.-]{1,40}\b)/g);
  return parts.map((p, i) => {
    if (p.startsWith("@")) {
      return <span key={i} style={{ color: "var(--gx-accent-violet)", fontWeight: 700 }}>{p}</span>;
    }
    return <span key={i}>{p}</span>;
  });
}

function parseMentions(text) {
  // returns [{ display: 'name' }]; resolution to actor ids is deferred.
  const seen = new Set();
  const out = [];
  const re = /@([\w][\w.-]{1,40})/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const display = m[1];
    if (seen.has(display)) continue;
    seen.add(display);
    out.push({ display });
  }
  return out;
}

function timeAgo(iso) {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  if (ms < 3_600_000) return `${Math.floor(ms/60000)}m`;
  if (ms < 86_400_000) return `${Math.floor(ms/3_600_000)}h`;
  const d = Math.floor(ms/86_400_000);
  if (d < 30) return `${d}d`;
  return new Date(iso).toLocaleDateString();
}
