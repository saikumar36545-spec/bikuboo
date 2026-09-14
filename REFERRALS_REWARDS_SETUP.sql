-- BIKUBOO Referrals & Rewards
alter table public.profiles add column if not exists referral_code text;
alter table public.profiles add column if not exists referred_by uuid references auth.users(id) on delete set null;

create unique index if not exists profiles_referral_code_key on public.profiles(referral_code) where referral_code is not null;

create table if not exists public.reward_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(10,2) not null,
  type text not null check (type in ('referral_bonus','ride_credit','adjustment','redeemed')),
  description text not null,
  referral_user_id uuid references auth.users(id) on delete set null,
  ride_id uuid references public.rides(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.reward_ledger enable row level security;
drop policy if exists "Users view own reward ledger" on public.reward_ledger;
create policy "Users view own reward ledger" on public.reward_ledger for select to authenticated using ((select auth.uid()) = user_id);
grant select on public.reward_ledger to authenticated;

create or replace function public.bikuboo_claim_referral(p_code text)
returns jsonb
language plpgsql security definer set search_path=public
as $$
declare inviter uuid; me uuid := auth.uid();
begin
  if me is null then raise exception 'You must be logged in'; end if;
  if upper(trim(coalesce(p_code,''))) = '' then raise exception 'Enter a referral code'; end if;
  select id into inviter from public.profiles where upper(referral_code)=upper(trim(p_code)) limit 1;
  if inviter is null then raise exception 'Referral code not found'; end if;
  if inviter = me then raise exception 'You cannot use your own referral code'; end if;
  if exists(select 1 from public.profiles where id=me and referred_by is not null) then raise exception 'A referral is already linked to your account'; end if;
  update public.profiles set referred_by=inviter where id=me;
  return jsonb_build_object('success',true,'inviter_id',inviter);
end $$;
grant execute on function public.bikuboo_claim_referral(text) to authenticated;

create or replace function public.bikuboo_reward_balance()
returns numeric
language sql stable security definer set search_path=public
as $$ select coalesce(sum(amount),0) from public.reward_ledger where user_id=auth.uid(); $$;
grant execute on function public.bikuboo_reward_balance() to authenticated;

create or replace function public.bikuboo_reward_history()
returns setof public.reward_ledger
language sql stable security definer set search_path=public
as $$ select * from public.reward_ledger where user_id=auth.uid() order by created_at desc limit 50; $$;
grant execute on function public.bikuboo_reward_history() to authenticated;

-- Create referral codes for existing profiles that do not have one.
update public.profiles
set referral_code = 'BIKU' || upper(substr(replace(id::text,'-',''),1,8))
where referral_code is null;

-- First completed ride for a referred user: reward both sides once.
create or replace function public.bikuboo_award_referral_on_completion()
returns trigger
language plpgsql security definer set search_path=public
as $$
declare req record; referred_from uuid; already boolean;
begin
  if NEW.status='completed' and OLD.status is distinct from 'completed' then
    for req in select passenger_id from public.ride_requests where ride_id=NEW.id and status='accepted' loop
      select referred_by into referred_from from public.profiles where id=req.passenger_id;
      if referred_from is not null then
        select exists(select 1 from public.reward_ledger where user_id=req.passenger_id and type='referral_bonus') into already;
        if not already then
          insert into public.reward_ledger(user_id,amount,type,description,referral_user_id,ride_id)
          values(req.passenger_id,50,'referral_bonus','Welcome referral reward',referred_from,NEW.id);
          insert into public.reward_ledger(user_id,amount,type,description,referral_user_id,ride_id)
          values(referred_from,50,'referral_bonus','Friend completed first ride',req.passenger_id,NEW.id);
        end if;
      end if;
    end loop;
  end if;
  return NEW;
end $$;

drop trigger if exists bikuboo_award_referral_on_completion on public.rides;
create trigger bikuboo_award_referral_on_completion after update of status on public.rides for each row execute function public.bikuboo_award_referral_on_completion();
