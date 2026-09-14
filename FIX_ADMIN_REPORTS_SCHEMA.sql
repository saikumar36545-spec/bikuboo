-- BIKUBOO: Fix Admin Reports schema mismatch
-- Safe migration: adds columns only when they are missing.

alter table public.safety_reports
  add column if not exists reason text;

alter table public.safety_reports
  add column if not exists details text;

alter table public.safety_reports
  add column if not exists status text not null default 'open';

alter table public.safety_reports
  add column if not exists admin_note text;

alter table public.safety_reports
  add column if not exists resolved_at timestamptz;

-- Existing rows created before reason was available should remain visible.
update public.safety_reports
set reason = 'Other'
where reason is null or btrim(reason) = '';

-- Keep the admin report function aligned with the actual table.
create or replace function public.bikuboo_admin_reports()
returns table(
  id uuid,
  reporter_id uuid,
  reporter_name text,
  reported_user_id uuid,
  reported_name text,
  ride_id uuid,
  reason text,
  details text,
  status text,
  admin_note text,
  created_at timestamptz,
  resolved_at timestamptz
)
language plpgsql security definer set search_path=public as $$
begin
  if not public.bikuboo_is_admin() then raise exception 'Admin access required.'; end if;
  return query
  select
    r.id,
    r.reporter_id,
    coalesce(rep.full_name,'BIKUBOO rider'),
    r.reported_user_id,
    coalesce(usr.full_name,'Deleted user'),
    r.ride_id,
    coalesce(r.reason,'Other'),
    r.details,
    coalesce(r.status,'open'),
    r.admin_note,
    r.created_at,
    r.resolved_at
  from public.safety_reports r
  left join public.profiles rep on rep.id=r.reporter_id
  left join public.profiles usr on usr.id=r.reported_user_id
  order by (coalesce(r.status,'open')='open') desc,r.created_at desc
  limit 200;
end;
$$;

grant execute on function public.bikuboo_admin_reports() to authenticated;

create index if not exists safety_reports_status_idx
  on public.safety_reports(status, created_at desc);

notify pgrst, 'reload schema';
