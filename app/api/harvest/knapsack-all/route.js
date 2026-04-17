import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fetchKNApSAcKHTML(speciesName) {
  try {
    const res = await fetch(
      `https://www.knapsackfamily.com/knapsack_core/result.php?sname=organism&word=${encodeURIComponent(speciesName)}`,
      { headers: { "User-Agent": "Mozilla/5.0 (compatible; GEOCON-Atlas/1.0; research bot)", "Accept": "text/html" } }
    );
    if (!res.ok) return [];
    const html = await res.text();
    const metabolites = [];
    const tableRegex = /<tr[^>]*>[\s\S]*?<\/tr>/gi;
    const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const rows = html.match(tableRegex) || [];
    for (const row of rows.slice(1)) {
      const cells = [];
      let cellMatch;
      const re = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      while ((cellMatch = re.exec(row)) !== null) {
        cells.push(cellMatch[1].replace(/<[^>]+>/g, "").trim());
      }
      if (cells.length >= 2 && cells[1] && cells[1].length > 2) {
        metabolites.push({ compound_name: cells[1], compound_id: cells[0] || null, reported_activity: cells[3] || null, compound_class: cells[2] || null });
      }
    }
    return metabolites;
  } catch { return []; }
}

function mapActivityCategory(compClass, activity) {
  const text = `${compClass || ""} ${activity || ""}`.toLowerCase();
  if (text.includes("alkaloid")) return "alkaloid";
  if (text.includes("flavonoid")) return "flavonoid";
  if (text.includes("terpenoid") || text.includes("terpene")) return "terpenoid";
  if (text.includes("phenolic") || text.includes("phenol")) return "phenolic";
  if (text.includes("saponin")) return "saponin";
  if (text.includes("glycoside")) return "glycoside";
  if (text.includes("steroid")) return "steroid";
  return "other";
}

export async function GET(req) {
  const url = new URL(req.url);
  const secret = req.headers.get("x-cron-secret") || url.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const log = { processed: 0, metabolites_added: 0, not_found: 0, errors: [] };

  // Fetch all species
  const { data: species } = await sb
    .from("species")
    .select("id, accepted_name")
    .order("id");

  if (!species?.length) return Response.json({ ...log, message: "no species" });

  // Get existing metabolite counts per species
  const { data: existingMets } = await sb.from("metabolites").select("species_id");
  const metCountMap = {};
  for (const m of existingMets || []) {
    metCountMap[m.species_id] = (metCountMap[m.species_id] || 0) + 1;
  }

  for (const sp of species) {
    try {
      // Skip if already has 3+ metabolites
      if ((metCountMap[sp.id] || 0) >= 3) {
        log.processed++;
        continue;
      }

      let mets = await fetchKNApSAcKHTML(sp.accepted_name);

      // Try genus only if nothing found
      if (!mets.length) {
        const genus = sp.accepted_name.split(" ")[0];
        mets = await fetchKNApSAcKHTML(genus);
        mets = mets.slice(0, 5); // limit genus-level results
      }

      if (!mets.length) {
        log.not_found++;
        log.processed++;
        await new Promise(r => setTimeout(r, 300));
        continue;
      }

      const toInsert = [];
      const seen = new Set();
      for (const m of mets.slice(0, 15)) {
        if (!m.compound_name || seen.has(m.compound_name.toLowerCase())) continue;
        seen.add(m.compound_name.toLowerCase());
        toInsert.push({
          id: crypto.randomUUID(),
          species_id: sp.id,
          compound_name: m.compound_name.slice(0, 200),
          compound_class: m.compound_class?.slice(0, 100) || null,
          reported_activity: m.reported_activity?.slice(0, 300) || null,
          activity_category: mapActivityCategory(m.compound_class, m.reported_activity),
          evidence: "Early research",
          confidence: 0.75,
          source: "KNApSAcK",
        });
      }

      if (toInsert.length > 0) {
        const { error } = await sb.from("metabolites").insert(toInsert);
        if (error) log.errors.push(`${sp.accepted_name}: ${error.message}`);
        else log.metabolites_added += toInsert.length;
      }

      log.processed++;
      await new Promise(r => setTimeout(r, 600));

    } catch (e) {
      log.errors.push(`${sp.accepted_name}: ${e.message}`);
      log.processed++;
    }
  }

  return Response.json(log);
}
