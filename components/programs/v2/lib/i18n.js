// lib/i18n.js
//
// Lightweight i18n helper. Memory says TR is the primary language;
// most DB labels are stored as label_tr / label_en pairs.
//
// Usage:
//   pickLabel({ label_tr: 'Tehdit analizi', label_en: 'Threat analysis' }, 'tr')
//   pickLabel(ticDef, lang)
//
// If lang preference is missing, falls back to the other language, then to ''.

export function pickLabel(obj, lang = 'tr', field = 'label') {
  if (!obj) return '';
  const primary = obj[`${field}_${lang}`];
  if (primary) return primary;
  const fallback = lang === 'tr' ? obj[`${field}_en`] : obj[`${field}_tr`];
  return fallback || '';
}

export function pickDescription(obj, lang = 'tr') {
  return pickLabel(obj, lang, 'description');
}

// Common UI strings used across tabs. Kept here to avoid scattering hardcoded text.
export const T = {
  // Tabs
  tabFoundation: { tr: 'Foundation', en: 'Foundation' },
  tabFieldLab:   { tr: 'Field & Lab', en: 'Field & Lab' },
  tabPathways:   { tr: 'Değer Yolları', en: 'Pathways' },
  tabContributors: { tr: 'Ekip', en: 'Contributors' },
  tabOutputs:    { tr: 'Çıktılar', en: 'Outputs' },

  // Statuses
  statusPending:    { tr: 'Bekliyor', en: 'Pending' },
  statusInProgress: { tr: 'Devam ediyor', en: 'In progress' },
  statusCompleted:  { tr: 'Tamamlandı', en: 'Completed' },
  statusWaived:     { tr: 'Waive edildi', en: 'Waived' },

  // Gate
  gatePassed:       { tr: 'Kapı açık', en: 'Gate passed' },
  gateNotPassed:    { tr: 'Kapı kapalı', en: 'Gate not passed' },
  gateProgress:     { tr: 'ilerleme', en: 'progress' },
  foundationGate:   { tr: 'Foundation Gate', en: 'Foundation Gate' },
  fieldLabGate:     { tr: 'Field & Lab Gate', en: 'Field & Lab Gate' },

  // Actions
  actionComplete:   { tr: 'Tamamla', en: 'Complete' },
  actionWaive:      { tr: 'Waive et', en: 'Waive' },
  actionRevisit:    { tr: 'Yeniden aç', en: 'Revisit' },
  actionDeclare:    { tr: 'Pathway ekle', en: 'Declare pathway' },
  actionActivate:   { tr: 'Aktive et', en: 'Activate' },
  actionAddOutput:  { tr: 'Çıktı ekle', en: 'Add output' },
  actionCancel:     { tr: 'İptal', en: 'Cancel' },
  actionSave:       { tr: 'Kaydet', en: 'Save' },
  actionClose:      { tr: 'Kapat', en: 'Close' },

  // Wheels
  wheelConservation: { tr: 'Koruma', en: 'Conservation' },
  wheelScience:      { tr: 'Bilim', en: 'Science' },

  // Misc
  loading:           { tr: 'Yükleniyor…', en: 'Loading…' },
  errorGeneric:      { tr: 'Bir hata oluştu', en: 'Something went wrong' },
  noData:            { tr: 'Henüz veri yok', en: 'No data yet' },
  evidenceLink:      { tr: 'Kanıt bağlantısı (opsiyonel)', en: 'Evidence link (optional)' },
  evidenceType:      { tr: 'Kanıt tipi', en: 'Evidence type' },
  evidenceNotes:     { tr: 'Notlar (opsiyonel)', en: 'Notes (optional)' },
  reasonRequired:    { tr: 'Gerekçe (en az 10 karakter)', en: 'Reason (min 10 chars)' },
  ownerOnly:         { tr: 'Sadece program sahibi', en: 'Owner only' },
};

export function t(key, lang = 'tr') {
  const entry = T[key];
  if (!entry) return key;
  return entry[lang] ?? entry.en ?? entry.tr ?? key;
}
