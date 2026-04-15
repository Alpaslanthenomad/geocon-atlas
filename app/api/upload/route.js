import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

const COLUMN_MAP = {
  "Tür (Latin)": "accepted_name", "Tür": "accepted_name", "Species": "accepted_name",
  "accepted_name": "accepted_name", "Latin Name": "accepted_name", "Tür Adı": "accepted_name",
  "Bölge": "region", "Region": "region", "region": "region", "Yayılış": "region",
  "Statü": "iucn_status", "Status": "iucn_status", "IUCN": "iucn_status",
  "iucn_status": "iucn_status", "Koruma": "iucn_status", "Conservation": "iucn_status",
  "Notlar/Kaynak": "notes", "Notlar": "notes", "Notes": "notes", "notes": "notes", "Kaynak": "notes",
  "Çiçeklenme": "flowering", "Flowering": "flowering", "Bloom": "flowering",
  "Habitat": "habitat", "habitat": "habitat",
  "Rakım": "elevation", "Altitude": "elevation", "Elevation": "elevation",
  "Kullanım": "usage", "Use": "usage", "Usage": "usage", "Kullanim": "usage",
  "Aile": "family", "Family": "family", "family": "family",
  "Cins": "genus", "Genus": "genus", "genus": "genus",
  "Endemik": "endemic", "Endemic": "endemic",
  "Ülke": "country_focus", "Country": "country_focus", "country": "country_focus",
  "Tehdit": "threats", "Threats": "threats", "threats": "threats",
  "CITES": "cites_appendix", "cites": "cites_appendix",
  "Trend": "population_trend", "trend": "population_trend",
  "TRL": "trl_level", "trl": "trl_level",
};

function mapColumns(headers) {
  const mapping = {};
  for (const h of headers) {
    const clean = (h || "").toString().trim();
    if (COLUMN_MAP[clean]) {
      mapping[clean] = COLUMN_MAP[clean];
    }
  }
  return mapping;
}

function extractGenus(name) {
  if (!name) return null;
  return name.trim().split(" ")[0];
}

function guessFamily(genus) {
  const families = {
    Fritillaria: "Liliaceae", Lilium: "Liliaceae", Tulipa: "Liliaceae",
    Crocus: "Iridaceae", Colchicum: "Colchicaceae",
    Cyclamen: "Primulaceae", Galanthus: "Amaryllidaceae",
    Narcissus: "Amaryllidaceae", Leucojum: "Amaryllidaceae",
    Leucocoryne: "Amaryllidaceae", Alstroemeria: "Alstroemeriaceae",
    Orchis: "Orchidaceae", Ophrys: "Orchidaceae", Dactylorhiza: "Orchidaceae",
    Tecophilaea: "Tecophilaeaceae", Muscari: "Asparagaceae",
    Allium: "Amaryllidaceae", Scilla: "Asparagaceae",
    Sternbergia: "Amaryllidaceae", Iris: "Iridaceae",
    Pancratium: "Amaryllidaceae", Boophone: "Amaryllidaceae",
    Lachenalia: "Asparagaceae", Zephyra: "Tecophilaeaceae",
  };
  return families[genus] || null;
}

function parseIUCN(val) {
  if (!val) return null;
  const s = val.toString().trim().toUpperCase();
  const valid = ["CR", "EN", "VU", "NT", "LC", "DD", "NE"];
  if (valid.includes(s)) return s;
  if (s.includes("CRITICALLY") || s.includes("KRİTİK")) return "CR";
  if (s.includes("ENDANGERED") || s.includes("TEHLİKE")) return "EN";
  if (s.includes("VULNERABLE") || s.includes("HASSAS")) return "VU";
  if (s.includes("NEAR")) return "NT";
  if (s.includes("LEAST")) return "LC";
  return s.slice(0, 4);
}

export const dynamic = "force-dynamic";

export async function POST(request) {
  const db = getSupabase();

  try {
    const body = await request.json();
    const { rows, headers, filename, mode } = body;

    if (!rows || !rows.length) {
      return Response.json({ error: "No data rows provided" }, { status: 400 });
    }

    const colMap = mapColumns(headers);
    const genusFromFile = filename
      ? filename.replace(/\.xlsx?$/i, "").replace(/_/g, " ").replace(/Tur Listesi|Species|List/gi, "").trim()
      : null;

    let added = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    const results = [];

    for (const row of rows) {
      try {
        const mapped = {};
        for (const [origCol, dbCol] of Object.entries(colMap)) {
          if (row[origCol] !== undefined && row[origCol] !== null && row[origCol] !== "") {
            mapped[dbCol] = row[origCol];
          }
        }

        if (!mapped.accepted_name) { 
  results.push({ status: "skipped", row: JSON.stringify(row), headers: JSON.stringify(Object.keys(row)) });
  skipped++; 
  continue; 
}

        const genus = mapped.genus || extractGenus(mapped.accepted_name) || genusFromFile;
        const family = mapped.family || guessFamily(genus);
        const id = `GEO-UPL-${mapped.accepted_name.replace(/\s+/g, "-").slice(0, 20)}-${Date.now().toString(36).slice(-4)}`;

        const { data: existing } = await db
          .from("species")
          .select("id")
          .ilike("accepted_name", mapped.accepted_name.trim())
          .single();

        const habitatParts = [
          mapped.habitat,
          mapped.elevation ? `${mapped.elevation}` : null,
          mapped.flowering ? `Flowering: ${mapped.flowering}` : null,
        ].filter(Boolean).join(" · ");

        const notesParts = [
          mapped.notes,
          mapped.usage ? `Usage: ${mapped.usage}` : null,
          mapped.threats ? `Threats: ${mapped.threats}` : null,
          `Source: ${filename || "Excel upload"}`,
        ].filter(Boolean).join(" | ");

        const speciesData = {
          accepted_name: mapped.accepted_name.trim(),
          family: family,
          genus: genus,
          geophyte_type: "Bulbous",
          country_focus: mapped.country_focus || "TR",
          region: mapped.region || null,
          endemic: mapped.endemic === "Yes" || mapped.endemic === "Evet" || (mapped.notes || "").toLowerCase().includes("endemik"),
          iucn_status: parseIUCN(mapped.iucn_status),
          cites_appendix: mapped.cites_appendix || null,
          population_trend: mapped.population_trend || null,
          habitat: habitatParts || null,
          notes: notesParts,
          confidence: 0.5,
          decision: "Monitor",
          last_verified: new Date().toISOString().split("T")[0],
        };

        if (existing) {
          if (mode === "skip_existing") { skipped++; continue; }
          await db.from("species").update(speciesData).eq("id", existing.id);
          updated++;
          results.push({ name: mapped.accepted_name, status: "updated", id: existing.id });
        } else {
          speciesData.id = id;
          const { error } = await db.from("species").insert(speciesData);
          if (error) { errors++; results.push({ name: mapped.accepted_name, status: "error", msg: error.message }); }
          else { added++; results.push({ name: mapped.accepted_name, status: "added", id }); }
        }
      } catch (err) {
        errors++;
      }
    }

    await db.from("change_log").insert({
      table_name: "species",
      record_id: "bulk_upload",
      field_changed: "Excel upload",
      old_value: null,
      new_value: JSON.stringify({ filename, added, updated, skipped, errors }),
      change_source: "excel_upload",
    });

    return Response.json({
      success: true,
      filename,
      total_rows: rows.length,
      added,
      updated,
      skipped,
      errors,
      results: results.slice(0, 20),
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
