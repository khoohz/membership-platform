"use client";

import { useRef, useState } from "react";
import { t, type Locale } from "@/lib/i18n";
import styles from "./portal.module.css";

const EXIT_MS = 200; // must match qrOut / backdropOut CSS duration

// The member's earn QR sits small on the hero card; tapping it opens a page-centered
// enlarged copy so a cashier can scan it across a counter without the member holding
// the phone awkwardly close. Native <dialog> gives us the focus trap, Esc-to-close,
// and inert background for free.

export default function MemberQr({ svg, locale }: { svg: string; locale: Locale }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [closing, setClosing] = useState(false);

  const open = () => {
    setClosing(false);
    dialogRef.current?.showModal();
  };
  // Play the exit animation, then actually close the dialog.
  const close = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(() => {
      dialogRef.current?.close();
      setClosing(false);
    }, EXIT_MS);
  };

  return (
    <>
      <button
        type="button"
        className={styles.memberQrBtn}
        onClick={open}
        aria-label={t(locale, "memberCode")}
      >
        <span className={styles.memberQr} dangerouslySetInnerHTML={{ __html: svg }} />
        <span className={styles.qrHint}>{t(locale, "qrHint")}</span>
      </button>

      <dialog
        ref={dialogRef}
        className={styles.qrDialog}
        data-closing={closing || undefined}
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        onClick={(e) => {
          if (e.target === dialogRef.current) close();
        }}
      >
        <div className={styles.qrDialogPanel}>
          <div className={styles.voucherLabel}>{t(locale, "memberCode")}</div>
          <div
            className={styles.qrDialogCode}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
          <p className={styles.voucherSub}>{t(locale, "scanToEarn")}</p>
          <button type="button" className={styles.primaryBtn} onClick={close}>
            {t(locale, "done")}
          </button>
        </div>
      </dialog>
    </>
  );
}
