"use client";
import { FAMILY_COLORS, DEF_FAM } from "../constants";

/**
 * Convert an ISO-3166-1 alpha-2 country code to its Unicode flag emoji.
 * 'TR' → 🇹🇷, 'US' → 🇺🇸. Returns an empty string if the input isn't two
 * uppercase letters.
 */
export function flag(iso2) {
  if (!iso2 || typeof iso2 !== "string") return "";
  const code = iso2.toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return "";
  return [...code]
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join("");
}

/** Display chip "🇹🇷 TR" for a country code. */
export function countryChip(iso2) {
  const f = flag(iso2);
  return f ? `${f} ${iso2}` : iso2;
}

/** Family colour tokens — falls back to a quiet neutral palette. */
export function familyTokens(family) {
  return FAMILY_COLORS[family] || DEF_FAM;
}
