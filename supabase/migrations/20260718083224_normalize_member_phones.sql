-- Ticket 2: backfill member phones to E.164 (+60...).
-- Application code now normalizes at every entry point (lib/phone.ts); this brings
-- ticket-1 rows (stored as typed) onto the same canonical form.
-- Runs as postgres, which retains UPDATE on members (only service_role/anon/
-- authenticated are restricted by RLS/grants).
--
-- Normalization mirrors lib/phone.ts: strip non-digits, then
--   01xxxxxxxx(x)  -> +601xxxxxxxx(x)   (local mobile format)
--   601xxxxxxxx(x) -> +601xxxxxxxx(x)   (country code without +)
-- Anything else is left untouched (unknown formats are not guessed at).
-- A row is also left untouched if its normalized value would collide with an
-- existing (tenant_id, phone) row -- demo-scale data, logged and skipped.

do $$
declare
  r record;
  digits text;
  normalized text;
begin
  for r in select id, tenant_id, phone from members loop
    digits := regexp_replace(r.phone, '\D', '', 'g');
    if digits ~ '^01[0-9]{8,9}$' then
      normalized := '+6' || digits;
    elsif digits ~ '^601[0-9]{8,9}$' then
      normalized := '+' || digits;
    else
      continue;
    end if;

    if normalized = r.phone then
      continue;
    end if;

    if exists (
      select 1 from members m
      where m.tenant_id = r.tenant_id and m.phone = normalized and m.id <> r.id
    ) then
      raise notice 'skipping member %: normalized phone % collides', r.id, normalized;
      continue;
    end if;

    update members set phone = normalized where id = r.id;
  end loop;
end $$;
