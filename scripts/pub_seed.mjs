// Phase 1 substrate seeding: link real publications onto conservation-relevant geophytes.
// Source: OpenAlex (open, CC0-ish), filtered to works whose TITLE contains the exact
// binomial (high precision -- a paper with the full species name in its title is about
// that species; no fuzzy/genus-only guessing). Targets the IUCN-assessed set. Emits a
// reviewable JSON; the apply step is separate + deduped. Nothing fabricated.
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const line of fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const MAIL = "atlas@vennbioventures.com";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cleanDoi = (d) => (d ? String(d).replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").toLowerCase() : null);

// load the conservation-relevant target set (IUCN-assessed geophytes)
console.error("loading IUCN-assessed geophytes…");
const targets = [];
for (let from = 0; ; from += 1000) {
  const { data, error } = await sb.from("species").select("id, accepted_name").eq("vertical_id", "geophytes").not("iucn_status", "is", null).range(from, from + 999);
  if (error) { console.error("db", error.message); break; }
  if (!data || !data.length) break;
  for (const s of data) if (s.accepted_name && /^[A-Z][a-z]+ [a-z]/.test(s.accepted_name)) targets.push(s);
  if (data.length < 1000) break;
}
console.error("targets:", targets.length);

const rows = [];
let done = 0, withPubs = 0;
async function fetchOne(s) {
  const bino = s.accepted_name.split(/\s+/).slice(0, 2).join(" ");
  try {
    const url = "https://api.openalex.org/works?filter=title.search:" + encodeURIComponent(bino) + "&per-page=15&mailto=" + MAIL;
    const j = await (await fetch(url, { headers: { "User-Agent": "GEOCON-Atlas/1.0 (mailto:" + MAIL + ")" } })).json();
    const hits = (j.results || []).filter((w) => (w.title || "").toLowerCase().includes(bino.toLowerCase())).slice(0, 8);
    if (hits.length) withPubs++;
    for (const w of hits) {
      rows.push({
        species_id: s.id,
        title: (w.title || w.display_name || "").slice(0, 500),
        authors: (w.authorships || []).slice(0, 6).map((a) => a.author?.display_name).filter(Boolean).join(", ").slice(0, 400),
        doi: cleanDoi(w.doi),
        year: w.publication_year || null,
        journal: (w.primary_location?.source?.display_name || "").slice(0, 250) || null,
        openalex_id: (w.id || "").replace("https://openalex.org/", "") || null,
        source: "OpenAlex (title-exact)",
        category: "literature",
      });
    }
  } catch (e) {}
  if (++done % 200 === 0) console.error("  …", done, "/", targets.length, "rows", rows.length);
}
const CONC = 5;
for (let i = 0; i < targets.length; i += CONC) {
  await Promise.all(targets.slice(i, i + CONC).map(fetchOne));
  await sleep(60);
}

// dedupe by (species_id, doi) within the pull
const seen = new Set();
const dedup = rows.filter((r) => { const k = r.species_id + "|" + (r.doi || r.title); if (seen.has(k)) return false; seen.add(k); return true; });
fs.writeFileSync(new URL("./pub_updates.json", import.meta.url), JSON.stringify({ rows: dedup }, null, 0));
console.error("=== DONE === targets:", targets.length, "| species with >=1 title-exact pub:", withPubs, "| total pub rows:", dedup.length);
