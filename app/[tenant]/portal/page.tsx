import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { getTenantBySlug } from "@/lib/tenants";
import { enrolOrLookupMember, findMemberByPhone, getMemberBalance } from "@/lib/members";
import { memberQrPayload } from "@/lib/member-qr";

async function enrol(tenantSlug: string, formData: FormData) {
  "use server";
  const phone = String(formData.get("phone") ?? "").trim();
  if (!phone) return;

  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return;

  const member = await enrolOrLookupMember(tenant.id, phone);
  if (!member) {
    redirect(`/${tenantSlug}/portal?phone=${encodeURIComponent(phone)}&error=bad_phone`);
  }
  redirect(`/${tenantSlug}/portal?phone=${encodeURIComponent(member.phone)}`);
}

export default async function PortalPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ phone?: string; error?: string }>;
}) {
  const { tenant: tenantSlug } = await params;
  const { phone, error } = await searchParams;

  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) {
    return <p>Unknown tenant &quot;{tenantSlug}&quot;.</p>;
  }

  let balance: number | null = null;
  let qrSvg: string | null = null;
  if (phone && error !== "bad_phone") {
    const member = await findMemberByPhone(tenant.id, phone);
    if (member) {
      balance = await getMemberBalance(tenant.id, member.id);
      qrSvg = await QRCode.toString(memberQrPayload(member.id), {
        type: "svg",
        margin: 1,
        width: 220,
      });
    }
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
      {error === "bad_phone" && (
        <p>That doesn&apos;t look like a Malaysian mobile number (e.g. 012-345 6789).</p>
      )}
      {phone && error !== "bad_phone" && balance === null && (
        <p>No member found for {phone}.</p>
      )}
      {balance !== null && (
        <>
          <p>
            Balance for {phone}: <strong>{balance}</strong> points
          </p>
          <p>Show this QR at the counter to earn points:</p>
          {qrSvg && <div dangerouslySetInnerHTML={{ __html: qrSvg }} />}
        </>
      )}
    </main>
  );
}
