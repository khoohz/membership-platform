import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { getTenantBySlug } from "@/lib/tenants";
import { findMemberByPhone } from "@/lib/members";
import { redemptionQrPayload } from "@/lib/member-qr";
import { getRedemption, getReward, createRedemption } from "@/lib/redemptions";
import Countdown from "../Countdown";

async function regenerate(
  tenantSlug: string,
  phone: string,
  rewardId: string,
) {
  "use server";
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return;
  const member = await findMemberByPhone(tenant.id, phone);
  if (!member) return;

  const result = await createRedemption(tenant.id, member.id, rewardId);
  if (!result.ok) {
    redirect(`/${tenantSlug}/portal?phone=${encodeURIComponent(phone)}&error=${result.error}`);
  }
  redirect(`/${tenantSlug}/portal/redeem/${result.id}?phone=${encodeURIComponent(phone)}`);
}

export default async function RedeemPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenant: string; redemption: string }>;
  searchParams: Promise<{ phone?: string }>;
}) {
  const { tenant: tenantSlug, redemption: redemptionId } = await params;
  const { phone } = await searchParams;

  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return <p>Unknown tenant &quot;{tenantSlug}&quot;.</p>;

  const redemption = await getRedemption(tenant.id, redemptionId);
  if (!redemption) return <p>Voucher not found.</p>;

  const reward = await getReward(tenant.id, redemption.reward_id);
  if (!reward) return <p>Reward no longer exists.</p>;

  const backLink = (
    <p>
      <a href={`/${tenantSlug}/portal?phone=${encodeURIComponent(phone ?? "")}`}>
        ← Back to portal
      </a>
    </p>
  );

  if (redemption.status === "claimed") {
    return (
      <main>
        <h1 style={{ fontSize: 42 }}>{reward.name}</h1>
        <p>
          <strong>Used ✓</strong> — this voucher has been redeemed.
        </p>
        {backLink}
      </main>
    );
  }

  const expired = new Date(redemption.expires_at) <= new Date();
  if (expired) {
    const regenerateAction = regenerate.bind(null, tenantSlug, phone ?? "", reward.id);
    return (
      <main>
        <h1 style={{ fontSize: 42 }}>{reward.name}</h1>
        <p>This code has expired.</p>
        <form action={regenerateAction}>
          <button type="submit">Generate a new code</button>
        </form>
        {backLink}
      </main>
    );
  }

  const qrSvg = await QRCode.toString(redemptionQrPayload(redemption.id), {
    type: "svg",
    margin: 1,
    width: 260,
  });

  return (
    <main>
      {/* Reward name in large text: the cashier reads it off the member's screen */}
      <h1 style={{ fontSize: 42 }}>{reward.name}</h1>
      <p>{reward.points_cost} points — show this code at the counter</p>
      <div dangerouslySetInnerHTML={{ __html: qrSvg }} />
      <Countdown expiresAt={redemption.expires_at} />
      {backLink}
    </main>
  );
}
