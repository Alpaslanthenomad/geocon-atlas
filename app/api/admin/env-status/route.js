// Env health check — reports which optional keys are PRESENT (boolean only,
// never the value). Bearer CRON_SECRET. Use to confirm what's wired in Vercel
// without exposing secrets. See docs/ENV.md.

export const dynamic = "force-dynamic";

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
  return Response.json({ present, missing, checked: KEYS.length });
}
export const POST = GET;
