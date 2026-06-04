// T4.b — OpenAPI 3.0 spec for the public API surface.
// GET /api/v1/spec → JSON. Will grow as more endpoints land under
// /api/v1/. Sets the contract early so Notion / Zotero / Telegram
// integrations have a single source of truth.

export const dynamic = "force-dynamic";

export async function GET() {
  const spec = {
    openapi: "3.0.3",
    info: {
      title: "GEOCON Atlas Public API",
      version: "0.1.0",
      description:
        "Read-only public API over GEOCON Atlas commons. " +
        "Authentication via Supabase anon key (no rate limit yet — " +
        "rate limiter lands in v0.2).",
      contact: { email: "alpaslansevket@gmail.com" },
      license: { name: "CC-BY-4.0 for data; MIT for code" },
    },
    servers: [
      { url: "https://atlas.vennbioventures.com/api/v1", description: "Production" },
    ],
    paths: {
      "/publications/{id}/bibtex": {
        get: {
          summary: "Get publication citation as BibTeX",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            200: {
              description: "BibTeX entry",
              content: { "application/x-bibtex": { schema: { type: "string" } } },
            },
            404: { description: "Publication not found" },
          },
        },
      },
      "/species/{id}": {
        get: {
          summary: "Get species detail",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: { 200: { description: "Species record (jsonb)" } },
        },
      },
      "/grants": {
        get: {
          summary: "List open conservation grants",
          parameters: [
            { name: "limit", in: "query", schema: { type: "integer", default: 50 } },
          ],
          responses: { 200: { description: "Array of grant records" } },
        },
      },
      "/iucn/{assessment_id}": {
        get: {
          summary: "Export IUCN assessment in SIS-compatible JSON",
          description:
            "Returns one IUCN assessment with species commons join in a JSON " +
            "shape mirroring the IUCN SIS export schema (assessment_id, " +
            "species_id, category, criteria[], sections{rationale,habitat," +
            "threats,population,conservation}). Anonymous + authenticated " +
            "callers can read assessments with status='published'. Author or " +
            "admin can read draft/peer_review/submitted via Bearer token.",
          parameters: [
            { name: "assessment_id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          ],
          responses: {
            200: { description: "Assessment JSON (SIS-compatible)" },
            404: { description: "Not found or not public" },
          },
        },
      },
      "/feed": {
        get: {
          summary: "Discovery feed (last 30 days)",
          responses: { 200: { description: "JSON feed events" } },
        },
      },
      "/feed.rss": {
        get: {
          summary: "Discovery feed as RSS 2.0",
          responses: { 200: { description: "RSS XML" } },
        },
      },
      "/feed.atom": {
        get: {
          summary: "Discovery feed as Atom 1.0",
          responses: { 200: { description: "Atom XML" } },
        },
      },
    },
  };
  return Response.json(spec, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
