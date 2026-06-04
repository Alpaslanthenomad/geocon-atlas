// v4.3-d — Admin endpoint to mint a Zenodo DOI for a pending citation.
//
// POST /api/admin/zenodo/mint  { citation_id }
//
// Server-side action that:
// 1) loads the pending data_citations row
// 2) POSTs a deposition to Zenodo (DOI reserved)
// 3) Sets metadata + publishes (so the DOI is final)
// 4) Persists DOI back via set_citation_doi
//
// Env-gated by ZENODO_API_TOKEN. Without it returns 503.
//
// Audit-safe: never accepts requested_by from the client; always reads
// the row from DB to bind metadata to the original requester.

import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.invalid";
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || "service";
const ZENODO_TOKEN = process.env.ZENODO_API_TOKEN || "";
const ZENODO_BASE  = process.env.ZENODO_BASE || "https://zenodo.org/api";

async function isAdmin(jwt) {
  const sb = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "anon", {
    auth: { persistSession: false },
    global: { headers: { Authorization: jwt } },
  });
  const { data } = await sb.from("profiles").select("role").maybeSingle();
  return data?.role === "admin";
}

export async function POST(req) {
  if (!ZENODO_TOKEN) {
    return Response.json({
      error: "ZENODO_API_TOKEN not configured",
      hint: "Set ZENODO_API_TOKEN env var on Vercel to enable DOI minting.",
    }, { status: 503 });
  }
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) {
    return Response.json({ error: "Authorization header required" }, { status: 401 });
  }
  const adminOk = await isAdmin(auth);
  if (!adminOk) return Response.json({ error: "admin only" }, { status: 403 });

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "json body required" }, { status: 400 }); }
  const citationId = body?.citation_id;
  if (!citationId) return Response.json({ error: "citation_id required" }, { status: 400 });

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const { data: cit, error } = await admin.from("data_citations")
    .select("id, kind, reference_id, cited_text, requested_by, doi")
    .eq("id", citationId)
    .maybeSingle();
  if (error || !cit) return Response.json({ error: "citation not found" }, { status: 404 });
  if (cit.doi) return Response.json({ error: "already minted", doi: cit.doi }, { status: 409 });

  // Step 1: Create empty deposition
  let depRes;
  try {
    depRes = await fetch(`${ZENODO_BASE}/deposit/depositions?access_token=${ZENODO_TOKEN}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
  } catch (e) {
    return Response.json({ error: "Zenodo unreachable", detail: String(e) }, { status: 502 });
  }
  if (!depRes.ok) {
    const t = await depRes.text();
    return Response.json({ error: `Zenodo create ${depRes.status}`, detail: t.slice(0, 300) }, { status: 502 });
  }
  const dep = await depRes.json();
  const depositionId = dep?.id;
  const reservedDoi  = dep?.metadata?.prereserve_doi?.doi || dep?.doi || null;
  if (!depositionId || !reservedDoi) {
    return Response.json({ error: "Zenodo response missing id/doi" }, { status: 502 });
  }

  // Step 2: Patch metadata
  const meta = {
    metadata: {
      upload_type: "dataset",
      title: `GEOCON Atlas citation — ${cit.kind}: ${cit.reference_id}`.slice(0, 250),
      description: (cit.cited_text || `Reference to GEOCON Atlas commons record (${cit.kind}, ${cit.reference_id}).`).slice(0, 4000),
      creators: [{ name: "GEOCON Atlas (Venn BioVentures)" }],
      access_right: "open",
      license: "cc-by-4.0",
      keywords: ["GEOCON", "conservation", "biodiversity", cit.kind].filter(Boolean),
      related_identifiers: [{
        identifier: `https://atlas.vennbioventures.com/geocon/${cit.kind}/${encodeURIComponent(cit.reference_id)}`,
        relation: "isDerivedFrom",
        scheme: "url",
      }],
      communities: [],
    },
  };
  const patchRes = await fetch(`${ZENODO_BASE}/deposit/depositions/${depositionId}?access_token=${ZENODO_TOKEN}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(meta),
  });
  if (!patchRes.ok) {
    const t = await patchRes.text();
    return Response.json({ error: `Zenodo metadata ${patchRes.status}`, detail: t.slice(0, 300) }, { status: 502 });
  }

  // Step 3: Publish (locks the DOI live)
  const pubRes = await fetch(`${ZENODO_BASE}/deposit/depositions/${depositionId}/actions/publish?access_token=${ZENODO_TOKEN}`, {
    method: "POST",
  });
  if (!pubRes.ok) {
    const t = await pubRes.text();
    return Response.json({ error: `Zenodo publish ${pubRes.status}`, detail: t.slice(0, 300) }, { status: 502 });
  }
  const pub = await pubRes.json();
  const finalDoi = pub?.doi || reservedDoi;

  // Step 4: Persist back
  await admin.rpc("set_citation_doi", {
    p_id: citationId,
    p_doi: finalDoi,
    p_zenodo_record_id: String(depositionId),
  });

  return Response.json({ doi: finalDoi, zenodo_record_id: depositionId });
}
