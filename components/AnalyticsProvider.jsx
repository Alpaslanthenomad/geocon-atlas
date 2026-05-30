"use client";
// AnalyticsProvider — initializes PostHog once on mount, tracks
// route changes as $pageview events, and ties the user identity to
// the Supabase auth user when they sign in. No-op without the env key.

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { initAnalytics, trackPageview, identifyUser, resetIdentity } from "../lib/analytics";
import { useAuthContext } from "../lib/authContext";

export default function AnalyticsProvider() {
  useEffect(() => { initAnalytics(); }, []);
  return (
    <Suspense fallback={null}>
      <PageviewTracker />
      <IdentityTracker />
    </Suspense>
  );
}

function PageviewTracker() {
  const pathname = usePathname();
  const sp = useSearchParams();
  useEffect(() => {
    if (!pathname) return;
    const qs = sp?.toString();
    trackPageview(pathname + (qs ? `?${qs}` : ""));
  }, [pathname, sp]);
  return null;
}

function IdentityTracker() {
  const { user, profile, researcher } = useAuthContext();
  useEffect(() => {
    if (user?.id) {
      identifyUser(user.id, {
        email: user.email,
        role:  profile?.role,
        name:  researcher?.name || profile?.full_name,
      });
    } else {
      resetIdentity();
    }
  }, [user?.id, profile?.role, researcher?.name, profile?.full_name, user?.email]);
  return null;
}
