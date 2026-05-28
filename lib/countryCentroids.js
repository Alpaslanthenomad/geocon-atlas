/**
 * ISO-3166-1 alpha-2 country code → approximate [lat, lng] centroid.
 * Used only for marker positioning on the explore globe — not geodetic precision.
 * Covers every country code currently present in species.country_focus, plus a
 * generous global tail for resilience as more data arrives.
 */

export const COUNTRY_CENTROIDS = {
  // Present in species data
  TR: [38.96, 35.24],   // Turkey
  IR: [32.43, 53.69],   // Iran
  ZA: [-30.56, 22.94],  // South Africa
  US: [37.09, -95.71],  // United States
  GR: [39.07, 21.82],   // Greece
  CL: [-35.68, -71.54], // Chile
  ES: [40.46, -3.75],   // Spain
  CN: [35.86, 104.20],  // China
  MX: [23.63, -102.55], // Mexico
  PT: [39.40, -8.22],   // Portugal
  GE: [42.32, 43.36],   // Georgia
  IN: [20.59, 78.96],   // India
  AF: [33.94, 67.71],   // Afghanistan
  BR: [-14.24, -51.93], // Brazil
  ET: [9.15, 40.49],    // Ethiopia
  KZ: [48.02, 66.92],   // Kazakhstan
  PE: [-9.19, -75.02],  // Peru
  AM: [40.07, 45.04],   // Armenia
  CO: [4.57, -74.30],   // Colombia
  IQ: [33.22, 43.68],   // Iraq
  MA: [31.79, -7.09],   // Morocco
  BG: [42.73, 25.49],   // Bulgaria
  MG: [-18.77, 46.87],  // Madagascar
  AR: [-38.42, -63.62], // Argentina
  UZ: [41.38, 64.59],   // Uzbekistan
  IL: [31.05, 34.85],   // Israel
  SY: [34.80, 38.99],   // Syria
  AU: [-25.27, 133.78], // Australia
  NZ: [-40.90, 174.89], // New Zealand
  IT: [41.87, 12.57],   // Italy
  NP: [28.39, 84.12],   // Nepal
  JP: [36.20, 138.25],  // Japan
  FR: [46.23, 2.21],    // France

  // Common neighbours / likely future entries
  GB: [55.38, -3.44],   // United Kingdom
  DE: [51.17, 10.45],   // Germany
  RU: [61.52, 105.32],  // Russia
  CA: [56.13, -106.35], // Canada
  CH: [46.82, 8.23],    // Switzerland
  AT: [47.52, 14.55],   // Austria
  BE: [50.50, 4.47],    // Belgium
  NL: [52.13, 5.29],    // Netherlands
  PL: [51.92, 19.14],   // Poland
  SE: [60.13, 18.64],   // Sweden
  NO: [60.47, 8.47],    // Norway
  FI: [61.92, 25.75],   // Finland
  DK: [56.26, 9.50],    // Denmark
  HU: [47.16, 19.50],   // Hungary
  RO: [45.94, 24.97],   // Romania
  CZ: [49.82, 15.47],   // Czechia
  SK: [48.67, 19.70],   // Slovakia
  HR: [45.10, 15.20],   // Croatia
  RS: [44.02, 21.01],   // Serbia
  AL: [41.15, 20.17],   // Albania
  MK: [41.61, 21.75],   // North Macedonia
  BA: [43.92, 17.68],   // Bosnia & Herzegovina
  SI: [46.15, 14.99],   // Slovenia
  UA: [48.38, 31.17],   // Ukraine
  IE: [53.14, -7.69],   // Ireland
  CY: [35.13, 33.43],   // Cyprus
  LB: [33.85, 35.86],   // Lebanon
  JO: [30.59, 36.24],   // Jordan
  SA: [23.89, 45.08],   // Saudi Arabia
  EG: [26.82, 30.80],   // Egypt
  TN: [33.89, 9.54],    // Tunisia
  DZ: [28.03, 1.66],    // Algeria
  LY: [26.34, 17.23],   // Libya
  SD: [12.86, 30.22],   // Sudan
  KE: [-0.02, 37.91],   // Kenya
  TZ: [-6.37, 34.89],   // Tanzania
  UG: [1.37, 32.29],    // Uganda
  NG: [9.08, 8.68],     // Nigeria
  NA: [-22.96, 18.49],  // Namibia
  BW: [-22.33, 24.68],  // Botswana
  ZW: [-19.02, 29.15],  // Zimbabwe
  ZM: [-13.13, 27.85],  // Zambia
  MZ: [-18.67, 35.53],  // Mozambique
  AO: [-11.20, 17.87],  // Angola
  TH: [15.87, 100.99],  // Thailand
  VN: [14.06, 108.28],  // Vietnam
  ID: [-0.79, 113.92],  // Indonesia
  PH: [12.88, 121.77],  // Philippines
  MY: [4.21, 101.98],   // Malaysia
  KR: [35.91, 127.77],  // South Korea
  PK: [30.38, 69.35],   // Pakistan
  EC: [-1.83, -78.18],  // Ecuador
  BO: [-16.29, -63.59], // Bolivia
  VE: [6.42, -66.59],   // Venezuela
  PY: [-23.44, -58.44], // Paraguay
  UY: [-32.52, -55.77], // Uruguay
};

/** Return [lat, lng] for an ISO-2 code, or null if unknown. */
export function getCentroid(iso2) {
  if (!iso2) return null;
  return COUNTRY_CENTROIDS[iso2.toUpperCase()] || null;
}
