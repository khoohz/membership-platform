"use client";

import type { CSSProperties } from "react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Drawer } from "vaul";
import styles from "./portal.module.css";

// Bottom drawer for a redemption voucher, built on vaul (the library shadcn's Drawer
// wraps). vaul renders a portaled fixed element and drives motion with transforms --
// smooth open + real drag-to-dismiss on iOS, where a native <dialog> flashed.
//
// Closing: vaul animates the panel + overlay in JS over ~0.5s with a decelerate
// curve whose long tail leaves a sliver of panel and a fading backdrop visible for
// ~300ms -- which reads as an unwanted "fade out". We can't reshape vaul's JS curve
// from CSS, so instead we UNMOUNT the drawer at EXIT_MS, once the panel is ~97% off
// screen and the overlay is ~0.03 opacity: the last invisible sliver is dropped
// instantly, so the close reads as a clean slide-down with no lingering fade.
// Unmounting also runs vaul's cleanup (restoring body scroll), so no lock leaks.
//
// The voucher is opened via ?voucher=<id> and server-rendered as children; the URL is
// cleaned in the background (router.replace) after we've already dropped the drawer.
//
// vaul portals to <body>, outside the themed .shell, so the resolved theme CSS
// variables are passed down and applied to the panel via `themeVars`.

const EXIT_MS = 260;

export default function VoucherSheet({
  children,
  closeHref,
  themeVars,
}: {
  children: React.ReactNode;
  closeHref: string;
  themeVars: CSSProperties;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [gone, setGone] = useState(false);
  const closingRef = useRef(false);

  const close = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    setOpen(false); // vaul starts the slide-down
    setTimeout(() => {
      setGone(true); // drop the drawer before vaul's slow tail lingers
      router.replace(closeHref, { scroll: false });
    }, EXIT_MS);
  };

  if (gone) return null;

  return (
    <Drawer.Root
      open={open}
      onOpenChange={(next) => {
        // Any dismiss (drag, overlay, Esc) routes through the same close().
        if (!next) close();
      }}
    >
      <Drawer.Portal>
        <Drawer.Overlay className={styles.sheetOverlay} />
        <Drawer.Content className={styles.sheetPanel} style={themeVars}>
          <Drawer.Handle className={styles.sheetGrip} />
          <Drawer.Title className={styles.srOnly}>Reward voucher</Drawer.Title>
          <div className={styles.sheetBody}>{children}</div>
          <button type="button" className={styles.sheetClose} onClick={close}>
            Close
          </button>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
