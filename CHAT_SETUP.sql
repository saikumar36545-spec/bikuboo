-- BIKUBOO In-App Chat setup
-- Run once in Supabase SQL Editor.

create table if not exists public.ride_messages (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references public.rides(id) on delete cascade,
  request_id uuid not null references public.ride_requests(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  message text not null check (char_length(trim(message)) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists ride_messages_request_created_idx
  on public.ride_messages(request_id, created_at);
create index if not exists ride_messages_sender_idx
  on public.ride_messages(sender_id);

alter table public.ride_messages enable row level security;

drop policy if exists "Accepted ride participants can view chat" on public.ride_messages;
create policy "Accepted ride participants can view chat"
on public.ride_messages
for select
to authenticated
using (
  exists (
    select 1
    from public.ride_requests rr
    join public.rides r on r.id = rr.ride_id
    where rr.id = ride_messages.request_id
      and rr.ride_id = ride_messages.ride_id
      and rr.status = 'accepted'
      and ((r.driver_id = (select auth.uid())) or (rr.passenger_id = (select auth.uid())))
  )
);

drop policy if exists "Accepted ride participants can send chat" on public.ride_messages;
create policy "Accepted ride participants can send chat"
on public.ride_messages
for insert
to authenticated
with check (
  sender_id = (select auth.uid())
  and exists (
    select 1
    from public.ride_requests rr
    join public.rides r on r.id = rr.ride_id
    where rr.id = ride_messages.request_id
      and rr.ride_id = ride_messages.ride_id
      and rr.status = 'accepted'
      and ((r.driver_id = (select auth.uid())) or (rr.passenger_id = (select auth.uid())))
  )
);

grant select, insert on public.ride_messages to authenticated;

-- Realtime chat updates (idempotent)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'ride_messages'
  ) then
    alter publication supabase_realtime add table public.ride_messages;
  end if;
end $$;

-- Optional hardening: prevent an accepted passenger from accidentally creating a
-- message for a different ride/request pair. The RLS policy above already checks it.
