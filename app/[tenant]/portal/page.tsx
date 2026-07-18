import { redirect } from "next/navigation";
import { getTenantBySlug } from "@/lib/tenants";
import { enrolOrLookupMember, findMemberByPhone, getMemberBalance } from "@/lib/members";

async function enrol(tenantSlug: string, formData: FormData) {
  "use server";
  const phone = String(formData.get("phone") ?? "").trim();
  if (!phone) return;

  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return;

  await enrolOrLookupMember(tenant.id, phone);
  redirect(`/${tenantSlug}/portal?phone=${encodeURIComponent(phone)}`);
}

export default async function PortalPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ phone?: string }>;
}) {
  const { tenant: tenantSlug } = await params;
  const { phone } = await searchParams;

  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) {
    return <p>Unknown tenant &quot;{tenantSlug}&quot;.</p>;
  }

  let balance: number | null = null;
  if (phone) {
    const member = await findMemberByPhone(tenant.id, phone);
    if (member) balance = await getMemberBalance(tenant.id, member.id);
  }

  const enrolWithTenant = enrol.bind(null, tenantSlug);

  return (
    <main>
      <h1>{tenant.name} — Member Portal</h1>
      <form action={enrolWithTenant}>
        <label>
          Phone number
          <br />
          <input type="tel" name="phone" defaultValue={phone ?? ""} required />
        </label>{" "}
        <button type="submit">Join / view balance</button>
      </form>
      {phone && balance === null && <p>No member found for {phone}.</p>}
      {balance !== null && (
        <p>
          Balance for {phone}: <strong>{balance}</strong> points
        </p>
      )}
    </main>
  );
}
