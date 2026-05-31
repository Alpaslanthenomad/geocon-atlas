// ORCID OAuth verification — STEP 1: redirect user to ORCID's
// /oauth/authorize endpoint.
//
// CSRF protection: we sign the state param with HMAC-SHA256 using the
// ORCID client secret as the key. State carries nonce.next.signature —
// callback verifies the signature without needing any cookie. This
// sidesteps Vercel edge cookie timing issues with redirect responses
// that caused state_mismatch errors with the previous cookie approach.

import { NextResponse } from "next/server";
import { randomBytes, createHmac } from "node:crypto";

export const dynamic = "force-dynamic";

function authorizeUrl(env) {
  return env === "sandbox"
    ? "https://sandbox.orcid.org/oauth/authorize"
    : "https://orcid.org/oauth/authorize";
}

function signState(payload, secret) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export async function GET(req) {
  const clientId = process.env.ORCID_CLIENT_ID;
  const clientSecret = process.env.ORCID_CLIENT_SECRET;
  const redirectUri = process.env.ORCID_REDIRECT_URI;
  const env = (process.env.ORCID_ENV || "production").toLowerCase();

  if (!clientId || !redirectUri || !clientSecret) {
    return NextResponse.json(
      {
        error: "orcid_not_configured",
        detail:
          "Set ORCID_CLIENT_ID, ORCID_CLIENT_SECRET and ORCID_REDIRECT_URI environment variables.",
      },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(req.url);
  const next = searchParams.get("next") || "/geocon/welcome";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/geocon/welcome";

  // Build signed state. Nonce defends against replay if the same
  // authorization code is captured; the timestamp lets us reject very
  // old states (10 min TTL).
  const nonce = randomBytes(12).toString("base64url");
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload = `${nonce}.${issuedAt}.${encodeURIComponent(safeNext)}`;
  const sig = signState(payload, clientSecret);
  const state = `${payload}.${sig}`;

  const url = new URL(authorizeUrl(env));
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "/authenticate");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);

  return NextResponse.redirect(url.toString(), { status: 302 });
}
