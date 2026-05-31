// Public ORCID profile lookup — no auth required (uses pub.orcid.org).
// Used by the welcome flow to validate that an ORCID exists and to
// surface a preview (name, employments, work count) before any import.

export const dynamic = "force-dynamic";

const ORCID_BASE = "https://pub.orcid.org/v3.0";
const UA = "GEOCONAtlas/1.0 (https://geocon.bio; atlas@geocon.bio)";

function isValidOrcid(s) {
  if (!s) return false;
  // 0000-0000-0000-0000 or 0000-0000-0000-000X (final check char can be X)
  return /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(s);
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": UA },
    cache: "no-store",
  });
  if (!res.ok) {
    const err = new Error(`ORCID upstream ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const orcid = (searchParams.get("orcid") || "").trim();

  if (!isValidOrcid(orcid)) {
    return Response.json({ error: "invalid_orcid" }, { status: 400 });
  }

  try {
    // Run person + works in parallel.
    const [person, works] = await Promise.all([
      fetchJson(`${ORCID_BASE}/${orcid}/person`),
      fetchJson(`${ORCID_BASE}/${orcid}/works`),
    ]);

    const name =
      [
        person?.name?.["given-names"]?.value,
        person?.name?.["family-name"]?.value,
      ]
        .filter(Boolean)
        .join(" ")
        .trim() || null;

    const country = person?.addresses?.address?.[0]?.country?.value || null;
    const biography = person?.biography?.content || null;
    const keywords =
      (person?.keywords?.keyword || [])
        .map((k) => k?.content)
        .filter(Boolean) || [];
    const otherNames =
      (person?.["other-names"]?.["other-name"] || [])
        .map((n) => n?.content)
        .filter(Boolean) || [];

    // Works are returned as grouped summaries — flatten to one row per
    // work, taking the first summary in each group as canonical.
    const worksFlat = (works?.group || [])
      .map((g) => {
        const s = g?.["work-summary"]?.[0];
        if (!s) return null;
        const title = s?.title?.title?.value || null;
        const year = Number(s?.["publication-date"]?.year?.value) || null;
        const type = s?.type || null;
        // Extract DOI from external-ids
        const ids = s?.["external-ids"]?.["external-id"] || [];
        let doi = null;
        for (const id of ids) {
          if (
            id?.["external-id-type"]?.toLowerCase() === "doi" &&
            id?.["external-id-value"]
          ) {
            doi = id["external-id-value"].trim();
            break;
          }
        }
        return { title, year, type, doi };
      })
      .filter(Boolean);

    return Response.json({
      orcid,
      name,
      country,
      biography,
      keywords,
      other_names: otherNames,
      works_count: worksFlat.length,
      works: worksFlat,
    });
  } catch (e) {
    const status = e?.status === 404 ? 404 : 502;
    return Response.json(
      { error: status === 404 ? "orcid_not_found" : "upstream_error", detail: String(e?.message || e) },
      { status }
    );
  }
}
