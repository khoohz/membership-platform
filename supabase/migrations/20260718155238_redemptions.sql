-- Ticket 3: redemption loop -- one-time vouchers, atomic claim.

-- The voucher. Its uuid id IS the QR token (rdm:<id>): opaque and unguessable, but
-- single-use is enforced by the status transition below, never by code secrecy --
-- a screenshot carries the same code and must fail on the second scan.
-- Expiry is lazy: status stays 'pending' but expires_at makes the row dead; the
-- member regenerates (a fresh row), so no expiry job is needed.
create table redemptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  member_id uuid not null references members (id) on delete cascade,
  reward_id uuid not null references rewards (id) on delete restrict,
  status text not null default 'pending' check (status in ('pending', 'claimed')),
  expires_at timestamptz not null,
  claimed_at timestamptz,
  claimed_outlet_id uuid references outlets (id),
  created_at timestamptz not null default now()
);

create index redemptions_tenant_id_idx on redemptions (tenant_id);
create index redemptions_tenant_member_idx on redemptions (tenant_id, member_id);

-- Same posture as every table: RLS on, no policies (deny anon/authenticated),
-- explicit grants for service_role (local CLI grants nothing by default).
alter table redemptions enable row level security;
grant select, insert, update on redemptions to service_role;

-- Links the deduction ledger row to its voucher (history shows the redemption;
-- ticket 11's "top redeemed rewards" reads through this).
alter table points_ledger
  add column redemption_id uuid references redemptions (id);

-- Atomic claim. supabase-js cannot run multi-statement transactions, so the whole
-- claim -- validate, balance-check, deduct, mark used -- lives in one function call
-- = one transaction: it fully happens or fully doesn't.
--
-- Concurrency: the redemption row is locked FOR UPDATE, so two staff phones
-- scanning the same code serialize -- the loser sees status='claimed' and gets
-- 'already_claimed'. The member row is then locked too, serializing concurrent
-- claims of *different* vouchers by the same member, so one balance cannot be
-- spent twice. Balance is computed inside the transaction (claim-time, not
-- generation-time). Lock order (redemption -> member) is the same on every path,
-- so no deadlock is possible.
create function claim_redemption(
  p_redemption_id uuid,
  p_tenant_id uuid,
  p_outlet_id uuid
) returns jsonb
language plpgsql
as $$
declare
  v_redemption redemptions%rowtype;
  v_reward rewards%rowtype;
  v_balance integer;
begin
  select * into v_redemption
  from redemptions
  where id = p_redemption_id and tenant_id = p_tenant_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;
  if v_redemption.status = 'claimed' then
    return jsonb_build_object('ok', false, 'error', 'already_claimed');
  end if;
  if v_redemption.expires_at <= now() then
    return jsonb_build_object('ok', false, 'error', 'expired');
  end if;

  perform 1 from members where id = v_redemption.member_id for update;

  select * into v_reward from rewards where id = v_redemption.reward_id;

  select coalesce(sum(delta), 0) into v_balance
  from points_ledger
  where tenant_id = p_tenant_id and member_id = v_redemption.member_id;

  if v_balance < v_reward.points_cost then
    return jsonb_build_object('ok', false, 'error', 'insufficient_points');
  end if;

  insert into points_ledger
    (tenant_id, member_id, outlet_id, delta, reason, source, redemption_id)
  values
    (p_tenant_id, v_redemption.member_id, p_outlet_id,
     -v_reward.points_cost, 'redeem', 'redemption', p_redemption_id);

  update redemptions
  set status = 'claimed', claimed_at = now(), claimed_outlet_id = p_outlet_id
  where id = p_redemption_id;

  return jsonb_build_object(
    'ok', true,
    'reward_name', v_reward.name,
    'points_cost', v_reward.points_cost,
    'new_balance', v_balance - v_reward.points_cost
  );
end;
$$;

revoke execute on function claim_redemption(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function claim_redemption(uuid, uuid, uuid) to service_role;
