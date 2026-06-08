"use client";
// Claim a species onto your bench (THE BENCH). Signed-in only. A claim is not a
// bookmark — it carries chain state and becomes your territory + the unit your
// private lab log + drafted moves attach to.

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";

export default function ClaimToggle({ speciesId }) {
  const { user } = useAuthContext();
  const [claimed, setClaimed] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user || !speciesId) return;
    supabase.rpc("is_species_claimed", { p_species_id: speciesId })
      .then(({ data }) => setClaimed(!!data)).catch(() => {});
  }, [user, speciesId]);

  if (!user) return null;

  async function toggle() {
    setBusy(true);
    try {
      if (claimed) { await supabase.rpc("unclaim_species", { p_species_id: speciesId }); setClaimed(false); }
      else { await supabase.rpc("claim_species", { p_species_id: speciesId, p_stance: null }); setClaimed(true); }
    } finally { setBusy(false); }
  }

  return (
    <button onClick={toggle} disabled={busy || claimed === null}
      style={{
        fontSize: 11.5, fontWeight: 700, padding: "7px 13px", borderRadius: 7, cursor: "pointer",
        border: claimed ? "1px solid #0a4a3e" : "none",
        background: claimed ? "var(--gx-card-bg)" : "#0a4a3e",
        color: claimed ? "#0a4a3e" : "#fff",
        whiteSpace: "nowrap",
      }}>
      {claimed ? "✓ On your bench" : "+ Claim to bench"}
    </button>
  );
}
