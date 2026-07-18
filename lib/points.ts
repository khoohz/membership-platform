import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Append-only: this is the only way points ever move. There is no update/adjust path --
// the database grants enforce that (UPDATE/DELETE are revoked on points_ledger).
// source/rule attribution records which earning rule produced the award
// (spec section 8: transactions with rule source; ticket 11's insights read these).
export async function awardPoints(params: {
  tenantId: string;
  memberId: string;
  outletId: string;
  delta: number;
  reason: string;
  source?: "staff_scan" | "staff_phone";
  ruleType?: "per_visit" | "per_rm";
  ruleN?: number;
  amountSen?: number;
}): Promise<void> {
  const { tenantId, memberId, outletId, delta, reason, source, ruleType, ruleN, amountSen } =
    params;
  const { error } = await supabaseAdmin.from("points_ledger").insert({
    tenant_id: tenantId,
    member_id: memberId,
    outlet_id: outletId,
    delta,
    reason,
    source: source ?? null,
    rule_type: ruleType ?? null,
    rule_n: ruleN ?? null,
    amount_sen: amountSen ?? null,
  });

  if (error) throw error;
}
