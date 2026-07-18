import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type Outlet = {
  id: string;
  tenant_id: string;
  name: string;
};

// Ticket 1 has no outlet picker -- one seeded outlet per tenant, used for every award.
// Multi-outlet selection is ticket 2's job.
export async function getDefaultOutlet(tenantId: string): Promise<Outlet> {
  const { data, error } = await supabaseAdmin
    .from("outlets")
    .select("id, tenant_id, name")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (error) throw error;
  return data;
}
