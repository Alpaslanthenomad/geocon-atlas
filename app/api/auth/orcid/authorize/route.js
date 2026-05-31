// ORCID OAuth verification — STEP 1: redirect user to ORCID's
// /oauth/authorize endpoint.
//
// We use scope=/authenticate (the minimal scope) which just confirms
// that the visitor owns the ORCID iD they're presenting. We don't ask
// for read-limited or activities/update — the public API already gives
// us everything we need, and broader scopes spook scientists.
//
// Env vars required (set in Vercel project settings):
//   ORCID_CLIENT_ID         — from orcid.org/developer-tools
//   ORCID_REDIRECT_URI      — must match the redirect URI in the ORCID app
//   ORCID_ENV               — "production" (default) or "sandbox"
//
// The state param carries:
//   nonce.next                where `next` is the post-verify route (default /geocon/welcome)
// Validated on the callback side.

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "orcid_oauth_state";
const STATE_TTL_SECONDS = 600; // 10 min

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
    return Response.json(
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
  // Cap the next path to internal routes only
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/geocon/welcome";

  // CSRF protection: random nonce stored in HttpOnly cookie, replayed via state
  const nonce = randomBytes(24).toString("base64url");
  const state = `${nonce}.${encodeURIComponent(safeNext)}`;

  cookies().set(STATE_COOKIE, nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: STATE_TTL_SECONDS,
    path: "/",
  });

  const url = new URL(authorizeUrl(env));
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "/authenticate");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);

  redirect(url.toString());
}
