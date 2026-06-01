// Pure-function unit tests for lib/atlas/format.
// First test scaffolded in the v3.1 P3 (test infra) bucket — Vitest's
// node environment, no DOM or Supabase mocks needed.

import { describe, it, expect } from "vitest";
import { flag, countryChip, familyTokens } from "../../lib/atlas/format";

describe("flag", () => {
  it("converts a valid ISO-2 to its emoji", () => {
    expect(flag("TR")).toBe("🇹🇷");
    expect(flag("US")).toBe("🇺🇸");
    expect(flag("DE")).toBe("🇩🇪");
  });

  it("uppercases lowercase input", () => {
    expect(flag("tr")).toBe("🇹🇷");
  });

  it("returns empty string for malformed input", () => {
    expect(flag("")).toBe("");
    expect(flag(null)).toBe("");
    expect(flag(undefined)).toBe("");
    expect(flag(42)).toBe("");
    expect(flag("T")).toBe("");
    expect(flag("TUR")).toBe("");
    expect(flag("T1")).toBe("");
  });
});

describe("countryChip", () => {
  it("prefixes the flag emoji to the code", () => {
    expect(countryChip("TR")).toBe("🇹🇷 TR");
  });

  it("falls back to the raw code when the flag is empty", () => {
    expect(countryChip("ZZ-INVALID")).toBe("ZZ-INVALID");
    // Note: flag() rejects 3-char strings, so this round-trips raw.
  });
});

describe("familyTokens", () => {
  it("returns an object with a fallback for unknown families", () => {
    const t = familyTokens("UnknownFamily12345");
    expect(t).toBeTypeOf("object");
    expect(t).toHaveProperty("bg");
    expect(t).toHaveProperty("text");
  });

  it("returns family-specific colors when known", () => {
    const iridaceae = familyTokens("Iridaceae");
    expect(iridaceae).toBeTypeOf("object");
    // Just verify the shape — exact colors are config not contract
    expect(iridaceae.bg).toBeTypeOf("string");
    expect(iridaceae.text).toBeTypeOf("string");
  });
});
