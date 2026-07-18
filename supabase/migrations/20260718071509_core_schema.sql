-- Ticket 1: walking skeleton core schema.
-- Seven tables: tenants, outlets, members, tiers, rewards, themes, points_ledger.
-- Every tenant-scoped table carries tenant_id and is protected by RLS in the next migration.

create table tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table outlets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index outlets_tenant_id_idx on outlets (tenant_id);

create table members (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  phone text not null,
  name text,
  birthday_month smallint check (birthday_month between 1 and 12),
  created_at timestamptz not null default now(),
  unique (tenant_id, phone)
);

create index members_tenant_id_idx on members (tenant_id);

-- Schema only for ticket 1: tiers, rewards, and themes exist so every table in the
-- walking skeleton is RLS-protected from day one, but nothing wires them into a flow yet.

create table tiers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  name text not null,
  min_points integer not null default 0,
  created_at timestamptz not null default now()
);

create index tiers_tenant_id_idx on tiers (tenant_id);

create table rewards (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  name text not null,
  points_cost integer not null check (points_cost > 0),
  created_at timestamptz not null default now()
);

create index rewards_tenant_id_idx on rewards (tenant_id);

-- One row per tenant: the tenant's theme selection + brand inputs (ticket 4 renders these).
-- theme_key references a code-level theme catalog, not a DB table.
create table themes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique references tenants (id) on delete cascade,
  theme_key text not null default 'atelier',
  logo_url text,
  brand_color text,
  cover_image_url text,
  created_at timestamptz not null default now()
);

create index themes_tenant_id_idx on themes (tenant_id);

-- Append-only points ledger. Balances are always derived (see member_balances view) --
-- never a mutable counter column. No updated_at column: rows are never updated.
create table points_ledger (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  member_id uuid not null references members (id) on delete cascade,
  outlet_id uuid not null references outlets (id) on delete restrict,
  delta integer not null check (delta <> 0),
  reason text not null,
  created_at timestamptz not null default now()
);

create index points_ledger_tenant_id_idx on points_ledger (tenant_id);
create index points_ledger_tenant_member_idx on points_ledger (tenant_id, member_id);
