"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";
import {
  fetchAllPublications,
  fetchAllMetabolites,
  fetchAllMetabolitePublications,
  fetchAllResearchers,
} from "../../lib/fetchHelpers";

import { Loading, SecondaryLoading } from "../shared";
import GEOCONHome from "../home/GEOCONHome";
import MyDashboard from "./MyDashboard";
import SpeciesDetailPanel from "../species/SpeciesDetailPanel";
import StartProgramModal from "../programs/StartProgramModal";
import CompassWidget from "../programs/CompassWidget";

/**
 * /geocon home route — loads the snapshot data the command center needs
 * (species + programs + secondary publications/metabolites/researchers).
 * Species/researcher detail panels still live here as modals until those
 * routes land in Phase 2.
 */
export default function HomeRoute() {
  const router = useRouter();
  const { user, profile, researcher } = useAuthContext();

  const [loading, setLoading] = useState(true);
  const [secondaryLoading, setSecondaryLoading] = useState(true);

  const [species, setSpecies] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [publications, setPublications] = useState([]);
  const [metabolites, setMetabolites] = useState([]);
  const [metabolitePublications, setMetabolitePublications] = useState([]);
  const [researchers, setResearchers] = useState([]);

  const [detailSpecies, setDetailSpecies] = useState(null);
  const [startProgramSp, setStartProgramSp] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCritical() {
      try {
        // Home only needs top-priority species (for ventureReady etc), not
        // all 47k WCVP rows. Capping at 2000 keeps the page snappy as the
        // atlas grows; the global counts that need to be exact (threatened,
        // total) come from cheap count-only queries below.
        const [sp, prog, pmem, ppub, threatenedCount, totalCount] = await Promise.all([
          supabase
            .from("species")
            .select("*")
            .order("composite_score", { ascending: false, nullsFirst: false })
            .limit(2000),
          supabase.from("programs").select("*, species(accepted_name,iucn_status,thumbnail_url), created_by_researcher:researchers!created_by(id,name,institution)").order("priority_score", { ascending: false }),
          supabase.from("program_members").select("researcher_id,program_id,role"),
          supabase.from("program_publications").select("publication_id,program_id"),
          supabase.from("species").select("id", { count: "exact", head: true }).in("iucn_status", ["CR", "EN", "VU"]),
          supabase.from("species").select("id", { count: "exact", head: true }),
        ]);
        if (cancelled) return null;

        // Attach the accurate global counts so GEOCONHome's stats stay true
        // even when species[] is the capped subset.
        const speciesRows = sp.data || [];
        speciesRows.__threatenedCount = threatenedCount.count || 0;
        speciesRows.__totalCount = totalCount.count || 0;
        setSpecies(speciesRows);
        if (prog.data) setPrograms(prog.data);
        setLoading(false);

        return {
          activeResearcherIds: new Set((pmem.data || []).map(m => m.researcher_id)),
          curatedPubIds: new Set((ppub.data || []).map(pp => pp.publication_id)),
        };
      } catch {
        if (!cancelled) setLoading(false);
        return null;
      }
    }

    async function loadSecondary(idSets) {
      try {
        const [pub, allResearchers, allMetabolites, allMetabPubs] = await Promise.all([
          fetchAllPublications(),
          fetchAllResearchers(),
          fetchAllMetabolites(),
          fetchAllMetabolitePublications(),
        ]);
        if (cancelled) return;

        const activeIds = idSets?.activeResearcherIds || new Set();
        const curatedIds = idSets?.curatedPubIds || new Set();

        const researchersAnnotated = allResearchers.map(r => ({ ...r, is_geocon_active: activeIds.has(r.id) }));
        researchersAnnotated.sort((a, b) => {
          if (a.is_geocon_active !== b.is_geocon_active) return a.is_geocon_active ? -1 : 1;
          return (b.h_index || 0) - (a.h_index || 0);
        });

        const publicationsAnnotated = pub.map(p => ({ ...p, is_geocon_curated: curatedIds.has(p.id) }));

        setMetabolites(allMetabolites);
        setMetabolitePublications(allMetabPubs);
        setResearchers(researchersAnnotated);
        setPublications(publicationsAnnotated);
      } catch {
        // silent
      } finally {
        if (!cancelled) setSecondaryLoading(false);
      }
    }

    (async () => {
      const idSets = await loadCritical();
      loadSecondary(idSets);
    })();

    return () => { cancelled = true; };
  }, []);

  // GEOCONHome calls setView(key). Adapt to real routes.
  function setView(key) {
    if (!key) return;
    router.push(`/geocon/${key}`);
  }

  if (loading) return <Loading />;

  const userRole = profile?.role || "observer";
  const homeUser = user
    ? { role: userRole, name: profile?.full_name || researcher?.name || user.email.split("@")[0] }
    : { role: "observer", name: "Observer" };

  return (
    <>
      <MyDashboard />
      <GEOCONHome
        species={species}
        publications={publications}
        metabolites={metabolites}
        researchers={researchers}
        programs={programs}
        user={homeUser}
        setView={setView}
        onSpeciesClick={setDetailSpecies}
        onStartProgram={(sp) => setStartProgramSp(sp)}
      />

      {secondaryLoading && publications.length === 0 && (
        <div style={{ marginTop: 16 }}>
          <SecondaryLoading label="Loading publications and metabolites" />
        </div>
      )}

      {detailSpecies && (
        <SpeciesDetailPanel
          species={detailSpecies}
          programs={programs}
          metabolitePublications={metabolitePublications}
          onClose={() => setDetailSpecies(null)}
          onStartProgram={(sp) => { setStartProgramSp(sp); setDetailSpecies(null); }}
          onOpenProgram={(prog) => { router.push(`/geocon/programs/${prog.id}`); setDetailSpecies(null); }}
          onOpenResearcher={() => { /* researcher route lands in Phase 2 */ }}
        />
      )}

      {startProgramSp && (
        <StartProgramModal
          species={startProgramSp}
          user={user}
          profile={profile}
          researcher={researcher}
          onClose={() => setStartProgramSp(null)}
          onSuccess={() => { setStartProgramSp(null); window.location.reload(); }}
        />
      )}

      <CompassWidget programId="8837a92b-6af0-4a20-ad34-5259045190a1" />
    </>
  );
}
