// ORCID OAuth verification — STEP 2: handle the redirect back from
// ORCID, exchange the code for the verified ORCID iD, then bounce
// the user back to /geocon/welcome with the verified ORCID in the URL.
//
// We DO NOT touch the profiles table here. Reading the Supabase
// session cookie from a Route Handler is brittle (Supabase SSR splits
// large session tokens across multiple sb-* cookies in a non-trivial
// format), and the redirect target also can't carry the bearer token
// safely. Instead, the WelcomeRoute on the client picks up the
// verified ORCID from the URL and calls /api/orcid/verify-link with a
// Bearer token from the live Supabase session — that endpoint stamps
// the profile.

import { NextResponse } from "next/server";

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

  // Hand back to the client. The WelcomeRoute will call
  // /api/orcid/verify-link with the bearer token to stamp the profile.
  return bounceTo(req, nextPath, {
    orcid_oauth: "verified",
    orcid: verifiedOrcid,
    name: verifiedName || undefined,
  });
}
