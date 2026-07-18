import { describe, it, expect, beforeAll, afterAll } from "vitest";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  checkPinAndMintSession,
  verifySessionToken,
  mintSessionToken,
  requireStaffSession,
} from "@/lib/staff-auth";
import { enrolOrLookupMember } from "@/lib/members";
import { awardPoints } from "@/lib/points";
import { createTestTenant, deleteTestTenant } from "./helpers";

const PIN = "482913";

describe("staff PIN auth", () => {
  let ctx: Awaited<ReturnType<typeof createTestTenant>>;

  beforeAll(async () => {
    ctx = await createTestTenant("staff-auth");
    const pinHash = await bcrypt.hash(PIN, 10);
    const { error } = await supabaseAdmin
      .from("outlets")
      .update({ pin_hash: pinHash })
      .eq("id", ctx.outlet.id);
    if (error) throw error;
  });

  afterAll(async () => {
    await deleteTestTenant(ctx.tenant.id);
  });

  it("correct PIN mints a verifiable session scoped to tenant + outlet", async () => {
    const result = await checkPinAndMintSession(ctx.tenant.id, ctx.outlet.id, PIN);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const session = verifySessionToken(result.token);
    expect(session?.tenantId).toBe(ctx.tenant.id);
    expect(session?.outletId).toBe(ctx.outlet.id);
  });

  it("wrong PIN does not mint a session", async () => {
    const result = await checkPinAndMintSession(ctx.tenant.id, ctx.outlet.id, "000000");
    expect(result).toEqual({ ok: false, reason: "wrong_pin" });
  });

  it("an outlet with no PIN set cannot be entered", async () => {
    const other = await createTestTenant("staff-auth-nopin");
    try {
      const result = await checkPinAndMintSession(other.tenant.id, other.outlet.id, PIN);
      expect(result).toEqual({ ok: false, reason: "no_pin_set" });
    } finally {
      await deleteTestTenant(other.tenant.id);
    }
  });

  it("locks the outlet after 5 straight failures, then rejects even the right PIN", async () => {
    const other = await createTestTenant("staff-auth-lockout");
    try {
      const pinHash = await bcrypt.hash(PIN, 10);
      await supabaseAdmin.from("outlets").update({ pin_hash: pinHash }).eq("id", other.outlet.id);

      for (let i = 0; i < 4; i++) {
        const r = await checkPinAndMintSession(other.tenant.id, other.outlet.id, "111111");
        expect(r).toEqual({ ok: false, reason: "wrong_pin" });
      }
      // 5th failure trips the lock
      const fifth = await checkPinAndMintSession(other.tenant.id, other.outlet.id, "111111");
      expect(fifth).toEqual({ ok: false, reason: "wrong_pin" });

      const lockedOut = await checkPinAndMintSession(other.tenant.id, other.outlet.id, PIN);
      expect(lockedOut).toEqual({ ok: false, reason: "locked" });
    } finally {
      await deleteTestTenant(other.tenant.id);
    }
  });

  it("tampered and cross-tenant tokens are rejected", async () => {
    const token = mintSessionToken(ctx.tenant.id, ctx.outlet.id);

    expect(verifySessionToken(token + "x")).toBeNull();
    expect(verifySessionToken("garbage")).toBeNull();

    // Token body swapped to another tenant but original signature kept
    const [, mac] = [token.slice(0, token.lastIndexOf(".")), token.slice(token.lastIndexOf(".") + 1)];
    const forgedBody = Buffer.from(
      JSON.stringify({ tenantId: crypto.randomUUID(), outletId: ctx.outlet.id, exp: 9999999999 }),
    ).toString("base64url");
    expect(verifySessionToken(`${forgedBody}.${mac}`)).toBeNull();

    // Valid token for tenant A is not a session for tenant B
    expect(requireStaffSession(token, crypto.randomUUID())).toBeNull();
    expect(requireStaffSession(token, ctx.tenant.id)).not.toBeNull();
  });

  it("a staff award writes one ledger row with outlet + rule attribution", async () => {
    const member = await enrolOrLookupMember(ctx.tenant.id, "0198765432");
    await awardPoints({
      tenantId: ctx.tenant.id,
      memberId: member!.id,
      outletId: ctx.outlet.id,
      delta: 21,
      reason: "earn",
      source: "staff_scan",
      ruleType: "per_rm",
      ruleN: 2,
      amountSen: 1090,
    });

    const { data: rows, error } = await supabaseAdmin
      .from("points_ledger")
      .select("delta, outlet_id, source, rule_type, rule_n, amount_sen")
      .eq("member_id", member!.id);
    if (error) throw error;

    expect(rows).toEqual([
      {
        delta: 21,
        outlet_id: ctx.outlet.id,
        source: "staff_scan",
        rule_type: "per_rm",
        rule_n: 2,
        amount_sen: 1090,
      },
    ]);
  });
});
