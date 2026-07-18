import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type Tenant = {
  id: string;
  slug: string;
  name: string;
};

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const { data, error } = await supabaseAdmin
    .from("tenants")
    .select("id, slug, name")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data;
}
