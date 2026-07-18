// The tenant's earning rule (spec section 3): N points per visit, or N points per
// RM1 spent -- always round down, no multipliers at MVP.

export type EarningRule = {
  type: "per_visit" | "per_rm";
  n: number;
};

// Per-RM points are computed in integer sen to avoid float drift:
// floor(N * amount_sen / 100). e.g. N=2, RM10.90 (1090 sen) -> floor(21.8) = 21.
export function pointsForSpend(rule: EarningRule, amountSen: number): number {
  if (rule.type !== "per_rm") throw new Error("pointsForSpend requires a per_rm rule");
  if (!Number.isInteger(amountSen) || amountSen <= 0) {
    throw new Error("amountSen must be a positive integer");
  }
  return Math.floor((rule.n * amountSen) / 100);
}

// "12.50" / "12.5" / "12" -> 1250 / 1250 / 1200 sen. Null for anything malformed.
export function parseRmToSen(input: string): number | null {
  const match = input.trim().match(/^(\d+)(?:\.(\d{1,2}))?$/);
  if (!match) return null;
  const rm = parseInt(match[1], 10);
  const senPart = (match[2] ?? "").padEnd(2, "0");
  const sen = rm * 100 + (senPart ? parseInt(senPart, 10) : 0);
  return sen > 0 ? sen : null;
}
