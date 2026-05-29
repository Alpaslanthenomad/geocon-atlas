"use client";
// components/geocon/ProposalDiscussion.jsx
//
// Embedded discussion thread for a single proposal. Used inline on the
// proposal detail page. Mirrors the program StreamTab UX:
//   * Composer at the top (signed-in parties only)
//   * Threaded list — top-level comments with replies indented under them
//   * Edit / Delete on own comments
//   * "Reply" composer per top-level comment
//
// Authority decisions (who can post) are made server-side in
// post_proposal_comment; this UI just hides the composer for viewers
// who'd just hit an RPC error anyway.

import { useMemo, useState } from "react";
import { useProposalComments } from "./hooks/useProposalComments";

export function ProposalDiscussion({
  proposalId,
  canDiscuss,            // viewer is a party to the proposal
  myUserId,              // for owner-of-comment edit/delete affordances
  myActor,               // { kind, id, name } — recorded on the comment
  myDisplayName,
}) {
  const { comments, loading, error, postComment, editComment, deleteComment } = useProposalComments(proposalId);

  const { topLevel, repliesByParent } = useMemo(() => {
    const byParent = new Map();
    const tops = [];
    for (const c of comments) {
      if (c.parent_id) {
        const arr = byParent.get(c.parent_id) || [];
        arr.push(c);
        byParent.set(c.parent_id, arr);
      } else {
        tops.push(c);
      }
    }
    return { topLevel: tops, repliesByParent: byParent };
  }, [comments]);

  return (
    <section style={{ background: "#fff", border: "1px solid #ece9e2", borderRadius: 10, padding: 16, marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
        <h2 style={{ fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 700, color: "#2c2c2a", margin: 0 }}>
          Discussion
        </h2>
        <span style={{ fontSize: 11, color: "#888" }}>{comments.length}</span>
      </div>

      {canDiscuss ? (
        <div style={{ marginBottom: 14 }}>
          <Composer
            displayName={myDisplayName}
            actorLabel={myActor?.name}
            onPost={(body) => postComment(body, {
              asActorKind: myActor?.kind ?? null,
              asActorId:   myActor?.id ?? null,
            })}
          />
        </div>
      ) : (
        <div style={{ marginBottom: 14, padding: 10, background: "#fafaf7", border: "1px dashed #ece9e2", borderRadius: 8, fontSize: 11, color: "#888" }}>
          Only parties to this proposal can post in the discussion.
        </div>
      )}

      {error && (
        <div style={{ marginBottom: 10, padding: 10, background: "#fdecec", border: "1px solid #fcc", borderRadius: 6, fontSize: 11, color: "#A32D2D" }}>
          {error.message || String(error)}
        </div>
      )}

      {loading ? (
        <div style={{ padding: 20, textAlign: "center", color: "#888", fontSize: 12 }}>Loading…</div>
      ) : comments.length === 0 ? (
        <div style={{ padding: 24, textAlign: "center", color: "#888", fontSize: 12, border: "1px dashed #ece9e2", borderRadius: 8 }}>
          No discussion yet. The first message kicks off the negotiation.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {topLevel.map((c) => (
            <CommentBlock
              key={c.id}
              comment={c}
              replies={repliesByParent.get(c.id) || []}
              canReply={canDiscuss}
              myUserId={myUserId}
              myActor={myActor}
              onReply={(body) => postComment(body, {
                parentId:    c.id,
                asActorKind: myActor?.kind ?? null,
                asActorId:   myActor?.id ?? null,
              })}
              onEdit={editComment}
              onDelete={deleteComment}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function CommentBlock({ comment, replies, canReply, myUserId, myActor, onReply, onEdit, onDelete }) {
  const [replying, setReplying] = useState(false);
  const isMine = myUserId && comment.author_user_id === myUserId;
  const [editing, setEditing] = useState(false);

  return (
    <div>
      <CommentRow
        c={comment}
        isMine={isMine}
        editing={editing}
        onStartEdit={() => setEditing(true)}
        onCancelEdit={() => setEditing(false)}
        onSaveEdit={async (body) => { await onEdit(comment.id, body); setEditing(false); }}
        onDelete={async () => {
          if (!confirm("Delete this comment?")) return;
          await onDelete(comment.id);
        }}
        onReplyClick={canReply ? () => setReplying((r) => !r) : null}
      />

      {replying && (
        <div style={{ marginTop: 6, marginLeft: 28 }}>
          <Composer
            displayName={null}
            actorLabel={myActor?.name}
            placeholder={`Reply to ${comment.author_name || "comment"}…`}
            onCancel={() => setReplying(false)}
            onPost={async (body) => { await onReply(body); setReplying(false); }}
            autoFocus
          />
        </div>
      )}

      {replies.length > 0 && (
        <div style={{ marginTop: 8, marginLeft: 28, paddingLeft: 12, borderLeft: "2px solid #f0eee8", display: "flex", flexDirection: "column", gap: 8 }}>
          {replies.map((r) => (
            <CommentRow
              key={r.id}
              c={r}
              isMine={myUserId && r.author_user_id === myUserId}
              onDelete={async () => { if (confirm("Delete this reply?")) await onDelete(r.id); }}
              onStartEdit={() => {/* inline edit on replies omitted for v1 */}}
              compact
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CommentRow({ c, isMine, editing, onStartEdit, onCancelEdit, onSaveEdit, onDelete, onReplyClick, compact }) {
  const [editBody, setEditBody] = useState(c.body);
  if (editing) {
    return (
      <div style={{ background: "#fff", border: "1px solid #ece9e2", borderRadius: 8, padding: 10 }}>
        <textarea
          value={editBody}
          onChange={(e) => setEditBody(e.target.value)}
          rows={3}
          autoFocus
          style={{ width: "100%", padding: "8px 10px", fontSize: 12, border: "1px solid #e8e6e1", borderRadius: 6, resize: "vertical", fontFamily: "inherit" }}
        />
        <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end", gap: 6 }}>
          <button onClick={onCancelEdit} style={{ fontSize: 11, padding: "5px 10px", background: "none", border: "1px solid #e8e6e1", color: "#666", borderRadius: 6, cursor: "pointer" }}>Cancel</button>
          <button
            onClick={() => onSaveEdit(editBody.trim())}
            disabled={!editBody.trim() || editBody.trim() === c.body.trim()}
            style={{ fontSize: 11, padding: "5px 12px", background: "#0a4a3e", border: "none", color: "#fff", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: compact ? "#fafaf7" : "#fff", border: "1px solid #ece9e2", borderRadius: 8, padding: compact ? 10 : 12 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#2c2c2a" }}>{c.author_name || "—"}</span>
        {c.author_actor_kind && (
          <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 999, background: c.author_actor_kind === "organization" ? "#E6F1FB" : "#EEEDFE", color: c.author_actor_kind === "organization" ? "#185FA5" : "#534AB7", fontWeight: 600 }}>
            speaking for {c.author_actor_kind}
          </span>
        )}
        <span style={{ fontSize: 10, color: "#aaa" }}>{formatAgo(c.created_at)}</span>
        {c.edited && <span style={{ fontSize: 9, color: "#aaa", fontStyle: "italic" }}>edited</span>}
      </div>
      <div style={{ fontSize: 12, color: "#333", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{c.body}</div>
      <div style={{ marginTop: 6, display: "flex", gap: 10, fontSize: 10 }}>
        {onReplyClick && (
          <button onClick={onReplyClick} style={{ background: "none", border: "none", color: "#0a4a3e", padding: 0, cursor: "pointer", fontWeight: 600 }}>Reply</button>
        )}
        {isMine && onStartEdit && !compact && (
          <button onClick={onStartEdit} style={{ background: "none", border: "none", color: "#666", padding: 0, cursor: "pointer" }}>Edit</button>
        )}
        {isMine && onDelete && (
          <button onClick={onDelete} style={{ background: "none", border: "none", color: "#A32D2D", padding: 0, cursor: "pointer" }}>Delete</button>
        )}
      </div>
    </div>
  );
}

function Composer({ displayName, actorLabel, onPost, onCancel, placeholder, autoFocus = false }) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  async function submit() {
    if (!body.trim() || busy) return;
    setBusy(true); setErr(null);
    try {
      await onPost(body.trim());
      setBody("");
    } catch (e) {
      setErr(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ background: "#fff", border: "1px solid #ece9e2", borderRadius: 8, padding: 10 }}>
      {(displayName || actorLabel) && (
        <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6, fontSize: 10, color: "#888" }}>
          {displayName && <span style={{ fontWeight: 600, color: "#2c2c2a" }}>{displayName}</span>}
          {actorLabel && <span>· speaking for {actorLabel}</span>}
        </div>
      )}
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        autoFocus={autoFocus}
        rows={3}
        placeholder={placeholder || "Write a message — counter-terms, questions, conditions…"}
        style={{ width: "100%", padding: "8px 10px", fontSize: 12, border: "1px solid #e8e6e1", borderRadius: 6, resize: "vertical", fontFamily: "inherit" }}
      />
      {err && <div style={{ marginTop: 6, fontSize: 11, color: "#A32D2D" }}>{err}</div>}
      <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 9, color: "#bbb" }}>{body.length}/5000</span>
        <div style={{ display: "flex", gap: 6 }}>
          {onCancel && <button onClick={onCancel} style={{ fontSize: 11, padding: "5px 10px", background: "none", border: "1px solid #e8e6e1", color: "#666", borderRadius: 6, cursor: "pointer" }}>Cancel</button>}
          <button
            onClick={submit}
            disabled={!body.trim() || busy}
            style={{
              fontSize: 11, padding: "5px 14px", fontWeight: 700,
              background: !body.trim() || busy ? "#bfbfbf" : "#0a4a3e",
              color: "#fff", border: "none", borderRadius: 6,
              cursor: !body.trim() || busy ? "not-allowed" : "pointer",
            }}
          >
            {busy ? "…" : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatAgo(at) {
  if (!at) return "";
  const d = new Date(at);
  const ms = Date.now() - d.getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}
