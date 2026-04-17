import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BATCH = 20;

// KNApSAcK species-metabolite search
async function fetchKNApSAcK(speciesName) {
  try {
    const genus = speciesName.split(" ")[0];
    const species = speciesName.split(" ")[1] || "";

    // KNApSAcK organism search API
    const res = await fetch(
      `https://www.knapsackfamily.com/knapsack_core/result.php?sname=organism&word=${encodeURIComponent(speciesName)}&display=1000&output=xml`,
      { headers: { "Accept": "application/xml, text/xml, */*" } }
    );

    if (!res.ok) return [];
    const text = await res.text();

    // Parse XML response
    const metabolites = [];
    const rowRegex = /<ROW>([\s\S]*?)<\/ROW>/g;
    let match;

    while ((match = rowRegex.exec(text)) !== null) {
      const row = match[1];
      const get = (tag) => {
        const m = row.match(new RegExp(`<${tag}>(.*?)<\/${tag}>`, "s"));
        return m ? m[1].trim() : null;
      };

      const compoundName = get("METABOLITE_NAME") || get("COMPOUND_NAME");
      const cid = get("CAS_ID") || get("KNAPSACK_ID");
      const activity = get("BIOLOGICAL_ACTIVITY") || get("ACTIVITY");
      const compoundClass = get("COMPOUND_CLASS") || get("CLASS");

      if (compoundName) {
        metabolites.push({
          compound_name: compoundName,
          compound_id: cid,
          reported_activity: activity,
          compound_class: compoundClass,
        });
      }
    }

    // If XML didn't work, try the HTML scrape approach
    if (metabolites.length === 0) {
      return await fetchKNApSAcKHTML(speciesName);
    }

    return metabolites;
  } catch {
    return await fetchKNApSAcKHTML(speciesName);
  }
}

async function fetchKNApSAcKHTML(speciesName) {
  try {
    const res = await fetch(
      `https://www.knapsackfamily.com/knapsack_core/result.php?sname=organism&word=${encodeURIComponent(speciesName)}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; GEOCON-Atlas/1.0; research bot)",
          "Accept": "text/html",
        }
      }
    );

    if (!res.ok) return [];
    const html = await res.text();

    const metabolites = [];
    // Parse table rows from KNApSAcK HTML response
    const tableRegex = /<tr[^>]*>[\s\S]*?<\/tr>/gi;
    const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const rows = html.match(tableRegex) || [];

    for (const row of rows.slice(1)) { // skip header
      const cells = [];
      let cellMatch;
      while ((cellMatch = cellRegex.exec(row)) !== null) {
        cells.push(cellMatch[1].replace(/<[^>]+>/g, "").trim());
      }
      if (cells.length >= 2 && cells[1] && cells[1].length > 2) {
        metabolites.push({
          compound_name: cells[1],
          compound_id: cells[0] || null,
          reported_activity: cells[3] || null,
          compound_class: cells[2] || null,
        });
      }
    }

    return metabolites;
  } catch {
    return [];
  }
}

// Map compound class to activity category
function mapActivityCategory(compClass, activity) {
  const text = `${compClass || ""} ${activity || ""}`.toLowerCase();
  if (text.includes("alkaloid")) return "alkaloid";
  if (text.includes("flavonoid")) return "flavonoid";
  if (text.includes("terpenoid") || text.includes("terpene")) return "terpenoid";
  if (text.includes("phenolic") || text.includes("phenol")) return "phenolic";
  if (text.includes("saponin")) return "saponin";
  if (text.includes("glycoside")) return "glycoside";
  if (text.includes("steroid")) return "steroid";
  if (text.includes("amino acid")) return "amino acid";
  return "other";
}

export async function GET(req) {
  const url = new URL(req.url);
  const secret = req.headers.get("x-cron-secret") || url.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const batch = parseInt(url.searchParams.get("batch") || "0");
  const log = { batch, processed: 0, metabolites_added: 0, not_found: 0, errors: [] };

  const { data: species } = await sb
    .from("species")
    .select("id, accepted_name")
    .order("id")
    .range(batch * BATCH, (batch + 1) * BATCH - 1);

  if (!species?.length) return Response.json({ ...log, message: "empty batch" });

  for (const sp of species) {
    try {
      // Check existing count
      const { count: existing } = await sb
        .from("metabolites")
        .select("id", { count: "exact", head: true })
        .eq("species_id", sp.id);

      // Skip if already has 3+ metabolites
      if ((existing || 0) >= 3) {
        log.processed++;
        continue;
      }

      const mets = await fetchKNApSAcK(sp.accepted_name);

      if (!mets.length) {
        // Try genus only
        const genus = sp.accepted_name.split(" ")[0];
        const genusMets = await fetchKNApSAcK(genus);
        if (genusMets.length) {
          mets.push(...genusMets.slice(0, 5));
        }
      }

      if (!mets.length) {
        log.not_found++;
        log.processed++;
        await new Promise(r => setTimeout(r, 500));
        continue;
      }

      // Insert unique metabolites
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
        const { error: insErr } = await sb.from("metabolites").insert(toInsert);
        if (insErr) log.errors.push(`${sp.accepted_name}: ${insErr.message}`);
        else log.metabolites_added += toInsert.length;
      }

      log.processed++;
      await new Promise(r => setTimeout(r, 800)); // KNApSAcK rate limit

    } catch (e) {
      log.errors.push(`${sp.accepted_name}: ${e.message}`);
      log.processed++;
    }
  }

  return Response.json(log);
}
