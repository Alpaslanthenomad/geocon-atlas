"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";

import { Loading } from "../shared";
import GEOCONHome from "../home/GEOCONHome";
import MyDashboard from "./MyDashboard";
import TrendingPanel from "./TrendingPanel";
import OnboardingChecklist from "./OnboardingChecklist";
import SpotlightRibbon from "./SpotlightRibbon";
import TrendingThreads from "./TrendingThreads";
import QuickTools from "./QuickTools";
import SpeciesDetailPanel from "../species/SpeciesDetailPanel";
import StartProgramModal from "../programs/StartProgramModal";
import CompassWidget from "../programs/CompassWidget";
import LeaderboardPanel from "./LeaderboardPanel";
import OrcidConnectBanner from "./OrcidConnectBanner";

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

  const [species, setSpecies] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [recentPublications, setRecentPublications] = useState([]);
  const [counts, setCounts] = useState({});

  const [detailSpecies, setDetailSpecies] = useState(null);
  const [startProgramSp, setStartProgramSp] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // 3 lightweight calls in parallel. The big change: we no longer
        // paginate every publication / researcher / metabolite row just to
        // call .length on them in the home widgets. get_home_metrics gives
        // us counts + the recent slices we actually render.
        //
        // Species slice is now 200 rows with a targeted column list — was
        // 2000 rows with select("*") which carried the tsvector and all
        // metadata for every row.
        const [metricsRes, spRes, progRes] = await Promise.all([
          supabase.rpc("get_home_metrics"),
          supabase
            .from("species")
            .select("id, accepted_name, family, genus, iucn_status, country_focus, thumbnail_url, composite_score, geocon_module, geophyte_type")
            .order("composite_score", { ascending: false, nullsFirst: false })
            .limit(200),
          supabase
            .from("programs")
            .select("id, program_name, status, priority_score, current_module, current_gate, next_action, species_id, created_by, species:species_id(accepted_name, iucn_status, thumbnail_url)")
            .order("priority_score", { ascending: false })
            .limit(50),
        ]);
        if (cancelled) return;

        const m = metricsRes.data || {};
        setCounts(m.counts || {});
        setRecentPublications(Array.isArray(m.recent_publications) ? m.recent_publications : []);

        const speciesRows = spRes.data || [];
        speciesRows.__threatenedCount = m.counts?.threatened || 0;
        speciesRows.__totalCount = m.counts?.species || 0;
        setSpecies(speciesRows);

        setPrograms(progRes.data || []);
      } catch {
        // silent — home still renders with whatever was set so far
      } finally {
        if (!cancelled) setLoading(false);
      }
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
      <OrcidConnectBanner />
      <OnboardingChecklist />
      <SpotlightRibbon />
      <TrendingThreads />
      <QuickTools />
      <MyDashboard />
      <LeaderboardPanel compact />
      <TrendingPanel />
      <GEOCONHome
        species={species}
        publications={recentPublications}
        metabolites={Array(counts.metabolites || 0).fill(null)}
        researchers={Array(counts.researchers || 0).fill(null)}
        programs={programs}
        user={homeUser}
        setView={setView}
        onSpeciesClick={setDetailSpecies}
        onStartProgram={(sp) => setStartProgramSp(sp)}
      />

      {detailSpecies && (
        <SpeciesDetailPanel
          species={detailSpecies}
          programs={programs}
          metabolitePublications={[]}
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
