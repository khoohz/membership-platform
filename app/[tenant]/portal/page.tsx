import type { CSSProperties } from "react";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { getTenantBySlug } from "@/lib/tenants";
import {
  enrolOrLookupMember,
  findMemberByPhone,
  getMemberBalance,
  getMemberEarnedTotal,
} from "@/lib/members";
import { memberQrPayload, redemptionQrPayload } from "@/lib/member-qr";
import {
  listRewards,
  getMemberHistory,
  getRedemption,
  getActiveRedemption,
  getReward,
  REDEMPTION_VALIDITY_SECONDS,
} from "@/lib/redemptions";
import { listTiers } from "@/lib/tiers";
import { deriveTierStanding } from "@/lib/tier-progress";
import { getTenantTheme } from "@/lib/themes";
import { Icon, iconForReward } from "@/lib/icons";
import { resolveLocale } from "@/lib/i18n/server";
import { translator, type Locale, type Translator } from "@/lib/i18n";
import { rememberMember, rememberedMember } from "@/lib/portal-session";
import MemberQr from "./MemberQr";
import ActiveVoucher from "./ActiveVoucher";
import RedeemButton from "./RedeemButton";
import HistoryExpander from "./HistoryExpander";
import LangToggle from "./LangToggle";
import CountUp from "./CountUp";
import Countdown from "./redeem/Countdown";
import { forgetMemberAction } from "./actions";
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
  // Long-lived device session (ticket 5): remember this member on this device so a
  // return visit skips the phone form. Unsigned convenience only -- see lib/portal-session.
  await rememberMember(tenantSlug, member.phone);
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
  const locale = await resolveLocale();
  const tr = translator(locale);

  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) {
    return <p style={{ padding: 24 }}>Unknown tenant &quot;{tenantSlug}&quot;.</p>;
  }

  const theme = await getTenantTheme(tenant.id);
  const themeStyle = theme.vars as CSSProperties;

  // An explicit ?phone wins; otherwise fall back to the remembered device session.
  const effectivePhone = phone ?? (error !== "bad_phone" ? await rememberedMember() : null);

  let member = null;
  let balance = 0;
  let qrSvg: string | null = null;
  let standing = null;
  let activeRedemption = null;
  if (effectivePhone && error !== "bad_phone") {
    member = await findMemberByPhone(tenant.id, effectivePhone);
    if (member) {
      balance = await getMemberBalance(tenant.id, member.id);
      qrSvg = await QRCode.toString(memberQrPayload(member.id), {
        type: "svg",
        margin: 0,
        color: { light: "#0000" },
      });
      // Tier/status is derived from lifetime points EARNED, not the spendable balance,
      // so redeeming a reward never demotes a member's tier.
      const earnedTotal = await getMemberEarnedTotal(tenant.id, member.id);
      standing = deriveTierStanding(await listTiers(tenant.id), earnedTotal);
      activeRedemption = await getActiveRedemption(tenant.id, member.id);
    }
  }

  // A live voucher blocks starting a second one (create_redemption enforces this too).
  // Restore its bar on reload: if the URL has no ?voucher but one is live, use it.
  const effectiveVoucherId = voucherId ?? activeRedemption?.id ?? null;

  const enrolWithTenant = enrol.bind(null, tenantSlug);
  const forgetWithTenant = forgetMemberAction.bind(null, tenantSlug);

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
        <LangToggle locale={locale} />
      </header>

      {!member ? (
        <form className={styles.enrol} action={enrolWithTenant}>
          <label className={styles.enrolLabel} htmlFor="phone">
            {tr("phoneLabel")}
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
              {tr("enter")}
            </button>
          </div>
          {error === "bad_phone" && <p className={styles.notice}>{tr("badPhone")}</p>}
          {effectivePhone && error !== "bad_phone" && (
            <p className={styles.notice}>{tr("noMemberFound", { phone: effectivePhone })}</p>
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
                  <div className={styles.cardBrandSub}>{tr("membership")}</div>
                </div>
              </div>
              {standing?.current && (
                <span className={styles.tierChip}>
                  <Icon name="spark" size={12} />
                  {standing.current.name}
                </span>
              )}
            </div>
            <div className={styles.cardFoot}>
              <div>
                <div className={styles.memberName}>{member.phone}</div>
                <div className={styles.balance}>
                  <CountUp value={balance} />
                </div>
                <div className={styles.balanceLabel}>{tr("points")}</div>
              </div>
              {qrSvg && <MemberQr svg={qrSvg} locale={locale} />}
            </div>
          </section>

          {standing && <TierJourney standing={standing} tr={tr} />}

          {error === "insufficient_points" && (
            <p className={styles.notice}>{tr("insufficientPoints")}</p>
          )}
          {/* Only surface this if a redeem was actually rejected (UI already disables
              the buttons while a voucher is live) -- no standing banner. */}
          {error === "active_voucher_exists" && (
            <p className={styles.notice}>{tr("activeVoucherBlock")}</p>
          )}

          <section className={styles.section}>
            <div className={styles.sectionLabel}>{tr("rewards")}</div>
            <RewardsList
              tenantSlug={tenantSlug}
              tenantId={tenant.id}
              phone={member.phone}
              balance={balance}
              layout={theme.definition.slots.rewards}
              blocked={!!activeRedemption}
              locale={locale}
              tr={tr}
            />
          </section>

          <section className={styles.section}>
            <div className={styles.sectionLabel}>{tr("history")}</div>
            <History tenantId={tenant.id} memberId={member.id} locale={locale} tr={tr} />
          </section>

          <footer className={styles.footer}>
            {tr("footer", { tenant: tenant.name })}
            <form action={forgetWithTenant}>
              <button type="submit" className={styles.signOut}>
                {tr("signOut")}
              </button>
            </form>
          </footer>

          {effectiveVoucherId && (
            <VoucherMount
              key={effectiveVoucherId}
              tenantSlug={tenantSlug}
              tenantId={tenant.id}
              phone={member.phone}
              redemptionId={effectiveVoucherId}
              initiallyMinimized={!voucherId}
              closeHref={portalHref(tenantSlug, member.phone)}
              themeStyle={themeStyle}
              locale={locale}
              tr={tr}
            />
          )}
        </>
      )}
    </div>
  );
}

function TierJourney({
  standing,
  tr,
}: {
  standing: NonNullable<ReturnType<typeof deriveTierStanding>>;
  tr: Translator;
}) {
  const pct = Math.round(standing.progress * 100);
  const ritual =
    standing.isTop && standing.current
      ? tr("tierTop", { tier: standing.current.name })
      : standing.next
        ? tr("tierProgress", { points: standing.pointsToNext ?? 0, tier: standing.next.name })
        : null;

  if (!ritual) return null;

  return (
    <section className={styles.journey} aria-label={ritual}>
      <div className={styles.journeyRitual}>{ritual}</div>
      <div
        className={styles.journeyTrack}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className={styles.journeyFill} style={{ width: `${pct}%` }} />
      </div>
      {!standing.isTop && (
        <div className={styles.journeyEnds}>
          <span>{standing.current?.name ?? ""}</span>
          <span>{standing.next?.name ?? ""}</span>
        </div>
      )}
    </section>
  );
}

async function VoucherMount({
  tenantSlug,
  tenantId,
  phone,
  redemptionId,
  initiallyMinimized,
  closeHref,
  themeStyle,
  locale,
  tr,
}: {
  tenantSlug: string;
  tenantId: string;
  phone: string;
  redemptionId: string;
  initiallyMinimized: boolean;
  closeHref: string;
  themeStyle: CSSProperties;
  locale: Locale;
  tr: Translator;
}) {
  const redemption = await getRedemption(tenantId, redemptionId);
  const reward = redemption ? await getReward(tenantId, redemption.reward_id) : null;

  if (!redemption || !reward) {
    return (
      <ActiveVoucher
        expiresAt={new Date().toISOString()}
        rewardName=""
        settled
        validitySeconds={REDEMPTION_VALIDITY_SECONDS}
        closeHref={closeHref}
        themeVars={themeStyle}
        locale={locale}
      >
        <p className={styles.voucherState}>{tr("voucherNotFound")}</p>
      </ActiveVoucher>
    );
  }

  const claimed = redemption.status === "claimed";
  const expired = new Date(redemption.expires_at) <= new Date();
  const settled = claimed || expired;

  return (
    <ActiveVoucher
      expiresAt={redemption.expires_at}
      rewardName={reward.name}
      settled={settled}
      validitySeconds={REDEMPTION_VALIDITY_SECONDS}
      initiallyMinimized={initiallyMinimized}
      closeHref={closeHref}
      themeVars={themeStyle}
      locale={locale}
    >
      <VoucherBody
        tenantSlug={tenantSlug}
        phone={phone}
        redemptionId={redemptionId}
        reward={reward}
        expiresAt={redemption.expires_at}
        claimed={claimed}
        expired={expired}
        locale={locale}
        tr={tr}
      />
    </ActiveVoucher>
  );
}

async function VoucherBody({
  tenantSlug,
  phone,
  redemptionId,
  reward,
  expiresAt,
  claimed,
  expired,
  locale,
  tr,
}: {
  tenantSlug: string;
  phone: string;
  redemptionId: string;
  reward: { id: string; name: string; points_cost: number };
  expiresAt: string;
  claimed: boolean;
  expired: boolean;
  locale: Locale;
  tr: Translator;
}) {
  if (claimed) {
    return (
      <>
        <div className={styles.voucherName}>{reward.name}</div>
        <p className={styles.voucherState}>{tr("voucherUsed")}</p>
      </>
    );
  }

  if (expired) {
    return (
      <>
        <div className={styles.voucherLabel}>{tr("expired")}</div>
        <div className={styles.voucherName}>{reward.name}</div>
        <p className={styles.voucherSub}>{tr("expiredSub")}</p>
        <RedeemButton
          tenantSlug={tenantSlug}
          phone={phone}
          rewardId={reward.id}
          rewardName={reward.name}
          locale={locale}
          label={tr("generateNewCode")}
          className={styles.primaryBtn}
          skipConfirm
        />
      </>
    );
  }

  const qrSvg = await QRCode.toString(redemptionQrPayload(redemptionId), {
    type: "svg",
    margin: 1,
    width: 220,
  });

  return (
    <>
      <div className={styles.voucherLabel}>{tr("showToStaff")}</div>
      <div className={styles.voucherName}>{reward.name}</div>
      <p className={styles.voucherSub}>{tr("oneTimeCode", { points: reward.points_cost })}</p>
      <div className={styles.voucherQr} dangerouslySetInnerHTML={{ __html: qrSvg }} />
      <div className={styles.voucherCountdown}>
        <Icon name="clock" size={13} />
        <Countdown expiresAt={expiresAt} locale={locale} />
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
  blocked,
  locale,
  tr,
}: {
  tenantSlug: string;
  tenantId: string;
  phone: string;
  balance: number;
  layout: "grid" | "list";
  blocked: boolean;
  locale: Locale;
  tr: Translator;
}) {
  const rewards = await listRewards(tenantId);
  if (rewards.length === 0) return <p className={styles.empty}>{tr("noRewards")}</p>;

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
                  <span>
                    {reward.points_cost} {tr("ptsUnit")}
                  </span>
                </div>
              </div>
              <RedeemButton
                tenantSlug={tenantSlug}
                phone={phone}
                rewardId={reward.id}
                rewardName={reward.name}
                locale={locale}
                disabled={!affordable || blocked}
                label={tr("redeem")}
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

function HistoryRow({
  entry,
  locale,
  tr,
}: {
  entry: Awaited<ReturnType<typeof getMemberHistory>>[number];
  locale: Locale;
  tr: Translator;
}) {
  const isRedeem = entry.delta < 0;
  const label = entry.reward_name ? `${tr("redeemed")} · ${entry.reward_name}` : tr("visit");
  const localeTag = locale === "zh" ? "zh-Hans" : locale === "ms" ? "ms-MY" : "en-MY";
  return (
    <div className={styles.historyRow}>
      <span className={styles.historyIcon}>
        <Icon name={isRedeem ? "gift" : "plus"} size={15} />
      </span>
      <span className={styles.historyText}>
        <b>{label}</b>
        <small>{new Date(entry.created_at).toLocaleString(localeTag)}</small>
      </span>
      <span
        className={`${styles.amount} ${isRedeem ? styles.amountMinus : styles.amountPlus}`}
      >
        {entry.delta > 0 ? `+${entry.delta}` : entry.delta}
      </span>
    </div>
  );
}

async function History({
  tenantId,
  memberId,
  locale,
  tr,
}: {
  tenantId: string;
  memberId: string;
  locale: Locale;
  tr: Translator;
}) {
  const entries = await getMemberHistory(tenantId, memberId);
  if (entries.length === 0) return <p className={styles.empty}>{tr("noActivity")}</p>;

  const preview = entries.slice(0, HISTORY_PREVIEW);
  const rest = entries.slice(HISTORY_PREVIEW);

  return (
    <div className={styles.history}>
      {preview.map((entry, i) => (
        <HistoryRow key={i} entry={entry} locale={locale} tr={tr} />
      ))}
      {rest.length > 0 && (
        <HistoryExpander count={entries.length} locale={locale}>
          {rest.map((entry, i) => (
            <HistoryRow key={i} entry={entry} locale={locale} tr={tr} />
          ))}
        </HistoryExpander>
      )}
    </div>
  );
}
