"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Drawer } from "vaul";
import { Icon } from "@/lib/icons";
import { t, type Locale } from "@/lib/i18n";
import BarCountdown from "./BarCountdown";
import styles from "./portal.module.css";

// The active voucher, hoisted to a persistent activity (ticket 5). The 60s one-time
// code survives closing the drawer: instead of navigating away, closing MINIMISES it to
// a countdown bar pinned at the bottom of the portal, which reopens the full drawer on
// tap and clears itself when the code expires.
//
// The server owns the voucher body (QR + states), passed as `children` and refreshed via
// the drawer's Countdown poll (so it flips to "Used" when the cashier confirms). This
// component only owns the expanded/minimised/dismissed shell.
//
//   settled = true  -> claimed or already expired at render: no live bar, drawer only,
//                      closing dismisses (removes ?voucher and cleans the URL).
//   settled = false -> a live pending code: close minimises to the bar; expiry tears the
//                      bar down and dismisses.
//
// vaul portals the panel to <body>, outside the themed .shell, so the resolved theme
// variables are passed down via `themeVars`.

const EXIT_MS = 260;

export default function ActiveVoucher({
  children,
  expiresAt,
  rewardName,
  settled,
  validitySeconds,
  initiallyMinimized,
  closeHref,
  themeVars,
  locale,
}: {
  children: React.ReactNode;
  expiresAt: string;
  rewardName: string;
  settled: boolean;
  validitySeconds: number;
  initiallyMinimized?: boolean;
  closeHref: string;
  themeVars: CSSProperties;
  locale: Locale;
}) {
  const router = useRouter();
  // Freshly-confirmed vouchers open the drawer; a voucher restored on reload (no
  // ?voucher in the URL) comes back minimised as the bar so it doesn't hijack the page.
  const [expanded, setExpanded] = useState(!initiallyMinimized);
  const [expired, setExpired] = useState(() => new Date(expiresAt).getTime() <= Date.now());
  const [gone, setGone] = useState(false);
  const dismissingRef = useRef(false);

  // Fully close: drop the drawer/bar and remove ?voucher so a reload is clean.
  const dismiss = () => {
    if (dismissingRef.current) return;
    dismissingRef.current = true;
    setExpanded(false);
    setTimeout(() => {
      setGone(true);
      router.replace(closeHref, { scroll: false });
    }, EXIT_MS);
  };

  // A live code becomes settled the instant it expires: tear the bar down. If it was
  // minimised (no visible Countdown polling), also dismiss so the URL doesn't keep a
  // dead ?voucher around. (Already-expired-at-mount is handled by the lazy initial
  // state above, so the effect only ever schedules the future flip.)
  useEffect(() => {
    if (settled || expired) return;
    const remaining = new Date(expiresAt).getTime() - Date.now();
    const timer = setTimeout(() => setExpired(true), Math.max(0, remaining));
    return () => clearTimeout(timer);
  }, [expiresAt, settled, expired]);

  const live = !settled && !expired;

  useEffect(() => {
    if (expired && !expanded) dismiss();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expired, expanded]);

  if (gone) return null;

  return (
    <>
      <Drawer.Root
        open={expanded}
        onOpenChange={(next) => {
          if (next) {
            setExpanded(true);
            return;
          }
          // Closing a live code minimises to the bar; a settled one dismisses.
          if (live) setExpanded(false);
          else dismiss();
        }}
      >
        <Drawer.Portal>
          <Drawer.Overlay className={styles.sheetOverlay} />
          <Drawer.Content className={styles.sheetPanel} style={themeVars}>
            <Drawer.Handle className={styles.sheetGrip} />
            <Drawer.Title className={styles.srOnly}>{rewardName}</Drawer.Title>
            <div className={styles.sheetBody}>{children}</div>
            <button
              type="button"
              className={styles.sheetClose}
              onClick={() => (live ? setExpanded(false) : dismiss())}
            >
              {t(locale, "close")}
            </button>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {live && !expanded && (
        <button
          type="button"
          className={styles.voucherBar}
          style={themeVars}
          onClick={() => setExpanded(true)}
        >
          <span className={styles.voucherBarIcon}>
            <Icon name="gift" size={16} />
          </span>
          <span className={styles.voucherBarText}>
            <b>{rewardName}</b>
            <small>{t(locale, "tapToView")}</small>
          </span>
          <BarCountdown expiresAt={expiresAt} totalSeconds={validitySeconds} locale={locale} />
        </button>
      )}
    </>
  );
}
