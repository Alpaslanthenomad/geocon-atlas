"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import ProgramDetailPanel from "../programs/v2/ProgramDetailPanel";

/**
 * /geocon/programs/[id] — v2 detail panel as a real route.
 * Fetches the program's display name + species name up front so the panel
 * header doesn't flash a UUID truncation.
 */
export default function ProgramDetailRoute({ programId }) {
  const router = useRouter();
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
    <ProgramDetailPanel
      program={meta}
      lang="tr"
      onClose={() => router.push("/geocon/programs")}
    />
  );
}
