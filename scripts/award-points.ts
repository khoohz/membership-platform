// Append a points-ledger row for a member from the CLI. A testing stand-in until the
// admin manual-adjust flow (ticket 11) exists -- e.g. topping up a demo member so the
// redeem loop can be exercised.
//
//   npx tsx scripts/award-points.ts <tenant-slug> <phone> <delta> [reason]
//   npx tsx scripts/award-points.ts demo-cafe +60176660001 300 manual_topup
//
// Uses NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env.local (or the
// environment) -- point those at local or cloud depending on which you're changing.
// The ledger is append-only, so this only ever inserts; balance/tier stay derived.

import { config } from "dotenv";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

config({ path: path.resolve(__dirname, "../.env.local") });

const slug = process.argv[2];
const phone = process.argv[3];
const delta = Number(process.argv[4]);
const reason = process.argv[5] ?? "manual_topup";

if (!slug || !phone || !Number.isInteger(delta) || delta === 0) {
  console.error("Usage: npx tsx scripts/award-points.ts <tenant-slug> <phone> <delta> [reason]");
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

  const { data: outlet, error: oErr } = await supabase
    .from("outlets")
    .select("id")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (oErr) throw oErr;
  if (!outlet) throw new Error(`Tenant "${slug}" has no outlet.`);

  const { data: member, error: mErr } = await supabase
    .from("members")
    .select("id")
    .eq("tenant_id", tenant.id)
    .eq("phone", phone)
    .maybeSingle();
  if (mErr) throw mErr;
  if (!member) throw new Error(`No member ${phone} for tenant "${slug}".`);

  const { error: iErr } = await supabase.from("points_ledger").insert({
    tenant_id: tenant.id,
    member_id: member.id,
    outlet_id: outlet.id,
    delta,
    reason,
  });
  if (iErr) throw iErr;

  const { data: bal, error: bErr } = await supabase
    .from("member_balances")
    .select("balance")
    .eq("tenant_id", tenant.id)
    .eq("member_id", member.id)
    .maybeSingle();
  if (bErr) throw bErr;

  console.log(
    `Awarded ${delta > 0 ? "+" : ""}${delta} to ${phone} @ ${tenant.name}. New balance: ${bal?.balance ?? 0}.`,
  );
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
