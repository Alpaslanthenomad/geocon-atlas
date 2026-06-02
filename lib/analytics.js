"use client";
// Self-hosted, privacy-first telemetry.
//
// Audit IX.2 — third-party trackers (PostHog, Plausible, GA) ruled
// out for an IUCN-pitching research platform; we ingest events into
// our own Supabase via the ingest_analytics_event RPC. No IP, no
// cookie, no fingerprint. Session id is an opaque UUID kept only in
// sessionStorage (gone on tab close); user_id is derived server-side
// from auth.uid() and never trusted from client.
//
// Public API:
//   track(event, { route?, payload? })  — fire-and-forget single event
//   trackEvent(name, props)              — legacy alias (kept for older
//                                         call sites that imported it)
//   usePageviews()                       — React hook; ping a pageview
//                                         on every Next.js pathname change
//   initAnalytics()                      — no-op (kept for back-compat)
//   identifyUser()/resetIdentity()       — no-op (user id is server-derived)
//
// All telemetry calls are fire-and-forget — failures are silent. UX
// must never depend on telemetry working.

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "./supabase";

const SESSION_KEY = "gx_analytics_session";

function getSessionId() {
  if (typeof window === "undefined") return null;
  try {
    let s = window.sessionStorage.getItem(SESSION_KEY);
    if (!s) {
      s = (typeof crypto !== "undefined" && crypto.randomUUID)
        ? crypto.randomUUID()
        : `s${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      window.sessionStorage.setItem(SESSION_KEY, s);
    }
    return s;
  } catch {
    return null;  // private browsing / storage disabled
  }
}

function uaClass() {
  if (typeof navigator === "undefined") return null;
  const ua = (navigator.userAgent || "").toLowerCase();
  if (/bot|crawl|spider|slurp|bingbot|googlebot|baiduspider|duckduckbot|yandex/i.test(ua)) return "bot";
  if (/iphone|ipad|ipod|android.*mobile|mobile/.test(ua)) return "mobile";
  return "desktop";
}

// Strip query strings except a deliberately-shared q= (search).
function normalizeRoute(p) {
  if (!p) return null;
  let path = p;
  try {
    if (path.startsWith("http")) {
      const u = new URL(path);
      path = u.pathname + (u.searchParams.get("q") ? `?q=${u.searchParams.get("q").slice(0, 64)}` : "");
    } else if (path.includes("?")) {
      const [base, qs] = path.split("?");
      const sp = new URLSearchParams(qs);
      path = base + (sp.get("q") ? `?q=${sp.get("q").slice(0, 64)}` : "");
    }
  } catch { /* ignore */ }
  return path;
}

export async function track(event, { route, payload } = {}) {
  if (!event || typeof event !== "string") return;
  if (typeof window === "undefined") return;
  const ua = uaClass();
  if (ua === "bot") return;
  try {
    const r = route ?? (window.location?.pathname + (window.location?.search || ""));
    await supabase.rpc("ingest_analytics_event", {
      p_event: event,
      p_route: normalizeRoute(r),
      p_session_id: getSessionId(),
      p_payload: payload || {},
      p_user_agent_class: ua,
    });
  } catch {
    // Silent — telemetry must not affect UX.
  }
}

// Legacy alias for older call sites that imported trackEvent.
export function trackEvent(name, props) {
  return track(name, { payload: props || {} });
}

// React hook — mount once at Shell level.
export function usePageviews() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname) return;
    const t = setTimeout(() => {
      track("pageview", { route: pathname });
    }, 50);
    return () => clearTimeout(t);
  }, [pathname]);
}

// Back-compat no-ops for old import sites
export function initAnalytics()       { /* self-hosted: nothing to init */ }
export function identifyUser()        { /* server-derives user_id */ }
export function resetIdentity()       { /* nothing to reset */ }
export function trackPageview(route)  { return track("pageview", { route }); }
