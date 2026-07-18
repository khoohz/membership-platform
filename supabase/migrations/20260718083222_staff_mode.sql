-- Ticket 2: staff mode -- earning rules, outlet PINs, ledger rule attribution.
-- No new tables, so no new RLS work: every column below lands on a table that is
-- already RLS-enabled deny-by-default (migration 20260718071510).

-- A tenant has exactly one earning rule (spec section 3): N points per visit, or
-- N points per RM1 (always round down, no multipliers at MVP).
alter table tenants
  add column earning_rule_type text not null default 'per_visit'
    check (earning_rule_type in ('per_visit', 'per_rm')),
  add column earning_rule_n integer not null default 10
    check (earning_rule_n > 0);

-- Staff mode is PIN-protected per outlet. pin_hash is bcrypt, never plaintext.
-- NULL means staff mode is locked for that outlet until a PIN is provisioned
-- (scripts/set-outlet-pin.ts) -- no PIN value ever lives in the repo or seed.
-- pin_failed_attempts / pin_locked_until back the brute-force lockout: the guard
-- must live in the database because serverless instances share no memory.
alter table outlets
  add column pin_hash text,
  add column pin_failed_attempts integer not null default 0,
  add column pin_locked_until timestamptz;

-- Rule attribution on every award (spec section 8: "transactions with rule source").
-- Nullable: ticket-1 skeleton rows predate rules. Adding columns is DDL and does not
-- weaken the append-only posture -- UPDATE/DELETE stay revoked on points_ledger.
alter table points_ledger
  add column source text,
  add column rule_type text,
  add column rule_n integer,
  add column amount_sen integer;
