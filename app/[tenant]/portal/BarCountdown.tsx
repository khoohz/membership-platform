"use client";

import { useEffect, useState } from "react";
import { t, type Locale } from "@/lib/i18n";
import styles from "./portal.module.css";

// Countdown for the minimized voucher bar: a "Valid for / 2m 50s" readout over a thin
// horizontal bar that drains as the code expires. Presentational only — the parent
// (ActiveVoucher) tears the whole bar down at expiry, and the server enforces it.

export default function BarCountdown({
  expiresAt,
  totalSeconds,
  locale,
}: {
  expiresAt: string;
  totalSeconds: number;
  locale: Locale;
}) {
  const remaining = () => Math.max(0, (new Date(expiresAt).getTime() - Date.now()) / 1000);
  const [secondsLeft, setSecondsLeft] = useState(remaining);

  useEffect(() => {
    const timer = setInterval(() => setSecondsLeft(remaining()), 250);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt]);

  const whole = Math.ceil(secondsLeft);
  const mm = Math.floor(whole / 60);
  const ss = whole % 60;
  const pct = totalSeconds > 0 ? Math.max(0, Math.min(100, (secondsLeft / totalSeconds) * 100)) : 0;

  return (
    <span className={styles.barCountdown}>
      <span className={styles.barCountdownLabel}>{t(locale, "validFor")}</span>
      <span className={styles.barCountdownTime}>
        {mm}m {ss.toString().padStart(2, "0")}s
      </span>
      <span className={styles.barCountdownTrack}>
        <span className={styles.barCountdownFill} style={{ width: `${pct}%` }} />
      </span>
    </span>
  );
}
