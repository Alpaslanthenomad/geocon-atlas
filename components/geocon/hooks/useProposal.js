// components/geocon/hooks/useProposal.js
//
// Fetches a single proposal via get_proposal and keeps it fresh by
// subscribing to Realtime changes on:
//   * collaboration_proposals (this row) — status transitions
//   * proposal_events (this proposal_id) — new audit entries
//
// Both are debounced into a single refetch so a burst doesn't hammer the
// RPC. The hook is read-only; mutations stay in the route component and
// call refetch() after they land.

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export function useProposal(proposalId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!proposalId) return;
    setError(null);
    const { data: r, error: e } = await supabase.rpc("get_proposal", { p_id: proposalId });
    if (e) setError(e);
    else setData(r || null);
  }, [proposalId]);

  useEffect(() => {
    let cancelled = false;
    if (!proposalId) { setData(null); setLoading(false); return; }
    setLoading(true);
    (async () => {
      const { data: r, error: e } = await supabase.rpc("get_proposal", { p_id: proposalId });
      if (cancelled) return;
      if (e) setError(e);
      else setData(r || null);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [proposalId]);

  useEffect(() => {
    if (!proposalId) return;
    let tail = null;
    const scheduleRefetch = () => {
      if (tail) clearTimeout(tail);
      tail = setTimeout(() => { refetch(); }, 400);
    };
    const channel = supabase
      .channel(`proposal:${proposalId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "collaboration_proposals", filter: `id=eq.${proposalId}` },
        scheduleRefetch
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "proposal_events", filter: `proposal_id=eq.${proposalId}` },
        scheduleRefetch
      )
      .subscribe();
    return () => {
      if (tail) clearTimeout(tail);
      supabase.removeChannel(channel);
    };
  }, [proposalId, refetch]);

  return { data, loading, error, refetch };
}
