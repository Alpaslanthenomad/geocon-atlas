// lib/visibility.js
//
// GEOCON Visibility Constitution (1 May 2026):
// - Public 🌐  → herkes görür
// - Network 👥 → kayıtlı GEOCON bireyleri (kurumlar değil — kurumlar Public görür)
// - Workspace 🔒 → sadece program owner + members
//
// İlke: "Bilimi açan, ticareti koruyan."

export const VIS = Object.freeze({
  PUBLIC: 'public',
  NETWORK: 'network',
  WORKSPACE: 'workspace',
});

export const VIS_ORDER = [VIS.PUBLIC, VIS.NETWORK, VIS.WORKSPACE];

export const VIS_META = {
  [VIS.PUBLIC]: {
    icon: '🌐',
    labelTr: 'Açık',
    labelEn: 'Public',
    descTr: 'Herkes görür',
    descEn: 'Visible to everyone',
    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  [VIS.NETWORK]: {
    icon: '👥',
    labelTr: 'Ağ',
    labelEn: 'Network',
    descTr: 'GEOCON üyeleri görür',
    descEn: 'Visible to GEOCON members',
    cls: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  [VIS.WORKSPACE]: {
    icon: '🔒',
    labelTr: 'Çalışma alanı',
    labelEn: 'Workspace',
    descTr: 'Sadece program ekibi',
    descEn: 'Program team only',
    cls: 'bg-amber-50 text-amber-700 border-amber-200',
  },
};

export function getVisMeta(level) {
  return VIS_META[level] ?? VIS_META[VIS.WORKSPACE];
}

/**
 * Higher rank = more restricted. Used to compare two visibility levels.
 */
export function visRank(level) {
  return VIS_ORDER.indexOf(level);
}
