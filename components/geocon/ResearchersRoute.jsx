"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { fetchAllResearchers } from "../../lib/fetchHelpers";
import { Loading } from "../shared";
import ResearchersView from "../researchers/ResearchersView";

/**
 * /geocon/researchers — route wrapper around the legacy ResearchersView.
 * Annotates each researcher with is_geocon_active based on program_members.
 * A click on a row currently opens nothing — the researcher detail panel
 * will become its own route in a later pass.
 */
export default function ResearchersRoute() {
  const router = useRouter();
  const [researchers, setResearchers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [all, members] = await Promise.all([
          fetchAllResearchers(),
          supabase.from("program_members").select("researcher_id"),
        ]);
        if (cancelled) return;
        const activeIds = new Set((members.data || []).map((m) => m.researcher_id).filter(Boolean));
        const annotated = (all || [])
          .map((r) => ({ ...r, is_geocon_active: activeIds.has(r.id) }))
          .sort((a, b) => {
            if (a.is_geocon_active !== b.is_geocon_active) return a.is_geocon_active ? -1 : 1;
            return (b.h_index || 0) - (a.h_index || 0);
          });
        setResearchers(annotated);
      } catch (e) {
        console.warn("[researchers] load error:", e?.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <Loading />;

  return (
    <ResearchersView
      researchers={researchers}
      onOpenResearcher={(r) => router.push(`/geocon/researchers/${encodeURIComponent(r.id || r)}`)}
    />
  );
}
