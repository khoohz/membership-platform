"use client";

import { useState } from "react";
import { Icon } from "@/lib/icons";
import styles from "./portal.module.css";

// Collapsible tail of the history list. The extra rows (server-rendered, passed as
// children) live in a grid that animates its row track from 0fr to 1fr -- a smooth
// height transition with no fixed pixel height. The toggle sits AFTER the collapsible
// region so "Show less" is always the last row, never wedged in the middle.

export default function HistoryExpander({
  count,
  children,
}: {
  count: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className={styles.historyCollapse} data-open={open || undefined}>
        <div className={styles.historyCollapseInner}>{children}</div>
      </div>
      <button
        type="button"
        className={styles.historyMoreToggle}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span>{open ? "Show less" : `Show all ${count}`}</span>
        <Icon
          name="chevronDown"
          size={15}
          className={styles.historyMoreChevron}
          data-open={open || undefined}
        />
      </button>
    </>
  );
}
