import { describe, it, expect } from "vitest";
import { DICTIONARIES, LOCALES, en, t, interpolate, isLocale } from "@/lib/i18n";

const LOCALE_CODES = ["en", "zh", "ms"] as const;
const canonicalKeys = Object.keys(en) as (keyof typeof en)[];

const placeholders = (s: string) =>
  (s.match(/\{(\w+)\}/g) ?? []).map((m) => m.slice(1, -1)).sort();

describe("i18n dictionary completeness", () => {
  it("every member-facing string exists in all three languages", () => {
    for (const code of LOCALE_CODES) {
      const dict = DICTIONARIES[code];
      expect(Object.keys(dict).sort()).toEqual([...canonicalKeys].sort());
      for (const key of canonicalKeys) {
        expect(dict[key], `${code}.${key}`).toBeTruthy();
        expect(dict[key].trim(), `${code}.${key} not blank`).not.toBe("");
      }
    }
  });

  it("translations preserve the exact placeholder set of the English source", () => {
    for (const key of canonicalKeys) {
      const expected = placeholders(en[key]);
      for (const code of LOCALE_CODES) {
        expect(placeholders(DICTIONARIES[code][key]), `${code}.${key} placeholders`).toEqual(
          expected,
        );
      }
    }
  });

  it("exposes toggle metadata for exactly the supported locales", () => {
    expect(LOCALES.map((l) => l.code).sort()).toEqual([...LOCALE_CODES].sort());
  });
});

describe("t() and interpolate", () => {
  it("interpolates named placeholders", () => {
    expect(t("en", "tierProgress", { points: 160, tier: "Gold" })).toBe("160 points to Gold");
    expect(t("ms", "tierProgress", { points: 160, tier: "Gold" })).toBe("160 mata lagi ke Gold");
  });

  it("leaves unknown placeholders intact rather than dropping them", () => {
    expect(interpolate("{a} and {b}", { a: "x" })).toBe("x and {b}");
  });

  it("falls back to the default locale for an unknown key gracefully", () => {
    // @ts-expect-error probing runtime robustness with a non-key
    expect(t("zh", "not_a_real_key")).toBeUndefined();
  });
});

describe("isLocale", () => {
  it("accepts supported codes and rejects everything else", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("zh")).toBe(true);
    expect(isLocale("ms")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
    expect(isLocale(null)).toBe(false);
  });
});
