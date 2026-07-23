// Replace a tenant's tier ladder from the CLI. A testing stand-in until the admin
// tiers editor (ticket 11) exists. Tier names are tenant-authored content; min_points
// is the threshold in LIFETIME points earned (see lib/tier-progress.ts).
//
//   npx tsx scripts/set-tiers.ts <tenant-slug> <name:points> [<name:points> ...]
//   npx tsx scripts/set-tiers.ts demo-cafe Regular:0 Silver:400 Gold:1000
//
// Replaces the whole ladder (delete + insert). Tiers are derived-only (no member row
// references a tier), so replacing them is safe. Uses NEXT_PUBLIC_SUPABASE_URL +
// SUPABASE_SERVICE_ROLE_KEY from .env.local (or the environment) -- point those at
// local or cloud depending on which you're changing.

import { config } from "dotenv";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

config({ path: path.resolve(__dirname, "../.env.local") });

const slug = process.argv[2];
const rungs = process.argv.slice(3).map((arg) => {
  const [name, points] = arg.split(":");
  return { name, min_points: Number(points) };
});

if (!slug || rungs.length === 0 || rungs.some((r) => !r.name || !Number.isInteger(r.min_points))) {
  console.error("Usage: npx tsx scripts/set-tiers.ts <tenant-slug> <name:points> [<name:points> ...]");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the environment.");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  const { data: tenant, error: tErr } = await supabase
    .from("tenants")
    .select("id, name")
    .eq("slug", slug)
    .maybeSingle();
  if (tErr) throw tErr;
  if (!tenant) throw new Error(`No tenant with slug "${slug}".`);

  const { error: dErr } = await supabase.from("tiers").delete().eq("tenant_id", tenant.id);
  if (dErr) throw dErr;

  const { error: iErr } = await supabase
    .from("tiers")
    .insert(rungs.map((r) => ({ tenant_id: tenant.id, name: r.name, min_points: r.min_points })));
  if (iErr) throw iErr;

  const ladder = [...rungs]
    .sort((a, b) => a.min_points - b.min_points)
    .map((r) => `${r.name} ${r.min_points}`)
    .join(" · ");
  console.log(`Set ${tenant.name} tiers: ${ladder}`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
