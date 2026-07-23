import type { ThemeDefinition } from "./types";
import { shade, rgba, readableSlab, contrastRatio } from "./color";

// Taffy -- pastel candy-shop playfulness on a white ground. Reference:
// nottipetfood.com, where generous WHITE SPACE dominates and the pastels appear as
// strategic blocks (badges, CTAs, product grounds) rather than as the page itself.
//
// Colour roles, deliberately separated so the two brand pastels each do one job:
//   white  -- the page. Nothing competes with the content.
//   brand  -- the hero slab (default pastel lavender #E5DCED) and the icon chips.
//   lime   -- the fixed secondary #DEE090: the CTA fill and the hero's accent disc.
// Earlier the lavender was the page wash, which made everything hazy and left the
// lime with no job but decoration. On white both pastels read as intentional blocks.
//
// Distinct from its siblings: Press is cream paper + hard black offset shadows + small
// radii; Velvet is porcelain + soft blurred depth + serif; Nocturne is near-black
// editorial. Taffy is white + 2px brand-dark outlines + a solid "cookie edge"
// (0 Npx 0 -- no blur, no offset-x) + 22-28px radii + a rounded display face. Flat
// vector, no grain, like the reference.

const LIME = "#DCED5A"; // fixed secondary: CTA fill + hero disc (bright lime)
const LIME_DEEP = shade(LIME, -0.55); // same hue, deep enough as an ink/icon accent on white

// Hero slab + ink resolved by measured contrast, never a lightness threshold: a
// mid-tone brand (hot pink, violet) defeats BOTH a dark and a cream ink, so
// readableSlab nudges the slab until the winning ink clears AA. Deterministic in
// `brand`, so craftedMaterial and cssVars independently derive the same slab.
function heroSlab(brand: string) {
  return readableSlab(brand, shade(brand, -0.85), "#FFFBF2");
}

export const taffy: ThemeDefinition = {
  key: "taffy",
  name: "Taffy",
  defaultBrandColor: "#D5BCFB",
  slots: { hero: "press", rewards: "grid" },

  // Flat, hard-edged discs -- no blur, no gradient mood. Both sit in the card's
  // UPPER-RIGHT dead zone: the lower half carries the phone, balance, points label,
  // QR tile and its hint, and a disc drifting under any of those either muddies the
  // ink contrast or collides with the QR. Ink zones stay flat slab, so hero
  // legibility is governed purely by the resolved pair above.
  craftedMaterial: (brand: string) => {
    const { slab, usedLightInk } = heroSlab(brand);
    const wash = usedLightInk ? shade(slab, 0.26) : shade(slab, -0.16);
    return [
      `radial-gradient(circle at 90% -12%, ${LIME} 0 30%, transparent calc(30% + 1px))`,
      `radial-gradient(circle at 58% -28%, ${wash} 0 34%, transparent calc(34% + 1px))`,
      `linear-gradient(${slab}, ${slab})`,
    ].join(", ");
  },

  cssVars: ({ brand, heroBackground }) => {
    const { ink: onBrand, usedLightInk } = heroSlab(brand);
    const onBrandMuted = usedLightInk
      ? "rgba(255, 251, 242, 0.74)"
      : rgba(shade(brand, -0.85), 0.72);

    // Outlines and the cookie edge are a deep shade of the brand, so even the linework
    // is tenant-tinted. Floored against white so a pale brand still draws a real line.
    const edge = shade(brand, -0.72);

    // The CTA is the lime block; its label must clear AA against it. Near-black wins
    // on a pastel lime, but a tenant-tinted ink is preferred when it also passes.
    const inkOnLime = shade(brand, -0.85);
    const btnInk = contrastRatio(inkOnLime, LIME) >= 4.5 ? inkOnLime : "#1A1A12";

    return {
      "--font-display": "var(--font-baloo)",
      "--font-body": "var(--font-nunito)",
      "--font-label": "var(--font-nunito)",

      // The page carries a whisper of the brand (lightened ~80% toward white) so the
      // PURE-WHITE cards read as raised panels. Both surfaces at #FFF left the cards
      // relying on their outline alone and they disappeared into the page.
      "--surface": shade(brand, 0.8),
      "--surface-2": "#FFFFFF",
      // The one place the lavender lives at low intensity: icon chips and history
      // discs, so the brand tints the furniture without hazing the page.
      "--surface-inset": shade(brand, 0.42),

      "--ink": shade(brand, -0.85),
      "--ink-muted": shade(brand, -0.7),
      // Deeper than a typical "faint" grey: it carries 10px uppercase section labels
      // and history timestamps, the sizes that fail first on a pastel theme.
      "--ink-faint": shade(brand, -0.58),
      "--hairline": edge,

      "--brand": shade(brand, -0.45),
      "--accent": LIME_DEEP,
      "--accent-ink": "#FFFDF4",

      // Lime CTA -- the secondary's real job.
      "--btn-bg": LIME,
      "--btn-ink": btnInk,

      "--hero-bg": heroBackground,
      "--hero-ink": onBrand,
      "--hero-ink-muted": onBrandMuted,
      "--hero-grain": "0",
      "--hero-logo-bg": usedLightInk
        ? "rgba(255, 251, 242, 0.16)"
        : rgba(shade(brand, -0.85), 0.08),
      "--hero-logo-border": onBrand,

      // Squishy toy geometry: very round, thick outline, solid bottom edge.
      "--r-card": "28px",
      "--r-panel": "22px",
      "--r-pill": "999px",
      "--r-chip": "16px",
      "--border-w": "2px",
      "--shadow-card": `0 4px 0 0 ${edge}`,
      "--shadow-hero": `0 7px 0 0 ${edge}`,
      "--press-transform": "translateY(3px)",

      "--label-spacing": "1.8px",
      "--label-transform": "uppercase",
      "--reward-name-size": "15.5px",
      "--balance-size": "72px",
      "--balance-weight": "800",
      "--balance-tracking": "-1px",
    };
  },
};
