-- BIKUBOO FIX: Find Ride showing no rides even when rides exist
-- Run this once in Supabase > SQL Editor.
-- This adds the correct SELECT policy for the status used by BIKUBOO (open).
-- It does not delete your existing rides.

drop policy if exists "Authenticated users can view open rides" on public.rides;

create policy "Authenticated users can view open rides"
on public.rides
for select
to authenticated
using (status = 'open');

-- Make sure authenticated users have table-level SELECT permission.
grant select on table public.rides to authenticated;
