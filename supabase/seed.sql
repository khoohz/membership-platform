-- Ticket 1: seed the one demo tenant used by the deployed walking skeleton.
-- No members are seeded -- the first visitor becomes member #1 through the portal itself.

with new_tenant as (
  insert into tenants (slug, name)
  values ('demo-cafe', 'Demo Cafe')
  returning id
)
insert into outlets (tenant_id, name)
select id, 'Main Outlet' from new_tenant;

insert into themes (tenant_id, theme_key)
select id, 'atelier' from tenants where slug = 'demo-cafe';
