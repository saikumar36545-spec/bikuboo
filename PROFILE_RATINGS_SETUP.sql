-- BIKUBOO: Profiles, verification, avatars, ratings & reviews
-- Run this once in Supabase SQL Editor. Safe to re-run.

alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists bike_model text;
alter table public.profiles add column if not exists bike_number text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists verification_status text not null default 'unverified';
alter table public.profiles add column if not exists verified_at timestamptz;
alter table public.profiles add column if not exists rating_avg numeric(3,2) not null default 0;
alter table public.profiles add column if not exists rating_count integer not null default 0;

create table if not exists public.ride_ratings (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references public.rides(id) on delete cascade,
  rater_id uuid not null references auth.users(id) on delete cascade,
  ratee_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  review text,
  created_at timestamptz not null default now(),
  unique (ride_id, rater_id)
);

alter table public.ride_ratings enable row level security;

drop policy if exists "Authenticated users can view ratings" on public.ride_ratings;
create policy "Authenticated users can view ratings"
on public.ride_ratings for select to authenticated using (true);

create index if not exists ride_ratings_ratee_idx on public.ride_ratings(ratee_id, created_at desc);
create index if not exists ride_ratings_ride_idx on public.ride_ratings(ride_id);

-- Keep aggregate rating fields on profiles in sync.
create or replace function public.bikuboo_refresh_rating(p_ratee uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.profiles p
  set rating_avg = coalesce((select round(avg(rating)::numeric,2) from public.ride_ratings where ratee_id=p_ratee),0),
      rating_count = coalesce((select count(*) from public.ride_ratings where ratee_id=p_ratee),0)
  where p.id=p_ratee;
end;
$$;

create or replace function public.bikuboo_submit_rating(
  p_ride_id uuid,
  p_ratee_id uuid,
  p_rating integer,
  p_review text default null
)
returns public.ride_ratings
language plpgsql security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_driver uuid;
  v_passenger uuid;
  v_result public.ride_ratings;
begin
  if v_user is null then raise exception 'You must be logged in.'; end if;
  if p_rating < 1 or p_rating > 5 then raise exception 'Rating must be between 1 and 5.'; end if;

  select driver_id into v_driver from public.rides where id=p_ride_id;
  if v_driver is null then raise exception 'Ride not found.'; end if;

  select passenger_id into v_passenger
  from public.ride_requests
  where ride_id=p_ride_id and status='accepted' and (passenger_id=v_user or passenger_id=p_ratee_id)
  order by created_at desc limit 1;

  if v_user = v_driver and v_passenger is null then
    raise exception 'You can only rate an accepted passenger on this ride.';
  end if;
  if v_user <> v_driver then
    if not exists (select 1 from public.ride_requests where ride_id=p_ride_id and passenger_id=v_user and status='accepted') then
      raise exception 'Only accepted ride participants can rate this ride.';
    end if;
  end if;
  if p_ratee_id = v_user then raise exception 'You cannot rate yourself.'; end if;

  if v_user = v_driver then
    if not exists (select 1 from public.ride_requests where ride_id=p_ride_id and passenger_id=p_ratee_id and status='accepted') then
      raise exception 'That passenger was not accepted for this ride.';
    end if;
  else
    if p_ratee_id <> v_driver then raise exception 'Passengers can rate only the driver.'; end if;
  end if;

  insert into public.ride_ratings(ride_id,rater_id,ratee_id,rating,review)
  values(p_ride_id,v_user,p_ratee_id,p_rating,nullif(left(coalesce(p_review,''),500),''))
  returning * into v_result;

  perform public.bikuboo_refresh_rating(p_ratee_id);
  return v_result;
exception
  when unique_violation then raise exception 'You have already rated this ride.';
end;
$$;

grant execute on function public.bikuboo_submit_rating(uuid,uuid,integer,text) to authenticated;

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "Authenticated users can view profiles" on public.profiles;
create policy "Authenticated users can view profiles"
on public.profiles for select to authenticated using (true);

grant select, update on public.profiles to authenticated;
grant select on public.ride_ratings to authenticated;

-- Verification request function: users can request verification, but cannot self-mark as verified.
create or replace function public.bikuboo_request_verification()
returns public.profiles language plpgsql security definer set search_path=public as $$
declare v_profile public.profiles;
begin
  if auth.uid() is null then raise exception 'You must be logged in.'; end if;
  update public.profiles set verification_status='pending' where id=auth.uid() returning * into v_profile;
  return v_profile;
end;
$$;
grant execute on function public.bikuboo_request_verification() to authenticated;

-- Avatar storage. Public read is intentional for profile photos; writes are limited to each user's folder.
insert into storage.buckets (id, name, public)
values ('avatars','avatars',true)
on conflict (id) do update set public=true;

drop policy if exists "Avatar images are publicly readable" on storage.objects;
create policy "Avatar images are publicly readable" on storage.objects for select using (bucket_id='avatars');

drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar" on storage.objects for insert to authenticated
with check (bucket_id='avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar" on storage.objects for update to authenticated
using (bucket_id='avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id='avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Users can delete their own avatar" on storage.objects;
create policy "Users can delete their own avatar" on storage.objects for delete to authenticated
using (bucket_id='avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
