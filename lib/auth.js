"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "./supabase";

/* ── Auth Hook ──
   Tek noktadan kullanıcı durumu:
   - user: auth.user objesi (id, email)
   - profile: public.profiles satırı
   - researcher: profile.researcher_id'ye karşılık gelen researchers satırı (varsa)
   - loading: ilk yükleme tamamlandı mı
   - refreshProfile: manuel yenileme (claim sonrası vs.)
*/
export function useAuth() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [researcher, setResearcher] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfileAndResearcher = useCallback(async (uid) => {
    if (!uid) {
      setProfile(null);
      setResearcher(null);
      return;
    }
    try {
      const { data: p, error: pErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", uid)
        .maybeSingle();
      if (pErr) {
        console.warn("[auth] profile fetch error:", pErr.message);
        setProfile(null);
        setResearcher(null);
        return;
      }
      setProfile(p || null);

      if (p?.researcher_id) {
        const { data: r } = await supabase
          .from("researchers")
          .select("*")
          .eq("id", p.researcher_id)
          .maybeSingle();
        setResearcher(r || null);
      } else {
        setResearcher(null);
      }
    } catch (e) {
      console.warn("[auth] unexpected error:", e.message);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      setUser(session?.user || null);
      if (session?.user) {
        await fetchProfileAndResearcher(session.user.id);
      }
      if (mounted) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        setUser(session?.user || null);
        await fetchProfileAndResearcher(session?.user?.id);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfileAndResearcher]);

  const refreshProfile = useCallback(async () => {
    if (user?.id) await fetchProfileAndResearcher(user.id);
  }, [user, fetchProfileAndResearcher]);

  return { user, profile, researcher, loading, refreshProfile };
}

/* ── State helpers ── */
export const isApproved = (profile) => profile?.approval_status === "approved";
export const isPending  = (profile) => profile?.approval_status === "pending";
export const isRejected = (profile) => profile?.approval_status === "rejected";
export const isAdmin    = (profile) => profile?.role === "admin";
export const isClaimed  = (profile) => !!profile?.researcher_id;
export const hasClaimRequest = (profile) => !!profile?.claim_request_for_researcher_id && !profile?.researcher_id;
export const isObserver = (profile) => profile?.signup_intent === "observer";

/* ── Auth actions ── */
export async function signUpWithEmail(email, password, fullName) {
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName || "" },
      emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
    },
  });
}

export async function signInWithPassword(email, password) {
  return await supabase.auth.signInWithPassword({ email, password });
}

export async function signInWithMagicLink(email) {
  return await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
    },
  });
}

export async function signOut() {
  return await supabase.auth.signOut();
}
