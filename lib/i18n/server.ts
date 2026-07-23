import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LANG_COOKIE, isLocale, type Locale } from "./index";

// Resolve the device's locale from the cookie on the server, so the first paint is
// already in the chosen language (no client flash, no CLS — matters for Lighthouse).
export async function resolveLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LANG_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
