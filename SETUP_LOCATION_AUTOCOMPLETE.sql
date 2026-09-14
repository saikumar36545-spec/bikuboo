-- BIKUBOO location autocomplete migration.
-- Safe for the existing rides table: it only adds missing columns.
alter table public.rides add column if not exists from_location text;
alter table public.rides add column if not exists to_location text;
alter table public.rides add column if not exists ride_date date;
alter table public.rides add column if not exists ride_time time;
alter table public.rides add column if not exists seats integer default 1;
alter table public.rides add column if not exists price numeric(10,2) default 0;
alter table public.rides add column if not exists status text default 'active';
alter table public.rides add column if not exists women_only boolean default false;
alter table public.rides add column if not exists women_preferred boolean default false;
alter table public.rides add column if not exists verified_only boolean default true;
alter table public.rides add column if not exists from_place_id text;
alter table public.rides add column if not exists to_place_id text;
alter table public.rides add column if not exists from_lat double precision;
alter table public.rides add column if not exists from_lng double precision;
alter table public.rides add column if not exists to_lat double precision;
alter table public.rides add column if not exists to_lng double precision;
