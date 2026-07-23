import { describe, it, expect } from "vitest";
import { deriveTierStanding, type TierLike } from "@/lib/tier-progress";

// A three-rung ladder like the demo seed. Passed unsorted to prove sorting.
const ladder: TierLike[] = [
  { name: "Gold", min_points: 400 },
  { name: "Regular", min_points: 0 },
  { name: "Silver", min_points: 150 },
];

describe("deriveTierStanding", () => {
  it("places a mid-ladder balance and computes points-to-next + progress", () => {
    const s = deriveTierStanding(ladder, 200);
    expect(s.current?.name).toBe("Silver");
    expect(s.next?.name).toBe("Gold");
    expect(s.pointsToNext).toBe(200); // 400 - 200
    expect(s.isTop).toBe(false);
    // 200 is 50 of the 250-point Silver->Gold span => 0.2
    expect(s.progress).toBeCloseTo(0.2, 5);
  });

  it("treats a balance exactly on a threshold as having reached that tier", () => {
    const s = deriveTierStanding(ladder, 150);
    expect(s.current?.name).toBe("Silver");
    expect(s.next?.name).toBe("Gold");
    expect(s.pointsToNext).toBe(250);
    expect(s.progress).toBeCloseTo(0, 5);
  });

  it("sits in the lowest tier for a brand-new member", () => {
    const s = deriveTierStanding(ladder, 0);
    expect(s.current?.name).toBe("Regular");
    expect(s.next?.name).toBe("Silver");
    expect(s.pointsToNext).toBe(150);
    expect(s.isTop).toBe(false);
  });

  it("reports the top tier with a full bar and no next", () => {
    const s = deriveTierStanding(ladder, 400);
    expect(s.current?.name).toBe("Gold");
    expect(s.next).toBeNull();
    expect(s.pointsToNext).toBeNull();
    expect(s.isTop).toBe(true);
    expect(s.progress).toBe(1);
  });

  it("stays at the top tier above the highest threshold", () => {
    const s = deriveTierStanding(ladder, 10_000);
    expect(s.current?.name).toBe("Gold");
    expect(s.isTop).toBe(true);
    expect(s.progress).toBe(1);
  });

  it("has no current tier when balance is below the lowest rung", () => {
    const raised: TierLike[] = [
      { name: "Silver", min_points: 150 },
      { name: "Gold", min_points: 400 },
    ];
    const s = deriveTierStanding(raised, 50);
    expect(s.current).toBeNull();
    expect(s.next?.name).toBe("Silver");
    expect(s.pointsToNext).toBe(100);
    // 50 of the 150-point 0->Silver span
    expect(s.progress).toBeCloseTo(50 / 150, 5);
  });

  it("returns a neutral standing when the tenant has no tiers", () => {
    const s = deriveTierStanding([], 500);
    expect(s.current).toBeNull();
    expect(s.next).toBeNull();
    expect(s.pointsToNext).toBeNull();
    expect(s.isTop).toBe(false);
    expect(s.progress).toBe(0);
  });

  it("clamps progress within [0,1] and never returns a negative points-to-next", () => {
    const s = deriveTierStanding(ladder, 390);
    expect(s.progress).toBeGreaterThanOrEqual(0);
    expect(s.progress).toBeLessThanOrEqual(1);
    expect(s.pointsToNext).toBe(10);
  });
});
