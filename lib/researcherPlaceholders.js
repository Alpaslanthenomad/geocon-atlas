// Shared logic for detecting catch-all / placeholder researcher rows that
// come in from upstream sources (OpenAlex, GBIF, future federations).
//
// Why: some external sources expose synthesized "author" records when the
// real attribution is unknown — e.g. OpenAlex's "GBIF.org User" entries
// represent occurrence records, not individuals. These should never bubble
// up to leaderboards or recognition surfaces.
//
// Used by:
//   - app/api/harvest/openalex/route.js — flag rows at import time
//   - (future) app/api/harvest/orcid/route.js — same hook
//   - SQL backfills via the researchers.is_placeholder column

// Exact-match names that always mean placeholder. Case-insensitive.
const PLACEHOLDER_EXACT_NAMES = new Set([
  "gbif.org user",
  "gbif.org",
  "unknown author",
  "anonymous",
  "n/a",
]);

// Regex patterns for placeholder-shaped names. Case-insensitive.
const PLACEHOLDER_PATTERNS = [
  /^et\s*al\.?$/i,                  // "et al." as a standalone author
  /^\(unknown\)/i,                  // "(Unknown)" prefix
  /^author\s+unknown$/i,            // "Author Unknown"
];

/**
 * Decide whether a candidate researcher row should be marked as a
 * placeholder. Operates on the display name only — the rest of the row
 * (institution, country, etc.) is independent.
 *
 * @param {string|null|undefined} name
 * @returns {boolean}
 */
export function isPlaceholderResearcherName(name) {
  if (!name) return true;          // empty / null → placeholder
  const norm = String(name).trim().toLowerCase();
  if (!norm) return true;
  if (PLACEHOLDER_EXACT_NAMES.has(norm)) return true;
  for (const re of PLACEHOLDER_PATTERNS) {
    if (re.test(norm)) return true;
  }
  return false;
}
