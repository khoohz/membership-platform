import type { ThemeDefinition } from "./types";
import { shade, rgba, darkSlabFor } from "./color";

// Velvet -- soft warm luxury. Fraunces serif display, porcelain surfaces, generous
// radii, and a layered "material" hero card woven from the tenant's brand color with
// a warm gold highlight. (Formerly "Atelier"; grown out of that prototype.)
//
// Deliberately the opposite of its siblings on every axis that matters:
//   Press    -- cream paper, hard 2px rules, un-blurred offset shadows, grotesque display
//   Nocturne -- near-black, flat editorial, mono labels, rewards as a list
//   Velvet   -- warm porcelain, deep round corners, soft layered shadows, serif display
//
// Polish pass (July 2026): balance set noticeably larger, label ink darkened for real
// contrast on porcelain (the old faint grey failed the legibility bar), corners
// rounded further, gold accent given more presence -- so the theme has a point of
// view instead of reading as a default.

const GOLD = "#B8862F";

// Contrast-resolved hero pair (see press.ts): a pale or yellow brand previously got
// fixed cream ink at ~1.3:1 -- effectively invisible.
const HERO_INK = "#FDFCF9";
function heroSlab(brand: string) {
  return { slab: darkSlabFor(brand, HERO_INK), ink: HERO_INK, usedLightInk: true };
}

export const velvet: ThemeDefinition = {
  key: "velvet",
  name: "Velvet",
  defaultBrandColor: "#0F6B5C",
  slots: { hero: "material", rewards: "grid" },

  craftedMaterial: (rawBrand: string) => {
    const { slab: brand } = heroSlab(rawBrand);
    return [
      `radial-gradient(120% 90% at 85% -10%, ${rgba("#E8C27A", 0.5)}, transparent 55%)`,
      `radial-gradient(90% 70% at 12% 110%, ${rgba(shade(brand, -0.65), 0.85)}, transparent 70%)`,
      `radial-gradient(140% 120% at 60% 40%, ${rgba(brand, 0.35)}, transparent 70%)`,
      `linear-gradient(150deg, ${shade(brand, -0.5)} 0%, ${brand} 46%, ${shade(brand, -0.4)} 100%)`,
    ].join(", ");
  },

  cssVars: ({ brand, heroBackground }) => ({
    "--font-display": "var(--font-fraunces)",
    "--font-body": "var(--font-jakarta)",
    "--font-label": "var(--font-jakarta)",

    "--surface": "#F6F2EC",
    "--surface-2": "#FFFFFF",
    "--surface-inset": "#F3EEE5",
    "--ink": "#171512",
    "--ink-muted": "#54504A",
    // Darkened from the old #A09C93: section labels and timestamps now hold real
    // contrast on porcelain instead of fading out.
    "--ink-faint": "#6E6960",
    "--hairline": "#E5E0D6",

    "--brand": brand,
    "--accent": GOLD,
    "--accent-ink": "#171512",

    "--hero-bg": heroBackground,
    "--hero-ink": heroSlab(brand).ink,
    "--hero-ink-muted": heroSlab(brand).usedLightInk
      ? "rgba(253, 252, 249, 0.7)"
      : "rgba(23, 21, 18, 0.66)",
    "--hero-grain": "0.14",
    "--hero-logo-bg": heroSlab(brand).usedLightInk ? "rgba(253, 252, 249, 0.16)" : "rgba(23, 21, 18, 0.10)",
    "--hero-logo-border": heroSlab(brand).ink,

    // Softer and rounder than either sibling theme.
    "--r-card": "30px",
    "--r-panel": "24px",
    "--r-pill": "999px",
    "--r-chip": "16px",
    "--border-w": "1px",

    "--shadow-card": "0 1px 2px rgba(23,21,18,.05), 0 14px 32px -20px rgba(23,21,18,.35)",
    "--shadow-hero": "0 2px 4px rgba(23,21,18,.16), 0 26px 52px -18px rgba(23,21,18,.5)",
    "--press-transform": "scale(0.97)",

    "--label-spacing": "2.4px",
    "--label-transform": "uppercase",
    "--reward-name-size": "14.5px",
    "--balance-size": "64px",
    "--balance-weight": "500",
    "--balance-tracking": "-2px",
  }),
};
