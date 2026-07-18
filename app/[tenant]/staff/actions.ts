"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTenantBySlug, earningRuleOf } from "@/lib/tenants";
import { getDefaultOutlet } from "@/lib/outlets";
import { findMemberByPhone, getMemberById } from "@/lib/members";
import { awardPoints } from "@/lib/points";
import { pointsForSpend } from "@/lib/earning";
import { checkPinAndMintSession, requireStaffSession, STAFF_COOKIE } from "@/lib/staff-auth";

export async function loginWithPin(tenantSlug: string, formData: FormData) {
  const pin = String(formData.get("pin") ?? "").trim();
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return;

  const outlet = await getDefaultOutlet(tenant.id);
  const result = await checkPinAndMintSession(tenant.id, outlet.id, pin);

  if (!result.ok) {
    redirect(`/${tenantSlug}/staff?error=${result.reason}`);
  }

  const cookieStore = await cookies();
  cookieStore.set(STAFF_COOKIE, result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: `/${tenantSlug}/staff`,
    maxAge: 12 * 3600,
  });
  redirect(`/${tenantSlug}/staff`);
}

export async function lookupByPhone(tenantSlug: string, formData: FormData) {
  const phone = String(formData.get("phone") ?? "").trim();
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return;

  const cookieStore = await cookies();
  const session = requireStaffSession(cookieStore.get(STAFF_COOKIE)?.value, tenant.id);
  if (!session) redirect(`/${tenantSlug}/staff?error=session`);

  const member = await findMemberByPhone(tenant.id, phone);
  if (!member) {
    redirect(`/${tenantSlug}/staff?error=member_not_found`);
  }
  redirect(`/${tenantSlug}/staff?member=${member.id}&src=phone`);
}

export async function awardToMember(tenantSlug: string, formData: FormData) {
  const memberId = String(formData.get("memberId") ?? "");
  const src = formData.get("src") === "phone" ? "staff_phone" : "staff_scan";
  const amountRaw = formData.get("amountSen");

  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return;

  const cookieStore = await cookies();
  const session = requireStaffSession(cookieStore.get(STAFF_COOKIE)?.value, tenant.id);
  if (!session) redirect(`/${tenantSlug}/staff?error=session`);

  const member = await getMemberById(tenant.id, memberId);
  if (!member) redirect(`/${tenantSlug}/staff?error=member_not_found`);

  // Points are always computed server-side from the tenant's rule -- the client
  // only ever submits the spend amount, never a points value.
  const rule = earningRuleOf(tenant);
  let delta: number;
  let amountSen: number | undefined;
  if (rule.type === "per_visit") {
    delta = rule.n;
  } else {
    amountSen = parseInt(String(amountRaw ?? ""), 10);
    if (!Number.isInteger(amountSen) || amountSen <= 0) {
      redirect(`/${tenantSlug}/staff?member=${member.id}&src=${formData.get("src")}&error=bad_amount`);
    }
    delta = pointsForSpend(rule, amountSen);
    if (delta <= 0) {
      redirect(`/${tenantSlug}/staff?member=${member.id}&src=${formData.get("src")}&error=amount_too_small`);
    }
  }

  await awardPoints({
    tenantId: tenant.id,
    memberId: member.id,
    outletId: session.outletId,
    delta,
    reason: "earn",
    source: src,
    ruleType: rule.type,
    ruleN: rule.n,
    amountSen,
  });

  redirect(`/${tenantSlug}/staff?member=${member.id}&awarded=${delta}`);
}
