import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { enrolOrLookupMember, getMemberBalance } from "@/lib/members";
import { awardPoints } from "@/lib/points";
import { createTestTenant, deleteTestTenant } from "./helpers";

describe("walking skeleton: enrol -> award -> balance", () => {
  let ctx: Awaited<ReturnType<typeof createTestTenant>>;

  beforeAll(async () => {
    ctx = await createTestTenant("walking-skeleton");
  });

  afterAll(async () => {
    await deleteTestTenant(ctx.tenant.id);
  });

  it("enrols a member at balance 0, then awards +10 as a single append-only ledger row", async () => {
    const member = await enrolOrLookupMember(ctx.tenant.id, "+60133333333");
    expect(member).not.toBeNull();
    expect(await getMemberBalance(ctx.tenant.id, member!.id)).toBe(0);

    await awardPoints({
      tenantId: ctx.tenant.id,
      memberId: member!.id,
      outletId: ctx.outlet.id,
      delta: 10,
      reason: "manual_award_v1",
    });

    expect(await getMemberBalance(ctx.tenant.id, member!.id)).toBe(10);

    const { data: ledgerRows, error } = await supabaseAdmin
      .from("points_ledger")
      .select("delta, reason")
      .eq("member_id", member!.id);
    if (error) throw error;

    // Derived, not mutated: exactly one row, not an updated counter.
    expect(ledgerRows).toEqual([{ delta: 10, reason: "manual_award_v1" }]);
  });

  it("re-entering the same phone number finds the existing member, not a duplicate", async () => {
    const first = await enrolOrLookupMember(ctx.tenant.id, "+60144444444");
    const second = await enrolOrLookupMember(ctx.tenant.id, "+60144444444");
    expect(second!.id).toBe(first!.id);
  });
});
