-- Ticket 1: make the points ledger structurally append-only.
--
-- BYPASSRLS (which service_role has) only skips row-security policies -- it does not
-- bypass table-level GRANT/REVOKE privileges. Revoking UPDATE/DELETE here means even our
-- own server code, running as service_role, physically cannot mutate or delete a ledger
-- row. Corrections can only ever be new offsetting rows. This is the literal enforcement
-- of the hard rule: balances are derived, never a mutable counter.

revoke update, delete on points_ledger from anon, authenticated, service_role;
