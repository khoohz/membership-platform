import type { ThemeDefinition } from "./types";
import { shade, isLight } from "./color";

// Press — a letterpress / print-shop membership card. Warm cream paper, near-black
// ink, thick ink borders with hard (un-blurred) offset shadows, an oversized
// typographic balance, and structured mono labels.
//
// Design intent: take brutalism's *clarity* (extreme contrast, hard edges, big type
// -- the thing Nocturne lacked) but execute it premium rather than pop-art: no
// sticker rotation, no comic color-blocking, one restrained brand block doing the
// talking. Bricolage Grotesque gives the display real character without novelty.

export const press: ThemeDefinition = {
  key: "press",
  name: "Press",
  defaultBrandColor: "#1F4D3D",
  slots: { hero: "press", rewards: "grid" },

  // Near-flat brand block with a printed tooth -- a pressed ink slab, not a gradient.
  craftedMaterial: (brand: string) =>
    `linear-gradient(163deg, ${shade(brand, 0.1)} 0%, ${brand} 52%, ${shade(brand, -0.2)} 100%)`,

  cssVars: ({ brand, heroBackground }) => {
    // The hero is a solid brand slab, so the ink on it must follow the brand's
    // lightness -- a pale brand gets dark ink, a deep brand gets cream.
    const onBrand = isLight(brand) ? "#141310" : "#FBF7EF";
    const onBrandMuted = isLight(brand) ? "rgba(20,19,16,0.62)" : "rgba(251,247,239,0.66)";
    return {
      "--font-display": "var(--font-bricolage)",
      "--font-body": "var(--font-jakarta)",
      "--font-label": "var(--font-jetbrains-mono)",

      "--surface": "#FBF7EF",
      "--surface-2": "#FFFDF8",
      "--surface-inset": "#F2EDE1",
      "--ink": "#141310",
      "--ink-muted": "#4A463E",
      "--ink-faint": "#8C867A",
      "--hairline": "#141310",

      "--brand": brand,
      "--accent": shade(brand, -0.12),
      "--accent-ink": "#FBF7EF",

      "--hero-bg": heroBackground,
      "--hero-ink": onBrand,
      "--hero-ink-muted": onBrandMuted,
      "--hero-grain": "0.09",
      "--hero-logo-bg": isLight(brand) ? "rgba(20,19,16,0.10)" : "rgba(251,247,239,0.14)",
      "--hero-logo-border": onBrand,

      // Hard-edged print geometry: small radii, real ink rules, offset shadows with
      // no blur, and a mechanical press that moves the block onto its own shadow.
      "--r-card": "6px",
      "--r-panel": "6px",
      "--r-pill": "4px",
      "--r-chip": "4px",
      "--border-w": "2px",
      "--shadow-card": "4px 4px 0 0 #141310",
      "--shadow-hero": "7px 7px 0 0 #141310",
      "--press-transform": "translate(2px, 2px)",

      "--label-spacing": "2.8px",
      "--label-transform": "uppercase",
      "--reward-name-size": "15px",
      "--balance-size": "76px",
      "--balance-weight": "800",
      "--balance-tracking": "-3px",
    };
  },
};
