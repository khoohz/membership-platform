// Pure tier-standing derivation. No DB, no server-only imports, so it unit-tests
// directly. Tiers are rungs (name + min_points); a member's tier and "N points to next"
// are derived here, never stored. The `points` passed in is lifetime points EARNED (not
// the spendable balance), so spending on rewards never demotes a tier.

export type TierLike = { name: string; min_points: number };

export type TierStanding = {
  current: TierLike | null; // highest rung the balance has reached (null if below the lowest)
  next: TierLike | null; // the rung being climbed toward (null at the top)
  pointsToNext: number | null; // points remaining to `next` (null at the top)
  progress: number; // 0..1 fraction from `current` floor toward `next`; 1 at the top
  isTop: boolean; // reached the highest rung
};

export function deriveTierStanding(tiers: TierLike[], points: number): TierStanding {
  const sorted = [...tiers].sort((a, b) => a.min_points - b.min_points);

  if (sorted.length === 0) {
    return { current: null, next: null, pointsToNext: null, progress: 0, isTop: false };
  }

  let current: TierLike | null = null;
  let next: TierLike | null = null;
  for (const tier of sorted) {
    if (tier.min_points <= points) {
      current = tier;
    } else {
      next = tier;
      break;
    }
  }

  // At or above the top rung: no next tier, bar is full.
  if (!next) {
    return { current, next: null, pointsToNext: null, progress: 1, isTop: true };
  }

  const floor = current?.min_points ?? 0;
  const span = next.min_points - floor;
  const progressed = points - floor;
  const progress = span > 0 ? Math.min(1, Math.max(0, progressed / span)) : 0;

  return {
    current,
    next,
    pointsToNext: Math.max(0, next.min_points - points),
    progress,
    isTop: false,
  };
}
