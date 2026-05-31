"use client";
// Catches the two failure modes that React's error boundaries miss:
//
//   1. window 'error'           — runtime errors outside React tree
//                                 (3rd-party scripts, async timers)
//   2. window 'unhandledrejection' — promise rejections from useEffect
//                                 IIFEs, missing try/catch in handlers
//
// Both modes used to surface as "Uncaught (in promise) Object" in
// production and could stall the React render cycle. We log them to
// the console + Sentry, then preventDefault so the browser doesn't
// re-emit them and React's dev overlay doesn't pin the page.
//
// Mounted once at the root layout — no children.

import { useEffect } from "react";

export default function GlobalErrorHandler() {
  useEffect(() => {
    function reportToSentry(error, tags) {
      if (typeof window === "undefined") return;
      if (!window.Sentry?.captureException) return;
      try { window.Sentry.captureException(error, { tags }); } catch { /* ignore */ }
    }

    function onUnhandledRejection(event) {
      const reason = event?.reason;
      // eslint-disable-next-line no-console
      console.warn("[unhandledrejection]", reason?.message || reason);
      reportToSentry(reason instanceof Error ? reason : new Error(String(reason)), { kind: "unhandledrejection" });
      event.preventDefault();
    }

    function onError(event) {
      const err = event?.error;
      // eslint-disable-next-line no-console
      console.warn("[window.error]", err?.message || event?.message);
      reportToSentry(err instanceof Error ? err : new Error(String(err || event?.message || "unknown")), { kind: "window.error" });
      // Don't preventDefault — let React's dev tools still see it
    }

    window.addEventListener("unhandledrejection", onUnhandledRejection);
    window.addEventListener("error", onError);
    return () => {
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
      window.removeEventListener("error", onError);
    };
  }, []);

  return null;
}
