"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";
import ProgramDetailPanel from "../programs/v2/ProgramDetailPanel";
import RelatedOpenCalls from "./RelatedOpenCalls";
import EntityDiscussion from "./EntityDiscussion";

const VALID_TABS = new Set(["foundation", "field_lab", "pathways", "species", "contributors", "outputs", "stream"]);

/**
 * /geocon/programs/[id] — v2 detail panel as a real route.
 * Fetches the program's display name + species name up front so the panel
 * header doesn't flash a UUID truncation. Reads ?tab= so deep links from the
 * notification bell land on the right tab.
 */
export default function ProgramDetailRoute({ programId }) {
  return (
    <Suspense fallback={<Loading />}>
      <RouteInner programId={programId} />
    </Suspense>
  );
}

function RouteInner({ programId }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get("tab");
  const initialTab = tabParam && VALID_TABS.has(tabParam) ? tabParam : "foundation";
  const [meta, setMeta] = useState({ id: programId });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("programs")
        .select("id, program_name, species:species_id(accepted_name)")
        .eq("id", programId)
        .maybeSingle();
      if (cancelled || !data) return;
      setMeta({
        id: data.id,
        title: data.program_name,
        species_name: data.species?.accepted_name,
      });
    })();
    return () => { cancelled = true; };
  }, [programId]);

  return (
    <>
      <ProgramDetailPanel
        program={meta}
        lang="tr"
        initialTab={initialTab}
        onClose={() => router.push("/geocon/programs")}
      />
      {/* Related open calls — proposals/briefs that touch this program
          via its species. Matches the panel mounted on Species,
          Country, Family, and Organization detail pages so wayfinding
          stays symmetric. */}
      <div style={{ maxWidth: 1180, margin: "24px auto 0", padding: "0 16px" }}>
        <RelatedOpenCalls
          rpcName="list_open_proposals_for_program"
          rpcArgs={{ p_program_id: programId }}
          title={`Open calls touching ${meta.title || "this program"}`}
        />
        <div style={{ marginTop: 16 }}>
          <EntityDiscussion kind="program" entityKey={programId}
            title={`Discussion · ${meta.title || "program"}`} />
        </div>
      </div>
    </>
  );
}

function Loading() {
  return <div className="p-6 text-sm text-slate-500">Loading…</div>;
}
