"use server";

import { redirect } from "next/navigation";
import { getTenantBySlug } from "@/lib/tenants";
import { findMemberByPhone } from "@/lib/members";
import { createRedemption } from "@/lib/redemptions";
import { forgetMember } from "@/lib/portal-session";

// Create a redemption and return its id (or an error) WITHOUT redirecting. The client
// then navigates with { scroll: false } so opening the voucher drawer doesn't reset
// the page scroll to the top (a server-action redirect always scrolls to top).
export async function createRedemptionAction(
  tenantSlug: string,
  phone: string,
  rewardId: string,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return { ok: false, error: "unknown" };

  const member = await findMemberByPhone(tenant.id, phone);
  if (!member) return { ok: false, error: "unknown" };

  return createRedemption(tenant.id, member.id, rewardId);
}

// Clear the device-convenience session (the "Not you?" affordance) and return to the
// bare portal, which then shows the phone form. This only forgets the local cookie --
// it is not a real logout (there is no authenticated session until ticket 8).
export async function forgetMemberAction(tenantSlug: string): Promise<void> {
  await forgetMember(tenantSlug);
  redirect(`/${tenantSlug}/portal`);
}
