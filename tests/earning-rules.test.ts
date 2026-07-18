import { describe, it, expect } from "vitest";
import { pointsForSpend, parseRmToSen } from "@/lib/earning";

describe("per-RM earning rule", () => {
  it("always rounds down", () => {
    expect(pointsForSpend({ type: "per_rm", n: 2 }, 1090)).toBe(21); // RM10.90 * 2 = 21.8
    expect(pointsForSpend({ type: "per_rm", n: 1 }, 1299)).toBe(12); // RM12.99
    expect(pointsForSpend({ type: "per_rm", n: 3 }, 333)).toBe(9); // RM3.33 * 3 = 9.99
  });

  it("supports tenant-custom N", () => {
    expect(pointsForSpend({ type: "per_rm", n: 1 }, 1000)).toBe(10);
    expect(pointsForSpend({ type: "per_rm", n: 5 }, 1000)).toBe(50);
    expect(pointsForSpend({ type: "per_rm", n: 7 }, 250)).toBe(17); // RM2.50 * 7 = 17.5
  });

  it("small amounts floor to zero rather than rounding up", () => {
    expect(pointsForSpend({ type: "per_rm", n: 1 }, 99)).toBe(0); // RM0.99
    expect(pointsForSpend({ type: "per_rm", n: 2 }, 49)).toBe(0); // RM0.49
  });

  it("rejects non-per_rm rules and bad amounts", () => {
    expect(() => pointsForSpend({ type: "per_visit", n: 10 }, 100)).toThrow();
    expect(() => pointsForSpend({ type: "per_rm", n: 1 }, 0)).toThrow();
    expect(() => pointsForSpend({ type: "per_rm", n: 1 }, 10.5)).toThrow();
  });
});

describe("parseRmToSen", () => {
  it("parses RM strings into integer sen", () => {
    expect(parseRmToSen("12.50")).toBe(1250);
    expect(parseRmToSen("12.5")).toBe(1250);
    expect(parseRmToSen("12")).toBe(1200);
    expect(parseRmToSen("0.05")).toBe(5);
  });

  it("rejects malformed or zero input", () => {
    expect(parseRmToSen("")).toBeNull();
    expect(parseRmToSen("abc")).toBeNull();
    expect(parseRmToSen("12.999")).toBeNull();
    expect(parseRmToSen("-5")).toBeNull();
    expect(parseRmToSen("0")).toBeNull();
    expect(parseRmToSen("0.00")).toBeNull();
  });
});
