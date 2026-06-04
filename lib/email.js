// v5.2-a — Resend email wrapper.
//
// One blessed sendEmail() function. Env-gated by RESEND_API_KEY; if
// the key is missing the function silently no-ops and returns
// { ok: false, skipped: true } so the caller (cron, trigger) can
// continue without throwing.
//
// All outbound transactional email lands here so we keep a single
// source of truth for "from" address, brand chrome, and unsubscribe
// footers.

const RESEND_KEY = process.env.RESEND_API_KEY || "";
const EMAIL_FROM = process.env.EMAIL_FROM || "GEOCON Atlas <geocon@vennbioventures.com>";
const SITE_URL   = process.env.NEXT_PUBLIC_SITE_URL || "https://atlas.vennbioventures.com";

/**
 * @param {object} args
 * @param {string|string[]} args.to        — recipient address(es)
 * @param {string} args.subject
 * @param {string} args.html               — HTML body
 * @param {string} [args.text]             — plain-text fallback
 * @param {string} [args.from]             — override default sender
 * @param {string} [args.replyTo]          — reply-to address
 * @returns {Promise<{ok: boolean, id?: string, error?: string, skipped?: boolean}>}
 */
export async function sendEmail({ to, subject, html, text, from, replyTo }) {
  if (!RESEND_KEY) {
    return { ok: false, skipped: true, error: "RESEND_API_KEY not configured" };
  }
  if (!to || !subject || (!html && !text)) {
    return { ok: false, error: "to + subject + (html|text) required" };
  }

  const body = {
    from: from || EMAIL_FROM,
    to: Array.isArray(to) ? to : [to],
    subject,
    html: html || `<pre>${escapeHtml(text)}</pre>`,
    text: text || stripHtml(html),
  };
  if (replyTo) body.reply_to = replyTo;

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      const t = await r.text();
      return { ok: false, error: `Resend ${r.status}: ${t.slice(0, 300)}` };
    }
    const j = await r.json();
    return { ok: true, id: j?.id };
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }
}

/**
 * Wrap a body in the GEOCON brand chrome (minimal HTML, text-mostly,
 * inline CSS for client compatibility). Returns the full HTML string.
 */
export function brandEmail({ title, bodyHtml, footerLink, ctaUrl, ctaLabel }) {
  return `<!doctype html>
<html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" />
<title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#f5f2eb;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;color:#1a1816;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f5f2eb;padding:24px 12px;">
  <tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;border:1px solid #ece9e2;">
      <tr><td style="padding:18px 22px;border-bottom:1px solid #ece9e2;">
        <div style="font-family:Georgia,serif;font-size:16px;font-weight:700;color:#1a1816;letter-spacing:-0.01em;">GEOCON Atlas</div>
        <div style="font-size:10px;color:#88817a;letter-spacing:1.2px;text-transform:uppercase;margin-top:2px;">Venn BioVentures · Conservation commons</div>
      </td></tr>
      <tr><td style="padding:22px;font-size:14px;line-height:1.6;color:#1a1816;">
        <h2 style="font-family:Georgia,serif;font-size:20px;font-weight:700;margin:0 0 12px 0;letter-spacing:-0.01em;">${escapeHtml(title)}</h2>
        ${bodyHtml}
        ${ctaUrl ? `<p style="margin:18px 0 0 0;"><a href="${escapeAttr(ctaUrl)}" style="display:inline-block;padding:10px 18px;background:#3C3489;color:#ffffff;text-decoration:none;border-radius:7px;font-weight:700;font-size:13px;letter-spacing:0.3px;">${escapeHtml(ctaLabel || "Open in GEOCON")}</a></p>` : ""}
      </td></tr>
      <tr><td style="padding:14px 22px;border-top:1px solid #ece9e2;font-size:11px;color:#88817a;line-height:1.5;">
        ${footerLink || `<a href="${SITE_URL}/geocon/profile" style="color:#534AB7;text-decoration:none;">Manage notification preferences</a> · <a href="${SITE_URL}" style="color:#88817a;text-decoration:none;">atlas.vennbioventures.com</a>`}
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

function escapeHtml(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function escapeAttr(s) { return escapeHtml(s); }
function stripHtml(s) { return String(s ?? "").replace(/<[^>]+>/g, ""); }
