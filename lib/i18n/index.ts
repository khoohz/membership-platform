// Isomorphic i18n surface: safe to import from client or server components. The
// cookie *reader* (next/headers) lives in ./server so this file stays client-safe.

import {
  DICTIONARIES,
  DEFAULT_LOCALE,
  type Dictionary,
  type Locale,
  type MessageKey,
} from "./dictionaries";

export {
  DICTIONARIES,
  DEFAULT_LOCALE,
  LOCALES,
  en,
  zh,
  ms,
} from "./dictionaries";
export type { Dictionary, Locale, MessageKey } from "./dictionaries";

// The device's language choice persists in this cookie (read server-side so SSR
// renders the right language with no flash). Set client-side by LangToggle.
export const LANG_COOKIE = "portal_lang";

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "en" || value === "zh" || value === "ms";
}

type Vars = Record<string, string | number>;

// Fill {name} placeholders. Unknown placeholders are left intact so a typo is visible
// rather than silently dropped.
export function interpolate(template: string, vars: Vars): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) =>
    key in vars ? String(vars[key]) : whole,
  );
}

export function t(locale: Locale, key: MessageKey, vars?: Vars): string {
  const dict: Dictionary = DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE];
  const template = dict[key] ?? DICTIONARIES[DEFAULT_LOCALE][key];
  return vars ? interpolate(template, vars) : template;
}

// Bind a locale once: `const tr = translator(locale); tr("rewards")`.
export type Translator = (key: MessageKey, vars?: Vars) => string;

export function translator(locale: Locale): Translator {
  return (key, vars) => t(locale, key, vars);
}
