import { describe, it, expect, beforeAll } from "vitest";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { enrolOrLookupMember, getMemberBalance } from "@/lib/members";
import { awardPoints } from "@/lib/points";
import { createRedemption, claimRedemption, getRedemption } from "@/lib/redemptions";
import { createTestTenant, createTestReward } from "./helpers";

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

beforeAll(async () => {
  ctx = await createTestTenant("redemptions");
  reward = await createTestReward(ctx.tenant.id, "Free Latte", 50);
});

describe("voucher generation", () => {
  it("refuses to create a voucher when balance is below the cost", async () => {
    const broke = await freshMemberWithPoints(20);
    const result = await createRedemption(ctx.tenant.id, broke.id, reward.id);
    expect(result).toEqual({ ok: false, error: "insufficient_points" });
  });

  it("refuses unknown rewards", async () => {
    const member = await freshMemberWithPoints(100);
    const result = await createRedemption(ctx.tenant.id, member.id, crypto.randomUUID());
    expect(result).toEqual({ ok: false, error: "unknown_reward" });
  });
});

describe("single-use claim", () => {
  it("claims once atomically, then fails the second scan of the same code", async () => {
    const member = await freshMemberWithPoints(60);
    const created = await createRedemption(ctx.tenant.id, member.id, reward.id);
    if (!created.ok) throw new Error("create failed");

    const first = await claimRedemption(ctx.tenant.id, created.id, ctx.outlet.id);
    expect(first).toMatchObject({ ok: true, reward_name: "Free Latte", new_balance: 10 });
    expect(await getMemberBalance(ctx.tenant.id, member.id)).toBe(10);

    // The screenshot scanned again
    const second = await claimRedemption(ctx.tenant.id, created.id, ctx.outlet.id);
    expect(second).toEqual({ ok: false, error: "already_claimed" });

    // Deduction happened exactly once, linked to the voucher
    const deductions = await negativeLedgerRows(member.id);
    expect(deductions).toEqual([
      { delta: -50, redemption_id: created.id, source: "redemption" },
    ]);
    expect(await getMemberBalance(ctx.tenant.id, member.id)).toBe(10);
  });
});

describe("expiry", () => {
  it("rejects an expired code and lets the member regenerate", async () => {
    const member = await freshMemberWithPoints(60);

    // Insert an already-expired voucher directly (validity window in the past)
    const { data: expired, error } = await supabaseAdmin
      .from("redemptions")
      .insert({
        tenant_id: ctx.tenant.id,
        member_id: member.id,
        reward_id: reward.id,
        expires_at: new Date(Date.now() - 1000).toISOString(),
      })
      .select("id")
      .single();
    if (error) throw error;

    const claim = await claimRedemption(ctx.tenant.id, expired.id, ctx.outlet.id);
    expect(claim).toEqual({ ok: false, error: "expired" });
    expect(await getMemberBalance(ctx.tenant.id, member.id)).toBe(60);

    // Regenerate = a fresh voucher, which claims fine
    const regenerated = await createRedemption(ctx.tenant.id, member.id, reward.id);
    if (!regenerated.ok) throw new Error("regenerate failed");
    const claim2 = await claimRedemption(ctx.tenant.id, regenerated.id, ctx.outlet.id);
    expect(claim2).toMatchObject({ ok: true });
  });
});

describe("concurrent double-claim race", () => {
  it("two simultaneous claims of one code: exactly one wins, one deduction", async () => {
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

describe("claim-time balance check", () => {
  it("rejects a claim when points were spent after the voucher was generated", async () => {
    const member = await freshMemberWithPoints(60);
    const created = await createRedemption(ctx.tenant.id, member.id, reward.id);
    if (!created.ok) throw new Error("create failed");

    // Points leave between generation and claim (e.g. another redemption elsewhere)
    await awardPoints({
      tenantId: ctx.tenant.id,
      memberId: member.id,
      outletId: ctx.outlet.id,
      delta: -20,
      reason: "test_drain",
    });

    const claim = await claimRedemption(ctx.tenant.id, created.id, ctx.outlet.id);
    expect(claim).toEqual({ ok: false, error: "insufficient_points" });

    // Voucher untouched, still pending -- member can top up and retry within validity
    const after = await getRedemption(ctx.tenant.id, created.id);
    expect(after?.status).toBe("pending");
    expect(await getMemberBalance(ctx.tenant.id, member.id)).toBe(40);
  });
});
