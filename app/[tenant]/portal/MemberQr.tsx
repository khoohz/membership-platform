"use client";

import { useRef, useState } from "react";
import styles from "./portal.module.css";

const EXIT_MS = 200; // must match qrOut / backdropOut CSS duration

// The member's earn QR sits small on the hero card; tapping it opens a page-centered
// enlarged copy so a cashier can scan it across a counter without the member holding
// the phone awkwardly close. Native <dialog> gives us the focus trap, Esc-to-close,
// and inert background for free.

export default function MemberQr({ svg, hint }: { svg: string; hint: string }) {
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
        aria-label="Enlarge my member QR code"
      >
        <span className={styles.memberQr} dangerouslySetInnerHTML={{ __html: svg }} />
        <span className={styles.qrHint}>{hint}</span>
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
          <div className={styles.voucherLabel}>Member code</div>
          <div
            className={styles.qrDialogCode}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
          <p className={styles.voucherSub}>Scan at the counter to earn points</p>
          <button type="button" className={styles.primaryBtn} onClick={close}>
            Done
          </button>
        </div>
      </dialog>
    </>
  );
}
