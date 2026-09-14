-- BIKUBOO Admin Dashboard setup
-- IMPORTANT: add your own admin account explicitly before using the dashboard.
-- 1) Find your Supabase Auth user id:
--    select id,email from auth.users order by created_at;
-- 2) Replace YOUR_USER_UUID below with that id and run it.
--    insert into public.bikuboo_admins(user_id) values ('YOUR_USER_UUID') on conflict do nothing;

create table if not exists public.bikuboo_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.bikuboo_admins enable row level security;

-- No direct client policies: admin membership is checked only inside security-definer functions.
revoke all on public.bikuboo_admins from anon, authenticated;

drop function if exists public.bikuboo_is_admin();
create or replace function public.bikuboo_is_admin()
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.bikuboo_admins where user_id = auth.uid());
$$;
grant execute on function public.bikuboo_is_admin() to authenticated;

alter table public.profiles add column if not exists suspended boolean not null default false;
alter table public.safety_reports add column if not exists status text not null default 'open';
alter table public.safety_reports add column if not exists admin_note text;
alter table public.safety_reports add column if not exists resolved_at timestamptz;

-- Verification requests are represented by profiles.verification_status = pending.
create index if not exists profiles_verification_status_idx on public.profiles(verification_status);
create index if not exists profiles_suspended_idx on public.profiles(suspended);
create index if not exists safety_reports_status_idx on public.safety_reports(status, created_at desc);

create or replace function public.bikuboo_admin_dashboard()
returns jsonb language plpgsql security definer set search_path=public as $$
declare out jsonb;
begin
  if not public.bikuboo_is_admin() then raise exception 'Admin access required.'; end if;
  select jsonb_build_object(
    'users',(select count(*) from public.profiles),
    'rides',(select count(*) from public.rides),
    'active_rides',(select count(*) from public.rides where status in ('open','started')),
    'completed_rides',(select count(*) from public.rides where status='completed'),
    'pending_verification',(select count(*) from public.profiles where verification_status='pending'),
    'open_reports',(select count(*) from public.safety_reports where status='open'),
    'ratings',(select count(*) from public.ride_ratings)
  ) into out;
  return out;
end;
$$;
grant execute on function public.bikuboo_admin_dashboard() to authenticated;

create or replace function public.bikuboo_admin_users(p_search text default null)
returns table(id uuid, full_name text, role text, phone text, bike_model text, bike_number text, verification_status text, verified_at timestamptz, rating_avg numeric, rating_count integer, suspended boolean, created_at timestamptz)
language plpgsql security definer set search_path=public as $$
begin
  if not public.bikuboo_is_admin() then raise exception 'Admin access required.'; end if;
  return query
  select p.id,p.full_name,p.role,p.phone,p.bike_model,p.bike_number,p.verification_status,p.verified_at,p.rating_avg,p.rating_count,p.suspended,p.created_at
  from public.profiles p
  where nullif(btrim(coalesce(p_search,'')),'') is null
     or p.full_name ilike '%'||btrim(p_search)||'%'
     or p.phone ilike '%'||btrim(p_search)||'%'
     or p.bike_number ilike '%'||btrim(p_search)||'%'
  order by p.created_at desc limit 200;
end;
$$;
grant execute on function public.bikuboo_admin_users(text) to authenticated;

create or replace function public.bikuboo_admin_verifications()
returns table(id uuid, full_name text, phone text, bike_model text, bike_number text, bio text, verification_status text, verified_at timestamptz, created_at timestamptz)
language plpgsql security definer set search_path=public as $$
begin
  if not public.bikuboo_is_admin() then raise exception 'Admin access required.'; end if;
  return query select p.id,p.full_name,p.phone,p.bike_model,p.bike_number,p.bio,p.verification_status,p.verified_at,p.created_at
  from public.profiles p where p.verification_status='pending' order by p.created_at asc;
end;
$$;
grant execute on function public.bikuboo_admin_verifications() to authenticated;

create or replace function public.bikuboo_admin_set_verification(p_user uuid,p_approved boolean)
returns boolean language plpgsql security definer set search_path=public as $$
begin
  if not public.bikuboo_is_admin() then raise exception 'Admin access required.'; end if;
  update public.profiles set verification_status=case when p_approved then 'verified' else 'unverified' end, verified_at=case when p_approved then now() else null end where id=p_user;
  return found;
end;
$$;
grant execute on function public.bikuboo_admin_set_verification(uuid,boolean) to authenticated;

create or replace function public.bikuboo_admin_set_suspended(p_user uuid,p_suspended boolean)
returns boolean language plpgsql security definer set search_path=public as $$
begin
  if not public.bikuboo_is_admin() then raise exception 'Admin access required.'; end if;
  if p_user=auth.uid() then raise exception 'You cannot suspend your own admin account.'; end if;
  update public.profiles set suspended=p_suspended where id=p_user;
  return found;
end;
$$;
grant execute on function public.bikuboo_admin_set_suspended(uuid,boolean) to authenticated;

create or replace function public.bikuboo_admin_reports()
returns table(id uuid, reporter_id uuid, reporter_name text, reported_user_id uuid, reported_name text, ride_id uuid, reason text, details text, status text, admin_note text, created_at timestamptz, resolved_at timestamptz)
language plpgsql security definer set search_path=public as $$
begin
  if not public.bikuboo_is_admin() then raise exception 'Admin access required.'; end if;
  return query
  select r.id,r.reporter_id,coalesce(rep.full_name,'BIKUBOO rider'),r.reported_user_id,coalesce(usr.full_name,'Deleted user'),r.ride_id,r.reason,r.details,r.status,r.admin_note,r.created_at,r.resolved_at
  from public.safety_reports r
  left join public.profiles rep on rep.id=r.reporter_id
  left join public.profiles usr on usr.id=r.reported_user_id
  order by (r.status='open') desc,r.created_at desc limit 200;
end;
$$;
grant execute on function public.bikuboo_admin_reports() to authenticated;

create or replace function public.bikuboo_admin_resolve_report(p_report uuid,p_status text,p_note text default null)
returns boolean language plpgsql security definer set search_path=public as $$
begin
  if not public.bikuboo_is_admin() then raise exception 'Admin access required.'; end if;
  if p_status not in ('open','resolved','dismissed') then raise exception 'Invalid report status.'; end if;
  update public.safety_reports set status=p_status,admin_note=left(coalesce(p_note,''),1000),resolved_at=case when p_status='open' then null else now() end where id=p_report;
  return found;
end;
$$;
grant execute on function public.bikuboo_admin_resolve_report(uuid,text,text) to authenticated;

create or replace function public.bikuboo_admin_rides()
returns table(id uuid, driver_id uuid, driver_name text, from_location text, to_location text, ride_date date, ride_time time, seats integer, price numeric, contribution numeric, status text, created_at timestamptz)
language plpgsql security definer set search_path=public as $$
begin
  if not public.bikuboo_is_admin() then raise exception 'Admin access required.'; end if;
  return query
  select r.id,r.driver_id,coalesce(p.full_name,'BIKUBOO rider'),r.from_location,r.to_location,r.ride_date,r.ride_time,r.seats,r.price,r.contribution,r.status,r.created_at
  from public.rides r left join public.profiles p on p.id=r.driver_id order by r.created_at desc limit 300;
end;
$$;
grant execute on function public.bikuboo_admin_rides() to authenticated;

-- Prevent suspended users from publishing/requesting by making the app's own write paths easy to harden.
-- Existing MVP policies/functions should remain unchanged; use these helpers from future write functions as needed.
