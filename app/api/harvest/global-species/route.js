import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const REGIONS = [
  // ── WESTERN ASIA & MIDDLE EAST ──
  { country_focus:"IR", region:"Zagros Mountains", label:"Iran — Zagros", genera:["Fritillaria","Tulipa","Allium","Crocus","Iris","Eremurus","Muscari","Colchicum"], focus:"Iran endemic geophytes, Zagros biodiversity hotspot, many threatened species" },
  { country_focus:"IR", region:"Alborz Mountains", label:"Iran — Alborz", genera:["Fritillaria","Galanthus","Scilla","Ornithogalum","Tulipa","Corydalis"], focus:"Northern Iran Caspian region endemic bulbous plants" },
  { country_focus:"IQ", region:"Kurdistan Iraq", label:"Iraq — Kurdistan", genera:["Tulipa","Iris","Allium","Crocus","Merendera"], focus:"Iraqi Kurdistan endemic geophytes, Mesopotamian mountain flora" },
  { country_focus:"SY", region:"Syrian Highland", label:"Syria & Lebanon", genera:["Tulipa","Iris","Anemone","Narcissus","Sternbergia"], focus:"Levantine endemic geophytes, Syrian highland and Lebanese mountain flora" },
  { country_focus:"IL", region:"Eastern Mediterranean", label:"Israel & Palestine", genera:["Iris","Anemone","Narcissus","Tulipa","Allium","Crocus"], focus:"Eastern Mediterranean endemic geophytes, Holy Land flora" },

  // ── CENTRAL ASIA ──
  { country_focus:"KZ", region:"Kazakhstan Steppe", label:"Kazakhstan", genera:["Tulipa","Eremurus","Allium","Iris","Gagea","Bellevalia"], focus:"Central Asian steppe geophytes, Kazakh endemic species" },
  { country_focus:"UZ", region:"Uzbekistan & Tajikistan", label:"Uzbekistan/Tajikistan", genera:["Tulipa","Allium","Iris","Crocus","Eremurus","Juno"], focus:"Pamir-Alai and Tian Shan endemic geophytes" },
  { country_focus:"AF", region:"Hindu Kush", label:"Afghanistan — Hindu Kush", genera:["Tulipa","Allium","Iris","Fritillaria","Eremurus"], focus:"Afghan highland endemic geophytes, Hindu Kush biodiversity" },

  // ── CAUCASUS ──
  { country_focus:"GE", region:"Greater Caucasus", label:"Georgia & Azerbaijan", genera:["Galanthus","Fritillaria","Iris","Tulipa","Scilla","Colchicum"], focus:"Caucasian endemic geophytes, global galanthamine source" },
  { country_focus:"AM", region:"Armenian Highland", label:"Armenia", genera:["Iris","Tulipa","Crocus","Allium","Gagea","Colchicum"], focus:"Armenian highland endemic geophytes, ancient agricultural center" },

  // ── EUROPE ──
  { country_focus:"GR", region:"Greek Islands & Mainland", label:"Greece", genera:["Cyclamen","Crocus","Fritillaria","Ophrys","Orchis","Sternbergia","Colchicum"], focus:"Eastern Mediterranean endemic geophytes, Greek biodiversity" },
  { country_focus:"IT", region:"Italian Peninsula & Sicily", label:"Italy & Sicily", genera:["Fritillaria","Lilium","Cyclamen","Colchicum","Crocus","Scilla"], focus:"Italian endemic geophytes, Mediterranean biodiversity" },
  { country_focus:"ES", region:"Iberian Peninsula", label:"Spain & Portugal", genera:["Narcissus","Tulipa","Iris","Scilla","Ornithogalum","Merendera"], focus:"Iberian endemic geophytes including Narcissus diversity center" },
  { country_focus:"FR", region:"Alps & Pyrenees", label:"French Alps/Pyrenees", genera:["Lilium","Erythronium","Crocus","Narcissus","Fritillaria","Gentiana"], focus:"Alpine geophytes, mountain endemic species of Western Europe" },
  { country_focus:"HR", region:"Balkan Peninsula", label:"Balkans — Croatia/Serbia", genera:["Fritillaria","Lilium","Scilla","Colchicum","Cyclamen","Iris"], focus:"Balkan endemic geophytes, high plant diversity" },
  { country_focus:"BG", region:"Bulgaria & Romania", label:"Bulgaria & Romania", genera:["Fritillaria","Galanthus","Crocus","Scilla","Sternbergia","Corydalis"], focus:"Eastern European endemic geophytes, Carpathian and Rhodope flora" },
  { country_focus:"PT", region:"Madeira & Canary Islands", label:"Macaronesia", genera:["Narcissus","Scilla","Aichryson","Semele"], focus:"Atlantic island endemic geophytes, Macaronesian biodiversity" },

  // ── AFRICA ──
  { country_focus:"ZA", region:"Cape Floristic Region", label:"South Africa — Cape", genera:["Gladiolus","Watsonia","Lachenalia","Moraea","Ixia","Sparaxis","Babiana"], focus:"Cape biodiversity hotspot, most diverse geophyte flora on Earth" },
  { country_focus:"ZA", region:"South African Highveld", label:"South Africa — Highveld", genera:["Ornithogalum","Hypoxis","Scilla","Zantedeschia","Haemanthus"], focus:"South African geophytes with medicinal and ornamental value" },
  { country_focus:"ET", region:"Ethiopian Highlands", label:"Ethiopia & East Africa", genera:["Gladiolus","Dierama","Kniphofia","Ornithogalum","Crinum"], focus:"East African highland geophytes, Ethiopian endemic species" },
  { country_focus:"MA", region:"Atlas Mountains", label:"Morocco — Atlas", genera:["Narcissus","Tulipa","Fritillaria","Iris","Colchicum","Scilla"], focus:"North African Atlas Mountain endemic geophytes" },
  { country_focus:"MG", region:"Madagascar", label:"Madagascar", genera:["Aloe","Crinum","Haemanthus","Pancratium"], focus:"Malagasy endemic geophytes, high endemism island flora" },

  // ── SOUTH AMERICA ──
  { country_focus:"CL", region:"Chilean Mediterranean", label:"Chile — Mediterranean", genera:["Leucocoryne","Rhodophiala","Alstroemeria","Conanthera","Tecophilaea","Chloraea"], focus:"Chilean endemic geophytes, Mediterranean climate zone" },
  { country_focus:"CL", region:"Atacama & Coquimbo", label:"Chile — Atacama", genera:["Leucocoryne","Zephyranthes","Habranthus","Triteleia"], focus:"Atacama desert geophytes, extreme environment adaptation" },
  { country_focus:"PE", region:"Andean Highlands", label:"Peru & Bolivia — Andes", genera:["Hippeastrum","Alstroemeria","Bomarea","Stenomesson","Ismene"], focus:"Andean geophytes, Peru and Bolivia highland endemic species" },
  { country_focus:"BR", region:"Atlantic Forest & Cerrado", label:"Brazil", genera:["Hippeastrum","Zephyranthes","Habranthus","Rhodophiala","Nothoscordum"], focus:"Brazilian endemic geophytes, Atlantic forest and cerrado" },
  { country_focus:"AR", region:"Patagonia & Pampas", label:"Argentina", genera:["Rhodophiala","Tristagma","Zephyranthes","Habranthus","Nothoscordum"], focus:"Argentine endemic geophytes, Patagonian and Andean flora" },
  { country_focus:"CO", region:"Colombian Andes", label:"Colombia & Venezuela", genera:["Hippeastrum","Alstroemeria","Bomarea","Elleanthus"], focus:"Northern Andean endemic geophytes, tropical highland flora" },

  // ── NORTH AMERICA ──
  { country_focus:"US", region:"California & Pacific Northwest", label:"Western North America", genera:["Calochortus","Erythronium","Camassia","Fritillaria","Dichelostemma"], focus:"Western North American endemic geophytes, California biodiversity hotspot" },
  { country_focus:"US", region:"Eastern North America", label:"Eastern North America", genera:["Trillium","Erythronium","Sanguinaria","Trout Lily","Dicentra"], focus:"Eastern North American woodland geophytes, temperate forest floor species" },
  { country_focus:"MX", region:"Mexican Highlands", label:"Mexico", genera:["Tigridia","Dahlia","Polianthes","Sprekelia","Zephyranthes","Milla"], focus:"Mexican endemic geophytes, ornamental and cultural value" },

  // ── ASIA ──
  { country_focus:"CN", region:"Yunnan & Sichuan", label:"China — SW Yunnan/Sichuan", genera:["Fritillaria","Lilium","Gagea","Nomocharis","Notholirion","Paris"], focus:"Chinese Himalayan geophytes, Yunnan-Sichuan biodiversity hotspot" },
  { country_focus:"CN", region:"Northern China", label:"China — Northern Steppes", genera:["Tulipa","Allium","Iris","Gagea","Scilla"], focus:"Northern Chinese steppe geophytes, Inner Mongolia and Manchuria" },
  { country_focus:"JP", region:"Japanese Archipelago", label:"Japan", genera:["Lilium","Erythronium","Fritillaria","Scilla","Calanthe","Pleione"], focus:"Japanese endemic geophytes, island endemic flora" },
  { country_focus:"IN", region:"Himalayan Foothills", label:"India — Himalayas", genera:["Fritillaria","Lilium","Allium","Iris","Crocus","Gagea"], focus:"Himalayan geophytes, India-Nepal-Bhutan mountain flora" },
  { country_focus:"NP", region:"Nepal Himalayas", label:"Nepal & Bhutan", genera:["Lilium","Fritillaria","Nomocharis","Paris","Notholirion"], focus:"High altitude Himalayan geophytes, Nepal and Bhutan endemic species" },

  // ── OCEANIA ──
  { country_focus:"AU", region:"Australian Mediterranean", label:"Australia — SW", genera:["Haemodorum","Burchardia","Thysanotus","Sowerbaea","Caesia"], focus:"Southwest Australian endemic geophytes, extraordinary endemism" },
  { country_focus:"NZ", region:"New Zealand", label:"New Zealand", genera:["Libertia","Arthropodium","Bulbinella","Thelymitra"], focus:"New Zealand endemic geophytes, Southern Hemisphere island flora" },
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
    let text = apiData.content[0].text.trim();
    // Extract JSON array from response
    const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (jsonMatch) {
      text = jsonMatch[0];
    } else {
      text = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    }
    species = JSON.parse(text);
  } catch (e) {
    return Response.json({ error: "Parse failed", raw: apiData.content[0].text.slice(0, 400) }, { status: 500 });
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
