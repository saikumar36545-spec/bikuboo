-- BIKUBOO: Driver Request Management + Seat Management
-- Run once in Supabase SQL Editor.
-- This keeps the current rides.seats column as AVAILABLE seats.

-- Allow the request lifecycle used by the app.
alter table public.ride_requests drop constraint if exists ride_requests_status_check;
alter table public.ride_requests
  add constraint ride_requests_status_check
  check (status in ('pending','accepted','rejected','cancelled'));

-- Ensure browser clients have the required table privileges.
grant select, insert, update on public.ride_requests to authenticated;
grant select, update on public.rides to authenticated;

alter table public.ride_requests enable row level security;
alter table public.rides enable row level security;

-- Passenger can see their own requests.
drop policy if exists "Passengers can view their own requests" on public.ride_requests;
create policy "Passengers can view their own requests"
on public.ride_requests for select to authenticated
using ((select auth.uid()) = passenger_id);

-- Driver can see requests belonging to rides they own.
drop policy if exists "Drivers can view requests for their rides" on public.ride_requests;
create policy "Drivers can view requests for their rides"
on public.ride_requests for select to authenticated
using (
  exists (
    select 1 from public.rides r
    where r.id = ride_requests.ride_id
      and r.driver_id = (select auth.uid())
  )
);

-- Driver can change only the status of requests for their rides.
drop policy if exists "Drivers can update requests for their rides" on public.ride_requests;
create policy "Drivers can update requests for their rides"
on public.ride_requests for update to authenticated
using (
  exists (
    select 1 from public.rides r
    where r.id = ride_requests.ride_id
      and r.driver_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.rides r
    where r.id = ride_requests.ride_id
      and r.driver_id = (select auth.uid())
  )
);

-- Drivers can update their own rides. The app only changes available seats.
drop policy if exists "Drivers can update their own rides" on public.rides;
create policy "Drivers can update their own rides"
on public.rides for update to authenticated
using ((select auth.uid()) = driver_id)
with check ((select auth.uid()) = driver_id);
