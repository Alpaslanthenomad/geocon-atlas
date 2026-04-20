import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

export const dynamic = "force-dynamic";

export async function POST(request) {
  const db = getSupabase();

  try {
    const body = await request.json();
    const { action, data } = body;

    if (action === "add_species") {
      const id = data.id || `GEO-${String(Date.now()).slice(-4)}`;
      const { error } = await db.from("species").upsert({
        id,
        accepted_name: data.accepted_name,
        family: data.family || null,
        genus: data.genus || null,
        geophyte_type: data.geophyte_type || null,
        country_focus: data.country_focus || null,
        region: data.region || null,
        endemic: data.endemic || false,
        iucn_status: data.iucn_status || null,
        cites_appendix: data.cites_appendix || null,
        population_trend: data.population_trend || null,
        trl_level: data.trl_level || null,
        decision: data.decision || "Monitor",
        decision_rationale: data.decision_rationale || null,
        score_conservation: data.score_conservation || null,
        score_science: data.score_science || null,
        score_production: data.score_production || null,
        score_governance: data.score_governance || null,
        score_venture: data.score_venture || null,
        composite_score: data.composite_score || null,
        climate_exposure: data.climate_exposure || null,
        regulatory_drag: data.regulatory_drag || null,
        spinoff_link: data.spinoff_link || null,
        market_area: data.market_area || null,
        market_size: data.market_size || null,
        habitat: data.habitat || null,
        tc_status: data.tc_status || null,
        confidence: data.confidence || 0.5,
        last_verified: new Date().toISOString().split("T")[0],
        notes: data.notes || null,
      }, { onConflict: "id" });

      if (error) return Response.json({ error: error.message }, { status: 400 });
      return Response.json({ success: true, id, message: "Species added/updated" });
    }

    if (action === "add_metabolite") {
      const id = data.id || `MET-MAN-${String(Date.now()).slice(-6)}`;
      const { error } = await db.from("metabolites").upsert({
        id,
        species_id: data.species_id,
        compound_name: data.compound_name,
        compound_class: data.compound_class || null,
        cas_number: data.cas_number || null,
        molecular_formula: data.molecular_formula || null,
        molecular_weight: data.molecular_weight || null,
        plant_organ: data.plant_organ || null,
        reported_activity: data.reported_activity || null,
        activity_category: data.activity_category || null,
        therapeutic_area: data.therapeutic_area || null,
        cosmetic_relevance: data.cosmetic_relevance || null,
        evidence: data.evidence || "Discovery",
        clinical_stage: data.clinical_stage || null,
        pubchem_cid: data.pubchem_cid || null,
        confidence: data.confidence || 0.5,
        source_database: data.source_database || "Manual entry",
        last_verified: new Date().toISOString().split("T")[0],
        notes: data.notes || null,
      }, { onConflict: "id" });

      if (error) return Response.json({ error: error.message }, { status: 400 });
      return Response.json({ success: true, id, message: "Metabolite added/updated" });
    }

    if (action === "add_institution") {
      const id = data.id || `INST-${String(Date.now()).slice(-4)}`;
      const { error } = await db.from("institutions").upsert({
        id,
        name: data.name,
        acronym: data.acronym || null,
        country: data.country || null,
        city: data.city || null,
        institution_type: data.institution_type || null,
        research_focus: data.research_focus || null,
        consortium_role: data.consortium_role || null,
        mou_status: data.mou_status || "Planned",
        priority: data.priority || "candidate",
        notes: data.notes || null,
      }, { onConflict: "id" });

      if (error) return Response.json({ error: error.message }, { status: 400 });
      return Response.json({ success: true, id, message: "Institution added/updated" });
    }

    if (action === "bulk_species") {
      const rows = data.rows || [];
      let added = 0;
      let errors = 0;

      for (const row of rows) {
        if (!row.accepted_name) { errors++; continue; }
        const id = row.id || `GEO-${String(Date.now()).slice(-4)}-${added}`;
        const { error } = await db.from("species").upsert({
          id,
          accepted_name: row.accepted_name,
          family: row.family || null,
          genus: row.genus || null,
          geophyte_type: row.geophyte_type || null,
          country_focus: row.country_focus || null,
          region: row.region || null,
          endemic: row.endemic === "Yes" || row.endemic === true,
          iucn_status: row.iucn_status || null,
          cites_appendix: row.cites_appendix || null,
          population_trend: row.population_trend || null,
          trl_level: parseInt(row.trl_level) || null,
          decision: row.decision || "Monitor",
          decision_rationale: row.decision_rationale || null,
          score_conservation: parseInt(row.score_conservation) || null,
          score_science: parseInt(row.score_science) || null,
          score_production: parseInt(row.score_production) || null,
          score_governance: parseInt(row.score_governance) || null,
          score_venture: parseInt(row.score_venture) || null,
          composite_score: parseInt(row.composite_score) || null,
          spinoff_link: row.spinoff_link || null,
          market_area: row.market_area || null,
          market_size: row.market_size || null,
          habitat: row.habitat || null,
          tc_status: row.tc_status || null,
          confidence: parseFloat(row.confidence) || 0.5,
          last_verified: new Date().toISOString().split("T")[0],
          notes: row.notes || "Bulk uploaded",
        }, { onConflict: "id" });

        if (error) errors++;
        else added++;
      }

      return Response.json({ success: true, added, errors, total: rows.length });
    }

    if (action === "trigger_harvest") {
      const target = data.target;
      const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NEXT_PUBLIC_SUPABASE_URL?.replace("supabase.co", "vercel.app") || "";

      const endpoints = {
        openalex: "/api/harvest/openalex",
        gbif: "/api/harvest/gbif",
        pubchem: "/api/harvest/pubchem",
        enrichment: "/api/harvest/enrichment",
      };

      if (!endpoints[target]) {
        return Response.json({ error: "Invalid harvest target" }, { status: 400 });
      }

      return Response.json({
        success: true,
        message: `Use Vercel Crons to trigger ${target} harvest`,
        endpoint: endpoints[target],
      });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
