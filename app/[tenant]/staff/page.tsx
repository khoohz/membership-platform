import { redirect } from "next/navigation";
import { getTenantBySlug } from "@/lib/tenants";
import { findMemberByPhone, getMemberBalance } from "@/lib/members";
import { getDefaultOutlet } from "@/lib/outlets";
import { awardPoints } from "@/lib/points";

const AWARD_AMOUNT = 10;

async function award(tenantSlug: string, formData: FormData) {
  "use server";
  const phone = String(formData.get("phone") ?? "").trim();
  if (!phone) return;

  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return;

  const member = await findMemberByPhone(tenant.id, phone);
  if (!member) {
    redirect(
      `/${tenantSlug}/staff?phone=${encodeURIComponent(phone)}&error=not_found`,
    );
  }

  const outlet = await getDefaultOutlet(tenant.id);
  await awardPoints({
    tenantId: tenant.id,
    memberId: member.id,
    outletId: outlet.id,
    delta: AWARD_AMOUNT,
    reason: "manual_award_v1",
  });

  redirect(
    `/${tenantSlug}/staff?phone=${encodeURIComponent(phone)}&awarded=${AWARD_AMOUNT}`,
  );
}

export default async function StaffPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ phone?: string; awarded?: string; error?: string }>;
}) {
  const { tenant: tenantSlug } = await params;
  const { phone, awarded, error } = await searchParams;

  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) {
    return <p>Unknown tenant &quot;{tenantSlug}&quot;.</p>;
  }

  let balance: number | null = null;
  if (phone && error !== "not_found") {
    const member = await findMemberByPhone(tenant.id, phone);
    if (member) balance = await getMemberBalance(tenant.id, member.id);
  }

  const awardWithTenant = award.bind(null, tenantSlug);

  return (
    <main>
      <h1>{tenant.name} — Staff</h1>
      <form action={awardWithTenant}>
        <label>
          Member phone number
          <br />
          <input type="tel" name="phone" defaultValue={phone ?? ""} required />
        </label>{" "}
        <button type="submit">Award +{AWARD_AMOUNT}</button>
      </form>
      {error === "not_found" && <p>No member found for {phone}.</p>}
      {awarded && <p>Awarded +{awarded} points.</p>}
      {balance !== null && <p>Current balance: {balance}</p>}
    </main>
  );
}
