// v5.2-b — Saved search weekly digest cron.
//
// Pattern: each saved_searches row is "due" if it's been > 7 days
// since last_run_at (or never run). For each due row:
//   1) Re-run the search via run_saved_search
//   2) If new_count > last_count, enqueue a digest email
//   3) Update last_run_at + last_count
//
// Email arrival is via the email-queue cron's Resend ship.
//
// Auth: Bearer CRON_SECRET. Runs weekly Monday 09:00 UTC.

import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.invalid";
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || "service";
const CRON_SECRET  = process.env.CRON_SECRET;
const SITE         = process.env.NEXT_PUBLIC_SITE_URL || "https://atlas.vennbioventures.com";

function authorized(req) {
  const h = req.headers.get("authorization") || "";
  const tok = h.startsWith("Bearer ") ? h.slice(7) : null;
  return !!(CRON_SECRET && tok === CRON_SECRET);
}

function escapeHtml(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildBody(query, result) {
  const sp = result?.species || [];
  const pb = result?.publications || [];
  const items = [];
  if (sp.length) {
    items.push(`<p style="margin:0 0 6px 0;"><strong style="color:#534AB7;letter-spacing:0.4px;font-size:11px;text-transform:uppercase;">Species (${sp.length})</strong></p>`);
    items.push(`<ul style="margin:0 0 12px 0;padding-left:20px;">${sp.map((s) =>
      `<li style="margin:3px 0;"><em><a href="${SITE}/geocon/species/${encodeURIComponent(s.id)}" style="color:#1a1816;font-weight:700;text-decoration:none;">${escapeHtml(s.accepted_name)}</a></em>${s.iucn_status ? ` <span style="font-family:monospace;color:#888;">· ${escapeHtml(s.iucn_status)}</span>` : ""}</li>`
    ).join("")}</ul>`);
  }
  if (pb.length) {
    items.push(`<p style="margin:0 0 6px 0;"><strong style="color:#534AB7;letter-spacing:0.4px;font-size:11px;text-transform:uppercase;">Publications (${pb.length})</strong></p>`);
    items.push(`<ul style="margin:0;padding-left:20px;">${pb.map((p) =>
      `<li style="margin:3px 0;"><a href="${SITE}/geocon/publications/${encodeURIComponent(p.id)}" style="color:#1a1816;text-decoration:none;">${escapeHtml(p.title)}</a>${p.year ? ` <span style="color:#888;">(${p.year})</span>` : ""}</li>`
    ).join("")}</ul>`);
  }
  return `<p>Yeni eşleşmeler aşağıda — kayıtlı aramanız: <strong>${escapeHtml(query)}</strong></p>${items.join("")}`;
}

function buildText(query, result) {
  const sp = result?.species || [];
  const pb = result?.publications || [];
  const lines = [`Your saved search: ${query}`, ""];
  if (sp.length) {
    lines.push("SPECIES:");
    sp.forEach((s) => lines.push(`  - ${s.accepted_name}${s.iucn_status ? " (" + s.iucn_status + ")" : ""}`));
    lines.push("");
  }
  if (pb.length) {
    lines.push("PUBLICATIONS:");
    pb.forEach((p) => lines.push(`  - ${p.title}${p.year ? " (" + p.year + ")" : ""}`));
  }
  lines.push("", `View all: ${SITE}/geocon/search?q=${encodeURIComponent(query)}`);
  return lines.join("\n");
}

export async function GET(req) {
  if (!authorized(req)) return new Response("unauthorized", { status: 401 });

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const { data: due, error } = await admin.rpc("list_active_saved_searches_for_digest");
  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!Array.isArray(due) || due.length === 0) {
    return Response.json({ due: 0 });
  }

  let enqueued = 0, unchanged = 0;
  for (const ss of due) {
    try {
      const { data: result, error: runErr } = await admin.rpc("run_saved_search", { p_id: ss.id });
      if (runErr) continue;
      const matches = result?.matches || 0;
      const previous = ss.last_count || 0;

      if (matches > previous) {
        // Enqueue digest email
        await admin.rpc("enqueue_email", {
          p_user_id: ss.user_id,
          p_recipient: ss.recipient,
          p_subject: `[GEOCON] ${matches - previous} yeni eşleşme · "${ss.name || ss.query}"`,
          p_body_html: buildBody(ss.query, result),
          p_body_text: buildText(ss.query, result),
          p_kind: "saved_search_digest",
          p_dedupe_key: `digest:${ss.id}:${matches}:${new Date().toISOString().slice(0, 10)}`,
        });
        enqueued++;
      } else {
        unchanged++;
      }

      await admin.rpc("mark_saved_search_run", { p_id: ss.id, p_count: matches });
    } catch {
      /* per-search failure → skip, will retry next week */
    }
  }

  return Response.json({ due: due.length, enqueued, unchanged });
}

export const POST = GET;
