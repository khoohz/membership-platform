// Toggle a tenant's earning rule from the CLI -- testing convenience until the
// wizard (ticket 6) and admin settings (ticket 11) expose this to owners.
//
//   npx tsx scripts/set-earning-rule.ts <tenant-slug> per_visit <n>
//   npx tsx scripts/set-earning-rule.ts <tenant-slug> per_rm <n>
//
// Uses NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env.local (or the
// environment) -- point those at local or cloud, same as set-outlet-pin.ts.

import { config } from "dotenv";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

config({ path: path.resolve(__dirname, "../.env.local") });

const [tenantSlug, ruleType, nRaw] = process.argv.slice(2);
const n = parseInt(nRaw ?? "", 10);

if (!tenantSlug || !["per_visit", "per_rm"].includes(ruleType) || !Number.isInteger(n) || n <= 0) {
  console.error("Usage: npx tsx scripts/set-earning-rule.ts <tenant-slug> <per_visit|per_rm> <n>");
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
  const { data: tenant, error } = await supabase
    .from("tenants")
    .update({ earning_rule_type: ruleType, earning_rule_n: n })
    .eq("slug", tenantSlug)
    .select("slug, earning_rule_type, earning_rule_n")
    .maybeSingle();
  if (error) throw error;
  if (!tenant) {
    console.error(`No tenant with slug "${tenantSlug}" at ${url}.`);
    process.exit(1);
  }
  console.log(
    `${tenant.slug}: ${tenant.earning_rule_type === "per_visit" ? `${tenant.earning_rule_n} points per visit` : `${tenant.earning_rule_n} point(s) per RM1 (round down)`} at ${url}`,
  );
}

main();
