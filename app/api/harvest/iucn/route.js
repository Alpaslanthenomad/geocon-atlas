// app/api/harvest/iucn/route.js
// Harvests IUCN Red List data for geophyte species
// Populates: conservation table
// Also updates species.iucn_status if changed
// Schedule: monthly, 4 batches of 45 species each
// Requires: IUCN_API_TOKEN env variable (free at https://apiv3.iucnredlist.org/api/v3/token/request)

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BATCH_SIZE = 45;
const IUCN_BASE = "https://apiv3.iucnredlist.org/api/v3";

// Maps IUCN codes to interpreted status
const STATUS_MAP = {
  "EX": "Extinct", "EW": "Extinct in Wild",
  "CR": "Critically Endangered", "EN": "Endangered",
  "VU": "Vulnerable", "NT": "Near Threatened",
  "LC": "Least Concern", "DD": "Data Deficient",
  "NE": "Not Evaluated",
};

async function fetchIUCNSpecies(speciesName, token) {
  try {
    // Search by species name
    const res = await fetch(
      `${IUCN_BASE}/species/${encodeURIComponent(speciesName)}?token=${token}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.result?.length) return null;
    return data.result[0];
  } catch {
    return null;
  }
}

async function fetchIUCNNarrative(speciesName, token) {
  try {
    const res = await fetch(
      `${IUCN_BASE}/species/narrative/${encodeURIComponent(speciesName)}?token=${token}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.result?.[0] || null;
  } catch {
    return null;
  }
}

export async function GET(request) {
  const secret = request.headers.get("x-cron-secret") ||
                 new URL(request.url).searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.IUCN_API_TOKEN;
  if (!token) {
    return Response.json({ 
      error: "IUCN_API_TOKEN not set. Get a free token at https://apiv3.iucnredlist.org/api/v3/token/request",
      setup_required: true 
    }, { status: 400 });
  }

  const batch = parseInt(new URL(request.url).searchParams.get("batch") || "0");
  const log = { batch, processed: 0, added: 0, updated: 0, errors: [] };

  try {
    const { data: species, error: spErr } = await supabase
      .from("species")
      .select("id, accepted_name, iucn_status, atlas_id")
      .order("id")
      .range(batch * BATCH_SIZE, (batch + 1) * BATCH_SIZE - 1);

    if (spErr) throw spErr;
    if (!species?.length) return Response.json({ ...log, message: "No species in batch" });

    for (const sp of species) {
      try {
        // Check if assessment exists and is recent (< 6 months)
        const { data: existing } = await supabase
          .from("conservation")
          .select("id, created_at, status_interpreted")
          .eq("species_id", sp.id)
          .eq("source", "IUCN Red List")
          .single();

        if (existing?.created_at) {
          const age = Date.now() - new Date(existing.created_at).getTime();
          if (age < 180 * 24 * 60 * 60 * 1000) {
            log.processed++;
            continue;
          }
        }

        // Fetch from IUCN
        const iucnData = await fetchIUCNSpecies(sp.accepted_name, token);
        
        if (!iucnData) {
          // Try genus species split
          const parts = sp.accepted_name.split(" ");
          let found = null;
          if (parts.length >= 2) {
            found = await fetchIUCNSpecies(`${parts[0]} ${parts[1]}`, token);
          }
          if (!found) {
            log.errors.push(`${sp.accepted_name}: not found in IUCN`);
            log.processed++;
            await new Promise(r => setTimeout(r, 200));
            continue;
          }
          Object.assign(iucnData || {}, found);
        }

        const statusCode = iucnData.category || "NE";
        const statusInterpreted = STATUS_MAP[statusCode] || statusCode;

        // Get narrative for trend info
        const narrative = await fetchIUCNNarrative(sp.accepted_name, token);
        
        // Determine trend from population trend field
        const popTrend = iucnData.population_trend || "Unknown";
        const trend = popTrend === "Decreasing" ? "Declining" :
                      popTrend === "Increasing" ? "Improving" :
                      popTrend === "Stable" ? "Stable" : "Unknown";

        const assessmentData = {
          assessment_id: `CONS-IUCN-${sp.id}`,
          species_id: sp.id,
          atlas_id: sp.atlas_id || null,
          source: "IUCN Red List",
          status_original: statusCode,
          status_interpreted: statusInterpreted,
          scope: "Global",
          assessment_year: iucnData.assessment_date 
            ? parseInt(iucnData.assessment_date.split("-")[0]) 
            : null,
          trend,
          confidence: statusCode === "DD" ? 0.3 : statusCode === "NE" ? 0.1 : 0.85,
          citation_or_url: `https://www.iucnredlist.org/species/${iucnData.taxonid}`,
          notes: narrative?.rationale?.slice(0, 500) || null,
        };

        const { error: consErr } = await supabase
          .from("conservation")
          .upsert(assessmentData, { onConflict: "assessment_id" });

        if (consErr) {
          log.errors.push(`${sp.accepted_name} conservation: ${consErr.message}`);
        } else {
          if (existing) log.updated++;
          else log.added++;

          // Update species.iucn_status if different
          if (sp.iucn_status !== statusCode && statusCode !== "NE") {
            await supabase
              .from("species")
              .update({ iucn_status: statusCode, last_verified: new Date().toISOString().split("T")[0] })
              .eq("id", sp.id);
          }
        }

        log.processed++;
        await new Promise(r => setTimeout(r, 500)); // IUCN rate limit

      } catch (e) {
        log.errors.push(`${sp.accepted_name}: ${e.message}`);
        log.processed++;
      }
    }

    // Log to harvest_log
    await supabase.from("harvest_log").insert({
      harvester: "iucn",
      batch,
      records_processed: log.processed,
      records_added: log.added + log.updated,
      errors: log.errors.length,
      details: JSON.stringify(log),
    }).catch(() => {});

    return Response.json(log);

  } catch (e) {
    return Response.json({ ...log, fatal: e.message }, { status: 500 });
  }
}
