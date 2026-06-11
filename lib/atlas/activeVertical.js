"use client";
import { supabase } from "../supabase";

/**
 * GATE-0 — the active-vertical resolver.
 *
 * Atlas reads (species list, family counts) must be scoped to ONE vertical so
 * the verticals never cross-contaminate (a geophytes browser must not see
 * medicinal-only species, and vice-versa). species.vertical_id is NOT NULL on
 * every row; this resolves which vertical the current viewer is in.
 *
 * Cached per session (one get_my_active_vertical RPC). Defaults to 'geophytes'
 * for logged-out viewers or any error — the safe public default. The cache is
 * cleared on vertical switch (VerticalSwitcher) so the next read re-scopes.
 */
let _cache; // undefined = not loaded; string = vertical id
let _inflight = null;

export async function getActiveVerticalId() {
  if (_cache !== undefined) return _cache;
  if (_inflight) return _inflight;
  _inflight = (async () => {
    let id = "geophytes";
    try {
      const { data } = await supabase.rpc("get_my_active_vertical");
      // get_my_active_vertical returns an object ({ id, display_name, ... });
      // tolerate a bare-string return too. Null/empty → the default.
      const resolved = data && (data.id || (typeof data === "string" ? data : null));
      if (resolved && typeof resolved === "string") id = resolved;
    } catch {
      /* keep the default */
    }
    _cache = id;
    _inflight = null;
    return id;
  })();
  return _inflight;
}

export function clearActiveVerticalCache() {
  _cache = undefined;
  _inflight = null;
}
