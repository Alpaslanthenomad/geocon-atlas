import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const REGIONS = [
  {
    country_focus: "IR",
    region: "Zagros Mountains",
    label: "Iran — Zagros",
    genera: ["Fritillaria", "Tulipa", "Allium", "Crocus", "Iris", "Eremurus", "Muscari", "Colchicum"],
    focus: "Iran endemic geophytes, high biodiversity hotspot, many threatened species"
  },
  {
    country_focus: "IR",
    region: "Alborz Mountains",
    label: "Iran — Alborz",
    genera: ["Fritillaria", "Galanthus", "Scilla", "Ornithogalum", "Tulipa", "Corydalis"],
    focus: "Northern Iran endemic bulbous plants, Caspian region"
  },
  {
    country_focus: "KZ",
    region: "Central Asia Steppe",
    label: "Central Asia",
    genera: ["Tulipa", "Eremurus", "Allium", "Iris", "Gagea", "Bellevalia"],
    focus: "Central Asian geophytes, steppes of Kazakhstan and Uzbekistan"
  },
  {
    country_focus: "GR",
    region: "Greek Mediterranean",
    label: "Greece — Mediterranean",
    genera: ["Cyclamen", "Crocus", "Fritillaria", "Ophrys", "Orchis", "Sternbergia", "Colchicum"],
    focus: "Eastern Mediterranean endemic geophytes, Greece and Aegean islands"
  },
  {
    country_focus: "ZA",
    region: "Cape Floristic Region",
    label: "South Africa — Cape",
    genera: ["Gladiolus", "Watsonia", "Lachenalia", "Moraea", "Ixia", "Sparaxis", "Babiana"],
    focus: "Cape biodiversity hotspot, South African bulbous plants"
  },
  {
    country_focus: "ZA",
    region: "South African Highveld",
    label: "South Africa — Highveld",
    genera: ["Ornithogalum", "Hypoxis", "Scilla", "Zantedeschia", "Haemanthus"],
    focus: "South African geophytes with medicinal and ornamental value"
  },
  {
    country_focus: "MX",
    region: "Mexican Highlands",
    label: "Mexico",
    genera: ["Tigridia", "Dahlia", "Polianthes", "Sprekelia", "Zephyranthes", "Habranthus"],
    focus: "Mexican endemic geophytes, ornamental and cultural value"
  },
  {
    country_focus: "ES",
    region: "Iberian Peninsula",
    label: "Spain — Iberian",
    genera: ["Narcissus", "Tulipa", "Iris", "Scilla", "Ornithogalum", "Merendera"],
    focus: "Iberian Peninsula endemic geophytes, Spain and Portugal"
  },
];

export async function GET(req) {
  const url = new URL(req.url);
  const secret = req.headers.get("x-cron-secret") || url.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const regionIndex = parseInt(url.searchParams.get("region_index") || "0");
  const speciesPerGenus = parseInt(url.searchParams.get("per_genus") || "3");

  if (regionIndex >= REGIONS.length) {
    return Response.json({ message: "All regions processed" });
  }

  const region = REGIONS[regionIndex];

  // Get existing species names to avoid duplicates
  const { data: existing } = await sb.from("species").select("accepted_name");
  const existingNames = new Set((existing || []).map(s => s.accepted_name.toLowerCase()));

  // Build prompt for Claude to generate species list
  const prompt = `You are a botanical expert specializing in geophytes (bulbous, cormous, rhizomatous, tuberous plants).

Generate a list of ${speciesPerGenus} threatened or conservation-relevant geophyte species for EACH of these genera from ${region.label}:
Genera: ${region.genera.join(", ")}
Focus: ${region.focus}

For each species provide:
- Accepted scientific name (binomial)
- IUCN status (CR, EN, VU, NT, LC, DD, or NE)
- Geophyte type (Bulbous, Cormous, Rhizomatous, or Tuberous)
- Brief habitat description (1 sentence)
- Primary market area (from: Ornamental, Cut flower, Cosmetic, Pharmaceutical, Nutraceutical, Spice/Food, Research)
- Whether endemic to region (true/false)

Prioritize:
1. Threatened species (CR, EN, VU) first
2. Species with known commercial or scientific value
3. Species not commonly in cultivation

Return ONLY valid JSON array:
[{
  "accepted_name": "Fritillaria zagrica",
  "genus": "Fritillaria",
  "family": "Liliaceae",
  "iucn_status": "EN",
  "geophyte_type": "Bulbous",
  "habitat": "Rocky limestone slopes at 1500-2500m elevation",
  "market_area": "Ornamental + Pharmaceutical",
  "endemicity_flag": true,
  "common_name": "Zagros Fritillary"
}]`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }]
    })
  });

  const apiData = await res.json();
  if (!apiData.content?.[0]?.text) {
    return Response.json({ error: "API error", details: JSON.stringify(apiData).slice(0, 200) }, { status: 500 });
  }

  let species;
  try {
    const text = apiData.content[0].text.replace(/```json|```/g, "").trim();
    species = JSON.parse(text);
  } catch (e) {
    return Response.json({ error: "Parse failed", raw: apiData.content[0].text.slice(0, 300) }, { status: 500 });
  }

  let inserted = 0, skipped = 0;
  const errors = [];
  const log = [];

  for (const sp of species) {
    if (!sp.accepted_name) continue;
    if (existingNames.has(sp.accepted_name.toLowerCase())) {
      skipped++;
      continue;
    }

    const id = `GEO-${region.country_focus}-${sp.accepted_name.replace(/\s+/g, "-").slice(0, 25)}-${Math.random().toString(36).slice(2, 6)}`;

    const { error } = await sb.from("species").insert({
      id,
      accepted_name: sp.accepted_name,
      genus: sp.genus || sp.accepted_name.split(" ")[0],
      family: sp.family || null,
      iucn_status: sp.iucn_status || null,
      geophyte_type: sp.geophyte_type || "Bulbous",
      habitat: sp.habitat || null,
      market_area: sp.market_area || null,
      endemicity_flag: sp.endemicity_flag || false,
      common_name: sp.common_name || null,
      country_focus: region.country_focus,
      region: region.region,
      confidence: 60,
      last_verified: new Date().toISOString().split("T")[0],
      decision: "Monitor",
    });

    if (error) {
      errors.push(`${sp.accepted_name}: ${error.message}`);
    } else {
      inserted++;
      existingNames.add(sp.accepted_name.toLowerCase());
      log.push({ name: sp.accepted_name, iucn: sp.iucn_status, region: region.label });
    }
  }

  return Response.json({
    region: region.label,
    region_index: regionIndex,
    next_region_index: regionIndex + 1,
    next_region: REGIONS[regionIndex + 1]?.label || "done",
    inserted,
    skipped,
    log,
    errors: errors.slice(0, 5),
  });
}
