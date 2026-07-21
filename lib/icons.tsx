import type { SVGProps } from "react";

// One stroke-icon set, one voice: 24px grid, 1.8 stroke, round caps/joins, no fill
// (except marks that read better solid, e.g. the star). No emoji anywhere in the UI.
// Reward icons are chosen deterministically from the reward name (iconForReward),
// so the themed reward cards get a real glyph without a schema column.

export type IconName =
  | "cup"
  | "pastry"
  | "cake"
  | "teapot"
  | "gift"
  | "spark"
  | "star"
  | "plus"
  | "minus"
  | "clock"
  | "chevronLeft"
  | "chevronDown"
  | "check";

const PATHS: Record<IconName, React.ReactNode> = {
  cup: (
    <>
      <path d="M5 9h11v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V9z" />
      <path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16" />
      <path d="M8 5.5c0-.8.7-1 .7-1.8M11.5 5.5c0-.8.7-1 .7-1.8" />
    </>
  ),
  pastry: (
    <>
      <path d="M7 13c-2 1.2-3.6 2.6-3 4s2.6 1 4.4.2" />
      <path d="M17 13c2 1.2 3.6 2.6 3 4s-2.6 1-4.4.2" />
      <path d="M8.4 17.5c-.9-3.4.4-8 3.6-10.5 3.2 2.5 4.5 7.1 3.6 10.5-2.3 1-4.9 1-7.2 0z" />
    </>
  ),
  cake: (
    <>
      <path d="M4 19h16" />
      <path d="M5 19v-5a7 7 0 0 1 14 0v5" />
      <path d="M5 15c1.5 1 3 .2 4-.6 1 .8 2.5 1.6 4 .6 1.3-.9 2.7-1.4 4-.4" />
      <path d="M12 7V5" />
    </>
  ),
  teapot: (
    <>
      <path d="M8 10h8a4.5 4.5 0 0 1 4.5 4.5c0 2.7-2 4.5-4.5 4.5H10c-2.5 0-4.5-1.8-4.5-4.5V12" />
      <path d="M5.5 12 3 9.5 6.5 8" />
      <path d="M9.5 10c0-2 1-3 2.5-3s2.5 1 2.5 3" />
    </>
  ),
  gift: (
    <>
      <rect x="4" y="10" width="16" height="10" rx="1.5" />
      <path d="M12 10v10M4 13.5h16" />
      <path d="M12 10c-4 0-5-1.6-5-2.8C7 5.9 8 5 9.2 5 11 5 12 7.5 12 10zm0 0c4 0 5-1.6 5-2.8C17 5.9 16 5 14.8 5 13 5 12 7.5 12 10z" />
    </>
  ),
  spark: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />,
  star: <path d="M12 2l2.4 6.9L21 9.3l-5.2 4.6 1.6 7.1L12 17.2 6.6 21l1.6-7.1L3 9.3l6.6-.4z" />,
  plus: <path d="M12 6v12M6 12h12" />,
  minus: <path d="M6 12h12" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  chevronLeft: <path d="M15 6l-6 6 6 6" />,
  chevronDown: <path d="M6 9l6 6 6-6" />,
  check: <path d="M4 12l5 5L20 6" />,
};

// The star mark reads better solid; everything else is stroked.
const SOLID: Partial<Record<IconName, boolean>> = { star: true };

export function Icon({
  name,
  size = 18,
  ...props
}: { name: IconName; size?: number } & Omit<SVGProps<SVGSVGElement>, "name">) {
  const solid = SOLID[name];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={solid ? "currentColor" : "none"}
      stroke={solid ? "none" : "currentColor"}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {PATHS[name]}
    </svg>
  );
}

// Deterministic reward glyph from the reward name — keyword match, gift as fallback.
export function iconForReward(name: string): IconName {
  const n = name.toLowerCase();
  if (/kopi|coffee|latte|espresso|americano/.test(n)) return "cup";
  if (/tea|teh|matcha/.test(n)) return "teapot";
  if (/croissant|pastry|bun|roti|toast/.test(n)) return "pastry";
  if (/cake|kek|slice|birthday|dessert/.test(n)) return "cake";
  return "gift";
}
