"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LOCALES, LANG_COOKIE, type Locale } from "@/lib/i18n";
import styles from "./portal.module.css";

// Visible EN / 中 / BM toggle. The choice persists per device in the portal_lang
// cookie (1 year); router.refresh re-runs the server components, which read the cookie
// and re-render in the chosen language — no client-side string swapping, no flash.

// Module-scope so the document.cookie write is a plain side effect, not a mutation
// inside the component body (which the React compiler forbids).
function writeLocaleCookie(code: Locale) {
  document.cookie = `${LANG_COOKIE}=${code}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

export default function LangToggle({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const pick = (code: Locale) => {
    if (code === locale) return;
    writeLocaleCookie(code);
    startTransition(() => router.refresh());
  };

  return (
    <div className={styles.langToggle} role="group" aria-label="Language">
      {LOCALES.map((l) => (
        <button
          key={l.code}
          type="button"
          className={styles.langBtn}
          data-active={l.code === locale || undefined}
          aria-pressed={l.code === locale}
          aria-label={l.label}
          disabled={pending}
          onClick={() => pick(l.code)}
        >
          {l.short}
        </button>
      ))}
    </div>
  );
}
