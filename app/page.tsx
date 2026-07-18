import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function Home() {
  const { data: tenants, error } = await supabaseAdmin
    .from("tenants")
    .select("slug, name")
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (
    <main>
      <h1>Membership Platform — walking skeleton</h1>
      <ul>
        {(tenants ?? []).map((tenant) => (
          <li key={tenant.slug}>
            {tenant.name}: <a href={`/${tenant.slug}/portal`}>portal</a>{" "}
            &middot; <a href={`/${tenant.slug}/staff`}>staff</a>
          </li>
        ))}
      </ul>
    </main>
  );
}
