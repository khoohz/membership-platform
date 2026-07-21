import type { CSSProperties } from "react";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { getTenantBySlug } from "@/lib/tenants";
import { enrolOrLookupMember, findMemberByPhone, getMemberBalance } from "@/lib/members";
import { memberQrPayload, redemptionQrPayload } from "@/lib/member-qr";
import {
  listRewards,
  getMemberHistory,
  getRedemption,
  getReward,
} from "@/lib/redemptions";
import { getTenantTheme } from "@/lib/themes";
import { Icon, iconForReward } from "@/lib/icons";
import MemberQr from "./MemberQr";
import VoucherSheet from "./VoucherSheet";
import RedeemButton from "./RedeemButton";
import HistoryExpander from "./HistoryExpander";
import Countdown from "./redeem/Countdown";
import styles from "./portal.module.css";

const portalHref = (tenantSlug: string, phone: string) =>
  `/${tenantSlug}/portal?phone=${encodeURIComponent(phone)}`;

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
  redirect(portalHref(tenantSlug, member.phone));
}

export default async function PortalPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ phone?: string; error?: string; voucher?: string }>;
}) {
  const { tenant: tenantSlug } = await params;
  const { phone, error, voucher: voucherId } = await searchParams;

  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) {
    return <p style={{ padding: 24 }}>Unknown tenant &quot;{tenantSlug}&quot;.</p>;
  }

  const theme = await getTenantTheme(tenant.id);
  const themeStyle = theme.vars as CSSProperties;

  let member = null;
  let balance = 0;
  let qrSvg: string | null = null;
  if (phone && error !== "bad_phone") {
    member = await findMemberByPhone(tenant.id, phone);
    if (member) {
      balance = await getMemberBalance(tenant.id, member.id);
      qrSvg = await QRCode.toString(memberQrPayload(member.id), {
        type: "svg",
        margin: 0,
        color: { light: "#0000" },
      });
    }
  }

  const enrolWithTenant = enrol.bind(null, tenantSlug);

  return (
    <div className={styles.shell} style={themeStyle} data-theme={theme.definition.key}>
      <header className={styles.topbar}>
        <div className={styles.tenant}>
          <span className={styles.tenantLogo}>
            {theme.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={theme.logoUrl} alt="" />
            ) : (
              <Icon name="cup" size={17} />
            )}
          </span>
          <span>{tenant.name}</span>
        </div>
      </header>

      {!member ? (
        <form className={styles.enrol} action={enrolWithTenant}>
          <label className={styles.enrolLabel} htmlFor="phone">
            Your phone number
          </label>
          <div className={styles.field}>
            <input
              className={styles.input}
              id="phone"
              type="tel"
              name="phone"
              inputMode="tel"
              placeholder="012-345 6789"
              defaultValue={phone ?? ""}
              required
            />
            <button className={styles.primaryBtn} type="submit">
              Enter
            </button>
          </div>
          {error === "bad_phone" && (
            <p className={styles.notice}>
              That doesn&apos;t look like a Malaysian mobile number.
            </p>
          )}
          {phone && error !== "bad_phone" && (
            <p className={styles.notice}>No member found for {phone}.</p>
          )}
        </form>
      ) : (
        <>
          <section className={styles.card} data-hero={theme.definition.slots.hero}>
            <div className={styles.cardHead}>
              <div className={styles.cardBrand}>
                <span className={styles.cardLogo}>
                  {theme.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={theme.logoUrl} alt="" />
                  ) : (
                    <Icon name="cup" size={17} />
                  )}
                </span>
                <div>
                  <div className={styles.cardBrandName}>{tenant.name}</div>
                  <div className={styles.cardBrandSub}>Membership</div>
                </div>
              </div>
            </div>
            <div className={styles.cardFoot}>
              <div>
                <div className={styles.memberName}>{member.phone}</div>
                <div className={styles.balance}>{balance}</div>
                <div className={styles.balanceLabel}>points</div>
              </div>
              {qrSvg && <MemberQr svg={qrSvg} hint="tap to enlarge" />}
            </div>
          </section>

          {error === "insufficient_points" && (
            <p className={styles.notice}>Not enough points for that reward.</p>
          )}

          <section className={styles.section}>
            <div className={styles.sectionLabel}>Rewards</div>
            <RewardsList
              tenantSlug={tenantSlug}
              tenantId={tenant.id}
              phone={member.phone}
              balance={balance}
              layout={theme.definition.slots.rewards}
            />
          </section>

          <section className={styles.section}>
            <div className={styles.sectionLabel}>History</div>
            <History tenantId={tenant.id} memberId={member.id} />
          </section>

          <footer className={styles.footer}>
            {tenant.name} Membership · Protected under PDPA
          </footer>

          {voucherId && (
            // key per voucher: closing then reopening quickly changes voucherId
            // without it ever going empty, so a fresh instance (open=true) is needed
            // each time -- otherwise the reused instance stays closed and won't show.
            <VoucherSheet
              key={voucherId}
              closeHref={portalHref(tenantSlug, member.phone)}
              themeVars={themeStyle}
            >
              <Voucher
                tenantSlug={tenantSlug}
                tenantId={tenant.id}
                phone={member.phone}
                redemptionId={voucherId}
              />
            </VoucherSheet>
          )}
        </>
      )}
    </div>
  );
}

async function Voucher({
  tenantSlug,
  tenantId,
  phone,
  redemptionId,
}: {
  tenantSlug: string;
  tenantId: string;
  phone: string;
  redemptionId: string;
}) {
  const redemption = await getRedemption(tenantId, redemptionId);
  const reward = redemption ? await getReward(tenantId, redemption.reward_id) : null;
  if (!redemption || !reward) {
    return <p className={styles.voucherState}>Voucher not found.</p>;
  }

  if (redemption.status === "claimed") {
    return (
      <>
        <div className={styles.voucherName}>{reward.name}</div>
        <p className={styles.voucherState}>Used — this voucher has been redeemed.</p>
      </>
    );
  }

  if (new Date(redemption.expires_at) <= new Date()) {
    return (
      <>
        <div className={styles.voucherLabel}>Expired</div>
        <div className={styles.voucherName}>{reward.name}</div>
        <p className={styles.voucherSub}>This code has expired.</p>
        <RedeemButton
          tenantSlug={tenantSlug}
          phone={phone}
          rewardId={reward.id}
          label="Generate a new code"
          className={styles.primaryBtn}
        />
      </>
    );
  }

  const qrSvg = await QRCode.toString(redemptionQrPayload(redemption.id), {
    type: "svg",
    margin: 1,
    width: 220,
  });

  return (
    <>
      <div className={styles.voucherLabel}>Show this to staff</div>
      <div className={styles.voucherName}>{reward.name}</div>
      <p className={styles.voucherSub}>{reward.points_cost} points · one-time code</p>
      <div className={styles.voucherQr} dangerouslySetInnerHTML={{ __html: qrSvg }} />
      <div className={styles.voucherCountdown}>
        <Icon name="clock" size={13} />
        <Countdown expiresAt={redemption.expires_at} />
      </div>
    </>
  );
}

async function RewardsList({
  tenantSlug,
  tenantId,
  phone,
  balance,
  layout,
}: {
  tenantSlug: string;
  tenantId: string;
  phone: string;
  balance: number;
  layout: "grid" | "list";
}) {
  const rewards = await listRewards(tenantId);
  if (rewards.length === 0) return <p className={styles.empty}>No rewards yet.</p>;

  return (
    <div className={styles.rewards} data-rewards={layout}>
      {rewards.map((reward) => {
        const affordable = balance >= reward.points_cost;
        return (
          <div className={styles.reward} key={reward.id}>
            <span className={styles.rewardIcon}>
              <Icon name={iconForReward(reward.name)} size={20} />
            </span>
            <div className={styles.rewardBody}>
              <div>
                <div className={styles.rewardName}>{reward.name}</div>
                <div className={styles.rewardCost}>
                  <Icon name="spark" size={12} />
                  <span>{reward.points_cost} pts</span>
                </div>
              </div>
              <RedeemButton
                tenantSlug={tenantSlug}
                phone={phone}
                rewardId={reward.id}
                disabled={!affordable}
                label={affordable ? "Redeem" : `Need ${reward.points_cost - balance}`}
                className={styles.rewardBtn}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

const HISTORY_PREVIEW = 5;

function HistoryRow({ entry }: { entry: Awaited<ReturnType<typeof getMemberHistory>>[number] }) {
  const isRedeem = entry.delta < 0;
  return (
    <div className={styles.historyRow}>
      <span className={styles.historyIcon}>
        <Icon name={isRedeem ? "gift" : "plus"} size={15} />
      </span>
      <span className={styles.historyText}>
        <b>{entry.reward_name ? `Redeemed · ${entry.reward_name}` : "Visit"}</b>
        <small>{new Date(entry.created_at).toLocaleString("en-MY")}</small>
      </span>
      <span
        className={`${styles.amount} ${isRedeem ? styles.amountMinus : styles.amountPlus}`}
      >
        {entry.delta > 0 ? `+${entry.delta}` : entry.delta}
      </span>
    </div>
  );
}

async function History({ tenantId, memberId }: { tenantId: string; memberId: string }) {
  const entries = await getMemberHistory(tenantId, memberId);
  if (entries.length === 0) return <p className={styles.empty}>No activity yet.</p>;

  const preview = entries.slice(0, HISTORY_PREVIEW);
  const rest = entries.slice(HISTORY_PREVIEW);

  return (
    <div className={styles.history}>
      {preview.map((entry, i) => (
        <HistoryRow key={i} entry={entry} />
      ))}
      {rest.length > 0 && (
        <HistoryExpander count={entries.length}>
          {rest.map((entry, i) => (
            <HistoryRow key={i} entry={entry} />
          ))}
        </HistoryExpander>
      )}
    </div>
  );
}
