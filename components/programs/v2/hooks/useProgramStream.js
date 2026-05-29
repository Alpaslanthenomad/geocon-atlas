// hooks/useProgramStream.js
//
// Wraps the get_program_stream + post_program_comment RPCs into a hook the
// StreamTab can subscribe to. Returns the interleaved event list plus a
// stable postComment() that refetches on success. Also subscribes to
// Supabase Realtime so the stream live-updates when comments are
// inserted/updated or audit rows land — no F5 required.

import { useCallback, useEffect, useState } from 'react';
import { getProgramStream, postProgramComment } from '../lib/programRpc';
import { supabase } from '../lib/supabaseClient';

export function useProgramStream(programId, { limit = 100 } = {}) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!programId) return;
    try {
      setError(null);
      const data = await getProgramStream(programId, limit);
      setEvents(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [programId, limit]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const data = await getProgramStream(programId, limit);
        if (!cancelled) setEvents(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [programId, limit]);

  // Realtime — refetch on any program_comments or audit event for this program.
  // Each change in the upstream tables triggers a single refetch (debounced by
  // a 600 ms tail so a burst doesn't hammer the RPC).
  useEffect(() => {
    if (!programId) return;
    let tail = null;
    const scheduleRefetch = () => {
      if (tail) clearTimeout(tail);
      tail = setTimeout(() => { refetch(); }, 600);
    };

    const channel = supabase
      .channel(`stream:program:${programId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'program_comments', filter: `program_id=eq.${programId}` },
        scheduleRefetch
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'program_tic_audit', filter: `program_id=eq.${programId}` },
        scheduleRefetch
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'program_output_audit', filter: `program_id=eq.${programId}` },
        scheduleRefetch
      )
      // member_audit + pathway_audit don't carry program_id directly — listen
      // unfiltered and re-derive in scheduleRefetch (cheap, infrequent).
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'program_member_audit' },
        scheduleRefetch
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'program_pathway_audit' },
        scheduleRefetch
      )
      .subscribe();

    return () => {
      if (tail) clearTimeout(tail);
      supabase.removeChannel(channel);
    };
  }, [programId, refetch]);

  const postComment = useCallback(async (body, opts = {}) => {
    const r = await postProgramComment(programId, body, opts);
    await refetch();
    return r;
  }, [programId, refetch]);

  return { events, loading, error, refetch, postComment };
}
