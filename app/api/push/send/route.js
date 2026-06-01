// Internal endpoint that fans out a web push to all of a user's
// registered subscriptions. Called by:
//   1. The DB trigger on notifications INSERT (via pg_net, with
//      PUSH_INTERNAL_SECRET in the Authorization header).
//   2. Manually for testing with ?secret=<PUSH_INTERNAL_SECRET>.
//
// Body:
//   { recipient_user_id: uuid, title, body, tag?, url?, payload? }
// Payload is forwarded verbatim to the service worker as `data`.
//
// 410 Gone / 404 responses from the push service mean the subscription
// is dead — we prune those rows so subsequent sends don't waste a call.

import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const ANON_URL            = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY         = process.env.SUPABASE_SERVICE_ROLE_KEY;
const INTERNAL_SECRET     = process.env.PUSH_INTERNAL_SECRET;
const VAPID_PUBLIC_KEY    = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY   = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT       = process.env.VAPID_SUBJECT || "mailto:alpaslansevket@gmail.com";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  } catch (e) {
    // Bad key format — keep going so the endpoint still 503s cleanly.
    console.warn("[push/send] setVapidDetails failed:", e?.message);
  }
}

function authorized(req) {
  const h = req.headers.get("authorization") || "";
  const fromHeader = h.startsWith("Bearer ") ? h.slice(7) : null;
  let fromQuery = null;
  try { fromQuery = new URL(req.url).searchParams.get("secret"); } catch { /* */ }
  return !!INTERNAL_SECRET && (fromHeader === INTERNAL_SECRET || fromQuery === INTERNAL_SECRET);
}

export async function POST(req) {
  if (!authorized(req)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!ANON_URL || !SERVICE_KEY) {
    return Response.json({ error: "supabase env missing" }, { status: 503 });
  }
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return Response.json({ error: "vapid keys missing" }, { status: 503 });
  }

  let body;
  try { body = await req.json(); }
  catch { return Response.json({ error: "invalid json" }, { status: 400 }); }

  const recipient = body?.recipient_user_id;
  const title = body?.title;
  if (!recipient || !title) {
    return Response.json({ error: "recipient_user_id and title required" }, { status: 400 });
  }

  const admin = createClient(ANON_URL, SERVICE_KEY, { auth: { persistSession: false } });

  const { data: subs, error: subErr } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, keys")
    .eq("user_id", recipient);

  if (subErr) return Response.json({ error: subErr.message }, { status: 500 });
  if (!subs || subs.length === 0) {
    return Response.json({ ok: true, sent: 0, pruned: 0, note: "no subscriptions" });
  }

  // Payload that lands in the service worker's `push` event.
  const swPayload = JSON.stringify({
    title,
    body: body.body || "",
    tag: body.tag || "geocon",
    url: body.url || "/geocon",
    data: body.payload || {},
  });

  const pruneIds = [];
  let sent = 0;
  let failed = 0;

  // Fan out sequentially — typical user has 1–3 subs, latency is fine.
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: sub.keys },
        swPayload,
        { TTL: 86400 } // 24h
      );
      sent++;
    } catch (e) {
      // 404/410 → endpoint gone, prune. Other errors → log but keep row.
      const status = e?.statusCode;
      if (status === 404 || status === 410) {
        pruneIds.push(sub.id);
      } else {
        failed++;
        console.warn("[push/send] webpush error", { status, msg: e?.message });
      }
    }
  }

  if (pruneIds.length > 0) {
    await admin.from("push_subscriptions").delete().in("id", pruneIds);
  }

  return Response.json({
    ok: failed === 0,
    sent,
    pruned: pruneIds.length,
    failed,
    total: subs.length,
  });
}

// GET so a quick health-check / manual smoke-test is possible.
// (Doesn't fan out — just verifies VAPID configuration.)
export async function GET(req) {
  if (!authorized(req)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  return Response.json({
    ok: true,
    vapid_configured: !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY),
    public_key_prefix: VAPID_PUBLIC_KEY ? VAPID_PUBLIC_KEY.slice(0, 12) + "…" : null,
  });
}
