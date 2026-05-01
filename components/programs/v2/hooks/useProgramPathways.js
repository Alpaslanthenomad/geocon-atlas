// hooks/useProgramPathways.js

import { useCallback, useEffect, useState } from 'react';
import {
  getProgramPathwaysWithStatus,
  declarePathway,
  activatePathway,
} from '../lib/programRpc';

export function useProgramPathways(programId) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const refetch = useCallback(async () => {
    if (!programId) return;
    try {
      setError(null);
      const result = await getProgramPathwaysWithStatus(programId);
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
        const result = await getProgramPathwaysWithStatus(programId);
        if (!cancelled) setData(result);
      } catch (e) {
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [programId]);

  const declare = useCallback(async (opts) => {
    const r = await declarePathway(programId, opts);
    await refetch();
    return r;
  }, [programId, refetch]);

  const activate = useCallback(async (pathwayId) => {
    // activatePathway returns { success: false, error: '...' } on gate fail
    // (not throw), so just pass it through.
    const r = await activatePathway(programId, pathwayId);
    if (r?.success !== false) await refetch();
    return r;
  }, [programId, refetch]);

  return {
    data,
    loading,
    error,
    refetch,
    declare,
    activate,
    isOwner:  data?.is_owner ?? false,
    declared: data?.declared ?? data?.pathways ?? [],
    library:  data?.library ?? [],
  };
}
