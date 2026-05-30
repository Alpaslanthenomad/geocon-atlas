import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

// DarwinCore Occurrence-flavored TSV export for a single species.
// Field set follows the Simple Darwin Core (dwc:) star schema; we
// emit only what the atlas reliably has.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

const FIELDS = [
  "occurrenceID",
  "scientificName",
  "genus",
  "family",
  "kingdom",
  "taxonRank",
  "vernacularName",
  "iucnRedListCategory",
  "country",
  "countryCode",
  "habitat",
  "associatedReferences",
];

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, max-age=600, s-maxage=1800",
  "Content-Type": "text/tab-separated-values; charset=utf-8",
};

export async function OPTIONS() {
  return new Response(null, { headers: { ...CORS, "Content-Type": "text/plain" } });
}

export async function GET(_req, { params }) {
  const id = params?.id;
  const { data: sp } = await supabase
    .from("species")
    .select("id, accepted_name, genus, family, common_name, iucn_status, country_focus, native_countries")
    .eq("id", id)
    .maybeSingle();

  if (!sp) {
    return new Response("species not found", { status: 404 });
  }

  const lines = [FIELDS.join("\t")];
  const countries = Array.isArray(sp.native_countries) && sp.native_countries.length
    ? sp.native_countries
    : sp.country_focus ? [sp.country_focus] : [null];

  for (const cc of countries) {
    const row = {
      occurrenceID:        `geocon:species:${sp.id}${cc ? `:${cc}` : ""}`,
      scientificName:      sp.accepted_name || "",
      genus:               sp.genus || "",
      family:              sp.family || "",
      kingdom:             "Plantae",
      taxonRank:           "species",
      vernacularName:      sp.common_name || "",
      iucnRedListCategory: sp.iucn_status || "",
      country:             cc || "",
      countryCode:         cc || "",
      habitat:             "",
      associatedReferences: `https://geocon-atlas.vercel.app/geocon/species/${sp.id}`,
    };
    lines.push(FIELDS.map((f) => escapeTSV(row[f])).join("\t"));
  }

  const filename = `${(sp.accepted_name || sp.id).replace(/[^a-z0-9]+/gi, "_")}_dwc.tsv`;
  return new Response(lines.join("\n") + "\n", {
    headers: {
      ...CORS,
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

function escapeTSV(v) {
  if (v == null) return "";
  return String(v).replace(/[\t\r\n]+/g, " ");
}
