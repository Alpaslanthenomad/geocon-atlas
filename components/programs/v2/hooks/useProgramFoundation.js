// hooks/useProgramFoundation.js
//
// Fetches dual-gate status + all tics for a program. Provides mutators that
// optimistically refetch after success.

import { useCallback, useEffect, useState } from 'react';
import {
  getProgramFoundationStatus,
  completeProgramTic,
  waiveProgramTic,
  revisitProgramTic,
} from '../lib/programRpc';

export function useProgramFoundation(programId) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const refetch = useCallback(async () => {
    if (!programId) return;
    try {
      setError(null);
      const result = await getProgramFoundationStatus(programId);
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
        const result = await getProgramFoundationStatus(programId);
        if (!cancelled) setData(result);
      } catch (e) {
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [programId]);

  // Mutators — refetch after success so UI stays in sync.
  const complete = useCallback(async (ticId, evidence) => {
    const r = await completeProgramTic(programId, ticId, evidence);
    await refetch();
    return r;
  }, [programId, refetch]);

  const waive = useCallback(async (ticId, reason) => {
    const r = await waiveProgramTic(programId, ticId, reason);
    await refetch();
    return r;
  }, [programId, refetch]);

  const revisit = useCallback(async (ticId, reason) => {
    const r = await revisitProgramTic(programId, ticId, reason);
    await refetch();
    return r;
  }, [programId, refetch]);

  // Helpers to slice tics by tier (dual-wheel architecture)
  const ticsByTier = (() => {
    if (!data?.tics) return { foundation: [], field_lab: [] };
    const foundation = [];
    const field_lab = [];
    for (const tic of data.tics) {
      // Tier comes from RPC; fall back gracefully if missing.
      const tier = tic.tier ?? (tic.foundation_gate_required ? 'foundation' : 'field_lab');
      if (tier === 'foundation') foundation.push(tic);
      else field_lab.push(tic);
    }
    return { foundation, field_lab };
  })();

  return {
    data,
    loading,
    error,
    refetch,
    complete,
    waive,
    revisit,
    isOwner: data?.is_owner ?? false,
    gates:   data?.gates ?? null,
    tics:    data?.tics ?? [],
    ticsByTier,
  };
}
