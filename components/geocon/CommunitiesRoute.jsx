"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { fetchAllResearchers } from "../../lib/fetchHelpers";
import { Loading } from "../shared";
import CommunitiesView from "../communities/CommunitiesView";

/**
 * /geocon/communities — route wrapper around CommunitiesView.
 * Needs the species + researchers tables; the view itself fetches its
 * researcher_species joins so we don't duplicate that here.
 */
export default function CommunitiesRoute() {
  const [species, setSpecies] = useState([]);
  const [researchers, setResearchers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [sp, rs] = await Promise.all([
          supabase
            .from("species")
            .select("id, accepted_name, family, iucn_status, country_focus, thumbnail_url, composite_score")
            .order("composite_score", { ascending: false, nullsFirst: false })
            .limit(2000),
          fetchAllResearchers(),
        ]);
        if (cancelled) return;
        setSpecies(sp.data || []);
        setResearchers(rs || []);
      } catch (e) {
        console.warn("[communities] load error:", e?.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <Loading />;
  return <CommunitiesView species={species} researchers={researchers} />;
}
