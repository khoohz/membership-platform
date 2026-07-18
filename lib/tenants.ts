import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";

import type { EarningRule } from "@/lib/earning";

export type Tenant = {
  id: string;
  slug: string;
  name: string;
  earning_rule_type: EarningRule["type"];
  earning_rule_n: number;
};

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const { data, error } = await supabaseAdmin
    .from("tenants")
    .select("id, slug, name, earning_rule_type, earning_rule_n")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export function earningRuleOf(tenant: Tenant): EarningRule {
  return { type: tenant.earning_rule_type, n: tenant.earning_rule_n };
}
