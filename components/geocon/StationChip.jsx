"use client";
// The station control surface (Phase 3). A small chip on the workspace that lets
// the user declare / change their identity (one of 9 stations). Persists via
// set_my_station, which also resolves the intent (so the lanes reorder). Station
// RE-SKINS only — it never gates. Shows the payoff text of the chosen station.

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { STATIONS, SUPER_CLASSES, getStation } from "../../lib/persona";

export default function StationChip() {
  const [station, setStation] = useState(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let on = true;
    supabase.rpc("get_my_station").then(({ data }) => { if (on) setStation(data || null); }).catch(() => {});
    return () => { on = false; };
  }, []);

  async function pick(key) {
    setSaving(true);
    const { error } = await supabase.rpc("set_my_station", { p_station: key });
    if (!error) setStation(key);
    setSaving(false);
    setOpen(false);
  }

  const meta = getStation(station);
  const groups = Object.keys(SUPER_CLASSES).map((sc) => ({
    sc, items: STATIONS.filter((s) => s.superClass === sc),
  }));

  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen((o) => !o)} style={{
        fontSize: 11, fontWeight: 700, padding: "5px 11px", borderRadius: 999,
        background: "var(--gx-surface-2)", color: "var(--gx-ink-soft)",
        border: "1px solid var(--gx-card-border)", cursor: "pointer", whiteSpace: "nowrap",
      }}>
        {meta ? meta.label : "Set your station"} ▾
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 30, width: 240,
          background: "var(--gx-card-bg)", border: "1px solid var(--gx-card-border)",
          borderRadius: 10, padding: 6, boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
        }}>
          {groups.map((g) => (
            <div key={g.sc} style={{ marginBottom: 4 }}>
              <div className="gx-overline" style={{ fontSize: 8.5, margin: "5px 8px 2px" }}>{SUPER_CLASSES[g.sc].label}</div>
              {g.items.map((s) => (
                <button key={s.key} onClick={() => pick(s.key)} disabled={saving}
                  style={{
                    display: "block", width: "100%", textAlign: "left",
                    fontSize: 12, fontWeight: s.key === station ? 700 : 500,
                    color: s.key === station ? "var(--gx-ink)" : "var(--gx-ink-soft)",
                    padding: "6px 9px", borderRadius: 7, border: "none",
                    background: s.key === station ? "var(--gx-surface-2)" : "transparent",
                    cursor: "pointer",
                  }}>
                  {s.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
