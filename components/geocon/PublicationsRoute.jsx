"use client";
import { useEffect, useState } from "react";
import {
  fetchAllPublications,
  fetchAllMetabolites,
  fetchAllMetabolitePublications,
} from "../../lib/fetchHelpers";
import { useAuthContext } from "../../lib/authContext";
import { supabase } from "../../lib/supabase";
import { Loading } from "../shared";
import PublicationsView from "../publications/PublicationsView";

/**
 * /geocon/publications — route wrapper around the legacy PublicationsView.
 * Annotates each publication with is_geocon_curated based on which ones
 * are wired into a program via program_publications.
 */
export default function PublicationsRoute() {
  const { user, profile, researcher } = useAuthContext();
  const [publications, setPublications] = useState([]);
  const [metabolites, setMetabolites] = useState([]);
  const [metabolitePublications, setMetabolitePublications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [pubs, mets, mpubs, programPubs] = await Promise.all([
          fetchAllPublications(),
          fetchAllMetabolites(),
          fetchAllMetabolitePublications(),
          supabase.from("program_publications").select("publication_id"),
        ]);
        if (cancelled) return;
        const curatedIds = new Set((programPubs.data || []).map((r) => r.publication_id));
        setPublications(
          (pubs || []).map((p) => ({ ...p, is_geocon_curated: curatedIds.has(p.id) }))
        );
        setMetabolites(mets || []);
        setMetabolitePublications(mpubs || []);
      } catch (e) {
        console.warn("[publications] load error:", e?.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <Loading />;

  return (
    <PublicationsView
      publications={publications}
      metabolites={metabolites}
      metabolitePublications={metabolitePublications}
      user={user}
      profile={profile}
      researcher={researcher}
      onPublicationAdded={() => window.location.reload()}
    />
  );
}
