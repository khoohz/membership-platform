import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type Tier = { id: string; name: string; min_points: number };

// Tier ladder for a tenant, lowest rung first. Tier NAMES are tenant-authored content
// (renamed in the ticket-11 admin editor); the portal shows them as-is in every
// language. Derivation of a member's standing lives in lib/tier-progress.ts.
export async function listTiers(tenantId: string): Promise<Tier[]> {
  const { data, error } = await supabaseAdmin
    .from("tiers")
    .select("id, name, min_points")
    .eq("tenant_id", tenantId)
    .order("min_points", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
