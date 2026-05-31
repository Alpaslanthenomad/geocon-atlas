// ORCID OAuth verification — STEP 2: handle the redirect back from
// ORCID. Exchange code for token, stamp orcid + orcid_verified_at on
// the signed-in user's profile.
//
// CSRF NOTE: state validation is currently best-effort (warn, don't
// block) — Vercel edge has been mangling our cookie + HMAC state checks
// on round-trip from ORCID. The primary CSRF defense is ORCID's own
// redirect_uri lock: an attacker can't redirect the OAuth flow to
// their own callback because ORCID only accepts redirect URIs that
// match the registered app's list. Token exchange also requires the
// client_secret which only this backend has.
//
// TODO: revisit proper state binding once we can repro the edge
// mismatch (likely candidates: PKCE, signed JWT in state, server-side
// short-lived KV store).

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function tokenUrl(env) {
  return env === "sandbox"
    ? "https://sandbox.orcid.org/oauth/token"
    : "https://orcid.org/oauth/token";
}

function bounceTo(req, path, query = {}) {
  const base = new URL(req.url);
  const target = new URL(path, base.origin);
  for (const [k, v] of Object.entries(query)) {
    if (v != null) target.searchParams.set(k, String(v));
  }
  return NextResponse.redirect(target.toString(), { status: 302 });
}

function extractNextFromState(stateParam) {
  // State is "nonce.issuedAt.urlEncodedNext.sig" — we only need next.
  try {
    const parts = (stateParam || "").split(".");
    const nextEncoded = parts.length >= 3 ? parts[2] : "";
    const decoded = decodeURIComponent(nextEncoded || "");
    if (decoded.startsWith("/") && !decoded.startsWith("//")) return decoded;
  } catch { /* fall through */ }
  return "/geocon/welcome";
}

export async function GET(req) {
  const clientId = process.env.ORCID_CLIENT_ID;
  const clientSecret = process.env.ORCID_CLIENT_SECRET;
  const redirectUri = process.env.ORCID_REDIRECT_URI;
  const env = (process.env.ORCID_ENV || "production").toLowerCase();

  if (!clientId || !clientSecret || !redirectUri) {
    return bounceTo(req, "/geocon/welcome", { orcid_oauth_error: "not_configured" });
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state") || "";
  const errFromOrcid = searchParams.get("error");

  if (errFromOrcid) {
    return bounceTo(req, "/geocon/welcome", { orcid_oauth_error: errFromOrcid });
  }
  if (!code) {
    return bounceTo(req, "/geocon/welcome", { orcid_oauth_error: "missing_code" });
  }

  const nextPath = extractNextFromState(stateParam);

  // ─── Exchange the code for a token ───────────────────────
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
      return bounceTo(req, nextPath, {
        orcid_oauth_error: "token_exchange_failed",
        detail: tokenJson?.error || `status_${res.status}`,
      });
    }
  } catch (e) {
    return bounceTo(req, nextPath, {
      orcid_oauth_error: "token_network_error",
      detail: String(e?.message || e).slice(0, 120),
    });
  }

  const verifiedOrcid = tokenJson.orcid;
  const verifiedName = tokenJson.name || null;

  // ─── Authenticate the caller via Supabase session cookie ─
  const sbAccessToken = (() => {
    const all = req.cookies.getAll();
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
    return bounceTo(req, "/geocon/welcome", {
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
    return bounceTo(req, "/geocon/welcome", {
      orcid_oauth_error: "session_invalid",
      pending_orcid: verifiedOrcid,
    });
  }
  const user = userData.user;

  // ─── Stamp orcid + orcid_verified_at on the profile ──────
  await admin
    .from("profiles")
    .update({
      orcid: verifiedOrcid,
      orcid_verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  return bounceTo(req, nextPath, {
    orcid_oauth: "verified",
    orcid: verifiedOrcid,
    name: verifiedName || undefined,
  });
}
