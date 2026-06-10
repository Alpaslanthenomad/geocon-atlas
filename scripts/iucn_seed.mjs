// Phase 1 substrate seeding: reconcile real IUCN Red List status onto geophyte species,
// matched by GBIF taxon key (exact, high-confidence -- no fuzzy name matching). Source:
// Wikidata (CC0) carrying P141 (IUCN status) + P846 (GBIF id). Fill-gaps only (never
// overwrites the existing curated iucn_status). Emits a reviewable updates JSON; the apply
// step is a separate, reversible DB update. Nothing fabricated.
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const line of fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const UA = "GEOCON-Atlas/1.0 (mailto:atlas@vennbioventures.com)";
const today = new Date().toISOString().slice(0, 10);

async function sparql(q) {
  const r = await fetch("https://query.wikidata.org/sparql?format=json&query=" + encodeURIComponent(q), { headers: { "User-Agent": UA, Accept: "application/sparql-results+json" } });
  if (!r.ok) throw new Error("wd " + r.status);
  return (await r.json()).results.bindings;
}
function labelToCode(l) {
  l = (l || "").toLowerCase();
  if (l.includes("critically endangered")) return "CR";
  if (l.includes("endangered")) return "EN";
  if (l.includes("vulnerable")) return "VU";
  if (l.includes("near threatened")) return "NT";
  if (l.includes("least concern")) return "LC";
  if (l.includes("data deficient")) return "DD";
  if (l.includes("extinct in the wild")) return "EW";
  if (l.includes("extinct")) return "EX";
  return null; // ignore NE / unknown
}

// 1) IUCN status item -> code map
console.error("resolving IUCN status items…");
const items = await sparql('SELECT DISTINCT ?iucn ?iucnLabel WHERE { ?t wdt:P141 ?iucn . SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } } LIMIT 80');
const qidToCode = {};
for (const b of items) { const c = labelToCode(b.iucnLabel?.value); if (c) qidToCode[b.iucn.value.split("/").pop()] = c; }
console.error("IUCN codes:", JSON.stringify(qidToCode));

// 2) gbif -> iucn code, paged
console.error("pulling Wikidata gbif->IUCN…");
const gbifToCode = new Map();
for (let off = 0; ; off += 20000) {
  const rows = await sparql("SELECT ?gbif ?iucn WHERE { ?t wdt:P846 ?gbif ; wdt:P141 ?iucn . } LIMIT 20000 OFFSET " + off);
  for (const b of rows) {
    const code = qidToCode[b.iucn.value.split("/").pop()];
    if (code && b.gbif?.value) gbifToCode.set(String(b.gbif.value), code);
  }
  console.error("  offset", off, "rows", rows.length, "map", gbifToCode.size);
  if (rows.length < 20000) break;
}

// 3) my geophyte species (id, gbif, current iucn), paged
console.error("loading geophyte species…");
const updates = [];
let matched = 0, gaps = 0, from = 0;
for (;;) {
  const { data, error } = await sb.from("species").select("id, external_ids, iucn_status").eq("vertical_id", "geophytes").range(from, from + 999);
  if (error) { console.error("db err", error.message); break; }
  if (!data || !data.length) break;
  for (const s of data) {
    const g = s.external_ids?.gbif ? String(s.external_ids.gbif) : null;
    if (!g) continue;
    const code = gbifToCode.get(g);
    if (!code) continue;
    matched++;
    if (!s.iucn_status || !String(s.iucn_status).trim()) { updates.push({ id: s.id, iucn: code }); gaps++; }
  }
  from += 1000;
  if (data.length < 1000) break;
}
fs.writeFileSync(new URL("./iucn_updates.json", import.meta.url), JSON.stringify({ retrieved: today, updates }, null, 0));
console.error("=== DONE === wikidata gbif-iucn:", gbifToCode.size, "| my species matched:", matched, "| gap-fills to apply:", gaps);
