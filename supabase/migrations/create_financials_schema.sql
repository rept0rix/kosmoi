-- Create Wallets Table
create table if not exists public.wallets (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) not null unique,
    balance decimal(12, 2) default 0.00 check (balance >= 0),
    currency text default 'THB',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);
-- Create Transactions Table
create table if not exists public.transactions (
    id uuid primary key default gen_random_uuid(),
    wallet_id uuid references public.wallets(id) not null,
    amount decimal(12, 2) not null,
    type text check (type in ('credit', 'debit')) not null,
    description text,
    metadata jsonb default '{}',
    reference_id text,
    -- External Stripe ID or internal Booking ID
    created_at timestamp with time zone default now()
);
-- Enable RLS
alter table public.wallets enable row level security;
alter table public.transactions enable row level security;
-- Policies for Wallets
create policy "Users can view own wallet" on public.wallets for
select using (auth.uid() = user_id);
-- Policies for Transactions
create policy "Users can view own transactions" on public.transactions for
select using (
        wallet_id in (
            select id
            from public.wallets
            where user_id = auth.uid()
        )
    );
-- Function to safely process a single wallet transaction (Credit/Debit)
create or replace function public.process_wallet_transaction(
        p_user_id uuid,
        p_amount decimal,
        p_type text,
        p_description text,
        p_reference_id text default null
    ) returns uuid as $$
declare v_wallet_id uuid;
v_transaction_id uuid;
v_new_balance decimal;
begin -- Get Wallet ID (Create if not exists - auto-provisioning)
select id into v_wallet_id
from public.wallets
where user_id = p_user_id;
if v_wallet_id is null then
insert into public.wallets (user_id, balance)
values (p_user_id, 0)
returning id into v_wallet_id;
end if;
-- Update Balance
if p_type = 'credit' then
update public.wallets
set balance = balance + p_amount
where id = v_wallet_id
returning balance into v_new_balance;
elsif p_type = 'debit' then
update public.wallets
set balance = balance - p_amount
where id = v_wallet_id
returning balance into v_new_balance;
if v_new_balance < 0 then raise exception 'Insufficient funds';
end if;
end if;
-- Log Transaction
insert into public.transactions (
        wallet_id,
        amount,
        type,
        description,
        reference_id
    )
values (
        v_wallet_id,
        p_amount,
        p_type,
        p_description,
        p_reference_id
    )
returning id into v_transaction_id;
return v_transaction_id;
end;
$$ language plpgsql security definer;
-- Function to safely process a payment between two wallets (Transfer)
create or replace function public.process_payment(
        payer_wallet_id uuid,
        receiver_wallet_id uuid,
        amount decimal,
        booking_id text,
        description text
    ) returns jsonb as $$
declare v_payer_balance decimal;
v_tx_payer uuid;
v_tx_receiver uuid;
begin -- 1. Debit Payer
update public.wallets
set balance = balance - amount
where id = payer_wallet_id
returning balance into v_payer_balance;
if v_payer_balance < 0 then raise exception 'Insufficient funds';
end if;
-- 2. Credit Receiver
update public.wallets
set balance = balance + amount
where id = receiver_wallet_id;
-- 3. Log Transactions
insert into public.transactions (
        wallet_id,
        amount,
        type,
        description,
        reference_id
    )
values (
        payer_wallet_id,
        amount,
        'debit',
        description,
        booking_id
    )
returning id into v_tx_payer;
insert into public.transactions (
        wallet_id,
        amount,
        type,
        description,
        reference_id
    )
values (
        receiver_wallet_id,
        amount,
        'credit',
        description,
        booking_id
    )
returning id into v_tx_receiver;
return jsonb_build_object(
    'success',
    true,
    'payer_tx',
    v_tx_payer,
    'receiver_tx',
    v_tx_receiver
);
end;
$$ language plpgsql security definer;