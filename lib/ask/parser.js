// Rule-based parser that maps a free-form English/Turkish sentence into
// a structured query the Atlas can execute against Supabase. This is
// the seed for a future LLM upgrade; the structured output is identical
// either way so callsites won't need to change.
//
// Returns: { tiers, families, genera, countries, intent, raw }
//
// intent ∈ 'species' | 'open_calls' | 'programs' | 'publications' | 'metabolites' | 'organizations'

const IUCN_KEYWORDS = {
  CR: ["cr", "critically endangered", "critically", "kritik tehlikede", "kritik"],
  EN: ["en", "endangered",            "tehlikede"],
  VU: ["vu", "vulnerable",            "hassas"],
  NT: ["nt", "near threatened",       "tehdide yakın", "yakın tehdit"],
  LC: ["lc", "least concern",         "düşük risk"],
  DD: ["dd", "data deficient",        "veri yetersiz"],
  NE: ["ne", "not evaluated",         "değerlendirilmemiş"],
};

const COUNTRY_ALIASES = {
  iran: "IR", "iran:": "IR", "i̇ran": "IR",
  turkey: "TR", "turkiye": "TR", "türkiye": "TR", "tr": "TR",
  greece: "GR", "yunanistan": "GR",
  spain: "ES", "ispanya": "ES",
  portugal: "PT", "portekiz": "PT",
  morocco: "MA", "fas": "MA",
  france: "FR", "fransa": "FR",
  italy: "IT", "italya": "IT", "i̇talya": "IT",
  bulgaria: "BG", "bulgaristan": "BG",
  georgia: "GE", "gürcistan": "GE",
  armenia: "AM", "ermenistan": "AM",
  azerbaijan: "AZ", "azerbaycan": "AZ",
  syria: "SY", "suriye": "SY",
  lebanon: "LB", "lübnan": "LB",
  israel: "IL", "i̇srail": "IL",
  jordan: "JO", "ürdün": "JO",
  cyprus: "CY", "kıbrıs": "CY",
  "south africa": "ZA", "güney afrika": "ZA", "za": "ZA",
  algeria: "DZ", "cezayir": "DZ",
  tunisia: "TN", "tunus": "TN",
  egypt: "EG", "mısır": "EG",
  // direct codes
  ir: "IR", gr: "GR", es: "ES", pt: "PT", ma: "MA", fr: "FR", it: "IT",
  bg: "BG", ge: "GE", am: "AM", az: "AZ", sy: "SY", lb: "LB", il: "IL",
  jo: "JO", cy: "CY", dz: "DZ", tn: "TN", eg: "EG",
};

const INTENT_KEYWORDS = [
  { intent: "open_calls",   words: ["open call", "open calls", "açık çağrı", "açık çağrılar", "proposal", "proposals", "öneri", "öneriler"] },
  { intent: "programs",     words: ["program", "programs", "programlar"] },
  { intent: "publications", words: ["publication", "publications", "paper", "papers", "yayın", "yayınlar", "makale", "makaleler"] },
  { intent: "metabolites",  words: ["metabolite", "metabolites", "compound", "compounds", "metabolit", "metabolitler", "bileşik"] },
  { intent: "organizations",words: ["organization", "organizations", "org", "orgs", "kurum", "kuruluş"] },
];

export function parseAsk(raw, vocab = {}) {
  const familyDict = (vocab.families || []).map((f) => ({ name: f, lower: f.toLowerCase() }));
  const genusDict  = (vocab.genera   || []).map((g) => ({ name: g, lower: g.toLowerCase() }));

  const text = (raw || "").trim().toLowerCase();
  const tiers = new Set();
  const families = new Set();
  const genera = new Set();
  const countries = new Set();
  let intent = "species";

  // IUCN
  for (const [tier, kws] of Object.entries(IUCN_KEYWORDS)) {
    for (const kw of kws) {
      const re = new RegExp(`(^|\\W)${escape(kw)}(\\W|$)`, "i");
      if (re.test(text)) tiers.add(tier);
    }
  }
  // Country aliases
  for (const [alias, iso] of Object.entries(COUNTRY_ALIASES)) {
    const re = new RegExp(`(^|\\W)${escape(alias)}(\\W|$)`, "i");
    if (re.test(text)) countries.add(iso);
  }
  // Intent
  for (const { intent: i, words } of INTENT_KEYWORDS) {
    if (words.some((w) => text.includes(w))) { intent = i; break; }
  }
  // Family / genus from vocab (lookup against atlas data passed in)
  for (const f of familyDict) {
    if (text.includes(f.lower)) families.add(f.name);
  }
  for (const g of genusDict) {
    if (text.includes(g.lower)) genera.add(g.name);
  }

  return {
    raw,
    intent,
    tiers:     Array.from(tiers),
    families:  Array.from(families),
    genera:    Array.from(genera),
    countries: Array.from(countries),
  };
}

function escape(s) {
  return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
}

export function summarizeQuery(q) {
  const parts = [];
  if (q.tiers?.length)     parts.push(q.tiers.join("+"));
  if (q.families?.length)  parts.push(q.families.join(", "));
  if (q.genera?.length)    parts.push(q.genera.map((g) => `genus ${g}`).join(", "));
  if (q.countries?.length) parts.push(q.countries.join(", "));
  if (q.intent !== "species") parts.push(`(intent: ${q.intent})`);
  return parts.join(" · ") || "no filters detected";
}
