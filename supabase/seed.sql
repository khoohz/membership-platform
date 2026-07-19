-- Seed the one demo tenant used by the deployed walking skeleton.
-- No members are seeded -- the first visitor becomes member #1 through the portal itself.
-- No outlet PIN is seeded (pin_hash stays NULL = staff mode locked): PINs are
-- provisioned per environment with scripts/set-outlet-pin.ts so no real PIN value
-- ever exists in the repo.

with new_tenant as (
  insert into tenants (slug, name, earning_rule_type, earning_rule_n)
  values ('demo-cafe', 'Demo Cafe', 'per_visit', 10)
  returning id
)
insert into outlets (tenant_id, name)
select id, 'Main Outlet' from new_tenant;

insert into themes (tenant_id, theme_key)
select id, 'atelier' from tenants where slug = 'demo-cafe';

-- Demo rewards (rewards management UI is ticket 11; these make redemption demoable).
insert into rewards (tenant_id, name, points_cost)
select id, r.name, r.points_cost
from tenants,
  (values ('Free Kopi', 30), ('Free Latte', 50), ('RM5 Off', 80)) as r (name, points_cost)
where slug = 'demo-cafe';
