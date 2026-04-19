import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const CAS_REGEX = /^[0-9]+-[0-9]+-[0-9]+$/;

async function getNameFromPubChem(cas) {
  try {
    // First try CAS lookup
    const res = await fetch(
      `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(cas)}/property/IUPACName,MolecularFormula,MolecularWeight,InChIKey/JSON`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const props = data?.PropertyTable?.Properties?.[0];
    if (!props) return null;

    // Get preferred name (IUPAC can be very long — try synonyms first)
    const synRes = await fetch(
      `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${props.CID}/synonyms/JSON`,
      { signal: AbortSignal.timeout(6000) }
    );
    let preferredName = props.IUPACName;
    if (synRes.ok) {
      const synData = await synRes.json();
      const synonyms = synData?.InformationList?.Information?.[0]?.Synonym || [];
      // Prefer shorter, readable names (not CAS, not InChI, not SMILES)
      const readable = synonyms.filter(s =>
        s.length < 60 &&
        !CAS_REGEX.test(s) &&
        !s.startsWith("InChI") &&
        !s.includes("=") &&
        /^[a-zA-Z]/.test(s)
      );
      if (readable.length > 0) preferredName = readable[0];
    }

    return {
      name: preferredName || props.IUPACName,
      formula: props.MolecularFormula,
      weight: props.MolecularWeight,
      cid: props.CID
    };
  } catch {
    return null;
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const batchSize = parseInt(searchParams.get("batch_size") || "30");

  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get CAS-format metabolites
  const { data: metabolites, error } = await supabase
    .from("metabolites")
    .select("id, compound_name, molecular_formula, molecular_weight, pubchem_cid")
    .limit(batchSize);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Filter to only CAS-format names
  const casRecords = (metabolites || []).filter(m => CAS_REGEX.test(m.compound_name));

  let fixed = 0;
  let not_found = 0;
  const errors = [];

  for (const rec of casRecords) {
    try {
      const result = await getNameFromPubChem(rec.compound_name);
      if (result) {
        const { error: upErr } = await supabase
          .from("metabolites")
          .update({
            compound_name: result.name,
            molecular_formula: result.formula || rec.molecular_formula,
            molecular_weight: result.weight || rec.molecular_weight,
            pubchem_cid: result.cid?.toString() || rec.pubchem_cid,
          })
          .eq("id", rec.id);

        if (upErr) errors.push(`${rec.compound_name}: ${upErr.message}`);
        else fixed++;
      } else {
        not_found++;
      }
      // Rate limit
      await new Promise(r => setTimeout(r, 300));
    } catch (e) {
      errors.push(`${rec.compound_name}: ${e.message}`);
    }
  }

  return Response.json({
    total_cas: casRecords.length,
    fixed,
    not_found,
    errors: errors.slice(0, 10)
  });
}
