import type { ThemeDefinition } from "./types";
import { shade, rgba, darkSlabFor } from "./color";

// Nocturne — dark editorial. Space Grotesk display, JetBrains Mono labels, a flat
// high-contrast hero (no grain, single brand wash), rewards as a full-width list.
// Deliberately structurally different from Atelier so that a theme swap proves the
// engine handles fonts, surfaces, hero treatment, and layout slots as pure data.

// Contrast-resolved hero pair (see press.ts).
const HERO_INK = "#FAFAFA";
function heroSlab(brand: string) {
  return { slab: darkSlabFor(brand, HERO_INK), ink: HERO_INK, usedLightInk: true };
}

export const nocturne: ThemeDefinition = {
  key: "nocturne",
  name: "Nocturne",
  defaultBrandColor: "#6D5EF7",
  slots: { hero: "editorial", rewards: "list" },

  craftedMaterial: (rawBrand: string) => {
    const { slab: brand } = heroSlab(rawBrand);
    return [
      `radial-gradient(110% 80% at 100% 0%, ${rgba(brand, 0.55)}, transparent 55%)`,
      `radial-gradient(90% 90% at 0% 100%, ${rgba(shade(brand, -0.4), 0.5)}, transparent 60%)`,
      `linear-gradient(135deg, ${shade(brand, -0.35)} 0%, #0B0B0D 62%)`,
    ].join(", ");
  },

  cssVars: ({ brand, heroBackground }) => ({
    "--font-display": "var(--font-space-grotesk)",
    "--font-body": "var(--font-space-grotesk)",
    "--font-label": "var(--font-jetbrains-mono)",

    "--surface": "#0B0B0D",
    "--surface-2": "#161619",
    "--surface-inset": "#202024",
    "--ink": "#F4F4F5",
    "--ink-muted": "#A1A1AA",
    "--ink-faint": "#8C8C92",
    "--hairline": "#29292E",

    "--brand": brand,
    "--accent": shade(brand, 0.2),
    "--accent-ink": "#0B0B0D",

    "--hero-bg": heroBackground,
    "--hero-ink": heroSlab(brand).ink,
    "--hero-ink-muted": heroSlab(brand).usedLightInk
      ? "rgba(250, 250, 250, 0.58)"
      : "rgba(11, 11, 13, 0.62)",
    "--hero-grain": "0.05",
    "--hero-logo-bg": "rgba(250, 250, 250, 0.08)",
    "--hero-logo-border": "rgba(250, 250, 250, 0.18)",

    "--r-card": "16px",
    "--r-panel": "12px",
    "--r-pill": "7px",
    "--r-chip": "8px",
    "--border-w": "1px",

    "--shadow-card": "0 0 0 1px rgba(255,255,255,.05)",
    "--shadow-hero": "0 20px 50px -20px rgba(0,0,0,.85), inset 0 0 0 1px rgba(255,255,255,.06)",
    "--press-transform": "scale(0.97)",

    "--label-spacing": "3.4px",
    "--label-transform": "uppercase",
    "--balance-size": "52px",
    "--balance-weight": "600",
    "--balance-tracking": "-1.5px",
  }),
};
