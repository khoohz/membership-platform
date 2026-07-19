import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { getTenantBySlug } from "@/lib/tenants";
import { enrolOrLookupMember, findMemberByPhone, getMemberBalance } from "@/lib/members";
import { memberQrPayload } from "@/lib/member-qr";
import { listRewards, createRedemption, getMemberHistory } from "@/lib/redemptions";

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

async function redeem(tenantSlug: string, phone: string, formData: FormData) {
  "use server";
  const rewardId = String(formData.get("rewardId") ?? "");
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

  let member = null;
  let balance = 0;
  let qrSvg: string | null = null;
  if (phone && error !== "bad_phone") {
    member = await findMemberByPhone(tenant.id, phone);
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
      {error === "insufficient_points" && <p>Not enough points for that reward.</p>}
      {phone && error !== "bad_phone" && !member && <p>No member found for {phone}.</p>}
      {member && (
        <>
          <p>
            Balance for {phone}: <strong>{balance}</strong> points
          </p>
          <p>Show this QR at the counter to earn points:</p>
          {qrSvg && <div dangerouslySetInnerHTML={{ __html: qrSvg }} />}

          <h2>Rewards</h2>
          <RewardsList
            tenantSlug={tenantSlug}
            tenantId={tenant.id}
            phone={member.phone}
            balance={balance}
          />

          <h2>History</h2>
          <History tenantId={tenant.id} memberId={member.id} />
        </>
      )}
    </main>
  );
}

async function RewardsList({
  tenantSlug,
  tenantId,
  phone,
  balance,
}: {
  tenantSlug: string;
  tenantId: string;
  phone: string;
  balance: number;
}) {
  const rewards = await listRewards(tenantId);
  if (rewards.length === 0) return <p>No rewards yet.</p>;

  const redeemAction = redeem.bind(null, tenantSlug, phone);

  return (
    <ul>
      {rewards.map((reward) => {
        const affordable = balance >= reward.points_cost;
        return (
          <li key={reward.id}>
            {reward.name} — {reward.points_cost} points{" "}
            <form action={redeemAction} style={{ display: "inline" }}>
              <input type="hidden" name="rewardId" value={reward.id} />
              <button type="submit" disabled={!affordable}>
                {affordable
                  ? "Redeem"
                  : `Need ${reward.points_cost - balance} more`}
              </button>
            </form>
          </li>
        );
      })}
    </ul>
  );
}

async function History({ tenantId, memberId }: { tenantId: string; memberId: string }) {
  const entries = await getMemberHistory(tenantId, memberId);
  if (entries.length === 0) return <p>No activity yet.</p>;

  return (
    <ul>
      {entries.map((entry, i) => (
        <li key={i}>
          {entry.delta > 0 ? `+${entry.delta}` : entry.delta}{" "}
          {entry.reward_name ? `— ${entry.reward_name} (redeemed)` : `— ${entry.reason}`}{" "}
          <small>{new Date(entry.created_at).toLocaleString("en-MY")}</small>
        </li>
      ))}
    </ul>
  );
}
