"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FileSignature, ArrowRight } from "lucide-react";
import { supabase } from "../../lib/supabase";
import ProgramDetailPanel from "../programs/v2/ProgramDetailPanel";
import RelatedOpenCalls from "./RelatedOpenCalls";
import EntityDiscussion from "./EntityDiscussion";
import ProgramTheses from "./ProgramTheses";

const VALID_TABS = new Set(["foundation", "field_lab", "propagation", "pathways", "species", "contributors", "outputs", "stream"]);

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
  const tabFromUrl = !!(tabParam && VALID_TABS.has(tabParam));
  const initialTab = tabFromUrl ? tabParam : "foundation";
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
        tabFromUrl={tabFromUrl}
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
        <ProgramTheses programId={programId} title="Affiliated theses" />
        <Link href={`/geocon/grant-studio?program=${programId}`} className="flex items-center gap-2.5 mt-4 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 no-underline transition hover:bg-slate-50">
          <FileSignature size={18} strokeWidth={1.8} className="shrink-0 text-slate-500" />
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-medium text-slate-700">
              Bu programdan fon başvurusu hazırla
            </div>
            <div className="mt-1 text-[11px] leading-relaxed text-slate-400">
              TÜBİTAK · Horizon Europe · KOSGEB — Proje Yazım Stüdyosu&apos;nda, bu program önceden seçili açılır
            </div>
            <div className="mt-1 text-[11px] leading-relaxed text-slate-400">
              İkincil destek alanı — program durumu veya ilerleme onayı değildir.
            </div>
          </div>
          <ArrowRight size={15} strokeWidth={1.9} className="shrink-0 text-slate-400" />
        </Link>
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
