import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Well-known local dev anon key (`npx supabase start` output) -- not a secret.
const LOCAL_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

export function makeAnonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  return createClient(url, LOCAL_ANON_KEY, { auth: { persistSession: false } });
}

export async function createTestTenant(slugPrefix: string) {
  const slug = `${slugPrefix}-${crypto.randomUUID()}`;
  const { data: tenant, error: tenantError } = await supabaseAdmin
    .from("tenants")
    .insert({ slug, name: slug })
    .select("id, slug, name")
    .single();
  if (tenantError) throw tenantError;

  const { data: outlet, error: outletError } = await supabaseAdmin
    .from("outlets")
    .insert({ tenant_id: tenant.id, name: "Test Outlet" })
    .select("id, tenant_id, name")
    .single();
  if (outletError) throw outletError;

  return { tenant, outlet };
}

export async function createTestReward(
  tenantId: string,
  name: string,
  pointsCost: number,
) {
  const { data, error } = await supabaseAdmin
    .from("rewards")
    .insert({ tenant_id: tenantId, name, points_cost: pointsCost })
    .select("id, name, points_cost")
    .single();
  if (error) throw error;
  return data;
}

// Best-effort: a test tenant with ledger rows CANNOT be deleted by the app role --
// points_ledger DELETE is revoked (append-only by design) and outlets are
// FK-restricted by ledger rows, which blocks the tenant cascade. Those tenants
// linger in the local db until the next `supabase db reset`; that's accepted, and
// the random per-run slugs keep them from interfering with anything.
export async function deleteTestTenant(tenantId: string) {
  await supabaseAdmin.from("tenants").delete().eq("id", tenantId);
}
