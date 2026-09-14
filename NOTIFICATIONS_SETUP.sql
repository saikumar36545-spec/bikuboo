-- BIKUBOO real-time notifications setup
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  ride_id uuid null references public.rides(id) on delete cascade,
  request_id uuid null references public.ride_requests(id) on delete cascade,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

drop policy if exists "Users can view own notifications" on public.notifications;
create policy "Users can view own notifications" on public.notifications
for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications" on public.notifications
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists notifications_user_created_idx on public.notifications(user_id, created_at desc);

-- Allow Realtime to stream notification rows. If already enabled, this statement may error;
-- in that case, enable notifications from Database -> Replication in Supabase.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

create or replace function public.bikuboo_notify_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_driver uuid;
  v_from text;
  v_to text;
  v_passenger text;
begin
  select driver_id, coalesce(from_location,from_place,''), coalesce(to_location,to_place,'')
    into v_driver, v_from, v_to
  from public.rides where id = new.ride_id;

  select coalesce(full_name,'BIKUBOO rider') into v_passenger
  from public.profiles where id = new.passenger_id;

  if v_driver is not null then
    insert into public.notifications(user_id,type,title,message,ride_id,request_id)
    values(v_driver,'ride_request','New ride request',
      v_passenger || ' requested a seat on ' || v_from || ' → ' || v_to,
      new.ride_id,new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists bikuboo_notify_request_insert on public.ride_requests;
create trigger bikuboo_notify_request_insert
after insert on public.ride_requests
for each row execute function public.bikuboo_notify_request();

create or replace function public.bikuboo_notify_request_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_from text;
  v_to text;
  v_title text;
  v_message text;
  v_type text;
begin
  if old.status is not distinct from new.status then return new; end if;

  select coalesce(from_location,from_place,''), coalesce(to_location,to_place,'')
    into v_from, v_to from public.rides where id = new.ride_id;

  if new.status = 'accepted' then
    v_type := 'request_accepted';
    v_title := 'Ride request accepted';
    v_message := 'Your request was accepted for ' || v_from || ' → ' || v_to;
  elsif new.status = 'rejected' then
    v_type := 'request_rejected';
    v_title := 'Ride request rejected';
    v_message := 'Your request was rejected for ' || v_from || ' → ' || v_to;
  else
    return new;
  end if;

  insert into public.notifications(user_id,type,title,message,ride_id,request_id)
  values(new.passenger_id,v_type,v_title,v_message,new.ride_id,new.id);
  return new;
end;
$$;

drop trigger if exists bikuboo_notify_request_status on public.ride_requests;
create trigger bikuboo_notify_request_status
after update of status on public.ride_requests
for each row execute function public.bikuboo_notify_request_status();

create or replace function public.bikuboo_notify_ride_full()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_from text;
  v_to text;
  r record;
begin
  if coalesce(old.seats,0) > 0 and coalesce(new.seats,0) = 0 then
    select coalesce(from_location,from_place,''), coalesce(to_location,to_place,'')
      into v_from, v_to from public.rides where id = new.id;
    for r in select id, passenger_id from public.ride_requests where ride_id = new.id and status = 'accepted' loop
      insert into public.notifications(user_id,type,title,message,ride_id,request_id)
      values(r.passenger_id,'ride_full','Ride is full','The ride ' || v_from || ' → ' || v_to || ' is now full.',new.id,r.id);
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists bikuboo_notify_ride_full on public.rides;
create trigger bikuboo_notify_ride_full
after update of seats on public.rides
for each row execute function public.bikuboo_notify_ride_full();
