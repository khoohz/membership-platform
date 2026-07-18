import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { normalizePhone } from "@/lib/phone";

export type Member = {
  id: string;
  tenant_id: string;
  phone: string;
};

// Enter a phone number, become (or find) a member. No verification -- per spec, there's
// never any OTP/password step in this product. Phone is normalized to E.164 (+60)
// before it touches the identity key; invalid formats return null rather than
// creating a member under a garbage key.
export async function enrolOrLookupMember(
  tenantId: string,
  phone: string,
): Promise<Member | null> {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;

  const { data, error } = await supabaseAdmin
    .from("members")
    .upsert(
      { tenant_id: tenantId, phone: normalized },
      { onConflict: "tenant_id,phone" },
    )
    .select("id, tenant_id, phone")
    .single();

  if (error) throw error;
  return data;
}

export async function findMemberByPhone(
  tenantId: string,
  phone: string,
): Promise<Member | null> {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;

  const { data, error } = await supabaseAdmin
    .from("members")
    .select("id, tenant_id, phone")
    .eq("tenant_id", tenantId)
    .eq("phone", normalized)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getMemberById(
  tenantId: string,
  memberId: string,
): Promise<Member | null> {
  const { data, error } = await supabaseAdmin
    .from("members")
    .select("id, tenant_id, phone")
    .eq("tenant_id", tenantId)
    .eq("id", memberId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// Balance is always derived from points_ledger via the member_balances view -- never a
// stored counter. A member with no ledger rows yet (freshly enrolled) has no row in the
// view at all, so "not found" means balance 0, not an error.
export async function getMemberBalance(
  tenantId: string,
  memberId: string,
): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from("member_balances")
    .select("balance")
    .eq("tenant_id", tenantId)
    .eq("member_id", memberId)
    .maybeSingle();

  if (error) throw error;
  return data?.balance ?? 0;
}
