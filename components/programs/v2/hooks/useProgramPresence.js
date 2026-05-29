// hooks/useProgramPresence.js
//
// Supabase Realtime presence channel per program. Signed-in viewers "track"
// themselves into the channel; everyone (including signed-out observers) gets
// the current list of who else is watching. Quiet ambient signal that the
// program is a shared workspace, not a dead document.

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useProgramPresence(programId, currentUser) {
  // currentUser: { id, name } | null. If null, the hook only listens.
  const [watchers, setWatchers] = useState([]);

  useEffect(() => {
    if (!programId) return;

    const channel = supabase.channel(`presence:program:${programId}`, {
      config: {
        presence: { key: currentUser?.id || `obs-${Math.random().toString(36).slice(2, 9)}` },
      },
    });

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const flat = [];
      for (const arr of Object.values(state)) {
        for (const v of arr) flat.push(v);
      }
      // Dedupe by id, prefer most-recently-joined
      const byId = new Map();
      for (const w of flat) {
        if (!w?.id) continue;
        const existing = byId.get(w.id);
        if (!existing || (w.at && existing.at && w.at > existing.at)) byId.set(w.id, w);
      }
      setWatchers([...byId.values()]);
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED' && currentUser?.id) {
        await channel.track({
          id: currentUser.id,
          name: currentUser.name || null,
          at: new Date().toISOString(),
        });
      }
    });

    return () => {
      try { channel.untrack().catch(() => {}); } catch {}
      supabase.removeChannel(channel);
    };
  }, [programId, currentUser?.id, currentUser?.name]);

  return watchers;
}
