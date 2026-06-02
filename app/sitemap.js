import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.invalid",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "anon"
);

const SITE = "https://geocon-atlas.vercel.app";

const STATIC = [
  "",                     // root (BEE landing)
  "/geocon",
  "/geocon/about",
  "/geocon/explore",
  "/geocon/species",
  "/geocon/families",
  "/geocon/countries",
  "/geocon/metabolites",
  "/geocon/publications",
  "/geocon/researchers",
  "/geocon/organizations",
  "/geocon/proposals",
  "/geocon/proposals/open",
  "/geocon/ask",
  "/geocon/compare",
  "/geocon/programs",
  "/geocon/programs/analytics",
  "/geocon/activity",
  "/geocon/communities",
];

export default async function sitemap() {
  const now = new Date();
  const entries = STATIC.map((path) => ({
    url: SITE + path,
    lastModified: now,
    changeFrequency: "daily",
    priority: path === "" || path === "/geocon" ? 1.0 : 0.7,
  }));

  // Pull a manageable slice of high-priority species (composite_score)
  // and threatened ones for SEO. Hard cap at 5k to keep the file in
  // Google's 50k row / 50 MB limit even after long growth.
  try {
    const { data: top } = await supabase
      .from("species")
      .select("id")
      .order("composite_score", { ascending: false, nullsFirst: false })
      .limit(5000);
    if (Array.isArray(top)) {
      for (const s of top) {
        entries.push({
          url: `${SITE}/geocon/species/${s.id}`,
          lastModified: now,
          changeFrequency: "weekly",
          priority: 0.6,
        });
      }
    }
  } catch {}

  // Families + countries — small but valuable for SEO
  try {
    const { data: fams } = await supabase.rpc("get_atlas_family_counts");
    if (Array.isArray(fams)) {
      for (const f of fams) {
        entries.push({
          url: `${SITE}/geocon/families/${encodeURIComponent(f.family)}`,
          lastModified: now,
          changeFrequency: "weekly",
          priority: 0.55,
        });
      }
    }
  } catch {}

  return entries;
}
