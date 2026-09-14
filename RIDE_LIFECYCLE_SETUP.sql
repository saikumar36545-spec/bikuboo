-- BIKUBOO Ride Lifecycle & Booking Management
-- Safe to run after the existing BIKUBOO setup scripts.

alter table public.rides drop constraint if exists rides_status_check;
alter table public.rides add constraint rides_status_check
  check (status in ('open','full','started','completed','cancelled'));

create index if not exists rides_driver_status_idx on public.rides(driver_id,status,ride_date,ride_time);
create index if not exists ride_requests_ride_status_idx on public.ride_requests(ride_id,status);

-- Centralized status transition for driver-controlled ride lifecycle.
create or replace function public.bikuboo_set_ride_status(p_ride_id uuid, p_status text)
returns public.rides
language plpgsql security definer set search_path=public
as $$
declare
  v_user uuid := auth.uid();
  v_ride public.rides;
  v_has_accepted boolean;
  v_unpaid boolean;
begin
  if v_user is null then raise exception 'You must be logged in.'; end if;
  select * into v_ride from public.rides where id=p_ride_id and driver_id=v_user for update;
  if v_ride.id is null then raise exception 'Ride not found or you are not the driver.'; end if;
  if p_status not in ('started','completed','cancelled','open') then raise exception 'Invalid ride status.'; end if;
  if v_ride.status='completed' then raise exception 'Completed rides cannot be changed.'; end if;
  if v_ride.status='cancelled' then raise exception 'Cancelled rides cannot be changed.'; end if;

  select exists(select 1 from public.ride_requests where ride_id=p_ride_id and status='accepted') into v_has_accepted;
  if p_status='started' then
    if not v_has_accepted then raise exception 'Accept at least one passenger before starting the ride.'; end if;
    if coalesce(v_ride.ride_date + v_ride.ride_time, now()) > now() + interval '24 hours' then
      raise exception 'This ride is scheduled too far in the future to start now.';
    end if;
    -- Paid rides must have a settled payment for every accepted passenger.
    if to_regclass('public.payment_transactions') is not null then
      select exists(
        select 1 from public.ride_requests rr
        join public.rides r on r.id=rr.ride_id
        where rr.ride_id=p_ride_id and rr.status='accepted'
          and coalesce(r.price,r.contribution,0)>0
          and not exists (
            select 1 from public.payment_transactions pt
            where pt.request_id=rr.id
              and ((pt.status='paid') or (pt.payment_method='cash' and pt.status='paid'))
          )
      ) into v_unpaid;
      if v_unpaid then raise exception 'Every accepted passenger must complete UPI payment or have cash confirmed before the ride starts.'; end if;
    end if;
  elsif p_status='completed' then
    if v_ride.status <> 'started' then raise exception 'Start the ride before marking it completed.'; end if;
  elsif p_status='cancelled' then
    if v_ride.status='started' then raise exception 'A started ride cannot be cancelled here.'; end if;
  end if;

  update public.rides set status=p_status where id=p_ride_id returning * into v_ride;
  if p_status='cancelled' then
    update public.ride_requests set status='cancelled' where ride_id=p_ride_id and status in ('pending','accepted');
  end if;
  return v_ride;
end;
$$;
grant execute on function public.bikuboo_set_ride_status(uuid,text) to authenticated;

-- Replace completion so only the driver completes the actual ride lifecycle.
create or replace function public.bikuboo_mark_ride_completed(p_request_id uuid)
returns boolean language plpgsql security definer set search_path=public
as $$
declare v_user uuid:=auth.uid(); v_s public.ride_safety; v_ride public.rides;
begin
  select * into v_s from public.ride_safety where request_id=p_request_id;
  if v_s.id is null then raise exception 'Ride verification record not found.'; end if;
  select * into v_ride from public.rides where id=v_s.ride_id;
  if v_ride.driver_id<>v_user then raise exception 'Only the driver can complete the ride.'; end if;
  if v_ride.status<>'started' then raise exception 'The ride must be started before completion.'; end if;
  update public.ride_safety set completed_at=coalesce(completed_at,now()) where id=v_s.id;
  update public.rides set status='completed' where id=v_s.ride_id;
  update public.notifications set is_read=true where ride_id=v_s.ride_id and user_id=v_user;
  return true;
end;
$$;
grant execute on function public.bikuboo_mark_ride_completed(uuid) to authenticated;

-- Make OTP verification move the ride into the Started state atomically.
create or replace function public.bikuboo_verify_ride_otp(p_request_id uuid,p_otp text)
returns table(ride_id uuid, request_id uuid, status text, started_at timestamptz)
language plpgsql security definer set search_path=public
as $$
declare
  v_user uuid := auth.uid(); v_s public.ride_safety; v_ride public.rides; v_started timestamptz;
  v_amount numeric; v_paid boolean;
begin
  if v_user is null then raise exception 'You must be logged in.'; end if;
  select * into v_s from public.ride_safety where request_id=p_request_id for update;
  if v_s.id is null then raise exception 'Ride-start verification has not been started by the driver.'; end if;
  select * into v_ride from public.rides where id=v_s.ride_id for update;
  if v_user <> v_s.passenger_id then raise exception 'Only the accepted passenger can verify this OTP.'; end if;
  if v_s.started_at is not null then return query select v_s.ride_id,v_s.request_id,'started'::text,v_s.started_at; return; end if;
  if v_ride.status in ('completed','cancelled') then raise exception 'This ride is no longer active.'; end if;
  if v_s.otp_created_at < now() - interval '30 minutes' then raise exception 'This OTP has expired. Ask the driver to generate a new one.'; end if;
  if p_otp is null or btrim(p_otp) <> v_s.otp_code then raise exception 'Incorrect ride-start OTP.'; end if;
  v_amount := coalesce(v_ride.price,v_ride.contribution,0);
  if v_amount>0 and to_regclass('public.payment_transactions') is not null then
    select exists(select 1 from public.payment_transactions pt where pt.request_id=p_request_id and pt.status='paid') into v_paid;
    if not v_paid then raise exception 'Payment must be completed or cash confirmed before starting the ride.'; end if;
  end if;
  update public.ride_safety set started_at=now() where id=v_s.id returning started_at into v_started;
  update public.rides set status='started' where id=v_ride.id and status<>'started';
  return query select v_s.ride_id,v_s.request_id,'started'::text,v_started;
end;
$$;
grant execute on function public.bikuboo_verify_ride_otp(uuid,text) to authenticated;
