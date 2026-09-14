-- BIKUBOO Admin Payments & Revenue reporting
-- Run this once in Supabase SQL Editor.
-- This does NOT change customer payment flows or charge any commission.

drop function if exists public.bikuboo_admin_payments();
create or replace function public.bikuboo_admin_payments()
returns table(
  id uuid,
  ride_id uuid,
  request_id uuid,
  passenger_id uuid,
  passenger_name text,
  driver_id uuid,
  driver_name text,
  amount_paise integer,
  currency text,
  status text,
  payment_method text,
  razorpay_order_id text,
  razorpay_payment_id text,
  created_at timestamptz,
  paid_at timestamptz
)
language plpgsql security definer set search_path=public as $$
begin
  if not public.bikuboo_is_admin() then raise exception 'Admin access required.'; end if;
  return query
  select
    pt.id,
    pt.ride_id,
    pt.request_id,
    pt.passenger_id,
    coalesce(pp.full_name,'BIKUBOO rider'),
    pt.driver_id,
    coalesce(dp.full_name,'BIKUBOO rider'),
    pt.amount_paise,
    pt.currency,
    pt.status,
    pt.payment_method,
    pt.razorpay_order_id,
    pt.razorpay_payment_id,
    pt.created_at,
    pt.paid_at
  from public.payment_transactions pt
  left join public.profiles pp on pp.id=pt.passenger_id
  left join public.profiles dp on dp.id=pt.driver_id
  order by pt.created_at desc
  limit 300;
end;
$$;
grant execute on function public.bikuboo_admin_payments() to authenticated;

notify pgrst, 'reload schema';
