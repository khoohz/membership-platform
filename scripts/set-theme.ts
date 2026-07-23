// Switch a tenant's theme and/or brand inputs from the CLI. Proves the theme engine
// is data-driven (no deploy to restyle) and is the testing stand-in until the wizard
// (ticket 6) and admin theme picker (ticket 11) expose this to owners.
//
//   npx tsx scripts/set-theme.ts <tenant-slug> --theme nocturne
//   npx tsx scripts/set-theme.ts <tenant-slug> --brand '#6F4E37'
//   npx tsx scripts/set-theme.ts <tenant-slug> --theme atelier --brand '#0F6B5C'
//
// Known theme keys: atelier, nocturne. Uses NEXT_PUBLIC_SUPABASE_URL +
// SUPABASE_SERVICE_ROLE_KEY from .env.local (or the environment) -- point those at
// local or cloud depending on which you're changing.

import { config } from "dotenv";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

config({ path: path.resolve(__dirname, "../.env.local") });

const KNOWN_THEMES = ["press", "velvet", "nocturne", "taffy"];

function flag(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const tenantSlug = process.argv[2];
const theme = flag("theme");
const brand = flag("brand");

if (!tenantSlug || tenantSlug.startsWith("--") || (!theme && !brand)) {
  console.error("Usage: npx tsx scripts/set-theme.ts <tenant-slug> [--theme <key>] [--brand '#RRGGBB']");
  process.exit(1);
}
if (theme && !KNOWN_THEMES.includes(theme)) {
  console.error(`Unknown theme "${theme}". Known: ${KNOWN_THEMES.join(", ")}`);
  process.exit(1);
}
if (brand && !/^#[0-9a-fA-F]{6}$/.test(brand)) {
  console.error(`Brand must be a #RRGGBB hex color (got "${brand}").`);
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", tenantSlug)
    .maybeSingle();
  if (tenantError) throw tenantError;
  if (!tenant) {
    console.error(`No tenant with slug "${tenantSlug}" at ${url}.`);
    process.exit(1);
  }

  const patch: Record<string, string> = {};
  if (theme) patch.theme_key = theme;
  if (brand) patch.brand_color = brand;

  const { data, error } = await supabase
    .from("themes")
    .update(patch)
    .eq("tenant_id", tenant.id)
    .select("theme_key, brand_color")
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    console.error(`No themes row for "${tenantSlug}" -- was the tenant seeded?`);
    process.exit(1);
  }

  console.log(`${tenantSlug}: theme=${data.theme_key} brand=${data.brand_color ?? "(default)"} at ${url}`);
}

main();
