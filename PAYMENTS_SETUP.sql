-- BIKUBOO Payments Setup (Razorpay-ready)
create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references public.rides(id) on delete cascade,
  request_id uuid not null references public.ride_requests(id) on delete cascade,
  passenger_id uuid not null references auth.users(id) on delete cascade,
  driver_id uuid not null references auth.users(id) on delete cascade,
  amount_paise integer not null check (amount_paise > 0),
  currency text not null default 'INR',
  status text not null default 'pending' check (status in ('pending','paid','failed','refunded','cancelled','cash_pending')),
  payment_method text not null default 'upi' check (payment_method in ('upi','cash')),
  cash_confirmed_at timestamptz,
  razorpay_order_id text unique,
  razorpay_payment_id text unique,
  razorpay_signature text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists payment_transactions_passenger_idx on public.payment_transactions(passenger_id, created_at desc);
create index if not exists payment_transactions_driver_idx on public.payment_transactions(driver_id, created_at desc);
create index if not exists payment_transactions_ride_idx on public.payment_transactions(ride_id, created_at desc);

alter table public.payment_transactions enable row level security;
drop policy if exists "payment own rows" on public.payment_transactions;
create policy "payment own rows" on public.payment_transactions
for select to authenticated
using (passenger_id = (select auth.uid()) or driver_id = (select auth.uid()));

grant select on public.payment_transactions to authenticated;

drop function if exists public.bikuboo_payment_access(uuid);
create or replace function public.bikuboo_payment_access(p_request uuid)
returns table(ok boolean, ride_id uuid, driver_id uuid, passenger_id uuid, amount_paise integer, currency text, status text)
language plpgsql security definer set search_path=public as $$
declare r record;
begin
  select rr.id request_id, rr.status request_status, rr.passenger_id, r.id ride_id, r.driver_id,
         round(coalesce(r.price,r.contribution,0)*100)::integer amount_paise
    into r
    from public.ride_requests rr join public.rides r on r.id=rr.ride_id
   where rr.id=p_request and rr.passenger_id=auth.uid();
  if not found or r.request_status <> 'accepted' then
    return query select false,null::uuid,null::uuid,auth.uid(),0,'INR'::text,'invalid'::text; return;
  end if;
  if r.amount_paise <= 0 then
    return query select false,r.ride_id,r.driver_id,r.passenger_id,0,'INR'::text,'free'::text; return;
  end if;
  return query select true,r.ride_id,r.driver_id,r.passenger_id,r.amount_paise,'INR'::text,'payable'::text;
end; $$;
grant execute on function public.bikuboo_payment_access(uuid) to authenticated;

-- Admin payment reporting helper
create or replace function public.bikuboo_admin_payments()
returns table(id uuid, ride_id uuid, request_id uuid, passenger_id uuid, passenger_name text, driver_id uuid, driver_name text, amount_paise integer, currency text, status text, razorpay_order_id text, razorpay_payment_id text, created_at timestamptz, paid_at timestamptz)
language plpgsql security definer set search_path=public as $$
begin
  if not public.bikuboo_is_admin() then raise exception 'Admin access required.'; end if;
  return query
  select pt.id,pt.ride_id,pt.request_id,pt.passenger_id,coalesce(pp.full_name,'BIKUBOO rider'),pt.driver_id,coalesce(dp.full_name,'BIKUBOO rider'),pt.amount_paise,pt.currency,pt.status,pt.razorpay_order_id,pt.razorpay_payment_id,pt.created_at,pt.paid_at
  from public.payment_transactions pt
  left join public.profiles pp on pp.id=pt.passenger_id
  left join public.profiles dp on dp.id=pt.driver_id
  order by pt.created_at desc limit 300;
end; $$;
grant execute on function public.bikuboo_admin_payments() to authenticated;


-- UPI is the primary online method. Cash is an optional offline method.
-- Safe upgrade for projects that already created payment_transactions.
alter table public.payment_transactions add column if not exists payment_method text not null default 'upi';
alter table public.payment_transactions add column if not exists cash_confirmed_at timestamptz;
update public.payment_transactions set payment_method='upi' where payment_method is null;

-- Rebuild the status constraint so cash_pending is accepted on existing projects.
alter table public.payment_transactions drop constraint if exists payment_transactions_status_check;
alter table public.payment_transactions add constraint payment_transactions_status_check
  check (status in ('pending','paid','failed','refunded','cancelled','cash_pending'));

alter table public.payment_transactions drop constraint if exists payment_transactions_payment_method_check;
alter table public.payment_transactions add constraint payment_transactions_payment_method_check
  check (payment_method in ('upi','cash'));

-- Passenger chooses cash. This creates a server-owned payment record; the browser
-- never gets permission to insert arbitrary payment rows.
create or replace function public.bikuboo_choose_cash_payment(p_request uuid)
returns table(ok boolean, transaction_id uuid, amount_paise integer, status text)
language plpgsql security definer set search_path=public as $$
declare r record; existing record; tx uuid;
begin
  select rr.id request_id, rr.status request_status, rr.passenger_id, r.id ride_id, r.driver_id,
         round(coalesce(r.price,r.contribution,0)*100)::integer amount_paise
    into r
    from public.ride_requests rr join public.rides r on r.id=rr.ride_id
   where rr.id=p_request and rr.passenger_id=auth.uid();
  if not found or r.request_status <> 'accepted' or r.amount_paise <= 0 then
    return query select false,null::uuid,0,'invalid'::text; return;
  end if;
  select * into existing from public.payment_transactions
   where request_id=p_request and status in ('paid','cash_pending','pending')
   order by created_at desc limit 1;
  if found then
    return query select true,existing.id,existing.amount_paise,existing.status; return;
  end if;
  insert into public.payment_transactions(ride_id,request_id,passenger_id,driver_id,amount_paise,currency,status,payment_method)
  values(r.ride_id,p_request,r.passenger_id,r.driver_id,r.amount_paise,'INR','cash_pending','cash')
  returning id into tx;
  return query select true,tx,r.amount_paise,'cash_pending'::text;
end; $$;
grant execute on function public.bikuboo_choose_cash_payment(uuid) to authenticated;

-- Driver confirms that the cash was actually received.
create or replace function public.bikuboo_confirm_cash_payment(p_transaction uuid)
returns boolean
language plpgsql security definer set search_path=public as $$
declare affected integer;
begin
  update public.payment_transactions
     set status='paid', paid_at=coalesce(paid_at,now()), cash_confirmed_at=now()
   where id=p_transaction and driver_id=auth.uid() and payment_method='cash' and status='cash_pending';
  get diagnostics affected = row_count;
  return affected > 0;
end; $$;
grant execute on function public.bikuboo_confirm_cash_payment(uuid) to authenticated;
