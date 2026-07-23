"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { t, type Locale } from "@/lib/i18n";
import { createRedemptionAction } from "./actions";
import styles from "./portal.module.css";

// Redeem / regenerate as a client action so the voucher drawer opens via a
// scroll-preserving navigation (router.push with scroll:false). A server-action
// redirect would scroll the page to the top as the drawer slides up.
//
// Confirm-first (ticket 5): tapping Redeem opens a confirmation dialog first; only on
// Confirm is the one-time code generated. The "generate a new code" path from an
// expired voucher passes skipConfirm — it is already a deliberate re-request.

const EXIT_MS = 200; // matches qrOut / backdropOut CSS duration

export default function RedeemButton({
  tenantSlug,
  phone,
  rewardId,
  rewardName,
  locale,
  disabled,
  label,
  className,
  skipConfirm,
}: {
  tenantSlug: string;
  phone: string;
  rewardId: string;
  rewardName: string;
  locale: Locale;
  disabled?: boolean;
  label: string;
  className?: string;
  skipConfirm?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [closing, setClosing] = useState(false);
  const base = `/${tenantSlug}/portal?phone=${encodeURIComponent(phone)}`;

  const generate = () =>
    startTransition(async () => {
      const res = await createRedemptionAction(tenantSlug, phone, rewardId);
      const target = res.ok ? `${base}&voucher=${res.id}` : `${base}&error=${res.error}`;
      router.push(target, { scroll: false });
    });

  const openConfirm = () => {
    setClosing(false);
    dialogRef.current?.showModal();
  };

  const closeConfirm = (then?: () => void) => {
    if (closing) return;
    setClosing(true);
    setTimeout(() => {
      dialogRef.current?.close();
      setClosing(false);
      then?.();
    }, EXIT_MS);
  };

  return (
    <>
      <button
        type="button"
        className={className}
        disabled={disabled || pending}
        onClick={() => (skipConfirm ? generate() : openConfirm())}
      >
        {label}
      </button>

      {!skipConfirm && (
        <dialog
          ref={dialogRef}
          className={styles.qrDialog}
          data-closing={closing || undefined}
          onCancel={(e) => {
            e.preventDefault();
            closeConfirm();
          }}
          onClick={(e) => {
            if (e.target === dialogRef.current) closeConfirm();
          }}
        >
          <div className={styles.qrDialogPanel}>
            <div className={styles.voucherLabel}>{t(locale, "confirmTitle")}</div>
            <div className={styles.voucherName}>{rewardName}</div>
            <p className={styles.confirmBody}>{t(locale, "confirmBody")}</p>
            <div className={styles.confirmActions}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => closeConfirm()}
              >
                {t(locale, "cancel")}
              </button>
              <button
                type="button"
                className={styles.primaryBtn}
                disabled={pending}
                onClick={() => closeConfirm(generate)}
              >
                {t(locale, "confirm")}
              </button>
            </div>
          </div>
        </dialog>
      )}
    </>
  );
}
