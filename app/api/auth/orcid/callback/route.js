// ORCID OAuth verification — STEP 2: handle the redirect back from
// ORCID. Exchange `code` for an access token + verified ORCID iD, then
// stamp orcid + orcid_verified_at on the signed-in user's profile.
//
// The caller MUST be signed in via Supabase already — this endpoint
// upgrades an existing identity, it does not create a Supabase user.

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "orcid_oauth_state";

function tokenUrl(env) {
  return env === "sandbox"
    ? "https://sandbox.orcid.org/oauth/token"
    : "https://orcid.org/oauth/token";
}

function bounceTo(path, query = {}) {
  const url = new URL(path, "http://placeholder.local");
  // We need an absolute URL for redirect() in route handlers; the host
  // is replaced by the runtime via NextResponse.
  for (const [k, v] of Object.entries(query)) {
    if (v != null) url.searchParams.set(k, String(v));
  }
  return redirect(url.pathname + url.search);
}

export async function GET(req) {
  const clientId = process.env.ORCID_CLIENT_ID;
  const clientSecret = process.env.ORCID_CLIENT_SECRET;
  const redirectUri = process.env.ORCID_REDIRECT_URI;
  const env = (process.env.ORCID_ENV || "production").toLowerCase();

  if (!clientId || !clientSecret || !redirectUri) {
    return bounceTo("/geocon/welcome", { orcid_oauth_error: "not_configured" });
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state") || "";
  const errFromOrcid = searchParams.get("error");

  // User may have cancelled at the ORCID screen
  if (errFromOrcid) {
    return bounceTo("/geocon/welcome", { orcid_oauth_error: errFromOrcid });
  }
  if (!code) {
    return bounceTo("/geocon/welcome", { orcid_oauth_error: "missing_code" });
  }

  // Verify state matches the nonce cookie we stamped on authorize
  const cookieStore = cookies();
  const expectedNonce = cookieStore.get(STATE_COOKIE)?.value;
  cookieStore.delete(STATE_COOKIE);

  const [nonce, nextEncoded] = stateParam.split(".");
  const nextPath = (() => {
    try {
      const decoded = decodeURIComponent(nextEncoded || "");
      return decoded.startsWith("/") && !decoded.startsWith("//") ? decoded : "/geocon/welcome";
    } catch { return "/geocon/welcome"; }
  })();

  if (!nonce || !expectedNonce || nonce !== expectedNonce) {
    return bounceTo(nextPath, { orcid_oauth_error: "state_mismatch" });
  }

  // Exchange the code for a token
  let tokenJson;
  try {
    const res = await fetch(tokenUrl(env), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });
    tokenJson = await res.json();
    if (!res.ok || !tokenJson?.orcid) {
      return bounceTo(nextPath, {
        orcid_oauth_error: "token_exchange_failed",
        detail: tokenJson?.error || `status_${res.status}`,
      });
    }
  } catch (e) {
    return bounceTo(nextPath, {
      orcid_oauth_error: "token_network_error",
      detail: String(e?.message || e).slice(0, 120),
    });
  }

  const verifiedOrcid = tokenJson.orcid;       // "0000-0000-0000-0000"
  const verifiedName = tokenJson.name || null; // human-readable name

  // ---- Authenticate the caller via Supabase session cookie ----
  // The caller is expected to be signed in — we read the access token
  // from the sb-* auth cookie. If absent, ask them to sign in first.
  const sbAccessToken = (() => {
    // Supabase JS v2 stores the session in a JSON cookie named
    // sb-<project-ref>-auth-token. Older flows use sb-access-token.
    // We scan all sb-* cookies and try to pull an access_token.
    const all = cookieStore.getAll();
    for (const c of all) {
      if (!c.name.startsWith("sb-")) continue;
      try {
        const parsed = JSON.parse(c.value);
        if (parsed?.access_token) return parsed.access_token;
        if (Array.isArray(parsed) && parsed[0]?.access_token) return parsed[0].access_token;
      } catch { /* not JSON, skip */ }
      if (c.name.endsWith("access-token") && c.value) return c.value;
    }
    return null;
  })();

  if (!sbAccessToken) {
    return bounceTo("/geocon/welcome", {
      orcid_oauth_error: "not_signed_in",
      pending_orcid: verifiedOrcid,
    });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
  const { data: userData, error: userErr } = await admin.auth.getUser(sbAccessToken);
  if (userErr || !userData?.user) {
    return bounceTo("/geocon/welcome", {
      orcid_oauth_error: "session_invalid",
      pending_orcid: verifiedOrcid,
    });
  }
  const user = userData.user;

  // ---- Stamp orcid + orcid_verified_at on the profile ----
  // (orcid is updated even if a different one was previously set — the
  // most recently verified ORCID wins.)
  await admin
    .from("profiles")
    .update({
      orcid: verifiedOrcid,
      orcid_verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  // ---- Hand back to the originating page ----
  return bounceTo(nextPath, {
    orcid_oauth: "verified",
    orcid: verifiedOrcid,
    name: verifiedName || undefined,
  });
}
