// v4.4-a — Bluesky + Mastodon autopost cron.
//
// Daily fan-out of new Discovery Feed events to:
//   - Bluesky (atproto.com) — via BSKY_HANDLE + BSKY_PASSWORD app pass
//   - Mastodon — via MASTODON_INSTANCE + MASTODON_TOKEN
//
// Picks events from get_discovery_feed (last 30d), filters to high-
// signal kinds (iucn_change, peer_endorsed+ outcome, publication_high,
// assessment_published), checks social_post_log to skip already-sent,
// posts a short item with link back to the species/program/etc page,
// records each successful post in social_post_log.
//
// Env-gated: each provider independently. If a provider's credentials
// are unset, that fan-out is silently skipped — useful for staging.
//
// Auth: Bearer CRON_SECRET.

import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.invalid";
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY || "service";
const CRON_SECRET   = process.env.CRON_SECRET;
const SITE          = process.env.NEXT_PUBLIC_SITE_URL || "https://atlas.vennbioventures.com";

const BSKY_HANDLE   = process.env.BSKY_HANDLE || "";
const BSKY_PASSWORD = process.env.BSKY_PASSWORD || "";

const MASTODON_INSTANCE = process.env.MASTODON_INSTANCE || "";  // e.g. https://fediscience.org
const MASTODON_TOKEN    = process.env.MASTODON_TOKEN    || "";

const HIGH_SIGNAL_KINDS = new Set([
  "iucn_change",
  "outcome_peer_endorsed",
  "outcome_org_declared",
  "outcome_venn_verified",
  "assessment_published",
  "publication_high_citation",
]);

function authorized(req) {
  const h = req.headers.get("authorization") || "";
  const tok = h.startsWith("Bearer ") ? h.slice(7) : null;
  return !!(CRON_SECRET && tok === CRON_SECRET);
}

function signature(ev) {
  return `${ev.kind}:${ev.ref_id || ev.id || ""}:${(ev.happened_at || "").slice(0, 10)}`;
}

function eventToText(ev) {
  const name = ev.species_name || ev.title || ev.subject || "—";
  const tail = ` · GEOCON Atlas`;
  switch (ev.kind) {
    case "iucn_change":
      return `${name} reassessed → ${ev.new_status || "?"} (was ${ev.old_status || "?"}).${tail}`;
    case "outcome_peer_endorsed":
    case "outcome_org_declared":
    case "outcome_venn_verified":
      return `Conservation outcome (${ev.kind.replace("outcome_", "")}): ${ev.title || name}.${tail}`;
    case "assessment_published":
      return `New IUCN assessment published: ${name}.${tail}`;
    case "publication_high_citation":
      return `Notable publication: ${ev.title?.slice(0, 160) || name}${tail}`;
    default:
      return `${ev.kind}: ${name}${tail}`;
  }
}

function eventUrl(ev) {
  if (ev.species_id)   return `${SITE}/geocon/species/${encodeURIComponent(ev.species_id)}`;
  if (ev.ref_kind === "program")     return `${SITE}/geocon/programs/${encodeURIComponent(ev.ref_id)}`;
  if (ev.ref_kind === "publication") return `${SITE}/geocon/publications/${encodeURIComponent(ev.ref_id)}`;
  if (ev.ref_kind === "outcome")     return `${SITE}/geocon/outcomes`;
  return `${SITE}/geocon/feed`;
}

async function postBluesky(text, url) {
  if (!BSKY_HANDLE || !BSKY_PASSWORD) return null;
  // Auth
  const sess = await fetch("https://bsky.social/xrpc/com.atproto.server.createSession", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: BSKY_HANDLE, password: BSKY_PASSWORD }),
  });
  if (!sess.ok) return null;
  const session = await sess.json();
  // Post
  const body = text.slice(0, 270) + (text.length > 270 ? "…" : "") + `\n${url}`;
  const res = await fetch("https://bsky.social/xrpc/com.atproto.repo.createRecord", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.accessJwt}`,
    },
    body: JSON.stringify({
      repo: session.did,
      collection: "app.bsky.feed.post",
      record: { text: body, createdAt: new Date().toISOString() },
    }),
  });
  if (!res.ok) return null;
  const j = await res.json();
  return `https://bsky.app/profile/${BSKY_HANDLE}/post/${(j.uri || "").split("/").pop()}`;
}

async function postMastodon(text, url) {
  if (!MASTODON_INSTANCE || !MASTODON_TOKEN) return null;
  const status = text.slice(0, 480) + (text.length > 480 ? "…" : "") + `\n\n${url}`;
  const res = await fetch(`${MASTODON_INSTANCE.replace(/\/$/, "")}/api/v1/statuses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MASTODON_TOKEN}`,
    },
    body: JSON.stringify({ status, visibility: "public" }),
  });
  if (!res.ok) return null;
  const j = await res.json();
  return j.url || null;
}

export async function GET(req) {
  if (!authorized(req)) return new Response("unauthorized", { status: 401 });
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  const { data: events, error } = await admin.rpc("get_discovery_feed", { p_limit: 50 });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  const filtered = (events || []).filter((e) => HIGH_SIGNAL_KINDS.has(e.kind));

  let posted = { bluesky: 0, mastodon: 0 };
  let skipped = 0;
  const errors = [];

  for (const ev of filtered) {
    const sig = signature(ev);
    const text = eventToText(ev);
    const url  = eventUrl(ev);

    // Bluesky
    try {
      const { data: was } = await admin.rpc("was_posted", { p_provider: "bluesky", p_signature: sig });
      if (!was && BSKY_HANDLE) {
        const postUrl = await postBluesky(text, url);
        if (postUrl) {
          await admin.rpc("mark_posted", { p_provider: "bluesky", p_signature: sig, p_post_url: postUrl });
          posted.bluesky++;
        }
      } else if (was) { skipped++; }
    } catch (e) { errors.push(`bsky: ${e.message}`); }

    // Mastodon
    try {
      const { data: was } = await admin.rpc("was_posted", { p_provider: "mastodon", p_signature: sig });
      if (!was && MASTODON_INSTANCE) {
        const postUrl = await postMastodon(text, url);
        if (postUrl) {
          await admin.rpc("mark_posted", { p_provider: "mastodon", p_signature: sig, p_post_url: postUrl });
          posted.mastodon++;
        }
      } else if (was) { skipped++; }
    } catch (e) { errors.push(`mast: ${e.message}`); }
  }

  return Response.json({
    candidates: filtered.length,
    posted,
    skipped,
    errors: errors.slice(0, 5),
  });
}

export const POST = GET;
