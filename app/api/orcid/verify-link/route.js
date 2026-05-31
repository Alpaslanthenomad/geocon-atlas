// Called by WelcomeRoute right after the OAuth callback returns with
// ?orcid_oauth=verified&orcid=…. The client passes its Supabase
// bearer token in the Authorization header (the same pattern as
// /api/orcid/import), and we stamp profiles.orcid +
// profiles.orcid_verified_at.
//
// Trust model: the body's `orcid` value was set by the callback after
// a real token exchange with ORCID, so we trust it for the v1 flow.
// A future hardening can sign the redirect query so the client can't
// fabricate a verified marker on its own.

import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function isValidOrcid(s) {
  if (!s) return false;
  return /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(s);
}

export async function POST(req) {
  // Authn
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData?.user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const user = userData.user;

  // Input
  let body;
  try { body = await req.json(); } catch { body = {}; }
  const orcid = (body?.orcid || "").trim();
  if (!isValidOrcid(orcid)) {
    return Response.json({ error: "invalid_orcid" }, { status: 400 });
  }

  const { error: upErr } = await admin
    .from("profiles")
    .update({
      orcid,
      orcid_verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (upErr) {
    return Response.json({ error: "update_failed", detail: upErr.message }, { status: 500 });
  }

  return Response.json({ ok: true, orcid });
}
