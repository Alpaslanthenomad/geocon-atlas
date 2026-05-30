"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Loading } from "../shared";
import CommunitiesView from "../communities/CommunitiesView";

/**
 * /geocon/communities — route wrapper around CommunitiesView.
 * Trimmed from 3,266-row fetchAllResearchers + 2,000 species to a top-N
 * slice with a tight column list. The view does its own
 * researcher_species joins on demand.
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
            .limit(400),
          supabase
            .from("researchers")
            .select("id, name, institution, country, h_index, citations_total, primary_field")
            .order("h_index", { ascending: false, nullsFirst: false })
            .limit(400),
        ]);
        if (cancelled) return;
        setSpecies(sp.data || []);
        setResearchers(rs.data || []);
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
