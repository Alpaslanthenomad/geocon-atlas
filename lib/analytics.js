"use client";
// PostHog initialization + thin event helpers. The whole module is a
// no-op when NEXT_PUBLIC_POSTHOG_KEY isn't set, so dev/local builds
// without the key still work.

import posthog from "posthog-js";

let initialized = false;

export function initAnalytics() {
  if (typeof window === "undefined") return;
  if (initialized) return;
  const key  = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
  if (!key) return;

  posthog.init(key, {
    api_host: host,
    person_profiles: "identified_only",
    capture_pageview: false,            // we capture pageviews ourselves on route change
    capture_pageleave: true,
    disable_session_recording: true,    // turn on per-route when we want it
    autocapture: {
      // Don't auto-track every input. Keeps event volume reasonable on
      // discussion threads and the Ask GEOCON page.
      element_attribute_ignorelist: ["data-private"],
    },
  });
  initialized = true;
}

export function trackPageview(url) {
  if (!initialized) return;
  posthog.capture("$pageview", { $current_url: url });
}

export function trackEvent(name, props) {
  if (!initialized) return;
  posthog.capture(name, props || {});
}

export function identifyUser(userId, traits) {
  if (!initialized) return;
  if (!userId) return;
  posthog.identify(userId, traits || {});
}

export function resetIdentity() {
  if (!initialized) return;
  posthog.reset();
}

export { posthog };
