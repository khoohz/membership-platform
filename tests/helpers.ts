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

export async function deleteTestTenant(tenantId: string) {
  // Ledger rows carry ON DELETE RESTRICT on outlet_id, so clear them before the
  // cascade deletes the outlet. tenants/outlets/members all cascade otherwise.
  await supabaseAdmin.from("points_ledger").delete().eq("tenant_id", tenantId);
  await supabaseAdmin.from("tenants").delete().eq("id", tenantId);
}
