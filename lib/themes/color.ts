// Small hex-color helpers for deriving the "crafted material" hero background from a
// tenant's single brand color. No dependency; clamps and tolerates #rgb / #rrggbb.

export type Rgb = { r: number; g: number; b: number };

export function parseHex(hex: string): Rgb {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  if (h.length !== 6 || Number.isNaN(n)) return { r: 15, g: 107, b: 92 }; // safe brand green
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));

export function toHex({ r, g, b }: Rgb): string {
  return "#" + [r, g, b].map((c) => clamp(c).toString(16).padStart(2, "0")).join("");
}

// Mix toward black (amount<0) or white (amount>0), amount in -1..1.
export function shade(hex: string, amount: number): string {
  const { r, g, b } = parseHex(hex);
  const t = amount < 0 ? 0 : 255;
  const p = Math.abs(amount);
  return toHex({ r: r + (t - r) * p, g: g + (t - g) * p, b: b + (t - b) * p });
}

export function rgba(hex: string, alpha: number): string {
  const { r, g, b } = parseHex(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Relative luminance -> pick readable ink over a brand fill.
export function isLight(hex: string): boolean {
  const { r, g, b } = parseHex(hex);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6;
}

// --- contrast-aware ink selection -------------------------------------------------
// A white-label hero is a slab of the tenant's brand colour, and the brand can be any
// hue. A simple isLight() threshold picks cream ink for anything "not light", which
// fails badly on mid-tone saturated brands (cream on hot pink is ~2.9:1). These helpers
// pick the ink that actually wins on contrast, and -- when a mid-tone brand defeats
// BOTH inks -- nudge the slab itself until the pair clears the target.

function channelLuminance(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(hex: string): number {
  const { r, g, b } = parseHex(hex);
  return (
    0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b)
  );
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

// Resolve a readable {slab, ink} pair for a brand-coloured surface. Returns the slab
// possibly shifted away from the raw brand -- only ever as far as needed to reach
// `target` (WCAG AA for normal text).
export function readableSlab(
  brand: string,
  darkInk: string,
  lightInk: string,
  target = 4.5,
): { slab: string; ink: string; usedLightInk: boolean } {
  const darkRatio = contrastRatio(darkInk, brand);
  const lightRatio = contrastRatio(lightInk, brand);

  if (Math.max(darkRatio, lightRatio) >= target) {
    const usedLightInk = lightRatio > darkRatio;
    return { slab: brand, ink: usedLightInk ? lightInk : darkInk, usedLightInk };
  }

  // Neither ink clears the raw brand (a mid-tone hue). Commit to whichever is ahead
  // and walk the slab toward its opposite until the pair passes.
  const usedLightInk = lightRatio >= darkRatio;
  const ink = usedLightInk ? lightInk : darkInk;
  let slab = brand;
  for (let i = 0; i < 24 && contrastRatio(ink, slab) < target; i++) {
    slab = shade(slab, usedLightInk ? -0.06 : 0.06);
  }
  return { slab, ink, usedLightInk };
}

// For themes whose hero is dark BY DESIGN (Velvet's layered material, Nocturne's
// editorial wash): never flip to dark ink -- that would put dark text on a gradient
// that still fades to near-black. Instead keep the light ink and deepen the slab until
// it clears the target, so any brand (even a pale pastel) yields a readable dark card.
export function darkSlabFor(brand: string, lightInk: string, target = 5.4): string {
  let slab = brand;
  for (let i = 0; i < 32 && contrastRatio(lightInk, slab) < target; i++) {
    slab = shade(slab, -0.06);
  }
  return slab;
}
