import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Voucher validity window. 3 minutes (deduct-on-confirm revision, 24 Jul 2026):
// long enough that a counter queue rarely burns the window, short enough to limit
// screenshot-hoarding. A single named constant, passed into create_redemption so the
// DB and UI share one source of truth.
export const REDEMPTION_VALIDITY_SECONDS = 180;

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

export type CreateRedemptionError =
  | "unknown_member"
  | "unknown_reward"
  | "insufficient_points"
  | "active_voucher_exists";

// Deduct-on-confirm (see migration 20260724120000): one atomic rpc that enforces
// one-live-voucher, checks the balance, creates the voucher, and appends the deduction
// -- points leave the moment the member confirms, not at the counter.
export async function createRedemption(
  tenantId: string,
  memberId: string,
  rewardId: string,
): Promise<{ ok: true; id: string } | { ok: false; error: CreateRedemptionError }> {
  const { data, error } = await supabaseAdmin.rpc("create_redemption", {
    p_tenant_id: tenantId,
    p_member_id: memberId,
    p_reward_id: rewardId,
    p_validity_seconds: REDEMPTION_VALIDITY_SECONDS,
  });
  if (error) throw error;
  return data as { ok: true; id: string } | { ok: false; error: CreateRedemptionError };
}

// The member's one live voucher, if any (pending and not yet expired). Used to restore
// the active-voucher bar after a reload and to block a second redemption in the UI
// (create_redemption enforces the same rule server-side).
export async function getActiveRedemption(
  tenantId: string,
  memberId: string,
): Promise<Redemption | null> {
  const { data, error } = await supabaseAdmin
    .from("redemptions")
    .select("id, tenant_id, member_id, reward_id, status, expires_at, created_at")
    .eq("tenant_id", tenantId)
    .eq("member_id", memberId)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
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
