// hooks/useProgramMembers.js

import { useCallback, useEffect, useState } from 'react';
import { getProgramMembersFull } from '../lib/programRpc';

export function useProgramMembers(programId) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const refetch = useCallback(async () => {
    if (!programId) return;
    try {
      setError(null);
      const result = await getProgramMembersFull(programId);
      setData(result);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [programId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const result = await getProgramMembersFull(programId);
        if (!cancelled) setData(result);
      } catch (e) {
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [programId]);

  return {
    data,
    loading,
    error,
    refetch,
    isOwner: data?.is_owner ?? false,
    members: data?.members ?? [],
  };
}
