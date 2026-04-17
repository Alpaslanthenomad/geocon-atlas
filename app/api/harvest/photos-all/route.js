import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getPhoto(speciesName) {
  try {
    // 1. iNaturalist — exact species
    const r1 = await fetch(`https://api.inaturalist.org/v1/taxa/autocomplete?q=${encodeURIComponent(speciesName)}&rank=species&per_page=3`);
    const d1 = await r1.json();
    const match = d1.results?.find(t => t.name?.toLowerCase() === speciesName.toLowerCase() && t.default_photo?.medium_url)
      || d1.results?.find(t => t.default_photo?.medium_url);
    if (match?.default_photo?.medium_url) {
      return { photo_url: match.default_photo.medium_url.replace("medium","large"), thumbnail_url: match.default_photo.medium_url, photo_credit: `© ${match.default_photo.attribution||"iNaturalist"}` };
    }

    // 2. iNaturalist — genus
    const genus = speciesName.split(" ")[0];
    const r2 = await fetch(`https://api.inaturalist.org/v1/taxa/autocomplete?q=${encodeURIComponent(genus)}&rank=genus&per_page=1`);
    const d2 = await r2.json();
    if (d2.results?.[0]?.default_photo?.medium_url) {
      const t = d2.results[0];
      return { photo_url: t.default_photo.medium_url.replace("medium","large"), thumbnail_url: t.default_photo.medium_url, photo_credit: `© ${t.default_photo.attribution||"iNaturalist"} (genus)` };
    }

    // 3. Wikipedia — species
    const r3 = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(speciesName.replace(" ","_"))}`);
    if (r3.ok) {
      const d3 = await r3.json();
      if (d3.thumbnail?.source) return { photo_url: d3.originalimage?.source||d3.thumbnail.source, thumbnail_url: d3.thumbnail.source, photo_credit: "© Wikimedia Commons" };
    }

    // 4. Wikipedia — genus
    const r4 = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(genus)}`);
    if (r4.ok) {
      const d4 = await r4.json();
      if (d4.thumbnail?.source) return { photo_url: d4.originalimage?.source||d4.thumbnail.source, thumbnail_url: d4.thumbnail.source, photo_credit: "© Wikimedia Commons (genus)" };
    }

    return null;
  } catch { return null; }
}

export async function GET(req) {
  const url = new URL(req.url);
  const secret = req.headers.get("x-cron-secret") || url.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const force = url.searchParams.get("force") === "true";
  const log = { processed: 0, photos_added: 0, not_found: 0, errors: [] };

  const { data: species } = await sb.from("species").select("id, accepted_name, photo_url, photo_credit").order("id");
  if (!species?.length) return Response.json({ ...log, message: "no species" });

  for (const sp of species) {
    try {
      // Skip if has good photo (not genus level) unless force=true
      if (!force && sp.photo_url && sp.photo_credit && !sp.photo_credit.includes("genus")) {
        log.processed++;
        continue;
      }

      const photo = await getPhoto(sp.accepted_name);

      if (photo) {
        const { error } = await sb.from("species").update({
          photo_url: photo.photo_url,
          thumbnail_url: photo.thumbnail_url,
          photo_credit: photo.photo_credit,
        }).eq("id", sp.id);

        if (error) log.errors.push(`${sp.accepted_name}: ${error.message}`);
        else log.photos_added++;
      } else {
        log.not_found++;
      }

      log.processed++;
      await new Promise(r => setTimeout(r, 400));
    } catch (e) {
      log.errors.push(`${sp.accepted_name}: ${e.message}`);
      log.processed++;
    }
  }

  return Response.json(log);
}
