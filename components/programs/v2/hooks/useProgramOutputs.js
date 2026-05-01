// hooks/useProgramOutputs.js

import { useCallback, useEffect, useState } from 'react';
import { getProgramOutputs, addProgramOutput } from '../lib/programRpc';

export function useProgramOutputs(programId, pathwayId = null) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const refetch = useCallback(async () => {
    if (!programId) return;
    try {
      setError(null);
      const result = await getProgramOutputs(programId, pathwayId);
      setData(result);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [programId, pathwayId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const result = await getProgramOutputs(programId, pathwayId);
        if (!cancelled) setData(result);
      } catch (e) {
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [programId, pathwayId]);

  const addOutput = useCallback(async (opts) => {
    const r = await addProgramOutput(programId, opts);
    await refetch();
    return r;
  }, [programId, refetch]);

  return {
    data,
    loading,
    error,
    refetch,
    addOutput,
    isOwner: data?.is_owner ?? false,
    outputs: data?.outputs ?? [],
    count:   data?.count ?? 0,
  };
}
