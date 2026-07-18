-- Ticket 1: enable RLS on every table, deny-by-default.
--
-- No login system exists yet (staff PIN lands in ticket 2, WhatsApp login in ticket 8).
-- All reads/writes in ticket 1 go through Next.js Server Actions using the service_role
-- key, which carries BYPASSRLS and always filters explicitly by tenant_id in application
-- code. So the job of this migration is narrower than "implement tenant policies" --
-- it's to guarantee that anon/authenticated (the only roles RLS actually restricts)
-- get zero rows on every table, since no legitimate direct-client access path exists yet.
--
-- Tickets 2 and 8 will add real identity-scoped policies (e.g. staff session -> tenant_id
-- + outlet_id, member session -> tenant_id + member_id) once a session mechanism exists.
-- Until then: RLS enabled, no policies, deny by default.

alter table tenants enable row level security;
alter table outlets enable row level security;
alter table members enable row level security;
alter table tiers enable row level security;
alter table rewards enable row level security;
alter table themes enable row level security;
alter table points_ledger enable row level security;

-- Supabase's default ACL for the public schema excludes anon/authenticated/service_role
-- from SELECT/INSERT/UPDATE/DELETE on newly created tables (only TRUNCATE/REFERENCES/
-- TRIGGER/MAINTAIN are granted by default). BYPASSRLS only skips row-security policies,
-- not table-level grants -- so without this, service_role could not touch these tables
-- at all. Server Actions run as service_role, so it needs full CRUD; anon/authenticated
-- get nothing (no policies exist for them yet, so a grant without a policy would still
-- deny by default, but we withhold the grant too for a clearer, defense-in-depth posture).
grant select, insert, update, delete on
  tenants, outlets, members, tiers, rewards, themes, points_ledger
to service_role;
