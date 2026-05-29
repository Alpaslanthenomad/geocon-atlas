// components/geocon/hooks/useProposalComments.js
//
// Fetches threaded comments for a proposal via get_proposal_comments and
// subscribes to Realtime so the discussion live-updates. postComment()
// wraps post_proposal_comment and refetches on success. editComment() /
// deleteComment() update the row directly via RLS (author-only).

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export function useProposalComments(proposalId) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const refetch = useCallback(async () => {
    if (!proposalId) return;
    setError(null);
    const { data, error: e } = await supabase.rpc("get_proposal_comments", { p_proposal_id: proposalId });
    if (e) setError(e);
    setComments(Array.isArray(data) ? data : []);
  }, [proposalId]);

  useEffect(() => {
    let cancelled = false;
    if (!proposalId) { setComments([]); setLoading(false); return; }
    setLoading(true);
    (async () => {
      const { data, error: e } = await supabase.rpc("get_proposal_comments", { p_proposal_id: proposalId });
      if (cancelled) return;
      if (e) setError(e);
      else setComments(Array.isArray(data) ? data : []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [proposalId]);

  useEffect(() => {
    if (!proposalId) return;
    let tail = null;
    const schedule = () => { if (tail) clearTimeout(tail); tail = setTimeout(() => refetch(), 400); };
    const channel = supabase
      .channel(`proposal_comments:${proposalId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "proposal_comments", filter: `proposal_id=eq.${proposalId}` },
        schedule
      )
      .subscribe();
    return () => {
      if (tail) clearTimeout(tail);
      supabase.removeChannel(channel);
    };
  }, [proposalId, refetch]);

  const postComment = useCallback(async (body, opts = {}) => {
    const { data, error: e } = await supabase.rpc("post_proposal_comment", {
      p_proposal_id:   proposalId,
      p_body:          body,
      p_parent_id:     opts.parentId      ?? null,
      p_mentions:      opts.mentions      ?? [],
      p_as_actor_kind: opts.asActorKind   ?? null,
      p_as_actor_id:   opts.asActorId     ?? null,
    });
    if (e) throw e;
    await refetch();
    return data;
  }, [proposalId, refetch]);

  const editComment = useCallback(async (id, body) => {
    const { error: e } = await supabase
      .from("proposal_comments")
      .update({ body, edited: true, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (e) throw e;
    await refetch();
  }, [refetch]);

  const deleteComment = useCallback(async (id) => {
    const { error: e } = await supabase
      .from("proposal_comments")
      .update({ deleted: true, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (e) throw e;
    await refetch();
  }, [refetch]);

  return { comments, loading, error, refetch, postComment, editComment, deleteComment };
}
