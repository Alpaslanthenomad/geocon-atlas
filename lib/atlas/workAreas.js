// The 5 work-areas of a species gearbox — the shared vocabulary for the gearbox, the
// work-desk and the position picker. (Names are provisional, pending the naming pass.)
export const WORK_AREAS = [
  { key: "identity", label: "Kimlik", color: "#1D9E75" },
  { key: "conservation", label: "Koruma", color: "#639922" },
  { key: "propagation", label: "Çoğaltım", color: "#378ADD" },
  { key: "chemistry", label: "Kimya", color: "#7F77DD" },
  { key: "value", label: "Değer", color: "#D85A30" },
];

export const AREA_BY_KEY = Object.fromEntries(WORK_AREAS.map((a) => [a.key, a]));
