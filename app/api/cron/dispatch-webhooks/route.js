// U1.a — Webhook dispatcher cron.
//
// Drains webhook_deliveries.status='pending' rows, POSTs to each
// channel.url, stamps delivery status. Slack & Discord both accept
// the same compact "text" JSON envelope, so we send one body shape
// across providers.
//
// Auth: CRON_SECRET (Bearer). Vercel cron schedule lives in
// vercel.json; manual test via ?secret= for dev.

import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.invalid");
const KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || "service");
const CRON_SECRET = process.env.CRON_SECRET;

function authorized(req) {
  const h = req.headers.get("authorization") || "";
  const fromHeader = h.startsWith("Bearer ") ? h.slice(7) : null;
  let fromQuery = null;
  try { fromQuery = new URL(req.url).searchParams.get("secret"); } catch {}
  return !!CRON_SECRET && (fromHeader === CRON_SECRET || fromQuery === CRON_SECRET);
}

function formatText(payload) {
  const t = payload?.type || "geocon";
  const actor = payload?.actor_name || "GEOCON Atlas";
  const body = payload?.payload?.body_excerpt
    || payload?.payload?.title
    || payload?.payload?.species_name
    || "";
  const ts = payload?.created_at ? new Date(payload.created_at).toISOString() : new Date().toISOString();
  return {
    text: `*${actor}* — ${t.replace(/_/g, " ")}${body ? `\n> ${body}` : ""}\n_${ts}_`,
    content: `**${actor}** · ${t}\n${body}`,  // Discord prefers `content`
  };
}

export async function GET(req) { return POST(req); }

export async function POST(req) {
  if (!authorized(req)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const admin = createClient(URL, KEY, { auth: { persistSession: false } });

  // Pull up to 50 pending. Cron runs every 1-5 min so backlog stays
  // shallow under normal load.
  const { data: pending, error } = await admin
    .from("webhook_deliveries")
    .select("id, payload, channel_id, attempt_count, webhook_channels!inner(url, provider, is_active)")
    .eq("status", "pending")
    .eq("webhook_channels.is_active", true)
    .order("created_at", { ascending: true })
    .limit(50);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!pending || pending.length === 0) {
    return Response.json({ ok: true, drained: 0 });
  }

  let delivered = 0, failed = 0;
  for (const row of pending) {
    const channel = row.webhook_channels;
    const body = formatText(row.payload);
    const wireBody = channel.provider === "discord"
      ? { content: body.content }
      : { text: body.text };
    try {
      const r = await fetch(channel.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(wireBody),
      });
      const ok = r.ok;
      await admin.from("webhook_deliveries")
        .update({
          status: ok ? "delivered" : "failed",
          attempt_count: row.attempt_count + 1,
          last_attempted_at: new Date().toISOString(),
          last_error: ok ? null : `HTTP ${r.status}`,
        })
        .eq("id", row.id);
      await admin.from("webhook_channels")
        .update({
          last_delivery_at: new Date().toISOString(),
          last_delivery_status: ok ? "delivered" : `failed (HTTP ${r.status})`,
        })
        .eq("id", row.channel_id);
      if (ok) delivered++; else failed++;
    } catch (e) {
      await admin.from("webhook_deliveries")
        .update({
          status: "failed",
          attempt_count: row.attempt_count + 1,
          last_attempted_at: new Date().toISOString(),
          last_error: String(e?.message || e),
        })
        .eq("id", row.id);
      failed++;
    }
  }

  return Response.json({ ok: failed === 0, delivered, failed, total: pending.length });
}
