// v4.2-b — Voice memo Whisper transcribe cron.
//
// Pulls a small batch of field_observations rows that have voice_url
// set but voice_transcript null, downloads each audio blob from
// Supabase Storage (the voice_url is a signed/public URL), POSTs to
// OpenAI Whisper, writes the transcript back via set_voice_transcript.
//
// Env-gated: requires OPENAI_API_KEY. Returns 503 if missing so the
// cron run is a silent no-op rather than a hard failure.
//
// Auth: Bearer CRON_SECRET.

import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.invalid";
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY || "service";
const CRON_SECRET   = process.env.CRON_SECRET;
const OPENAI_KEY    = process.env.OPENAI_API_KEY || "";
const WHISPER_MODEL = process.env.WHISPER_MODEL || "whisper-1";

function authorized(req) {
  const h = req.headers.get("authorization") || "";
  const tok = h.startsWith("Bearer ") ? h.slice(7) : null;
  return !!(CRON_SECRET && tok === CRON_SECRET);
}

async function transcribe(audioBuffer, filename) {
  const form = new FormData();
  form.append("model", WHISPER_MODEL);
  form.append("file", new Blob([audioBuffer]), filename || "audio.webm");
  const r = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_KEY}` },
    body: form,
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Whisper ${r.status}: ${t.slice(0, 300)}`);
  }
  const j = await r.json();
  return j.text || "";
}

export async function GET(req) {
  if (!authorized(req)) return new Response("unauthorized", { status: 401 });
  if (!OPENAI_KEY) {
    return Response.json({
      ok: false,
      error: "OPENAI_API_KEY not configured",
      hint: "Set OPENAI_API_KEY env var on Vercel to activate voice transcription.",
    }, { status: 503 });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const url = new URL(req.url);
  const max = Math.min(50, parseInt(url.searchParams.get("max") || "10", 10) || 10);

  const { data: pending, error } = await admin.rpc("pending_voice_transcriptions", { p_limit: max });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!Array.isArray(pending) || pending.length === 0) {
    return Response.json({ processed: 0, message: "no pending voice memos" });
  }

  let done = 0, failed = 0;
  for (const row of pending) {
    try {
      const audioRes = await fetch(row.voice_url);
      if (!audioRes.ok) throw new Error(`download ${audioRes.status}`);
      const buf = Buffer.from(await audioRes.arrayBuffer());
      const filename = row.voice_url.split("/").pop() || "audio.webm";
      const text = await transcribe(buf, filename);
      await admin.rpc("set_voice_transcript", {
        p_observation_id: row.id,
        p_transcript: text,
        p_model: WHISPER_MODEL,
      });
      done++;
    } catch (e) {
      failed++;
    }
  }

  return Response.json({ processed: pending.length, transcribed: done, failed });
}

export const POST = GET;
