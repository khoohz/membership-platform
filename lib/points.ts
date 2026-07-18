import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Append-only: this is the only way points ever move. There is no update/adjust path --
// the database grants enforce that (UPDATE/DELETE are revoked on points_ledger).
export async function awardPoints(params: {
  tenantId: string;
  memberId: string;
  outletId: string;
  delta: number;
  reason: string;
}): Promise<void> {
  const { tenantId, memberId, outletId, delta, reason } = params;
  const { error } = await supabaseAdmin.from("points_ledger").insert({
    tenant_id: tenantId,
    member_id: memberId,
    outlet_id: outletId,
    delta,
    reason,
  });

  if (error) throw error;
}
