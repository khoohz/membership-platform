// Provision (or rotate) an outlet's staff PIN. PINs never live in the repo or seed;
// run this per environment instead:
//
//   npx tsx scripts/set-outlet-pin.ts <tenant-slug> <pin>
//
// Uses NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env.local (or the
// environment), so point those at local or cloud depending on which you're provisioning.
// With multiple outlets pass the outlet name as a third argument.

import { config } from "dotenv";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

config({ path: path.resolve(__dirname, "../.env.local") });

const [tenantSlug, pin, outletName] = process.argv.slice(2);

if (!tenantSlug || !pin) {
  console.error("Usage: npx tsx scripts/set-outlet-pin.ts <tenant-slug> <pin> [outlet-name]");
  process.exit(1);
}
if (!/^\d{6}$/.test(pin)) {
  console.error("PIN must be exactly 6 digits.");
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
    .select("id, slug")
    .eq("slug", tenantSlug)
    .maybeSingle();
  if (tenantError) throw tenantError;
  if (!tenant) {
    console.error(`No tenant with slug "${tenantSlug}" at ${url}.`);
    process.exit(1);
  }

  let query = supabase.from("outlets").select("id, name").eq("tenant_id", tenant.id);
  if (outletName) query = query.eq("name", outletName);
  const { data: outlets, error: outletsError } = await query;
  if (outletsError) throw outletsError;
  if (!outlets || outlets.length === 0) {
    console.error(`No matching outlet for tenant "${tenantSlug}".`);
    process.exit(1);
  }
  if (outlets.length > 1) {
    console.error(
      `Tenant has ${outlets.length} outlets -- pass an outlet name: ${outlets.map((o) => o.name).join(", ")}`,
    );
    process.exit(1);
  }

  const pinHash = await bcrypt.hash(pin, 10);
  const { error: updateError } = await supabase
    .from("outlets")
    .update({ pin_hash: pinHash, pin_failed_attempts: 0, pin_locked_until: null })
    .eq("id", outlets[0].id);
  if (updateError) throw updateError;

  console.log(`PIN set for "${outlets[0].name}" (tenant ${tenantSlug}) at ${url}.`);
}

main();
