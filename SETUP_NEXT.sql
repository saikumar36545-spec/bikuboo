-- Run this once in Supabase SQL Editor before testing Offer a Ride.
-- These fields support the safety preferences shown in the BIKUBOO form.

alter table public.rides
  add column if not exists women_only boolean not null default false,
  add column if not exists women_preferred boolean not null default false,
  add column if not exists verified_only boolean not null default true;

-- My Rides / cancellation support
alter table public.rides drop constraint if exists rides_status_check;
alter table public.rides add constraint rides_status_check check (status in ('open','full','started','completed','cancelled'));

grant select, update on public.rides to authenticated;
grant select, update on public.ride_requests to authenticated;

-- Drivers can view all of their own rides, including cancelled rides.
drop policy if exists "Drivers can view their own rides" on public.rides;
create policy "Drivers can view their own rides"
on public.rides for select to authenticated
using ((select auth.uid()) = driver_id);

-- Passengers can view rides they have requested, including cancelled rides.
drop policy if exists "Passengers can view requested rides" on public.rides;
create policy "Passengers can view requested rides"
on public.rides for select to authenticated
using (
  exists (
    select 1 from public.ride_requests rr
    where rr.ride_id = rides.id
      and rr.passenger_id = (select auth.uid())
  )
);

-- Passengers can cancel/update only their own requests.
drop policy if exists "Passengers can update their own requests" on public.ride_requests;
create policy "Passengers can update their own requests"
on public.ride_requests for update to authenticated
using ((select auth.uid()) = passenger_id)
with check ((select auth.uid()) = passenger_id);


-- Securely cancel a passenger request and restore one seat when an accepted request is cancelled.
create or replace function public.cancel_my_ride_request(request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  req public.ride_requests%rowtype;
begin
  select * into req
  from public.ride_requests
  where id = request_id and passenger_id = auth.uid()
  for update;

  if not found then
    raise exception 'Ride request not found or not owned by you';
  end if;

  if req.status in ('cancelled','rejected') then
    return;
  end if;

  if req.status = 'accepted' then
    update public.rides
      set seats = coalesce(seats,0) + 1
    where id = req.ride_id and status <> 'cancelled';
  end if;

  update public.ride_requests
    set status = 'cancelled'
  where id = req.id;
end;
$$;

grant execute on function public.cancel_my_ride_request(uuid) to authenticated;
