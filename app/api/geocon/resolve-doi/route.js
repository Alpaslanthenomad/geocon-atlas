// Resolve a DOI to CSL-JSON for the Thesis Workbench Reference Library. Server-side
// (avoids browser CORS). Primary: doi.org content negotiation (CSL-JSON directly);
// fallback: CrossRef works API mapped to CSL. Read-only, no auth needed (public
// bibliographic metadata). Reuses the same CrossRef path the receipt minter uses.

export const runtime = "nodejs";

const UA = "GEOCON-Atlas/1.0 (https://atlas.vennbioventures.com; mailto:atlas@vennbioventures.com)";

function cleanDoi(raw) {
  return String(raw || "").trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").replace(/^doi:/i, "").trim();
}

export async function GET(req) {
  const doi = cleanDoi(new URL(req.url).searchParams.get("doi"));
  if (!doi || !/^10\.\d{4,9}\//.test(doi)) {
    return Response.json({ error: "Geçerli bir DOI gir (10.xxxx/...)" }, { status: 400 });
  }
  try {
    // 1) doi.org content negotiation -> CSL-JSON directly
    const r = await fetch("https://doi.org/" + doi, {
      headers: { Accept: "application/vnd.citationstyles.csl+json", "User-Agent": UA },
      redirect: "follow",
    });
    if (r.ok) {
      const csl = await r.json();
      if (csl && (csl.title || csl.author)) return Response.json({ csl });
    }
    // 2) CrossRef fallback
    const cr = await fetch("https://api.crossref.org/works/" + doi, { headers: { "User-Agent": UA } });
    if (cr.ok) {
      const m = (await cr.json()).message || {};
      const csl = {
        type: m.type || "article-journal",
        title: Array.isArray(m.title) ? m.title[0] : m.title,
        author: m.author,
        issued: m.issued,
        "container-title": Array.isArray(m["container-title"]) ? m["container-title"][0] : m["container-title"],
        volume: m.volume, issue: m.issue, page: m.page, DOI: m.DOI || doi, publisher: m.publisher, URL: m.URL,
      };
      if (csl.title || csl.author) return Response.json({ csl });
    }
    return Response.json({ error: "DOI çözümlenemedi" }, { status: 404 });
  } catch (e) {
    return Response.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
