"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { t, type Locale } from "@/lib/i18n";

// In-drawer countdown for the live voucher: "Valid for 2m 50s". Presentational —
// expiry is enforced server-side (claim_redemption checks expires_at).
//
// It also polls (router.refresh) every few seconds so the member's screen flips to
// "Used" moments after the cashier confirms — there is no push channel, and the mutual
// at-the-counter confirmation is the point of the flow. The claimed/expired states
// don't render this, so polling stops itself.

const POLL_MS = 2500;

export default function Countdown({
  expiresAt,
  locale,
}: {
  expiresAt: string;
  locale: Locale;
}) {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000)),
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const left = Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0) {
        clearInterval(timer);
        router.refresh();
      }
    }, 250);
    return () => clearInterval(timer);
  }, [expiresAt, router]);

  useEffect(() => {
    const id = setInterval(() => router.refresh(), POLL_MS);
    return () => clearInterval(id);
  }, [router]);

  const mm = Math.floor(secondsLeft / 60);
  const ss = secondsLeft % 60;

  return (
    <span>
      {t(locale, "validFor")}{" "}
      <strong>
        {mm}m {ss.toString().padStart(2, "0")}s
      </strong>
    </span>
  );
}
