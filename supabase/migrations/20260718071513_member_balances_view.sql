-- Ticket 1: derived balance view.
--
-- security_invoker = true (PG15+) makes this view enforce RLS for whoever queries it,
-- rather than defaulting to the view owner's permissions. A member with no ledger rows
-- yet won't appear here at all -- application code treats "no row" as balance 0.

create view member_balances
with (security_invoker = true) as
select
  tenant_id,
  member_id,
  coalesce(sum(delta), 0)::integer as balance
from points_ledger
group by tenant_id, member_id;

-- Same default-ACL gap as tables: views need an explicit grant for service_role too.
grant select on member_balances to service_role;
