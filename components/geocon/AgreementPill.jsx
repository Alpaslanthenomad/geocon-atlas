"use client";
// Tiny "🔐 Agreement" pill — drop next to a program title in any
// listing surface (Programs index, species detail, family/country
// active-programs list). Uses a shared cache so a page rendering
// 20 program cards issues ONE RPC, not 20.

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

// In-page memo so siblings share the lookup.
const cache = new Map(); // programId → bool
const pending = new Map(); // programId → Promise<bool>

async function probeBulk(ids) {
  const unknown = ids.filter((id) => !cache.has(id) && !pending.has(id));
  if (unknown.length === 0) return;
  const p = (async () => {
    const { data } = await supabase.rpc("programs_with_active_agreements", { p_ids: unknown });
    const hits = new Set(Array.isArray(data) ? data.map((r) => r.program_id) : []);
    for (const id of unknown) cache.set(id, hits.has(id));
  })();
  for (const id of unknown) pending.set(id, p);
  await p;
  for (const id of unknown) pending.delete(id);
}

export default function AgreementPill({ programId }) {
  const [has, setHas] = useState(cache.get(programId) ?? null);

  useEffect(() => {
    if (!programId) return;
    let cancelled = false;
    if (cache.has(programId)) {
      setHas(cache.get(programId));
      return;
    }
    probeBulk([programId]).then(() => {
      if (cancelled) return;
      setHas(cache.get(programId) ?? false);
    });
    return () => { cancelled = true; };
  }, [programId]);

  if (!has) return null;
  return (
    <span
      title="A Member Agreement is on file for this Program. Splits and clauses are visible only to active members."
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: 0.4,
        textTransform: "uppercase",
        padding: "2px 7px",
        borderRadius: 999,
        background: "rgba(83, 74, 183, 0.14)",
        color: "var(--gx-accent-violet)",
        border: "1px solid rgba(83, 74, 183, 0.25)",
        whiteSpace: "nowrap",
      }}
    >
      🔐 Agreement
    </span>
  );
}
