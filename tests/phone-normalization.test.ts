import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { normalizePhone } from "@/lib/phone";
import { enrolOrLookupMember, findMemberByPhone } from "@/lib/members";
import { createTestTenant, deleteTestTenant } from "./helpers";

describe("normalizePhone", () => {
  it("maps every Malaysian format of the same number to one canonical form", () => {
    expect(normalizePhone("012-345 6789")).toBe("+60123456789");
    expect(normalizePhone("0123456789")).toBe("+60123456789");
    expect(normalizePhone("+60123456789")).toBe("+60123456789");
    expect(normalizePhone("60123456789")).toBe("+60123456789");
    expect(normalizePhone("012 345 6789")).toBe("+60123456789");
  });

  it("handles 11-digit mobile numbers (011 prefix)", () => {
    expect(normalizePhone("011-2345 6789")).toBe("+601123456789");
    expect(normalizePhone("01123456789")).toBe("+601123456789");
  });

  it("rejects junk", () => {
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone("abc")).toBeNull();
    expect(normalizePhone("12345")).toBeNull();
    expect(normalizePhone("+65 9123 4567")).toBeNull(); // Singapore number
    expect(normalizePhone("03-1234 5678")).toBeNull(); // landline
  });
});

describe("normalization at the identity boundary", () => {
  let ctx: Awaited<ReturnType<typeof createTestTenant>>;

  beforeAll(async () => {
    ctx = await createTestTenant("phone-norm");
  });

  afterAll(async () => {
    await deleteTestTenant(ctx.tenant.id);
  });

  it("three formats of one number resolve to the same member", async () => {
    const enrolled = await enrolOrLookupMember(ctx.tenant.id, "012-345 6789");
    expect(enrolled).not.toBeNull();
    expect(enrolled!.phone).toBe("+60123456789");

    const viaBare = await enrolOrLookupMember(ctx.tenant.id, "0123456789");
    const viaE164 = await findMemberByPhone(ctx.tenant.id, "+60123456789");

    expect(viaBare!.id).toBe(enrolled!.id);
    expect(viaE164!.id).toBe(enrolled!.id);
  });

  it("invalid phone cannot create a member", async () => {
    expect(await enrolOrLookupMember(ctx.tenant.id, "not-a-phone")).toBeNull();
  });
});
