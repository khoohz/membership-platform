import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { BrandInputs, ResolvedTheme, ThemeDefinition } from "./types";
import { velvet } from "./velvet";
import { nocturne } from "./nocturne";
import { press } from "./press";

export type { ResolvedTheme } from "./types";
export { velvet, nocturne, press };

// The code-level theme catalog. theme_key on the DB row selects one; an unknown key
// falls back to the flagship. Adding a theme = adding an entry here (code); switching
// a tenant between these = a data change on themes.theme_key only.
const CATALOG: Record<string, ThemeDefinition> = {
  [press.key]: press,
  [velvet.key]: velvet,
  [nocturne.key]: nocturne,
};

// Retired keys kept resolvable so existing tenant rows never render a wrong theme.
const ALIASES: Record<string, string> = {
  atelier: velvet.key, // "Atelier" was renamed to Velvet in the July 2026 polish pass
};

export const DEFAULT_THEME = press;

export function getThemeDefinition(themeKey: string | null | undefined): ThemeDefinition {
  if (!themeKey) return DEFAULT_THEME;
  const key = ALIASES[themeKey] ?? themeKey;
  return CATALOG[key] ?? DEFAULT_THEME;
}

// Resolve a theme definition + the tenant's brand inputs into ready-to-render tokens.
// The hero background is the tenant's cover image if present, else the theme's crafted
// material woven from the brand color (the "crafted fallback material").
export function resolveTheme(themeKey: string | null, brand: BrandInputs): ResolvedTheme {
  const definition = getThemeDefinition(themeKey);
  const brandColor = brand.brandColor?.trim() || definition.defaultBrandColor;
  // A tenant cover photo can be any brightness, but the hero ink is near-white in
  // every theme. Layer a top-to-bottom dark scrim over the image so the balance,
  // labels, and QR hint keep a legible contrast regardless of the photo. The crafted
  // material is always dark by construction, so it needs no scrim.
  const heroBackground = brand.coverImageUrl
    ? `linear-gradient(180deg, rgba(17,18,20,0.28) 0%, rgba(17,18,20,0.62) 100%), url("${brand.coverImageUrl}") center / cover no-repeat`
    : definition.craftedMaterial(brandColor);

  return {
    definition,
    brand: brandColor,
    vars: definition.cssVars({ brand: brandColor, heroBackground }),
    logoUrl: brand.logoUrl?.trim() || null,
  };
}

// Fetch the tenant's theme row and resolve it. Missing row -> default theme with
// theme defaults (a tenant that never configured branding still gets a coherent card).
export async function getTenantTheme(tenantId: string): Promise<ResolvedTheme> {
  const { data, error } = await supabaseAdmin
    .from("themes")
    .select("theme_key, logo_url, brand_color, cover_image_url")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error) throw error;

  return resolveTheme(data?.theme_key ?? null, {
    brandColor: data?.brand_color ?? null,
    logoUrl: data?.logo_url ?? null,
    coverImageUrl: data?.cover_image_url ?? null,
  });
}
