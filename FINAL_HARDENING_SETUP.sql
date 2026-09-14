-- BIKUBOO final production hardening
-- Run once in Supabase SQL Editor after the existing setup scripts.
-- Safe to re-run.

begin;

create unique index if not exists ride_requests_ride_passenger_uidx
  on public.ride_requests(ride_id, passenger_id);

drop policy if exists "Passengers can create ride requests" on public.ride_requests;
create policy "Passengers can create ride requests"
on public.ride_requests
for insert to authenticated
with check (
  passenger_id = (select auth.uid())
  and status = 'pending'
  and exists (
    select 1 from public.rides r
    where r.id = ride_requests.ride_id
      and r.status = 'open'
      and coalesce(r.seats,0) > 0
      and r.driver_id <> (select auth.uid())
  )
  and not exists (
    select 1 from public.user_blocks ub
    where (ub.blocker_id = (select auth.uid()) and ub.blocked_user_id = (select rides.driver_id from public.rides where rides.id = ride_requests.ride_id))
       or (ub.blocker_id = (select rides.driver_id from public.rides where rides.id = ride_requests.ride_id) and ub.blocked_user_id = (select auth.uid()))
  )
);

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
  v_ride public.rides%rowtype;
  v_result public.ride_ratings;
begin
  if v_user is null then raise exception 'You must be logged in.'; end if;
  if p_rating < 1 or p_rating > 5 then raise exception 'Rating must be between 1 and 5.'; end if;
  select * into v_ride from public.rides where id=p_ride_id;
  if v_ride.id is null then raise exception 'Ride not found.'; end if;
  if v_ride.status <> 'completed' then raise exception 'Ratings are available after the ride is completed.'; end if;
  if p_ratee_id = v_user then raise exception 'You cannot rate yourself.'; end if;
  if v_user = v_ride.driver_id then
    if not exists (select 1 from public.ride_requests where ride_id=p_ride_id and passenger_id=p_ratee_id and status='accepted') then
      raise exception 'That passenger was not an accepted participant on this ride.';
    end if;
  else
    if not exists (select 1 from public.ride_requests where ride_id=p_ride_id and passenger_id=v_user and status='accepted') then
      raise exception 'Only accepted passengers can rate this ride.';
    end if;
    if p_ratee_id <> v_ride.driver_id then raise exception 'Passengers can rate only the driver.'; end if;
  end if;
  insert into public.ride_ratings(ride_id,rater_id,ratee_id,rating,review)
  values(p_ride_id,v_user,p_ratee_id,p_rating,nullif(left(coalesce(p_review,''),500),''))
  returning * into v_result;
  perform public.bikuboo_refresh_rating(p_ratee_id);
  return v_result;
exception when unique_violation then
  raise exception 'You have already rated this ride.';
end;
$$;

grant execute on function public.bikuboo_submit_rating(uuid,uuid,integer,text) to authenticated;

alter table public.ride_messages
  drop constraint if exists ride_messages_message_length_check;
alter table public.ride_messages
  add constraint ride_messages_message_length_check
  check (char_length(trim(message)) between 1 and 1000);

commit;
notify pgrst, 'reload schema';
