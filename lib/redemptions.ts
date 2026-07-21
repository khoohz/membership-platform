import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getMemberBalance } from "@/lib/members";

// Voucher validity window. 60s per spec section 3; a single named constant so the
// pilot can tune it (cashier queue speed vs screenshot-hoarding risk) in one place.
export const REDEMPTION_VALIDITY_SECONDS = 60;

export type Redemption = {
  id: string;
  tenant_id: string;
  member_id: string;
  reward_id: string;
  status: "pending" | "claimed";
  expires_at: string;
  created_at: string;
};

export type Reward = {
  id: string;
  name: string;
  points_cost: number;
};

export async function listRewards(tenantId: string): Promise<Reward[]> {
  const { data, error } = await supabaseAdmin
    .from("rewards")
    .select("id, name, points_cost")
    .eq("tenant_id", tenantId)
    .order("points_cost", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getReward(tenantId: string, rewardId: string): Promise<Reward | null> {
  const { data, error } = await supabaseAdmin
    .from("rewards")
    .select("id, name, points_cost")
    .eq("tenant_id", tenantId)
    .eq("id", rewardId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Generation-time balance check is UX-only; claim_redemption re-checks inside the
// transaction, because points can be spent between generation and claim.
export async function createRedemption(
  tenantId: string,
  memberId: string,
  rewardId: string,
): Promise<{ ok: true; id: string } | { ok: false; error: "unknown_reward" | "insufficient_points" }> {
  const reward = await getReward(tenantId, rewardId);
  if (!reward) return { ok: false, error: "unknown_reward" };

  const balance = await getMemberBalance(tenantId, memberId);
  if (balance < reward.points_cost) return { ok: false, error: "insufficient_points" };

  const { data, error } = await supabaseAdmin
    .from("redemptions")
    .insert({
      tenant_id: tenantId,
      member_id: memberId,
      reward_id: rewardId,
      expires_at: new Date(Date.now() + REDEMPTION_VALIDITY_SECONDS * 1000).toISOString(),
    })
    .select("id")
    .single();
  if (error) throw error;
  return { ok: true, id: data.id };
}

export async function getRedemption(
  tenantId: string,
  redemptionId: string,
): Promise<Redemption | null> {
  const { data, error } = await supabaseAdmin
    .from("redemptions")
    .select("id, tenant_id, member_id, reward_id, status, expires_at, created_at")
    .eq("tenant_id", tenantId)
    .eq("id", redemptionId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export type ClaimResult =
  | { ok: true; reward_name: string; points_cost: number; new_balance: number }
  | { ok: false; error: "not_found" | "already_claimed" | "expired" | "insufficient_points" };

// One rpc call = one Postgres transaction (see migration 20260718155238): validate,
// lock, balance-check, insert negative ledger row, mark claimed -- all or nothing.
export async function claimRedemption(
  tenantId: string,
  redemptionId: string,
  outletId: string,
): Promise<ClaimResult> {
  const { data, error } = await supabaseAdmin.rpc("claim_redemption", {
    p_redemption_id: redemptionId,
    p_tenant_id: tenantId,
    p_outlet_id: outletId,
  });
  if (error) throw error;
  return data as ClaimResult;
}

export type HistoryEntry = {
  delta: number;
  reason: string;
  created_at: string;
  reward_name: string | null;
};

export async function getMemberHistory(
  tenantId: string,
  memberId: string,
  limit = 50,
): Promise<HistoryEntry[]> {
  const { data, error } = await supabaseAdmin
    .from("points_ledger")
    .select("delta, reason, created_at, redemptions (rewards (name))")
    .eq("tenant_id", tenantId)
    .eq("member_id", memberId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((row) => {
    const redemption = row.redemptions as unknown as { rewards: { name: string } | null } | null;
    return {
      delta: row.delta,
      reason: row.reason,
      created_at: row.created_at,
      reward_name: redemption?.rewards?.name ?? null,
    };
  });
}
