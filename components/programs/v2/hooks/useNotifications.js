// hooks/useNotifications.js
//
// Single source of truth for the in-app notification bell. Fetches the
// recent list + unread count on mount, then subscribes to Supabase Realtime
// so a new row inserted for the signed-in user lights the badge instantly
// (no polling, no refresh).

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getMyNotifications,
  getMyNotificationUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '../lib/programRpc';
import { supabase } from '../lib/supabaseClient';

export function useNotifications(userId, { limit = 30 } = {}) {
  const [items, setItems]   = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);

  const refetch = useCallback(async () => {
    if (!userId) {
      setItems([]); setUnread(0); return;
    }
    try {
      setError(null);
      const [list, n] = await Promise.all([
        getMyNotifications({ limit }),
        getMyNotificationUnreadCount(),
      ]);
      setItems(Array.isArray(list) ? list : []);
      setUnread(typeof n === 'number' ? n : 0);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [userId, limit]);

  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setItems([]); setUnread(0); setLoading(false); return;
    }
    setLoading(true);
    (async () => {
      try {
        const [list, n] = await Promise.all([
          getMyNotifications({ limit }),
          getMyNotificationUnreadCount(),
        ]);
        if (cancelled) return;
        setItems(Array.isArray(list) ? list : []);
        setUnread(typeof n === 'number' ? n : 0);
      } catch (e) {
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId, limit]);

  // Keep the latest refetch in a ref so the realtime subscription below can
  // call it without listing `refetch` as a dependency (which would re-subscribe
  // on every identity change and risk a churn/refetch loop). The channel should
  // only re-subscribe when the userId changes.
  const refetchRef = useRef(refetch);
  useEffect(() => { refetchRef.current = refetch; }, [refetch]);

  // Realtime: listen for any change to *my* notifications.
  // Use a postgres_changes filter so we don't get fanned-out chatter for
  // other users' rows (RLS would block them anyway, but filtering at the
  // subscription level is cheaper).
  useEffect(() => {
    if (!userId) return;
    let tail = null;
    const scheduleRefetch = () => {
      if (tail) clearTimeout(tail);
      tail = setTimeout(() => { refetchRef.current(); }, 400);
    };

    const channel = supabase
      .channel(`notifications:user:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_user_id=eq.${userId}`,
        },
        scheduleRefetch
      )
      .subscribe();

    return () => {
      if (tail) clearTimeout(tail);
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const markOneRead = useCallback(async (id) => {
    // Optimistic: flip locally, then call RPC. If RPC fails we refetch to
    // resync. (Realtime will eventually push the truth either way.)
    setItems((prev) => prev.map((it) => it.id === id ? { ...it, read_at: it.read_at || new Date().toISOString() } : it));
    setUnread((prev) => Math.max(0, prev - 1));
    try {
      await markNotificationRead(id);
    } catch (e) {
      setError(e);
      refetch();
    }
  }, [refetch]);

  const markAllRead = useCallback(async () => {
    setItems((prev) => prev.map((it) => it.read_at ? it : { ...it, read_at: new Date().toISOString() }));
    setUnread(0);
    try {
      await markAllNotificationsRead();
    } catch (e) {
      setError(e);
      refetch();
    }
  }, [refetch]);

  return { items, unread, loading, error, refetch, markOneRead, markAllRead };
}
