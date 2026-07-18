import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { enrolOrLookupMember, findMemberByPhone } from "@/lib/members";
import { createTestTenant, deleteTestTenant, makeAnonClient } from "./helpers";

describe("tenant isolation", () => {
  let tenantA: Awaited<ReturnType<typeof createTestTenant>>;
  let tenantB: Awaited<ReturnType<typeof createTestTenant>>;

  beforeAll(async () => {
    tenantA = await createTestTenant("isolation-a");
    tenantB = await createTestTenant("isolation-b");
    await enrolOrLookupMember(tenantA.tenant.id, "+60111111111");
    await enrolOrLookupMember(tenantB.tenant.id, "+60122222222");
  });

  afterAll(async () => {
    await deleteTestTenant(tenantA.tenant.id);
    await deleteTestTenant(tenantB.tenant.id);
  });

  it("tenant B's lookup never returns tenant A's member, and vice versa", async () => {
    const foundInB = await findMemberByPhone(tenantB.tenant.id, "+60111111111");
    expect(foundInB).toBeNull();

    const foundInA = await findMemberByPhone(tenantA.tenant.id, "+60122222222");
    expect(foundInA).toBeNull();

    // Sanity: each tenant can still find its own member.
    expect(await findMemberByPhone(tenantA.tenant.id, "+60111111111")).not.toBeNull();
    expect(await findMemberByPhone(tenantB.tenant.id, "+60122222222")).not.toBeNull();
  });

  it("direct anon-key access to members is denied regardless of tenant (defense in depth)", async () => {
    const anon = makeAnonClient();

    const { data: dataA, error: errorA } = await anon
      .from("members")
      .select("*")
      .eq("tenant_id", tenantA.tenant.id);
    const { data: dataB, error: errorB } = await anon
      .from("members")
      .select("*")
      .eq("tenant_id", tenantB.tenant.id);

    // anon has no GRANT on members at all (migration 20260718071510_enable_rls.sql
    // withholds it) and RLS has no permissive policy for it either -- PostgREST
    // surfaces this as a permission-denied error, not an empty result set. Either
    // way, no row from any tenant ever reaches an anon caller.
    expect(errorA?.code).toBe("42501");
    expect(dataA).toBeNull();
    expect(errorB?.code).toBe("42501");
    expect(dataB).toBeNull();
  });
});
