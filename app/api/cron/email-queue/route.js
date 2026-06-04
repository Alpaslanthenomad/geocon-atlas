// v5.2-c — Email queue drain cron.
//
// Runs every 10 min, pulls up to 30 pending rows from notify_email_queue
// and ships each via Resend. Marks sent/failed via mark_email_sent.
//
// Auth: Bearer CRON_SECRET. Resend env-gated; if RESEND_API_KEY not
// set the cron is a silent no-op and rows remain pending.

import { createClient } from "@supabase/supabase-js";
import { sendEmail, brandEmail } from "../../../../lib/email";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.invalid";
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || "service";
const CRON_SECRET  = process.env.CRON_SECRET;

function authorized(req) {
  const h = req.headers.get("authorization") || "";
  const tok = h.startsWith("Bearer ") ? h.slice(7) : null;
  return !!(CRON_SECRET && tok === CRON_SECRET);
}

export async function GET(req) {
  if (!authorized(req)) return new Response("unauthorized", { status: 401 });

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const { data: rows, error } = await admin.rpc("drain_pending_emails", { p_limit: 30 });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!Array.isArray(rows) || rows.length === 0) {
    return Response.json({ drained: 0 });
  }

  let sent = 0, failed = 0;
  for (const row of rows) {
    try {
      // If the body_html came from the trigger it's a bare fragment;
      // wrap it in brand chrome. Heuristic: starts with "<p" + missing
      // <html>.
      const isBare = row.body_html && !/<html|<!DOCTYPE/i.test(row.body_html);
      const html = isBare
        ? brandEmail({ title: row.subject, bodyHtml: row.body_html })
        : row.body_html;
      const res = await sendEmail({
        to: row.recipient,
        subject: row.subject,
        html,
        text: row.body_text,
      });
      await admin.rpc("mark_email_sent", {
        p_id: row.id,
        p_ok: !!res.ok,
        p_error: res.error || null,
      });
      if (res.ok) sent++;
      else if (res.skipped) { /* RESEND_API_KEY not set; leave pending, no attempt */ }
      else failed++;
    } catch (e) {
      await admin.rpc("mark_email_sent", { p_id: row.id, p_ok: false, p_error: String(e?.message || e) });
      failed++;
    }
  }
  return Response.json({ drained: rows.length, sent, failed });
}

export const POST = GET;
