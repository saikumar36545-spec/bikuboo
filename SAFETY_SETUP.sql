-- BIKUBOO: Safety Center, ride-start OTP, SOS, reports & blocks
-- Run once in Supabase SQL Editor.

create table if not exists public.emergency_contacts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  contact_name text not null,
  contact_phone text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.ride_safety (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references public.rides(id) on delete cascade,
  request_id uuid not null references public.ride_requests(id) on delete cascade,
  driver_id uuid not null references auth.users(id) on delete cascade,
  passenger_id uuid not null references auth.users(id) on delete cascade,
  otp_code text,
  otp_created_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  last_sos_at timestamptz,
  created_at timestamptz not null default now(),
  unique(request_id)
);

create index if not exists ride_safety_driver_idx on public.ride_safety(driver_id, created_at desc);
create index if not exists ride_safety_passenger_idx on public.ride_safety(passenger_id, created_at desc);

create table if not exists public.safety_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reported_user_id uuid references auth.users(id) on delete set null,
  ride_id uuid references public.rides(id) on delete set null,
  reason text not null,
  details text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(blocker_id, blocked_user_id),
  check(blocker_id <> blocked_user_id)
);

alter table public.ride_safety enable row level security;
alter table public.safety_reports enable row level security;
alter table public.user_blocks enable row level security;

-- Users can only see their own safety records.
drop policy if exists "Participants can view own ride safety" on public.ride_safety;
create policy "Participants can view own ride safety" on public.ride_safety
for select to authenticated
using ((select auth.uid()) in (driver_id, passenger_id));

drop policy if exists "Users can view own safety reports" on public.safety_reports;
create policy "Users can view own safety reports" on public.safety_reports
for select to authenticated using ((select auth.uid()) = reporter_id);

drop policy if exists "Users can view own blocks" on public.user_blocks;
create policy "Users can view own blocks" on public.user_blocks
for select to authenticated using ((select auth.uid()) = blocker_id);

alter table public.emergency_contacts enable row level security;
drop policy if exists "Users can view own emergency contact" on public.emergency_contacts;
create policy "Users can view own emergency contact" on public.emergency_contacts for select to authenticated using ((select auth.uid())=user_id);
drop policy if exists "Users can insert own emergency contact" on public.emergency_contacts;
create policy "Users can insert own emergency contact" on public.emergency_contacts for insert to authenticated with check ((select auth.uid())=user_id);
drop policy if exists "Users can update own emergency contact" on public.emergency_contacts;
create policy "Users can update own emergency contact" on public.emergency_contacts for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
drop policy if exists "Users can delete own emergency contact" on public.emergency_contacts;
create policy "Users can delete own emergency contact" on public.emergency_contacts for delete to authenticated using ((select auth.uid())=user_id);

grant select on public.ride_safety, public.safety_reports, public.user_blocks, public.emergency_contacts to authenticated;
grant insert, update, delete on public.emergency_contacts to authenticated;
grant select, update on public.profiles to authenticated;

create or replace function public.bikuboo_start_ride(p_request_id uuid)
returns table(ride_id uuid, request_id uuid, otp_code text, status text)
language plpgsql security definer set search_path=public
as $$
declare
  v_user uuid := auth.uid();
  v_request public.ride_requests;
  v_driver uuid;
  v_code text;
begin
  if v_user is null then raise exception 'You must be logged in.'; end if;
  select * into v_request from public.ride_requests where id=p_request_id and status='accepted';
  if v_request.id is null then raise exception 'Accepted ride request not found.'; end if;
  select driver_id into v_driver from public.rides where id=v_request.ride_id;
  if v_driver is null then raise exception 'Ride not found.'; end if;
  if v_user <> v_driver then raise exception 'Only the driver can generate the ride-start OTP.'; end if;
  v_code := lpad(floor(random()*10000)::int::text,4,'0');
  insert into public.ride_safety(ride_id,request_id,driver_id,passenger_id,otp_code,otp_created_at)
  values(v_request.ride_id,v_request.id,v_driver,v_request.passenger_id,v_code,now())
  on conflict(request_id) do update set otp_code=excluded.otp_code, otp_created_at=excluded.otp_created_at, started_at=null;
  return query select v_request.ride_id,v_request.id,v_code,'waiting_for_passenger'::text;
end;
$$;
grant execute on function public.bikuboo_start_ride(uuid) to authenticated;

create or replace function public.bikuboo_verify_ride_otp(p_request_id uuid,p_otp text)
returns table(ride_id uuid, request_id uuid, status text, started_at timestamptz)
language plpgsql security definer set search_path=public
as $$
declare
  v_user uuid := auth.uid();
  v_s public.ride_safety;
begin
  if v_user is null then raise exception 'You must be logged in.'; end if;
  select * into v_s from public.ride_safety where request_id=p_request_id;
  if v_s.id is null then raise exception 'Ride-start verification has not been started by the driver.'; end if;
  if v_user <> v_s.passenger_id then raise exception 'Only the accepted passenger can verify this OTP.'; end if;
  if v_s.started_at is not null then
    return query select v_s.ride_id,v_s.request_id,'started'::text,v_s.started_at; return;
  end if;
  if v_s.otp_created_at < now() - interval '30 minutes' then raise exception 'This OTP has expired. Ask the driver to generate a new one.'; end if;
  if p_otp is null or btrim(p_otp) <> v_s.otp_code then raise exception 'Incorrect ride-start OTP.'; end if;
  update public.ride_safety set started_at=now() where id=v_s.id returning * into v_s;
  return query select v_s.ride_id,v_s.request_id,'started'::text,v_s.started_at;
end;
$$;
grant execute on function public.bikuboo_verify_ride_otp(uuid,text) to authenticated;

create or replace function public.bikuboo_mark_ride_completed(p_request_id uuid)
returns boolean language plpgsql security definer set search_path=public
as $$
declare v_user uuid:=auth.uid(); v_s public.ride_safety;
begin
  select * into v_s from public.ride_safety where request_id=p_request_id;
  if v_s.id is null then raise exception 'Safety record not found.'; end if;
  if v_user not in (v_s.driver_id,v_s.passenger_id) then raise exception 'Not a ride participant.'; end if;
  update public.ride_safety set completed_at=coalesce(completed_at,now()) where id=v_s.id;
  return true;
end;
$$;
grant execute on function public.bikuboo_mark_ride_completed(uuid) to authenticated;

create or replace function public.bikuboo_sos(p_request_id uuid,p_message text default 'Emergency assistance requested')
returns public.ride_safety language plpgsql security definer set search_path=public
as $$
declare v_user uuid:=auth.uid(); v_s public.ride_safety; v_other uuid;
begin
  select * into v_s from public.ride_safety where request_id=p_request_id;
  if v_s.id is null then raise exception 'Safety record not found. Start ride verification first.'; end if;
  if v_user not in (v_s.driver_id,v_s.passenger_id) then raise exception 'Not a ride participant.'; end if;
  update public.ride_safety set last_sos_at=now() where id=v_s.id returning * into v_s;
  v_other := case when v_user=v_s.driver_id then v_s.passenger_id else v_s.driver_id end;
  insert into public.notifications(user_id,type,title,message,ride_id,request_id)
  values(v_other,'safety_sos','🚨 SOS alert',left(coalesce(p_message,'Emergency assistance requested'),500),v_s.ride_id,v_s.request_id);
  return v_s;
end;
$$;
grant execute on function public.bikuboo_sos(uuid,text) to authenticated;

create or replace function public.bikuboo_submit_safety_report(p_reported_user uuid,p_ride_id uuid,p_reason text,p_details text default null)
returns public.safety_reports language plpgsql security definer set search_path=public
as $$
declare v_user uuid:=auth.uid(); v_result public.safety_reports;
begin
  if v_user is null then raise exception 'You must be logged in.'; end if;
  if p_reported_user = v_user then raise exception 'You cannot report yourself.'; end if;
  insert into public.safety_reports(reporter_id,reported_user_id,ride_id,reason,details)
  values(v_user,p_reported_user,p_ride_id,left(coalesce(p_reason,'Other'),120),left(coalesce(p_details,''),1000)) returning * into v_result;
  return v_result;
end;
$$;
grant execute on function public.bikuboo_submit_safety_report(uuid,uuid,text,text) to authenticated;

create or replace function public.bikuboo_block_user(p_blocked_user uuid)
returns public.user_blocks language plpgsql security definer set search_path=public
as $$
declare v_user uuid:=auth.uid(); v_result public.user_blocks;
begin
  if v_user is null then raise exception 'You must be logged in.'; end if;
  if p_blocked_user = v_user then raise exception 'You cannot block yourself.'; end if;
  insert into public.user_blocks(blocker_id,blocked_user_id) values(v_user,p_blocked_user)
  on conflict(blocker_id,blocked_user_id) do nothing returning * into v_result;
  if v_result.id is null then select * into v_result from public.user_blocks where blocker_id=v_user and blocked_user_id=p_blocked_user; end if;
  return v_result;
end;
$$;
grant execute on function public.bikuboo_block_user(uuid) to authenticated;
