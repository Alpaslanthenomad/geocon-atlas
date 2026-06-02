// ORCID → K1 baseline import.
//
// Inputs (POST body):
//   { orcid: "0000-0000-0000-0000" }
//
// Flow:
//   1. Authenticate the caller via Supabase JWT
//   2. Re-fetch the ORCID profile + works from the public API
//   3. Find or create the matching researchers row (key on orcid)
//   4. Link the profile to that researcher (profile.researcher_id)
//   5. Save the ORCID on the profile (orcid + welcomed_at NULL'd if first time)
//   6. For each work with a DOI: call import_orcid_work_as_event RPC
//   7. Return summary stats
//
// Idempotent: re-running on the same ORCID just no-ops the events.

import { createClient } from "@supabase/supabase-js";
import { isPlaceholderResearcherName } from "../../../../lib/researcherPlaceholders";

export const dynamic = "force-dynamic";

const ORCID_BASE = "https://pub.orcid.org/v3.0";
const UA = "GEOCONAtlas/1.0 (https://geocon.bio; atlas@geocon.bio)";

function isValidOrcid(s) {
  if (!s) return false;
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

export async function POST(req) {
  // ---- Authn ----
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.invalid"),
    (process.env.SUPABASE_SERVICE_ROLE_KEY || "service"),
    { auth: { persistSession: false } }
  );
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData?.user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const user = userData.user;

  // ---- Input ----
  let body;
  try { body = await req.json(); } catch { body = {}; }
  const orcid = (body?.orcid || "").trim();
  if (!isValidOrcid(orcid)) {
    return Response.json({ error: "invalid_orcid" }, { status: 400 });
  }

  // ---- Re-fetch from ORCID public API (server-side, trustable) ----
  let person, works;
  try {
    [person, works] = await Promise.all([
      fetchJson(`${ORCID_BASE}/${orcid}/person`),
      fetchJson(`${ORCID_BASE}/${orcid}/works`),
    ]);
  } catch (e) {
    const status = e?.status === 404 ? 404 : 502;
    return Response.json(
      { error: status === 404 ? "orcid_not_found" : "upstream_error", detail: String(e?.message || e) },
      { status }
    );
  }

  const name =
    [
      person?.name?.["given-names"]?.value,
      person?.name?.["family-name"]?.value,
    ].filter(Boolean).join(" ").trim() || null;
  const country = person?.addresses?.address?.[0]?.country?.value || null;

  // ---- Find or create researchers row ----
  let researcherId = null;
  {
    const { data: existing } = await admin
      .from("researchers")
      .select("id, name, country, orcid")
      .eq("orcid", orcid)
      .maybeSingle();
    if (existing) {
      researcherId = existing.id;
      // Patch name/country if we have better info and existing was empty.
      const patch = {};
      if (!existing.name && name) patch.name = name;
      if (!existing.country && country) patch.country = country;
      if (Object.keys(patch).length > 0) {
        await admin.from("researchers").update(patch).eq("id", researcherId);
      }
    } else {
      // Mint a stable researcher ID derived from the ORCID.
      researcherId = "RES-ORCID-" + orcid.replace(/-/g, "");
      const isPlaceholder = isPlaceholderResearcherName(name);
      await admin.from("researchers").upsert({
        id: researcherId,
        orcid,
        name: name || "(unnamed ORCID record)",
        country,
        priority: isPlaceholder ? "low" : "candidate",
        collaboration_fit: "self-onboarded via ORCID",
        notes: `Onboarded via ORCID ${orcid}.`,
        last_verified: new Date().toISOString().split("T")[0],
        is_placeholder: isPlaceholder,
      }, { onConflict: "id" });
    }
  }

  // ---- Link profile via SECURITY DEFINER RPC ----
  // Use a user-scoped client (anon key + bearer) so auth.uid() inside
  // the RPC resolves to the caller. The earlier `admin.from("profiles")
  // .update(...)` path was silently failing in production (suspect
  // service-role key handling), leaving profile.orcid NULL even when
  // the OAuth flow succeeded.
  const userClient = createClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.invalid"),
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "anon"),
    {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    }
  );

  const { error: linkErr } = await userClient.rpc("link_my_orcid", {
    p_orcid: orcid,
    p_researcher_id: researcherId,
    p_set_verified: false,  // manual flow doesn't prove ownership
    p_set_welcomed: false,  // welcomed_at is now stamped by Step 4 mission save
  });
  if (linkErr) {
    return Response.json(
      { error: "profile_link_failed", detail: linkErr.message },
      { status: 500 }
    );
  }

  // ---- Build the work list and import each with a DOI ----
  const worksFlat = (works?.group || [])
    .map((g) => {
      const s = g?.["work-summary"]?.[0];
      if (!s) return null;
      const title = s?.title?.title?.value || null;
      const year = Number(s?.["publication-date"]?.year?.value) || null;
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
      return { title, year, doi };
    })
    .filter((w) => w && w.doi);

  let newEvents = 0;
  for (const w of worksFlat) {
    const { data: inserted } = await admin.rpc("import_orcid_work_as_event", {
      p_contributor_id: researcherId,
      p_doi: w.doi,
      p_title: w.title,
      p_year: w.year,
    });
    if (typeof inserted === "number") newEvents += inserted;
  }

  // (welcomed_at was already stamped by link_my_orcid above)

  return Response.json({
    researcher_id: researcherId,
    works_seen: (works?.group || []).length,
    works_with_doi: worksFlat.length,
    new_events: newEvents,
    name,
    country,
  });
}
