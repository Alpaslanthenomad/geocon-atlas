// ORCID OAuth verification — STEP 1: redirect user to ORCID's
// /oauth/authorize endpoint.
//
// We use scope=/authenticate (the minimal scope) which just confirms
// that the visitor owns the ORCID iD they're presenting.
//
// IMPORTANT: We use NextResponse.redirect() + response.cookies.set()
// instead of next/navigation's redirect() + cookies().set() because
// the latter has a timing bug on Vercel edge where the cookie is
// dropped before the redirect response is sent, leading to
// state_mismatch on the callback side.

import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "orcid_oauth_state";
const STATE_TTL_SECONDS = 600;

function authorizeUrl(env) {
  return env === "sandbox"
    ? "https://sandbox.orcid.org/oauth/authorize"
    : "https://orcid.org/oauth/authorize";
}

export async function GET(req) {
  const clientId = process.env.ORCID_CLIENT_ID;
  const redirectUri = process.env.ORCID_REDIRECT_URI;
  const env = (process.env.ORCID_ENV || "production").toLowerCase();

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      {
        error: "orcid_not_configured",
        detail:
          "Set ORCID_CLIENT_ID and ORCID_REDIRECT_URI environment variables. Register an app at orcid.org/developer-tools.",
      },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(req.url);
  const next = searchParams.get("next") || "/geocon/welcome";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/geocon/welcome";

  const nonce = randomBytes(24).toString("base64url");
  const state = `${nonce}.${encodeURIComponent(safeNext)}`;

  const url = new URL(authorizeUrl(env));
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "/authenticate");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);

  // NextResponse.redirect() + response.cookies.set() is the only
  // pattern that reliably writes the cookie before the 302 is sent.
  const response = NextResponse.redirect(url.toString(), { status: 302 });
  response.cookies.set({
    name: STATE_COOKIE,
    value: nonce,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: STATE_TTL_SECONDS,
    path: "/",
  });
  return response;
}
