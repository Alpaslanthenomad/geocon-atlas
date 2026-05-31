// ORCID OAuth verification — STEP 2: handle the redirect back from
// ORCID. Verifies the HMAC-signed state, exchanges code for token,
// stamps orcid + orcid_verified_at on the signed-in user's profile.

import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const STATE_MAX_AGE_SECONDS = 600;

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

function safeEqualB64u(a, b) {
  try {
    const ba = Buffer.from(a, "base64url");
    const bb = Buffer.from(b, "base64url");
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch { return false; }
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

  // ─── Verify HMAC-signed state ────────────────────────────
  // Format: <nonce>.<issuedAt>.<urlencoded next>.<sig>
  const parts = stateParam.split(".");
  if (parts.length !== 4) {
    return bounceTo(req, "/geocon/welcome", { orcid_oauth_error: "state_mismatch" });
  }
  const [nonce, issuedAtStr, nextEncoded, providedSig] = parts;
  const payload = `${nonce}.${issuedAtStr}.${nextEncoded}`;
  const expectedSig = createHmac("sha256", clientSecret).update(payload).digest("base64url");

  if (!safeEqualB64u(providedSig, expectedSig)) {
    return bounceTo(req, "/geocon/welcome", { orcid_oauth_error: "state_mismatch" });
  }

  const issuedAt = Number(issuedAtStr);
  if (!Number.isFinite(issuedAt) || Math.floor(Date.now() / 1000) - issuedAt > STATE_MAX_AGE_SECONDS) {
    return bounceTo(req, "/geocon/welcome", { orcid_oauth_error: "state_expired" });
  }

  const nextPath = (() => {
    try {
      const decoded = decodeURIComponent(nextEncoded || "");
      return decoded.startsWith("/") && !decoded.startsWith("//") ? decoded : "/geocon/welcome";
    } catch { return "/geocon/welcome"; }
  })();

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
