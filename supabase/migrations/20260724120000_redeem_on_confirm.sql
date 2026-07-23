-- Ticket 5 (redemption UX revision, 24 Jul 2026): DEDUCT ON CONFIRM.
--
-- Product decision (supersedes MVP-SPEC §3's "cashier scans -> deduct" and the 60s
-- window; rationale recorded in WAYFINDER-MAP): the member commits points the moment
-- they confirm a redemption, not at the counter. The confirm dialog IS the commitment;
-- deducting up front prevents mis-operation by member or staff and closes gaming.
-- Consequences baked in here:
--   * points leave at confirm; an unclaimed voucher is NOT refunded.
--   * validity is passed from the app (p_validity_seconds; now 3 minutes).
--   * one live voucher per member at a time -- a pending, non-expired voucher blocks a
--     second, so deductions can't stack and two codes can't co-exist.
--   * claim no longer deducts -- it only validates and marks the voucher used.
--
-- SECURITY NOTE: until ticket 8's signed member sessions exist, anyone who knows a
-- phone can open that portal and now *spend* its points remotely (previously an
-- in-person staff scan was required to move points). Acceptable for DEMO tenants only;
-- ticket 8 -- a hard prerequisite before any real tenant onboards -- closes it.

-- A member-initiated redemption has no outlet: the member confirms from their phone,
-- not at a counter. The fulfilment outlet is still captured on redemptions.claimed_
-- outlet_id at claim, so the confirm-time deduction row carries a null outlet_id.
alter table points_ledger alter column outlet_id drop not null;

-- Atomic deduct-on-confirm: one function call = one transaction. Lock the member,
-- enforce one-live-voucher, balance-check against the append-only ledger, insert the
-- voucher, and append the deduction -- all or nothing. The per-member FOR UPDATE lock
-- serialises two rapid confirms so the one-live-voucher rule can't be raced.
create function create_redemption(
  p_tenant_id uuid,
  p_member_id uuid,
  p_reward_id uuid,
  p_validity_seconds integer
) returns jsonb
language plpgsql
as $$
declare
  v_reward rewards%rowtype;
  v_balance integer;
  v_active integer;
  v_id uuid;
begin
  perform 1 from members
  where id = p_member_id and tenant_id = p_tenant_id
  for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'unknown_member');
  end if;

  select * into v_reward from rewards
  where id = p_reward_id and tenant_id = p_tenant_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'unknown_reward');
  end if;

  -- One live voucher at a time (expired-but-pending rows don't count).
  select count(*) into v_active from redemptions
  where tenant_id = p_tenant_id and member_id = p_member_id
    and status = 'pending' and expires_at > now();
  if v_active > 0 then
    return jsonb_build_object('ok', false, 'error', 'active_voucher_exists');
  end if;

  select coalesce(sum(delta), 0) into v_balance from points_ledger
  where tenant_id = p_tenant_id and member_id = p_member_id;
  if v_balance < v_reward.points_cost then
    return jsonb_build_object('ok', false, 'error', 'insufficient_points');
  end if;

  insert into redemptions (tenant_id, member_id, reward_id, expires_at)
  values (p_tenant_id, p_member_id, p_reward_id,
          now() + make_interval(secs => p_validity_seconds))
  returning id into v_id;

  -- Deduct now, linked to the voucher (history reads through redemption_id).
  insert into points_ledger
    (tenant_id, member_id, outlet_id, delta, reason, source, redemption_id)
  values
    (p_tenant_id, p_member_id, null, -v_reward.points_cost, 'redeem', 'redemption', v_id);

  return jsonb_build_object('ok', true, 'id', v_id);
end;
$$;

revoke execute on function create_redemption(uuid, uuid, uuid, integer)
  from public, anon, authenticated;
grant execute on function create_redemption(uuid, uuid, uuid, integer) to service_role;

-- Claim no longer deducts (the deduction happened at confirm). It validates the
-- voucher and marks it used: a screenshot scanned twice still fails on the status
-- transition, and an expired code still fails. new_balance is the member's current
-- derived balance (already net of the confirm-time deduction). REPLACE keeps grants.
create or replace function claim_redemption(
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
  select * into v_redemption from redemptions
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

  select * into v_reward from rewards where id = v_redemption.reward_id;

  update redemptions
  set status = 'claimed', claimed_at = now(), claimed_outlet_id = p_outlet_id
  where id = p_redemption_id;

  select coalesce(sum(delta), 0) into v_balance from points_ledger
  where tenant_id = p_tenant_id and member_id = v_redemption.member_id;

  return jsonb_build_object(
    'ok', true,
    'reward_name', v_reward.name,
    'points_cost', v_reward.points_cost,
    'new_balance', v_balance
  );
end;
$$;
