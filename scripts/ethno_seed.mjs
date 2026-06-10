// ETHNOFLORA seed importer (READ-ONLY external pull; emits a reviewable JSON, no DB writes).
// Two real, licence-clean signals from Wikidata (CC0), normalised through GBIF (CC-BY):
//   A) GLOBAL: taxa that are the SOURCE OF a product (P1672) AND carry an IUCN status (P141)
//      -- the conservation<->value intersection that is the GEOCON mission (threatened + useful).
//   B) ANATOLIA ANCHOR: taxa endemic to Turkey (P183 = Q43).
// GBIF derives family + native distribution; endemism = native-country set is a singleton.
// Each row keeps provenance (Wikidata Q-id, GBIF key, the sourced product, IUCN). Nothing fabricated.
import fs from "node:fs";

const UA = "GEOCON-Atlas-ETHNOFLORA/1.0 (https://atlas.vennbioventures.com; mailto:atlas@vennbioventures.com)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const qid = (u) => (u ? String(u).split("/").pop() : null);

async function getJson(url) {
  const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (!r.ok) throw new Error(r.status + "");
  return r.json();
}
async function sparql(q) {
  const j = await getJson("https://query.wikidata.org/sparql?format=json&query=" + encodeURIComponent(q));
  return j.results.bindings;
}

// Clean MEDICINAL signal: a plant that is the botanical SOURCE OF a medication (P1672 -> Q12140).
// This is the real pharmacopeia (galantamine, morphine, quinine, colchicine, digoxin...), plants only.
const Q_MED = `SELECT DISTINCT ?taxon ?taxonName ?gbif ?iucn ?iucnLabel ?prodLabel WHERE {
  ?taxon wdt:P31 wd:Q16521 ; wdt:P225 ?taxonName ; wdt:P846 ?gbif ; wdt:P1672 ?prod .
  ?prod wdt:P31/wdt:P279* wd:Q12140 .
  OPTIONAL { ?taxon wdt:P141 ?iucn . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". ?iucn rdfs:label ?iucnLabel . ?prod rdfs:label ?prodLabel . }
} LIMIT 1500`;

console.error("querying Wikidata (plants that source a medication)…");
const g = await sparql(Q_MED);
console.error("medication-source rows:", g.length);

const byName = new Map();
for (const b of g) {
  const name = b.taxonName?.value; if (!name) continue;
  const o = byName.get(name) || { name, q: qid(b.taxon?.value), gbif: b.gbif?.value || null, iucn: qid(b.iucn?.value), iucn_label: b.iucnLabel?.value || null, products: new Set(), turkey_endemic_wd: false };
  if (b.prodLabel?.value) o.products.add(b.prodLabel.value);
  if (!o.iucn && b.iucn) { o.iucn = qid(b.iucn.value); o.iucn_label = b.iucnLabel?.value || null; }
  byName.set(name, o);
}
console.error("distinct medicinal taxa:", byName.size);

const MED = /.*/;   // every row here sources a medication => medicinal by construction
const list = [...byName.values()];
const out = [];
let done = 0;
async function normalise(t) {
  try {
    let g = null;
    try { g = await getJson("https://api.gbif.org/v1/species/" + t.gbif); } catch (e) {}
    if (!g || !(g.key || g.nubKey)) g = await getJson("https://api.gbif.org/v1/species/match?name=" + encodeURIComponent(t.name) + "&kingdom=Plantae");
    const key = g.usageKey || g.nubKey || g.key || null;
    let native = [];
    if (key) {
      try {
        const dist = await getJson("https://api.gbif.org/v1/species/" + key + "/distributions?limit=100");
        native = [...new Set((dist.results || []).filter((d) => d.establishmentMeans === "NATIVE" && d.country).map((d) => d.country))].sort();
      } catch (e) {}
    }
    const canon = g.canonicalName || g.scientificName || t.name;
    const products = [...t.products];
    out.push({
      name: canon, genus: canon.split(" ")[0], family: g.family || null, gbif_key: key, gbif_status: g.status || g.taxonomicStatus || null,
      iucn: t.iucn, iucn_label: t.iucn_label, wikidata_q: t.q, medications: products,
      medicinal: true,
      native_countries: native, endemic: native.length === 1, turkey_native: native.includes("TR"), turkey_endemic_wd: t.turkey_endemic_wd,
    });
  } catch (e) { out.push({ name: t.name, gbif_key: null, error: String(e.message || e) }); }
  if (++done % 50 === 0) console.error("  …", done, "/", list.length);
}
// light concurrency
const CONC = 6;
for (let i = 0; i < list.length; i += CONC) {
  await Promise.all(list.slice(i, i + CONC).map(normalise));
  await sleep(40);
}

const withGbif = out.filter((o) => o.gbif_key);
const med = out.filter((o) => o.medicinal);
const endemic = out.filter((o) => o.endemic);
const trLinked = out.filter((o) => o.turkey_native || o.turkey_endemic_wd);
const outPath = new URL("./ethno_seed.json", import.meta.url);
console.error("=== DONE ===");
console.error("total:", out.length, "| with GBIF:", withGbif.length, "| medicinal-tagged:", med.length, "| endemic(singleton):", endemic.length, "| Turkey-linked:", trLinked.length, "| with IUCN:", out.filter((o) => o.iucn).length);
fs.writeFileSync(outPath, JSON.stringify(out, null, 1));
console.error("wrote", outPath.pathname);
