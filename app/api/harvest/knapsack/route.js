import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// PubChem API - resolve CAS number to compound info
async function resolveFromPubChem(casOrName) {
  try {
    // Try CAS number lookup
    const isCAS = /^\d{2,7}-\d{2}-\d$/.test(casOrName.trim());
    const searchTerm = isCAS ? casOrName.trim() : casOrName.trim();
    const namespace = isCAS ? "name" : "name";

    const res = await fetch(
      `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/${namespace}/${encodeURIComponent(searchTerm)}/JSON?MaxRecords=1`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const compound = data?.PC_Compounds?.[0];
    if (!compound) return null;

    // Extract properties
    const props = compound.props || [];
    const get = (name, label) => {
      const p = props.find(p => p.urn?.name === name && (!label || p.urn?.label === label));
      return p?.value?.sval || p?.value?.fval || null;
    };

    const iupacName = get("IUPAC Name", "Preferred") || get("IUPAC Name");
    const synonyms = compound.synonyms?.slice(0, 5) || [];
    
    // Get preferred common name from synonyms
    const commonName = synonyms.find(s => 
      !/^\d/.test(s) && s.length < 40 && !/^[A-Z]{2,}-/.test(s)
    ) || iupacName || casOrName;

    // Classify compound class
    const nameForClass = (commonName || "").toLowerCase();
    let activityCategory = "other";
    let compoundClass = null;

    if (/alkaloid|colchicine|lycorine|galanthamine|solanine|caffeine|morphine|codeine|tomatine/.test(nameForClass)) {
      activityCategory = "alkaloid"; compoundClass = "Alkaloid";
    } else if (/flavon|quercetin|kaempferol|rutin|luteolin|apigenin|catechin|anthocyan/.test(nameForClass)) {
      activityCategory = "flavonoid"; compoundClass = "Flavonoid";
    } else if (/terpen|gibberellin|diterpene|monoterpene|sesquiterpene|limonene|linalool|geraniol|camphor/.test(nameForClass)) {
      activityCategory = "terpenoid"; compoundClass = "Terpenoid";
    } else if (/phenol|caffeic|ferulic|chlorogenic|rosmarinic|syringic|vanillin|eugenol/.test(nameForClass)) {
      activityCategory = "phenolic"; compoundClass = "Phenolic";
    } else if (/saponin|glycyrrhizin|digitonin|avenacin/.test(nameForClass)) {
      activityCategory = "saponin"; compoundClass = "Saponin";
    } else if (/glycoside|glucoside|galactoside|rhamnoside/.test(nameForClass)) {
      activityCategory = "glycoside"; compoundClass = "Glycoside";
    } else if (/sterol|steroid|sitosterol|stigmasterol|cholesterol|diosgenin|hecogenin/.test(nameForClass)) {
      activityCategory = "steroid"; compoundClass = "Steroid";
    } else if (/amino acid|alanine|glycine|leucine|proline|serine|threonine/.test(nameForClass)) {
      activityCategory = "amino acid"; compoundClass = "Amino acid";
    }

    return {
      compound_name: commonName.slice(0, 200),
      compound_class: compoundClass,
      activity_category: activityCategory,
      cas_number: isCAS ? casOrName.trim() : null,
    };
  } catch { return null; }
}

// Re-harvest KNApSAcK with better parsing
async function fetchKNApSAcK(speciesName) {
  try {
    const res = await fetch(
      `https://www.knapsackfamily.com/knapsack_core/result.php?sname=organism&word=${encodeURIComponent(speciesName)}`,
      { headers: { "User-Agent": "Mozilla/5.0 (compatible; GEOCON-Atlas/1.0; research)" } }
    );
    if (!res.ok) return [];
    const html = await res.text();

    const metabolites = [];
    
    // Find table rows - KNApSAcK table format:
    // C-ID | Metabolite name | Molecular weight | Biological activity | CAS | ...
    const rowMatches = html.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
    
    for (const row of rowMatches) {
      const cells = [];
      const cellMatches = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
      for (const cell of cellMatches) {
        const text = cell.replace(/<[^>]+>/g, "").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&nbsp;/g," ").trim();
        cells.push(text);
      }
      
      // KNApSAcK rows have: [C-ID, metabolite_name, mol_weight, activity, CAS, ...]
      // C-ID starts with "C" followed by numbers
      if (cells.length >= 2 && /^C\d+/.test(cells[0])) {
        const metName = cells[1]?.trim();
        const activity = cells[3]?.trim() || null;
        const cas = cells[4]?.trim() || null;
        
        if (metName && metName.length > 1 && !/^\d+$/.test(metName)) {
          // Classify by name
          const nameLow = metName.toLowerCase();
          let actCat = "other";
          let compClass = null;
          
          if (/alkaloid|colchicine|lycorine|galanthamine|solanine|caffeine|morphine|colchi/.test(nameLow)) { actCat="alkaloid"; compClass="Alkaloid"; }
          else if (/flavon|quercetin|kaempferol|rutin|luteolin|apigenin|catechin|anthocyan|flavone/.test(nameLow)) { actCat="flavonoid"; compClass="Flavonoid"; }
          else if (/gibberellin|terpen|diterpene|monoterpene|sesquiterp|limonene|linalool|geraniol|camphor|terpene/.test(nameLow)) { actCat="terpenoid"; compClass="Terpenoid"; }
          else if (/phenol|caffeic|ferulic|chlorogenic|rosmarinic|vanillin|eugenol|benzoic|cinnamic/.test(nameLow)) { actCat="phenolic"; compClass="Phenolic"; }
          else if (/saponin|glycyrrhizin|digitonin/.test(nameLow)) { actCat="saponin"; compClass="Saponin"; }
          else if (/glycoside|glucoside|galactoside|rhamnoside/.test(nameLow)) { actCat="glycoside"; compClass="Glycoside"; }
          else if (/sterol|steroid|sitosterol|stigmasterol|cholesterol|diosgenin/.test(nameLow)) { actCat="steroid"; compClass="Steroid"; }
          
          metabolites.push({
            compound_name: metName.slice(0, 200),
            compound_class: compClass,
            reported_activity: activity?.slice(0, 300) || null,
            activity_category: actCat,
            cas_number: cas && /^\d{2,7}-\d{2}-\d$/.test(cas) ? cas : null,
          });
        }
      }
    }
    
    return metabolites;
  } catch { return []; }
}

export async function GET(req) {
  const url = new URL(req.url);
  const secret = req.headers.get("x-cron-secret") || url.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const mode = url.searchParams.get("mode") || "reharvest"; // reharvest | fix_cas
  const log = { mode, processed: 0, added: 0, fixed: 0, not_found: 0, errors: [] };

  if (mode === "fix_cas") {
    // Fix existing metabolites where compound_name is a CAS number
    const { data: mets } = await sb
      .from("metabolites")
      .select("id, compound_name")
      .filter("compound_name", "ilike", "%-%-%"); // CAS pattern

    const casLike = (mets || []).filter(m => /^\d{2,7}-\d{2}-\d$/.test(m.compound_name.trim()));
    log.processed = casLike.length;

    for (const met of casLike.slice(0, 100)) { // process 100 at a time
      const resolved = await resolveFromPubChem(met.compound_name);
      if (resolved) {
        const { error } = await sb.from("metabolites").update({
          compound_name: resolved.compound_name,
          compound_class: resolved.compound_class,
          activity_category: resolved.activity_category,
          cas_number: resolved.cas_number,
        }).eq("id", met.id);
        if (!error) log.fixed++;
        else log.errors.push(`${met.compound_name}: ${error.message}`);
      } else {
        log.not_found++;
      }
      await new Promise(r => setTimeout(r, 200));
    }

    return Response.json(log);
  }

  // Re-harvest mode: get all species, re-fetch from KNApSAcK
  const { data: species } = await sb
    .from("species")
    .select("id, accepted_name")
    .order("id");

  if (!species?.length) return Response.json({ ...log, message: "no species" });

  // Get existing counts to skip those with good data
  const { data: existingMets } = await sb.from("metabolites").select("species_id, compound_name");
  const existingMap = {};
  for (const m of existingMets || []) {
    if (!existingMap[m.species_id]) existingMap[m.species_id] = [];
    existingMap[m.species_id].push(m.compound_name);
  }

  for (const sp of species) {
    try {
      const mets = await fetchKNApSAcK(sp.accepted_name);
      
      if (!mets.length) {
        log.not_found++;
        log.processed++;
        await new Promise(r => setTimeout(r, 300));
        continue;
      }

      // Only insert new ones (not already in DB)
      const existing = existingMap[sp.id] || [];
      const toInsert = mets
        .filter(m => !existing.includes(m.compound_name))
        .slice(0, 20)
        .map(m => ({
          id: crypto.randomUUID(),
          species_id: sp.id,
          compound_name: m.compound_name,
          compound_class: m.compound_class,
          reported_activity: m.reported_activity,
          activity_category: m.activity_category,
          cas_number: m.cas_number,
          evidence: "Early research",
          confidence: 0.75,
          source: "KNApSAcK",
        }));

      if (toInsert.length > 0) {
        const { error } = await sb.from("metabolites").insert(toInsert);
        if (error) log.errors.push(`${sp.accepted_name}: ${error.message}`);
        else log.added += toInsert.length;
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
