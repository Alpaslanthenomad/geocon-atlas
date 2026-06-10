// Env health check — reports which optional keys are PRESENT (boolean only,
// never the value), plus a FUNCTIONAL probe that the SUPABASE_SERVICE_ROLE_KEY
// genuinely has service-role authority (auth.admin is reachable only with the
// real service key). Bearer CRON_SECRET. Never exposes any secret value.

import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CRON_SECRET = process.env.CRON_SECRET;
function authorized(req) {
  const h = req.headers.get("authorization") || "";
  const t = h.startsWith("Bearer ") ? h.slice(7) : null;
  return !!(CRON_SECRET && t === CRON_SECRET);
}

const KEYS = [
  // required
  "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "CRON_SECRET",
  // data + AI
  "IUCN_API_TOKEN", "ANTHROPIC_API_KEY", "NCBI_API_KEY", "SEMANTIC_SCHOLAR_API_KEY",
  // features
  "ZENODO_API_TOKEN", "ZENODO_BASE", "PLANTNET_API_KEY", "OPENAI_API_KEY", "WHISPER_MODEL",
  "RESEND_API_KEY", "EMAIL_FROM",
  "BSKY_HANDLE", "BSKY_PASSWORD", "MASTODON_INSTANCE", "MASTODON_TOKEN",
  // push
  "NEXT_PUBLIC_VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY", "VAPID_SUBJECT", "PUSH_INTERNAL_SECRET",
  // orcid + site
  "ORCID_CLIENT_ID", "ORCID_CLIENT_SECRET", "ORCID_REDIRECT_URI",
  "NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_SITE_ORIGIN",
];

export async function GET(req) {
  if (!authorized(req)) return new Response("unauthorized", { status: 401 });
  const present = {};
  for (const k of KEYS) present[k] = !!(process.env[k] && String(process.env[k]).trim().length > 0);
  const missing = KEYS.filter((k) => !present[k]);

  // functional probe: does SUPABASE_SERVICE_ROLE_KEY actually have service-role authority?
  let service_role_ok = null, service_role_note = null;
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && key) {
      const sb = createClient(url, key, { auth: { persistSession: false } });
      const { data, error } = await sb.auth.admin.listUsers({ page: 1, perPage: 1 });
      if (error) { service_role_ok = false; service_role_note = error.message; }
      else { service_role_ok = true; service_role_note = "auth.admin reachable — service-role confirmed"; }
    }
  } catch (e) { service_role_ok = false; service_role_note = String(e?.message || e); }

  return Response.json({ present, missing, checked: KEYS.length, service_role_ok, service_role_note });
}
export const POST = GET;
