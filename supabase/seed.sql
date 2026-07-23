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

-- Theme selection + brand inputs (ticket 4 renders these). brand_color is a deep
-- green distinct from the theme's own default, so the crafted hero material is
-- visibly data-driven. No logo/cover set: the theme's fallbacks (initial glyph +
-- crafted material) render instead. Switch theme/brand with scripts/set-theme.ts.
insert into themes (tenant_id, theme_key, brand_color)
select id, 'press', '#1F4D3D' from tenants where slug = 'demo-cafe';

-- Demo rewards (rewards management UI is ticket 11; these make redemption demoable).
insert into rewards (tenant_id, name, points_cost)
select id, r.name, r.points_cost
from tenants,
  (values ('Free Kopi', 30), ('Free Latte', 50), ('RM5 Off', 80)) as r (name, points_cost)
where slug = 'demo-cafe';

-- Demo tier ladder (tiers editor is ticket 11). Names are tenant-authored content, so
-- the portal shows them as-is in every language; only the surrounding ritual/progress
-- copy is translated. The lowest rung sits at 0 so every member has a tier. A member's
-- tier + "N points to next" are derived from the ledger balance (lib/tier-progress.ts).
insert into tiers (tenant_id, name, min_points)
select id, t.name, t.min_points
from tenants,
  (values ('Regular', 0), ('Silver', 400), ('Gold', 1000)) as t (name, min_points)
where slug = 'demo-cafe';
