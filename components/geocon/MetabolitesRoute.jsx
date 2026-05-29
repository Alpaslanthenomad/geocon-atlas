"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import {
  fetchAllPublications,
  fetchAllMetabolites,
  fetchAllMetabolitePublications,
} from "../../lib/fetchHelpers";
import { Loading } from "../shared";
import MetaboliteExplorer from "../metabolites/MetaboliteExplorer";

/**
 * /geocon/metabolites — route wrapper around the legacy MetaboliteExplorer.
 * Fetches the four datasets the explorer needs (metabolites, publications,
 * metabolite_publications links, species). Clicking a species in the
 * explorer routes to its /geocon/species/[id] detail page instead of opening
 * an inline panel.
 */
export default function MetabolitesRoute() {
  const router = useRouter();
  const [metabolites, setMetabolites] = useState([]);
  const [metabolitePublications, setMetabolitePublications] = useState([]);
  const [publications, setPublications] = useState([]);
  const [species, setSpecies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [mets, mpubs, pubs, sp] = await Promise.all([
          fetchAllMetabolites(),
          fetchAllMetabolitePublications(),
          fetchAllPublications(),
          supabase
            .from("species")
            .select("id, accepted_name, family, iucn_status, country_focus, thumbnail_url, composite_score")
            .order("composite_score", { ascending: false, nullsFirst: false })
            .limit(2000),
        ]);
        if (cancelled) return;
        setMetabolites(mets || []);
        setMetabolitePublications(mpubs || []);
        setPublications(pubs || []);
        setSpecies(sp.data || []);
      } catch (e) {
        console.warn("[metabolites] load error:", e?.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <Loading />;

  return (
    <MetaboliteExplorer
      metabolites={metabolites}
      metabolitePublications={metabolitePublications}
      publications={publications}
      species={species}
      onSpeciesClick={(s) => s?.id && router.push(`/geocon/species/${s.id}`)}
    />
  );
}
