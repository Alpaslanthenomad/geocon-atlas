// hooks/useProgramStream.js
//
// Wraps the get_program_stream + post_program_comment RPCs into a hook the
// StreamTab can subscribe to. Returns the interleaved event list plus a
// stable postComment() that refetches on success.

import { useCallback, useEffect, useState } from 'react';
import { getProgramStream, postProgramComment } from '../lib/programRpc';

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

  const postComment = useCallback(async (body, opts = {}) => {
    const r = await postProgramComment(programId, body, opts);
    await refetch();
    return r;
  }, [programId, refetch]);

  return { events, loading, error, refetch, postComment };
}
