// Server-only Claude helper. Single Anthropic client + thin logging.
// Routes import this; client components never touch it.

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

// Prefer Haiku 4.5 — fast + cheapest. Same alias resolves to latest
// snapshot, so we don't need to bump the model ID per release.
export const DEFAULT_MODEL = "claude-haiku-4-5";

// Token-based cost estimates (USD per 1M tokens) for telemetry.
const COST = {
  "claude-haiku-4-5":  { in: 1, out: 5 },
  "claude-sonnet-4-6": { in: 3, out: 15 },
  "claude-opus-4-7":   { in: 15, out: 75 },
};

let _client = null;
export function client() {
  if (_client) return _client;
  if (!process.env.ANTHROPIC_API_KEY) return null;
  _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

export function isEnabled() {
  return !!process.env.ANTHROPIC_API_KEY;
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export function estimateCost(model, tokensIn, tokensOut) {
  const c = COST[model] || COST[DEFAULT_MODEL];
  return ((tokensIn || 0) * c.in + (tokensOut || 0) * c.out) / 1_000_000;
}

export async function logUsage({ route, userId, model, tokensIn, tokensOut, latencyMs, ok, errorText, promptHash }) {
  try {
    await supabaseAdmin.from("ai_usage_events").insert({
      route,
      user_id: userId || null,
      model,
      tokens_in: tokensIn || 0,
      tokens_out: tokensOut || 0,
      latency_ms: latencyMs || null,
      cost_usd: estimateCost(model, tokensIn, tokensOut),
      prompt_hash: promptHash || null,
      ok: ok !== false,
      error_text: errorText || null,
    });
  } catch (e) {
    // Telemetry must never break the request path.
  }
}

// Lightweight call that just asks Claude for a JSON object matching a
// caller-supplied schema. We use the prefill technique so Claude
// reliably opens with `{`, then we parse the whole reply.
export async function askJSON({ system, user, model = DEFAULT_MODEL, maxTokens = 600 }) {
  const c = client();
  if (!c) throw new Error("ANTHROPIC_API_KEY not configured");
  const started = Date.now();
  const res = await c.messages.create({
    model,
    max_tokens: maxTokens,
    system,
    messages: [
      { role: "user",      content: user },
      { role: "assistant", content: "{" },
    ],
  });
  const latency = Date.now() - started;
  const text = "{" + (res.content?.[0]?.text || "");
  let parsed = null;
  try { parsed = JSON.parse(text); } catch { /* caller decides */ }
  return {
    text,
    parsed,
    model,
    usage: res.usage,
    latencyMs: latency,
  };
}

// Long-form completion (no JSON parsing).
export async function askText({ system, user, model = DEFAULT_MODEL, maxTokens = 800 }) {
  const c = client();
  if (!c) throw new Error("ANTHROPIC_API_KEY not configured");
  const started = Date.now();
  const res = await c.messages.create({
    model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: user }],
  });
  return {
    text: res.content?.[0]?.text || "",
    model,
    usage: res.usage,
    latencyMs: Date.now() - started,
  };
}
