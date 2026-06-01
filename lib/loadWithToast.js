// Tiny helper so list/index routes can surface load failures without
// each one re-implementing the try/catch + console.warn + setState
// dance. Drop it into a useEffect-driven loader:
//
//   useEffect(() => {
//     const cancel = loadWithToast({
//       label: "MyDashboard",
//       toast,                            // from useToast()
//       fn: () => supabase.rpc("get_my_home_dashboard"),
//       onData: (data) => setRows(Array.isArray(data) ? data : []),
//       onSettled: () => setLoading(false),
//     });
//     return cancel;
//   }, [...]);
//
// Returns a cancel function for cleanup. The toast message is human-
// readable but kept short — error.message is shown as `detail`.

export function loadWithToast({
  label,
  toast,
  fn,
  onData,
  onSettled,
  // Override the user-facing toast message; default keys off `label`.
  errorMessage,
}) {
  let cancelled = false;
  (async () => {
    try {
      const result = await fn();
      if (cancelled) return;
      // Supabase JS pattern: { data, error } envelope
      if (result && typeof result === "object" && "data" in result) {
        if (result.error) throw result.error;
        onData?.(result.data);
      } else {
        onData?.(result);
      }
    } catch (e) {
      if (cancelled) return;
      const msg = e?.message || String(e);
      // eslint-disable-next-line no-console
      console.warn(`[${label}]`, msg);
      try {
        toast?.error?.(errorMessage || `${label} yüklenemedi`, { detail: msg });
      } catch { /* never let telemetry recursion break load path */ }
    } finally {
      if (!cancelled) onSettled?.();
    }
  })().catch(() => { /* belt-and-suspenders */ });
  return () => { cancelled = true; };
}
