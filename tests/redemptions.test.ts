import { describe, it, expect, beforeAll } from "vitest";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { enrolOrLookupMember, getMemberBalance } from "@/lib/members";
import { awardPoints } from "@/lib/points";
import { createRedemption, claimRedemption, getRedemption } from "@/lib/redemptions";
import { createTestTenant, createTestReward } from "./helpers";

// Deduct-on-confirm model (migration 20260724120000): points leave the ledger the
// moment createRedemption succeeds, not at claim. Claim only validates + marks used.
//
// No afterAll cleanup: these tenants have ledger rows, which the app role cannot
// delete (append-only). See deleteTestTenant in helpers.ts; db reset wipes them.

let ctx: Awaited<ReturnType<typeof createTestTenant>>;
let reward: Awaited<ReturnType<typeof createTestReward>>;
let memberSeq = 0;

async function freshMemberWithPoints(points: number) {
  const member = await enrolOrLookupMember(ctx.tenant.id, `+6017000${1000 + memberSeq++}`);
  if (!member) throw new Error("enrol failed");
  if (points > 0) {
    await awardPoints({
      tenantId: ctx.tenant.id,
      memberId: member.id,
      outletId: ctx.outlet.id,
      delta: points,
      reason: "earn",
    });
  }
  return member;
}

async function negativeLedgerRows(memberId: string) {
  const { data, error } = await supabaseAdmin
    .from("points_ledger")
    .select("delta, redemption_id, source")
    .eq("member_id", memberId)
    .lt("delta", 0);
  if (error) throw error;
  return data;
}

async function expireVoucher(id: string) {
  const { error } = await supabaseAdmin
    .from("redemptions")
    .update({ expires_at: new Date(Date.now() - 1000).toISOString() })
    .eq("id", id);
  if (error) throw error;
}

beforeAll(async () => {
  ctx = await createTestTenant("redemptions");
  reward = await createTestReward(ctx.tenant.id, "Free Latte", 50);
});

describe("deduct on confirm", () => {
  it("deducts points immediately when the voucher is created", async () => {
    const member = await freshMemberWithPoints(60);
    const created = await createRedemption(ctx.tenant.id, member.id, reward.id);
    if (!created.ok) throw new Error("create failed");

    expect(await getMemberBalance(ctx.tenant.id, member.id)).toBe(10);
    expect(await negativeLedgerRows(member.id)).toEqual([
      { delta: -50, redemption_id: created.id, source: "redemption" },
    ]);
  });

  it("refuses to create a voucher when balance is below the cost, moving nothing", async () => {
    const broke = await freshMemberWithPoints(20);
    const result = await createRedemption(ctx.tenant.id, broke.id, reward.id);
    expect(result).toEqual({ ok: false, error: "insufficient_points" });
    expect(await getMemberBalance(ctx.tenant.id, broke.id)).toBe(20);
    expect(await negativeLedgerRows(broke.id)).toEqual([]);
  });

  it("refuses unknown rewards", async () => {
    const member = await freshMemberWithPoints(100);
    const result = await createRedemption(ctx.tenant.id, member.id, crypto.randomUUID());
    expect(result).toEqual({ ok: false, error: "unknown_reward" });
    expect(await getMemberBalance(ctx.tenant.id, member.id)).toBe(100);
  });
});

describe("one live voucher at a time", () => {
  it("blocks a second voucher while the first is still live", async () => {
    const member = await freshMemberWithPoints(200);
    const first = await createRedemption(ctx.tenant.id, member.id, reward.id);
    expect(first.ok).toBe(true);

    const second = await createRedemption(ctx.tenant.id, member.id, reward.id);
    expect(second).toEqual({ ok: false, error: "active_voucher_exists" });

    // Only the first deduction landed.
    expect(await negativeLedgerRows(member.id)).toHaveLength(1);
    expect(await getMemberBalance(ctx.tenant.id, member.id)).toBe(150);
  });

  it("two simultaneous confirms: exactly one wins, one deduction", async () => {
    const member = await freshMemberWithPoints(200);
    const [a, b] = await Promise.all([
      createRedemption(ctx.tenant.id, member.id, reward.id),
      createRedemption(ctx.tenant.id, member.id, reward.id),
    ]);

    const outcomes = [a, b].map((r) => (r.ok ? "ok" : r.error)).sort();
    expect(outcomes).toEqual(["active_voucher_exists", "ok"]);
    expect(await negativeLedgerRows(member.id)).toHaveLength(1);
    expect(await getMemberBalance(ctx.tenant.id, member.id)).toBe(150);
  });
});

describe("claim marks used without deducting again", () => {
  it("claims once, reports the post-confirm balance, then fails the second scan", async () => {
    const member = await freshMemberWithPoints(60);
    const created = await createRedemption(ctx.tenant.id, member.id, reward.id);
    if (!created.ok) throw new Error("create failed");
    expect(await getMemberBalance(ctx.tenant.id, member.id)).toBe(10); // already deducted

    const first = await claimRedemption(ctx.tenant.id, created.id, ctx.outlet.id);
    expect(first).toMatchObject({ ok: true, reward_name: "Free Latte", new_balance: 10 });
    // Claim moved no points.
    expect(await getMemberBalance(ctx.tenant.id, member.id)).toBe(10);

    const second = await claimRedemption(ctx.tenant.id, created.id, ctx.outlet.id);
    expect(second).toEqual({ ok: false, error: "already_claimed" });

    // Deduction happened exactly once, at confirm.
    expect(await negativeLedgerRows(member.id)).toEqual([
      { delta: -50, redemption_id: created.id, source: "redemption" },
    ]);
  });

  it("two simultaneous claims of one code: one wins, still one deduction", async () => {
    const member = await freshMemberWithPoints(60);
    const created = await createRedemption(ctx.tenant.id, member.id, reward.id);
    if (!created.ok) throw new Error("create failed");

    const [a, b] = await Promise.all([
      claimRedemption(ctx.tenant.id, created.id, ctx.outlet.id),
      claimRedemption(ctx.tenant.id, created.id, ctx.outlet.id),
    ]);

    const outcomes = [a, b].map((r) => (r.ok ? "ok" : r.error)).sort();
    expect(outcomes).toEqual(["already_claimed", "ok"]);
    expect(await negativeLedgerRows(member.id)).toHaveLength(1);
    expect(await getMemberBalance(ctx.tenant.id, member.id)).toBe(10);
  });
});

describe("expiry does not refund", () => {
  it("keeps points deducted on an unclaimed, expired voucher and lets the member regenerate", async () => {
    const member = await freshMemberWithPoints(120);
    const created = await createRedemption(ctx.tenant.id, member.id, reward.id);
    if (!created.ok) throw new Error("create failed");
    expect(await getMemberBalance(ctx.tenant.id, member.id)).toBe(70);

    await expireVoucher(created.id);

    const claim = await claimRedemption(ctx.tenant.id, created.id, ctx.outlet.id);
    expect(claim).toEqual({ ok: false, error: "expired" });
    // No refund: the confirm-time deduction stands.
    expect(await getMemberBalance(ctx.tenant.id, member.id)).toBe(70);
    expect((await getRedemption(ctx.tenant.id, created.id))?.status).toBe("pending");

    // The expired voucher no longer blocks a new one.
    const regenerated = await createRedemption(ctx.tenant.id, member.id, reward.id);
    if (!regenerated.ok) throw new Error("regenerate failed");
    expect(await getMemberBalance(ctx.tenant.id, member.id)).toBe(20);
  });
});
