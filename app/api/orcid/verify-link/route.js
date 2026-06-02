// Called by WelcomeRoute right after the OAuth callback returns with
// ?orcid_oauth=verified&orcid=…. Stamps profiles.orcid +
// profiles.orcid_verified_at on the caller's row via the
// link_my_orcid SECURITY DEFINER RPC. The RPC pattern bypasses RLS
// reliably and surfaces clear errors via PostgreSQL exceptions, which
// the previous `from('profiles').update(...)` path was masking.

import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function isValidOrcid(s) {
  if (!s) return false;
  return /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(s);
}

export async function POST(req) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  // We need to call link_my_orcid as the AUTHENTICATED user so that
  // auth.uid() resolves inside the SECURITY DEFINER function. That
  // means a client created with the anon key + the user's JWT, not
  // the service role (service role's auth.uid() is NULL).
  const userClient = createClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.invalid"),
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "anon"),
    {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    }
  );

  let body;
  try { body = await req.json(); } catch { body = {}; }
  const orcid = (body?.orcid || "").trim();
  if (!isValidOrcid(orcid)) {
    return Response.json({ error: "invalid_orcid" }, { status: 400 });
  }

  const { data, error } = await userClient.rpc("link_my_orcid", {
    p_orcid: orcid,
    p_researcher_id: null,
    p_set_verified: true,   // OAuth round-trip DID prove ownership
    p_set_welcomed: false,  // welcomed_at is stamped by Step 4 mission save
  });

  if (error) {
    return Response.json(
      { error: error.message?.includes("not_signed_in") ? "unauthorized" : "update_failed", detail: error.message },
      { status: error.message?.includes("not_signed_in") ? 401 : 500 }
    );
  }

  return Response.json({ ok: true, ...data });
}
