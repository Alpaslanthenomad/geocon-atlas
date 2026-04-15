import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

const SPECIES_SEARCH = [
  { species_id: "GEO-0001", names: ["Fritillaria imperialis", "Fritillaria alkaloid"] },
  { species_id: "GEO-0002", names: ["Lilium candidum"] },
  { species_id: "GEO-0003", names: ["Orchis mascula glucomannan", "salep orchid"] },
  { species_id: "GEO-0004", names: ["Tecophilaea cyanocrocus"] },
  { species_id: "GEO-0005", names: ["Alstroemeria ligtu"] },
  { species_id: "GEO-0006", names: ["Cyclamen coum", "cyclamin saponin"] },
  { species_id: "GEO-0007", names: ["Crocus sativus", "crocin", "safranal", "picrocrocin"] },
  { species_id: "GEO-0008", names: ["Leucocoryne purpurea"] },
];

async function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchPubChemByCID(cid) {
  const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/property/MolecularFormula,MolecularWeight,IUPACName,InChI,CanonicalSMILES,IsomericSMILES,XLogP/JSON`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  return data?.PropertyTable?.Properties?.[0] || null;
}

async function fetchPubChemByName(name) {
  const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(name)}/property/CID,MolecularFormula,MolecularWeight,IUPACName,InChI,CanonicalSMILES,XLogP/JSON`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return data?.PropertyTable?.Properties || [];
}

async function searchPubChemCompounds(query) {
  const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(query)}/cids/JSON`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const cids = (data?.IdentifierList?.CID || []).slice(0, 3);
    const results = [];
    for (const cid of cids) {
      const props = await fetchPubChemByCID(cid);
      if (props) results.push({ ...props, CID: cid });
      await delay(200);
    }
    return results;
  } catch {
    return [];
  }
}

async function getBioactivity(cid) {
  const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/assaysummary/JSON`;
  try {
    const res = await fetch(url);
    if (!res.ok) return { activeCount: 0, summary: "" };
    const data = await res.json();
    const assays = data?.Table?.Row || [];
    const active = assays.filter((r) => {
      const cells = r?.Cell || [];
      return cells.some((c) => c?.toString?.().toLowerCase() === "active");
    });
    return {
      activeCount: active.length,
      totalAssays: assays.length,
      summary: `${active.length} active / ${assays.length} total bioassays`,
    };
  } catch {
    return { activeCount: 0, summary: "" };
  }
}

async function enrichExistingMetabolites(db) {
  let enriched = 0;
  const { data: metabolites } = await db
    .from("metabolites")
    .select("id, pubchem_cid, compound_name, molecular_formula, molecular_weight")
    .not("pubchem_cid", "is", null);

  if (!metabolites) return 0;

  for (const met of metabolites) {
    try {
      const props = await fetchPubChemByCID(met.pubchem_cid);
      if (!props) continue;

      const updates = {};
      if (!met.molecular_formula && props.MolecularFormula) updates.molecular_formula = props.MolecularFormula;
      if (!met.molecular_weight && props.MolecularWeight) updates.molecular_weight = props.MolecularWeight;

      const bioact = await getBioactivity(met.pubchem_cid);

      const noteAdd = [
        props.IUPACName ? `IUPAC: ${props.IUPACName.slice(0, 80)}` : "",
        props.XLogP !== undefined ? `XLogP: ${props.XLogP}` : "",
        bioact.summary ? `BioAssays: ${bioact.summary}` : "",
        props.CanonicalSMILES ? `SMILES: ${props.CanonicalSMILES.slice(0, 60)}` : "",
      ]
        .filter(Boolean)
        .join(" | ");

      if (noteAdd) {
        const { data: current } = await db.from("metabolites").select("notes").eq("id", met.id).single();
        const existingNotes = current?.notes || "";
        if (!existingNotes.includes("IUPAC:")) {
          updates.notes = existingNotes ? `${existingNotes} || PubChem: ${noteAdd}` : `PubChem: ${noteAdd}`;
        }
      }

      updates.last_verified = new Date().toISOString().split("T")[0];

      if (Object.keys(updates).length > 1) {
        await db.from("metabolites").update(updates).eq("id", met.id);
        enriched++;
      }

      await delay(300);
    } catch {
      continue;
    }
  }

  return enriched;
}

async function discoverNewCompounds(db) {
  let discovered = 0;

  for (const spec of SPECIES_SEARCH) {
    for (const name of spec.names) {
      try {
        const compounds = await searchPubChemCompounds(name);

        for (const comp of compounds) {
          if (!comp.CID) continue;

          const { data: existing } = await db
            .from("metabolites")
            .select("id")
            .eq("pubchem_cid", comp.CID)
            .single();

          if (existing) continue;

          const metId = `MET-PC-${comp.CID}`;

          const { data: idCheck } = await db
            .from("metabolites")
            .select("id")
            .eq("id", metId)
            .single();

          if (idCheck) continue;

          const bioact = await getBioactivity(comp.CID);

          await db.from("metabolites").insert({
            id: metId,
            species_id: spec.species_id,
            compound_name: comp.IUPACName ? comp.IUPACName.slice(0, 80) : `CID-${comp.CID}`,
            compound_class: "Auto-classified pending",
            molecular_formula: comp.MolecularFormula || null,
            molecular_weight: comp.MolecularWeight || null,
            pubchem_cid: comp.CID,
            reported_activity: bioact.summary || "Pending bioassay review",
            activity_category: "Pending classification",
            evidence: "Discovery",
            clinical_stage: "Discovery",
            confidence: 0.3,
            source_database: "PubChem auto-harvest",
            ip_potential: "Under assessment",
            last_verified: new Date().toISOString().split("T")[0],
            notes: `Auto-discovered via PubChem. Search: "${name}". ${comp.CanonicalSMILES ? `SMILES: ${comp.CanonicalSMILES.slice(0, 60)}` : ""} ${comp.XLogP !== undefined ? `XLogP: ${comp.XLogP}` : ""}`.trim(),
          });

          discovered++;
          await delay(300);
        }
      } catch {
        continue;
      }
    }
  }

  return discovered;
}

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getSupabase();
  const startTime = Date.now();
  let errors = 0;
  let enriched = 0;
  let discovered = 0;

  try {
    enriched = await enrichExistingMetabolites(db);
  } catch (err) {
    errors++;
  }

  try {
    discovered = await discoverNewCompounds(db);
  } catch (err) {
    errors++;
  }

  const duration = Math.round((Date.now() - startTime) / 1000);

  await db.from("harvest_log").insert({
    source_id: "SRC-008",
    harvest_type: "PubChem enrichment + discovery",
    query_params: JSON.stringify(SPECIES_SEARCH.map((s) => s.species_id)),
    records_fetched: enriched + discovered,
    records_new: discovered,
    records_updated: enriched,
    errors: errors,
    freshness_score: 1.0,
    status: errors === 0 ? "success" : "partial",
    started_at: new Date(startTime).toISOString(),
    completed_at: new Date().toISOString(),
    duration_seconds: duration,
    next_scheduled: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  });

  await db.from("data_sources").update({
    last_successful_harvest: new Date().toISOString(),
    freshness_score: 1.0,
  }).eq("id", "SRC-008");

  return Response.json({
    success: true,
    duration_seconds: duration,
    existing_enriched: enriched,
    new_compounds_discovered: discovered,
    errors: errors,
  });
}
