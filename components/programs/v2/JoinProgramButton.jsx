"use client";
// The door (VIS-2). A non-member viewing a program can request to join; the
// owner approves/declines in Contributors. Mirrors the organization join model.

import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../../lib/supabase";

export default function JoinProgramButton({ programId }) {
  const [m, setM] = useState(null);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const load = useCallback(() => {
    supabase.rpc("get_my_program_membership", { p_program_id: programId })
      .then(({ data }) => setM(data || null)).catch(() => {});
  }, [programId]);
  useEffect(() => { if (programId) load(); }, [programId, load]);

  if (!m) return null;
  // owner or active member: no join control
  if (m.is_owner || m.status === "active") return null;

  if (!m.signed_in) {
    return <span className="text-[11px] text-slate-400">Sign in to request to join</span>;
  }
  if (m.status === "requested") {
    return <span className="rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 text-[11px] font-semibold">Request pending</span>;
  }

  async function submit() {
    setBusy(true); setErr(null);
    const { data, error } = await supabase.rpc("request_to_join_program", { p_program_id: programId, p_message: msg.trim() || null });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    if (data && data.success === false) { setErr(data.reason === "exists" ? "Already requested." : "Could not request."); return; }
    setOpen(false); setMsg(""); load();
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="rounded-lg bg-slate-900 text-white px-3 py-1.5 text-[12px] font-semibold hover:bg-slate-700">
        Request to join
      </button>
      {open && (
        <div className="fixed inset-0 z-[9990] flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-sm font-bold text-slate-800">Request to join this program</div>
            <p className="text-[12px] text-slate-500 mt-1">The owner reviews your request. Say briefly how you could contribute.</p>
            <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={4}
              placeholder="e.g. I work on Fritillaria propagation and can help with the in-vitro protocol…"
              className="mt-3 w-full rounded-lg border border-slate-200 p-2.5 text-[13px]" />
            {err && <div className="mt-2 text-[12px] text-red-600">{err}</div>}
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="px-3 py-1.5 text-[12px] text-slate-500">Cancel</button>
              <button onClick={submit} disabled={busy}
                className="rounded-lg bg-slate-900 text-white px-4 py-1.5 text-[12px] font-semibold disabled:opacity-60">
                {busy ? "Sending…" : "Send request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
