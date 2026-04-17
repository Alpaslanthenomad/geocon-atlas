import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BATCH = 25;

async function getWikimediaPhoto(speciesName) {
  try {
    // Try exact species name first on iNaturalist
    const inatRes = await fetch(
      `https://api.inaturalist.org/v1/taxa/autocomplete?q=${encodeURIComponent(speciesName)}&rank=species&per_page=3`
    );
    const inatData = await inatRes.json();

    // Find best match
    const match = inatData.results?.find(t =>
      t.name?.toLowerCase() === speciesName.toLowerCase() ||
      t.default_photo?.medium_url
    );

    if (match?.default_photo?.medium_url) {
      return {
        photo_url: match.default_photo.medium_url.replace("medium", "large"),
        thumbnail_url: match.default_photo.medium_url,
        photo_credit: `© ${match.default_photo.attribution || "iNaturalist"}`,
        photo_source: "iNaturalist",
      };
    }

    // Fallback: try genus level on iNaturalist
    const genus = speciesName.split(" ")[0];
    const genusRes = await fetch(
      `https://api.inaturalist.org/v1/taxa/autocomplete?q=${encodeURIComponent(genus)}&rank=genus&per_page=1`
    );
    const genusData = await genusRes.json();
    if (genusData.results?.[0]?.default_photo?.medium_url) {
      const t = genusData.results[0];
      return {
        photo_url: t.default_photo.medium_url.replace("medium", "large"),
        thumbnail_url: t.default_photo.medium_url,
        photo_credit: `© ${t.default_photo.attribution || "iNaturalist"} (genus level)`,
        photo_source: "iNaturalist",
      };
    }

    // Fallback: Wikipedia
    const wikiRes = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(speciesName.replace(" ", "_"))}`
    );
    if (wikiRes.ok) {
      const wikiData = await wikiRes.json();
      if (wikiData.thumbnail?.source) {
        return {
          photo_url: wikiData.originalimage?.source || wikiData.thumbnail.source,
          thumbnail_url: wikiData.thumbnail.source,
          photo_credit: "© Wikimedia Commons",
          photo_source: "Wikipedia",
        };
      }
    }

    // Last fallback: Wikipedia genus page
    const wikiGenusRes = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(genus)}`
    );
    if (wikiGenusRes.ok) {
      const wikiGenusData = await wikiGenusRes.json();
      if (wikiGenusData.thumbnail?.source) {
        return {
          photo_url: wikiGenusData.originalimage?.source || wikiGenusData.thumbnail.source,
          thumbnail_url: wikiGenusData.thumbnail.source,
          photo_credit: "© Wikimedia Commons (genus level)",
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
      // Skip only if already has a non-genus photo
      if (sp.photo_url && sp.photo_credit && !sp.photo_credit.includes("genus level")) {
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
