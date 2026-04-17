import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BATCH = 20;

// LOTUS uses Wikidata SPARQL endpoint
async function fetchLOTUS(speciesName) {
  try {
    const genus = speciesName.split(" ")[0];
    const epithet = speciesName.split(" ")[1] || "";

    const query = `
SELECT DISTINCT ?compound ?compoundLabel ?inchikey ?cas ?activity WHERE {
  ?taxon wdt:P225 "${speciesName}" .
  ?statement ps:P703 ?taxon ;
             pq:P248 ?source .
  ?compound wdt:P703 ?taxon .
  ?compound rdfs:label ?compoundLabel .
  FILTER(LANG(?compoundLabel) = "en")
  OPTIONAL { ?compound wdt:P231 ?cas }
  OPTIONAL { ?compound wdt:P235 ?inchikey }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
}
LIMIT 30`;

    const res = await fetch(
      `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`,
      { headers: { "Accept": "application/json", "User-Agent": "GEOCON-Atlas/1.0 (research)" } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.results?.bindings || [];
  } catch { return []; }
}

// Dr. Duke's phytochemical DB via USDA
async function fetchDukeDB(speciesName) {
  try {
    const genus = speciesName.split(" ")[0];
    const epithet = speciesName.split(" ")[1] || "";
    
    const res = await fetch(
      `https://phytochem.nal.usda.gov/phytochem/chemicals/search?plant=${encodeURIComponent(genus)}+${encodeURIComponent(epithet)}&format=json`,
      { headers: { "Accept": "application/json" } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch { return []; }
}

// COCONUT (natural products DB) API
async function fetchCOCONUT(speciesName) {
  try {
    const res = await fetch(
      `https://coconut.naturalproducts.net/api/search/organisms?query=${encodeURIComponent(speciesName)}&page=1&perPage=30`,
      { headers: { "Accept": "application/json", "User-Agent": "GEOCON-Atlas/1.0" } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || data.results || [];
  } catch { return []; }
}

function classifyByName(name) {
  const n = (name || "").toLowerCase();
  if (/alkaloid|colchicine|lycorine|galanthamine|indole|purine|caffeine|morphine|solanine|tomatine|berberine/.test(n)) return "alkaloid";
  if (/flavon|quercetin|kaempferol|rutin|luteolin|apigenin|catechin|anthocyan|isoflavone|naringenin/.test(n)) return "flavonoid";
  if (/gibberellin|terpene|terpenoid|diterpene|monoterpene|sesquiterp|limonene|linalool|geraniol|camphor|carotene|carotenoid/.test(n)) return "terpenoid";
  if (/phenol|caffeic|ferulic|chlorogenic|rosmarinic|vanillin|eugenol|benzoic|cinnamic|coumarin|lignin/.test(n)) return "phenolic";
  if (/saponin|glycyrrhizin|digitonin|avenacin/.test(n)) return "saponin";
  if (/glycoside|glucoside|galactoside|rhamnoside|arabinoside/.test(n)) return "glycoside";
  if (/sterol|steroid|sitosterol|stigmasterol|cholesterol|diosgenin|hecogenin/.test(n)) return "steroid";
  if (/amino acid|\balanine\b|\bglycine\b|\bleucine\b|\bproline\b|\bserine\b|\bthreonine\b/.test(n)) return "amino acid";
  return "other";
}

export async function GET(req) {
  const url = new URL(req.url);
  const secret = req.headers.get("x-cron-secret") || url.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const batch = parseInt(url.searchParams.get("batch") || "0");
  const source = url.searchParams.get("src") || "coconut"; // coconut | lotus
  const log = { batch, source, processed: 0, added: 0, not_found: 0, errors: [] };

  const { data: species } = await sb
    .from("species")
    .select("id, accepted_name")
    .order("id")
    .range(batch * BATCH, (batch + 1) * BATCH - 1);

  if (!species?.length) return Response.json({ ...log, message: "empty batch" });

  // Get existing metabolite names per species to avoid duplicates
  const { data: existing } = await sb.from("metabolites").select("species_id, compound_name");
  const existingMap = {};
  for (const m of existing || []) {
    if (!existingMap[m.species_id]) existingMap[m.species_id] = new Set();
    existingMap[m.species_id].add((m.compound_name || "").toLowerCase());
  }

  for (const sp of species) {
    try {
      let results = [];

      if (source === "lotus") {
        const raw = await fetchLOTUS(sp.accepted_name);
        results = raw.map(r => ({
          compound_name: r.compoundLabel?.value || "",
          cas_number: r.cas?.value || null,
          activity_category: classifyByName(r.compoundLabel?.value || ""),
        })).filter(r => r.compound_name && r.compound_name.length > 2);
      } else {
        // COCONUT
        const raw = await fetchCOCONUT(sp.accepted_name);
        // If no results try genus only
        const data = raw.length ? raw : await fetchCOCONUT(sp.accepted_name.split(" ")[0]);
        results = data.map(r => ({
          compound_name: r.name || r.iupac_name || r.molecule_name || "",
          compound_class: r.class_name || null,
          reported_activity: r.biological_activity || null,
          activity_category: classifyByName(r.name || r.iupac_name || ""),
        })).filter(r => r.compound_name && r.compound_name.length > 2);
      }

      if (!results.length) {
        log.not_found++;
        log.processed++;
        await new Promise(r => setTimeout(r, 300));
        continue;
      }

      const existingNames = existingMap[sp.id] || new Set();
      const toInsert = [];
      const seen = new Set();

      for (const r of results.slice(0, 20)) {
        const nameLow = r.compound_name.toLowerCase();
        if (existingNames.has(nameLow) || seen.has(nameLow)) continue;
        seen.add(nameLow);

        toInsert.push({
          id: crypto.randomUUID(),
          species_id: sp.id,
          compound_name: r.compound_name.slice(0, 200),
          compound_class: r.compound_class || null,
          reported_activity: r.reported_activity || null,
          activity_category: r.activity_category || "other",
          cas_number: r.cas_number || null,
          evidence: "Early research",
          confidence: 0.70,
          source: source === "lotus" ? "LOTUS/Wikidata" : "COCONUT",
        });
      }

      if (toInsert.length > 0) {
        const { error } = await sb.from("metabolites").insert(toInsert);
        if (error) log.errors.push(`${sp.accepted_name}: ${error.message}`);
        else log.added += toInsert.length;
      }

      log.processed++;
      await new Promise(r => setTimeout(r, 800));
    } catch (e) {
      log.errors.push(`${sp.accepted_name}: ${e.message}`);
      log.processed++;
    }
  }

  return Response.json(log);
}
