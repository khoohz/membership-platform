// A theme is a code-level definition (not a DB row): it maps the tenant's brand
// inputs (brand color, logo, cover) onto a fixed contract of CSS custom properties
// plus a small set of layout slots. Switching a tenant between existing themes is a
// pure data change (themes.theme_key); only *adding* a theme is code.

export type HeroSlot = "material" | "editorial" | "press";
export type RewardsSlot = "grid" | "list";

export type ThemeSlots = {
  hero: HeroSlot; // how the member card renders: layered material vs flat editorial
  rewards: RewardsSlot; // rewards as a 2-up grid vs a full-width list
};

// Brand inputs from the tenant's themes row (all optional; theme supplies fallbacks).
export type BrandInputs = {
  brandColor: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
};

export type ThemeDefinition = {
  key: string;
  name: string;
  defaultBrandColor: string;
  slots: ThemeSlots;
  // Produce the full CSS-variable map for the portal wrapper. `brand` is the resolved
  // brand color; `heroBackground` is the resolved CSS background for the member card
  // (tenant cover image if present, else the theme's crafted material recipe).
  cssVars: (ctx: { brand: string; heroBackground: string }) => Record<string, string>;
  // The crafted fallback "material" when the tenant supplies no cover image.
  craftedMaterial: (brand: string) => string;
};

// What the portal actually renders with: the definition plus resolved brand + the
// ready-to-spread CSS variables.
export type ResolvedTheme = {
  definition: ThemeDefinition;
  brand: string;
  vars: Record<string, string>;
  logoUrl: string | null;
};
