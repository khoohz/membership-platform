"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Client-side countdown for the voucher. Purely presentational: expiry is enforced
// server-side (claim_redemption checks expires_at).
//
// While pending this also polls (router.refresh) every few seconds so the member's
// screen flips to "Used" moments after the cashier confirms -- there is no push
// channel, and the mutual at-the-counter confirmation is the point of the flow.
// The claimed/expired states don't render this component, so polling stops itself.

const POLL_MS = 2500;

export default function Countdown({ expiresAt }: { expiresAt: string }) {
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
    const poll = setInterval(() => router.refresh(), POLL_MS);
    return () => clearInterval(poll);
  }, [router]);

  return (
    <p>
      Valid for <strong>{secondsLeft}</strong> more second{secondsLeft === 1 ? "" : "s"}
    </p>
  );
}
