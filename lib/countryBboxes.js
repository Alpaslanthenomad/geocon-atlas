/**
 * ISO-3166-1 alpha-2 → approximate bounding box for the populated/relevant
 * land mass of each country, [minLat, minLng, maxLat, maxLng].
 *
 * Used to spread per-species pins across a country's actual extent rather
 * than clustering every species at the country centroid. A deterministic
 * hash of the species id picks a stable point inside the box, so the same
 * species lands in the same spot every render.
 *
 * For a handful of countries with widely-separated territories (US, RU,
 * FR, NL, ...) we intentionally use only the contiguous land bbox so a
 * pin doesn't fly to Hawaii or French Guiana when the underlying species
 * lives in the mainland.
 *
 * Accuracy target: ±2° at most for the major species producers. Tail
 * countries can be coarser without harming the visual story.
 */

export const COUNTRY_BBOXES = {
  // ── Anatolia / Middle East / Caucasus (heavy geophyte coverage)
  TR: [36.0, 26.0, 42.1, 45.0],   // Turkey
  IR: [25.0, 44.0, 39.8, 63.3],   // Iran
  IQ: [29.1, 38.8, 37.4, 48.6],   // Iraq
  SY: [32.3, 35.7, 37.3, 42.4],   // Syria
  LB: [33.0, 35.1, 34.7, 36.6],   // Lebanon
  IL: [29.5, 34.3, 33.3, 35.9],   // Israel
  JO: [29.2, 34.9, 33.4, 39.3],   // Jordan
  CY: [34.5, 32.3, 35.7, 34.6],   // Cyprus
  AM: [38.8, 43.5, 41.3, 46.6],   // Armenia
  AZ: [38.4, 44.8, 41.9, 50.4],   // Azerbaijan
  GE: [41.0, 40.0, 43.6, 46.7],   // Georgia
  AF: [29.4, 60.5, 38.5, 74.9],   // Afghanistan
  PK: [23.5, 60.9, 37.1, 77.0],   // Pakistan
  YE: [12.1, 42.5, 19.0, 53.1],   // Yemen
  OM: [16.6, 51.9, 26.4, 59.8],   // Oman
  SA: [16.0, 34.5, 32.2, 55.7],   // Saudi Arabia
  AE: [22.6, 51.5, 26.1, 56.4],   // UAE

  // ── Mediterranean Europe
  GR: [34.8, 19.4, 41.7, 28.3],   // Greece
  ES: [36.0, -9.5, 43.8, 4.3],    // Spain (mainland)
  PT: [37.0, -9.5, 42.2, -6.2],   // Portugal (mainland)
  IT: [36.5, 6.6, 47.1, 18.5],    // Italy
  FR: [42.3, -5.2, 51.1, 8.3],    // France (metropolitan)
  HR: [42.4, 13.4, 46.5, 19.4],   // Croatia
  SI: [45.4, 13.4, 46.9, 16.6],   // Slovenia
  AL: [39.6, 19.3, 42.7, 21.1],   // Albania
  ME: [41.8, 18.4, 43.6, 20.4],   // Montenegro
  MK: [40.8, 20.4, 42.4, 23.0],   // North Macedonia
  RS: [42.2, 18.8, 46.2, 23.0],   // Serbia
  BA: [42.5, 15.7, 45.3, 19.7],   // Bosnia
  BG: [41.2, 22.4, 44.2, 28.6],   // Bulgaria
  RO: [43.6, 20.3, 48.3, 29.7],   // Romania
  MT: [35.8, 14.2, 36.1, 14.6],   // Malta

  // ── Northern + Central Europe (geophyte tail)
  DE: [47.3, 5.9, 55.1, 15.0],    // Germany
  AT: [46.4, 9.5, 49.0, 17.2],    // Austria
  CH: [45.8, 5.9, 47.8, 10.5],    // Switzerland
  CZ: [48.6, 12.1, 51.1, 18.9],   // Czechia
  SK: [47.7, 16.8, 49.6, 22.6],   // Slovakia
  HU: [45.7, 16.1, 48.6, 22.9],   // Hungary
  PL: [49.0, 14.1, 54.8, 24.2],   // Poland
  BE: [49.5, 2.5, 51.5, 6.4],     // Belgium
  NL: [50.7, 3.4, 53.6, 7.2],     // Netherlands (continental)
  LU: [49.4, 5.7, 50.2, 6.5],     // Luxembourg
  GB: [49.9, -8.6, 58.6, 1.8],    // United Kingdom
  IE: [51.4, -10.5, 55.4, -5.4],  // Ireland
  DK: [54.5, 8.0, 57.7, 12.6],    // Denmark
  SE: [55.3, 11.2, 68.8, 24.2],   // Sweden (south-skewed for geophyte habitat)
  NO: [58.0, 4.5, 71.0, 31.0],    // Norway
  FI: [59.8, 19.5, 70.1, 31.6],   // Finland
  EE: [57.5, 21.8, 59.7, 28.2],   // Estonia
  LV: [55.6, 21.0, 58.1, 28.2],   // Latvia
  LT: [53.9, 21.1, 56.4, 26.8],   // Lithuania
  BY: [51.3, 23.2, 56.2, 32.8],   // Belarus
  UA: [44.4, 22.1, 52.4, 40.2],   // Ukraine
  MD: [45.5, 26.6, 48.5, 30.1],   // Moldova
  RU: [50.0, 30.0, 60.0, 60.0],   // Russia (European core only — full bbox spans 11 zones)

  // ── North Africa (Maghreb + Sahara fringe)
  MA: [27.6, -13.2, 35.9, -1.0],  // Morocco
  DZ: [19.0, -8.7, 37.0, 12.0],   // Algeria
  TN: [30.2, 7.5, 37.5, 11.6],    // Tunisia
  LY: [19.5, 9.4, 33.2, 25.2],    // Libya
  EG: [22.0, 25.0, 31.7, 36.9],   // Egypt
  SD: [8.7, 21.8, 22.2, 38.6],    // Sudan

  // ── East / South / Horn of Africa
  ET: [3.4, 33.0, 14.9, 47.9],    // Ethiopia
  ER: [12.4, 36.4, 18.0, 43.1],   // Eritrea
  SO: [-1.7, 40.9, 11.9, 51.4],   // Somalia
  KE: [-4.7, 33.9, 4.6, 41.9],    // Kenya
  TZ: [-11.7, 29.3, -1.0, 40.4],  // Tanzania
  UG: [-1.5, 29.6, 4.2, 35.0],    // Uganda
  RW: [-2.8, 28.9, -1.0, 30.9],   // Rwanda
  BI: [-4.5, 29.0, -2.3, 30.8],   // Burundi
  ZA: [-34.8, 16.5, -22.1, 32.9], // South Africa
  NA: [-28.9, 11.7, -16.9, 25.3], // Namibia
  BW: [-26.9, 20.0, -17.8, 29.4], // Botswana
  ZW: [-22.4, 25.2, -15.6, 33.1], // Zimbabwe
  MZ: [-26.9, 30.2, -10.5, 40.9], // Mozambique
  ZM: [-18.1, 21.9, -8.2, 33.7],  // Zambia
  MW: [-17.1, 32.7, -9.4, 35.9],  // Malawi
  LS: [-30.7, 27.0, -28.6, 29.5], // Lesotho
  SZ: [-27.3, 30.8, -25.7, 32.1], // eSwatini
  MG: [-25.6, 43.2, -11.9, 50.5], // Madagascar
  AO: [-18.0, 11.7, -4.4, 24.1],  // Angola
  CD: [-13.5, 12.2, 5.4, 31.3],   // DR Congo
  CG: [-5.0, 11.1, 3.7, 18.6],    // Congo
  CM: [1.7, 8.5, 13.1, 16.2],     // Cameroon
  NG: [4.3, 2.7, 13.9, 14.7],     // Nigeria

  // ── Central + South Asia + Far East
  KZ: [40.5, 46.5, 55.4, 87.3],   // Kazakhstan
  UZ: [37.2, 56.0, 45.6, 73.1],   // Uzbekistan
  TM: [35.1, 52.4, 42.8, 66.7],   // Turkmenistan
  TJ: [36.7, 67.4, 41.0, 75.2],   // Tajikistan
  KG: [39.2, 69.3, 43.3, 80.3],   // Kyrgyzstan
  MN: [41.6, 87.7, 52.2, 119.9],  // Mongolia
  IN: [8.0, 68.0, 37.0, 97.0],    // India
  NP: [26.3, 80.0, 30.4, 88.2],   // Nepal
  BT: [26.7, 88.7, 28.3, 92.1],   // Bhutan
  LK: [5.9, 79.7, 9.9, 81.9],     // Sri Lanka
  BD: [20.7, 88.0, 26.6, 92.7],   // Bangladesh
  MM: [9.7, 92.2, 28.5, 101.2],   // Myanmar
  TH: [5.6, 97.3, 20.5, 105.6],   // Thailand
  VN: [8.4, 102.1, 23.4, 109.5],  // Vietnam
  LA: [13.9, 100.1, 22.5, 107.7], // Laos
  KH: [10.4, 102.3, 14.7, 107.6], // Cambodia
  MY: [0.8, 99.6, 7.4, 119.3],    // Malaysia
  ID: [-10.4, 95.0, 6.1, 141.0],  // Indonesia
  PH: [4.6, 116.9, 19.6, 126.6],  // Philippines
  CN: [18.0, 73.0, 54.0, 135.0],  // China
  JP: [30.7, 128.5, 45.5, 145.8], // Japan
  KR: [33.1, 124.6, 38.6, 131.9], // South Korea
  KP: [37.7, 124.2, 43.0, 130.7], // North Korea
  TW: [21.9, 120.0, 25.3, 122.0], // Taiwan

  // ── Americas
  US: [24.5, -125.0, 49.5, -66.5], // United States (CONUS only)
  CA: [42.0, -141.0, 60.0, -52.6], // Canada (south)
  MX: [14.5, -118.4, 32.7, -86.7], // Mexico
  GT: [13.7, -92.2, 17.8, -88.2],  // Guatemala
  HN: [12.9, -89.4, 16.5, -83.1],  // Honduras
  NI: [10.7, -87.7, 15.0, -82.7],  // Nicaragua
  CR: [8.0, -85.9, 11.2, -82.5],   // Costa Rica
  PA: [7.2, -83.0, 9.6, -77.2],    // Panama
  CU: [19.8, -84.9, 23.2, -74.1],  // Cuba
  DO: [17.5, -72.0, 19.9, -68.3],  // Dominican Rep
  HT: [18.0, -74.5, 20.1, -71.6],  // Haiti
  JM: [17.7, -78.4, 18.5, -76.2],  // Jamaica
  CO: [-4.2, -79.0, 12.5, -66.8],  // Colombia
  VE: [0.7, -73.4, 12.2, -59.8],   // Venezuela
  EC: [-5.0, -81.1, 1.5, -75.2],   // Ecuador
  PE: [-18.4, -81.4, -0.2, -68.7], // Peru
  BO: [-22.9, -69.6, -9.7, -57.5], // Bolivia
  CL: [-55.9, -75.7, -17.5, -66.4], // Chile
  AR: [-55.1, -73.6, -21.8, -53.6], // Argentina
  PY: [-27.6, -62.6, -19.3, -54.3], // Paraguay
  UY: [-34.9, -58.4, -30.1, -53.1], // Uruguay
  BR: [-33.7, -73.9, 5.3, -34.7],   // Brazil
  GY: [1.2, -61.4, 8.6, -56.5],     // Guyana
  SR: [1.8, -58.1, 6.0, -53.9],     // Suriname

  // ── Oceania
  AU: [-43.6, 113.3, -10.6, 153.7], // Australia
  NZ: [-46.6, 166.4, -34.4, 178.6], // New Zealand
  PG: [-10.7, 140.8, -1.4, 155.7],  // Papua New Guinea
  FJ: [-19.0, 177.0, -16.5, 180.0], // Fiji
};

/**
 * Deterministic, stable 32-bit hash of a species id. Two different
 * suffixes give us independent fractions for lat and lng so the same
 * id doesn't land on a diagonal in every country.
 */
function hash32(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0);
}

/**
 * Pick a stable [lat, lng] inside a country's bbox using two independent
 * hashes of speciesId. The 5% inset keeps pins from sitting exactly on
 * the political border which can otherwise overlap neighboring marker
 * clouds at high zoom.
 */
export function pointInCountry(countryCode, speciesId) {
  const bbox = COUNTRY_BBOXES[countryCode];
  if (!bbox || !speciesId) return null;
  const [minLat, minLng, maxLat, maxLng] = bbox;
  const h1 = hash32(speciesId);
  const h2 = hash32(speciesId + ":lng");
  const fracLat = (h1 & 0xffff) / 0xffff;
  const fracLng = (h2 & 0xffff) / 0xffff;
  const insetLat = (maxLat - minLat) * 0.05;
  const insetLng = (maxLng - minLng) * 0.05;
  return [
    minLat + insetLat + (maxLat - minLat - 2 * insetLat) * fracLat,
    minLng + insetLng + (maxLng - minLng - 2 * insetLng) * fracLng,
  ];
}
