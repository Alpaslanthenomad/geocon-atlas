import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BATCH = 25;

async function getWikimediaPhoto(speciesName) {
  try {
    // First try iNaturalist API - better quality photos
    const inatRes = await fetch(
      `https://api.inaturalist.org/v1/taxa/autocomplete?q=${encodeURIComponent(speciesName)}&rank=species&per_page=1`
    );
    const inatData = await inatRes.json();
    
    if (inatData.results?.[0]?.default_photo?.medium_url) {
      const taxon = inatData.results[0];
      return {
        photo_url: taxon.default_photo.medium_url.replace("medium", "large"),
        thumbnail_url: taxon.default_photo.medium_url,
        photo_credit: `© ${taxon.default_photo.attribution || "iNaturalist"}`,
        photo_source: "iNaturalist",
      };
    }

    // Fallback: Wikimedia Commons
    const wikiRes = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(speciesName.replace(" ", "_"))}`
    );
    
    if (wikiRes.ok) {
      const wikiData = await wikiRes.json();
      if (wikiData.thumbnail?.source) {
        const fullSize = wikiData.originalimage?.source || wikiData.thumbnail.source;
        return {
          photo_url: fullSize,
          thumbnail_url: wikiData.thumbnail.source,
          photo_credit: "© Wikimedia Commons",
          photo_source: "Wikipedia",
        };
      }
    }

    return null;
  } catch { return null; }
}

export async function GET(req) {
  const url = new URL(req.url);
  const secret = req.headers.get("x-cron-secret") || url.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const batch = parseInt(url.searchParams.get("batch") || "0");
  const log = { batch, processed: 0, photos_added: 0, not_found: 0, errors: [] };

  const { data: species } = await sb
    .from("species")
    .select("id, accepted_name, photo_url")
    .order("id")
    .range(batch * BATCH, (batch + 1) * BATCH - 1);

  if (!species?.length) return Response.json({ ...log, message: "empty batch" });

  for (const sp of species) {
    try {
      // Skip if already has photo
      if (sp.photo_url) {
        log.processed++;
        continue;
      }

      const photo = await getWikimediaPhoto(sp.accepted_name);

      if (photo) {
        const { error } = await sb
          .from("species")
          .update({
            photo_url: photo.photo_url,
            thumbnail_url: photo.thumbnail_url,
            photo_credit: photo.photo_credit,
          })
          .eq("id", sp.id);

        if (error) log.errors.push(`${sp.accepted_name}: ${error.message}`);
        else log.photos_added++;
      } else {
        log.not_found++;
      }

      log.processed++;
      await new Promise(r => setTimeout(r, 500));

    } catch (e) {
      log.errors.push(`${sp.accepted_name}: ${e.message}`);
      log.processed++;
    }
  }

  return Response.json(log);
}
