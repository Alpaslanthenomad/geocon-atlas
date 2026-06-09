import { createClient } from "@supabase/supabase-js";

// Scale the citable-TIC: mint a Provenance Receipt for an evidenced chain fact whose
// chain_evidence carries a DOI. Resolves canonical metadata via CrossRef, generates
// a persistent id + a FAIR-style citation, and inserts the receipt (service role).
// Admin-gated by CRON_SECRET. Idempotent (skips facts that already have a receipt).
// Single: ?link_fact_id=<uuid>   Batch: ?mode=batch  (all evidenced+DOI facts).

const sb = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.invalid"),
  (process.env.SUPABASE_SERVICE_ROLE_KEY || "service")
);

function pidFor(linkFactId) {
  return "GEOCON-" + String(linkFactId).replace(/-/g, "").slice(0, 8).toUpperCase();
}

async function resolveCrossref(doi) {
  try {
    const r = await fetch("https://api.crossref.org/works/" + encodeURIComponent(doi), {
      headers: { "User-Agent": "GEOCON-Atlas/1.0 (mailto:alpaslansevket@gmail.com)" },
    });
    if (!r.ok) return { doi, resolved_via: "unresolved" };
    const m = (await r.json()).message || {};
    return {
      doi,
      title: (m.title || [])[0] || null,
      authors: (m.author || []).map((a) => (a.family || "") + " " + (a.given || "").split(/\s+/).map((p) => p[0] || "").join("")).join("; ") || null,
      year: m.issued && m.issued["date-parts"] && m.issued["date-parts"][0] ? m.issued["date-parts"][0][0] : null,
      journal: (m["container-title"] || [])[0] || null,
      volume: m.volume || null,
      page: m.page || null,
      type: m.type || null,
      publisher: m.publisher || null,
      resolved_via: "CrossRef",
    };
  } catch (e) {
    return { doi, resolved_via: "unresolved" };
  }
}

async function mintOne(fid) {
  const { data: ex } = await sb.from("chain_receipt").select("pid").eq("link_fact_id", fid).maybeSingle();
  if (ex) return { skipped: true, pid: ex.pid };

  const { data: evs } = await sb.from("chain_evidence")
    .select("source_ref, value_json").eq("link_fact_id", fid)
    .order("recorded_at", { ascending: false }).limit(1);
  const ev = evs && evs[0];
  const ref = (ev && ev.source_ref) || "";
  let doi = ref.toUpperCase().startsWith("DOI:") ? ref.slice(4) : null;
  if (!doi) { const mm = ref.match(/10\.\d{4,}\/\S+/); doi = mm ? mm[0] : null; }
  if (!doi) return { error: "no DOI in evidence source_ref" };

  const { data: f } = await sb.from("chain_link_fact")
    .select("species_id, evidence_class").eq("id", fid).single();
  if (!f) return { error: "fact not found" };
  const { data: s } = await sb.from("species").select("accepted_name").eq("id", f.species_id).single();
  const compound = ev && ev.value_json && ev.value_json.compound ? ev.value_json.compound : null;

  const crossref = await resolveCrossref(doi);
  const pid = pidFor(fid);
  const src = crossref.title
    ? " Source: " + crossref.authors + " (" + crossref.year + "), " + crossref.title + ", " + crossref.journal + " " + (crossref.volume || "") + ":" + (crossref.page || "") + "."
    : "";
  const citation = "GEOCON Atlas. Verified fact " + pid + " -- " + (compound || "a verified fact") +
    " in " + (s ? s.accepted_name : "") + ". Evidence: " + (f.evidence_class || "literature") +
    ", money-blind." + src + " DOI:" + doi + ". https://atlas.vennbioventures.com/receipt/" + pid;

  const { error } = await sb.from("chain_receipt").insert({
    pid, link_fact_id: fid, version: 1, doi, crossref, citation_md: citation,
  });
  if (error) return { error: error.message };
  return { minted: true, pid, compound, doi };
}

export async function GET(req) {
  const url = new URL(req.url);
  // Header-only auth for this WRITE endpoint (a URL ?secret leaks via logs/referrers
  // per Codex crosscheck). The cron sends x-cron-secret; manual triggers use curl.
  const secret = req.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const linkFactId = url.searchParams.get("link_fact_id");
  const batch = url.searchParams.get("mode") === "batch";

  let factIds = [];
  if (linkFactId) {
    factIds = [linkFactId];
  } else if (batch) {
    const { data: ev } = await sb.from("chain_evidence").select("link_fact_id, source_ref").like("source_ref", "DOI:%");
    const { data: have } = await sb.from("chain_receipt").select("link_fact_id");
    const haveSet = new Set((have || []).map((r) => r.link_fact_id));
    factIds = [...new Set((ev || []).map((e) => e.link_fact_id).filter((id) => id && !haveSet.has(id)))];
  } else {
    return Response.json({ error: "link_fact_id or mode=batch required" }, { status: 400 });
  }

  const minted = [], skipped = [], errors = [];
  for (const fid of factIds) {
    try {
      const r = await mintOne(fid);
      if (r.minted) minted.push(r);
      else if (r.skipped) skipped.push({ fid, pid: r.pid });
      else errors.push({ fid, err: r.error });
    } catch (e) {
      errors.push({ fid, err: e.message });
    }
  }

  return Response.json({ candidates: factIds.length, minted: minted.length, skipped: skipped.length, errors, sample: minted.slice(0, 10) });
}
