-- Create a table for public profiles (if it doesn't exist, though typically handled elsewhere, strictly we need mapping for stripe)
create table if not exists public.customers (
    id uuid references auth.users not null primary key,
    stripe_customer_id text
);
alter table public.customers enable row level security;
-- Products
create table if not exists public.products (
    id text primary key,
    active boolean,
    name text,
    description text,
    image text,
    metadata jsonb
);
alter table public.products enable row level security;
create policy "Allow public read-only access." on public.products for
select using (true);
-- Prices
create table if not exists public.prices (
    id text primary key,
    product_id text references public.products,
    active boolean,
    description text,
    unit_amount bigint,
    currency text,
    type text,
    interval text,
    interval_count integer,
    trial_period_days integer,
    metadata jsonb
);
alter table public.prices enable row level security;
create policy "Allow public read-only access." on public.prices for
select using (true);
-- Subscriptions
create table if not exists public.subscriptions (
    id text primary key,
    user_id uuid references auth.users not null,
    status text,
    metadata jsonb,
    price_id text references public.prices,
    quantity integer,
    cancel_at_period_end boolean,
    created timestamp with time zone default timezone('utc'::text, now()) not null,
    current_period_start timestamp with time zone default timezone('utc'::text, now()) not null,
    current_period_end timestamp with time zone default timezone('utc'::text, now()) not null,
    ended_at timestamp with time zone default timezone('utc'::text, now()),
    cancel_at timestamp with time zone default timezone('utc'::text, now()),
    canceled_at timestamp with time zone default timezone('utc'::text, now()),
    trial_start timestamp with time zone default timezone('utc'::text, now()),
    trial_end timestamp with time zone default timezone('utc'::text, now())
);
alter table public.subscriptions enable row level security;
create policy "Can only view own data" on public.subscriptions for
select using (auth.uid() = user_id);
-- Realtime
alter publication supabase_realtime
add table public.products;
alter publication supabase_realtime
add table public.prices;