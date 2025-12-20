-- Stripe Subscriptions Schema
-- 1. Customers
-- Map Supabase users to Stripe customers
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
    stripe_customer_id TEXT
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
-- No policies needed if only accessed via Service Role, but for safety:
CREATE POLICY "Public read customers" ON public.customers FOR
SELECT USING (true);
-- BE CAREFUL, maybe only own?
-- Actually, typically users only need to read their own mapping if at all, but mostly this is backend.
-- Let's stick to: Users can read own.
DROP POLICY IF EXISTS "Users can read own customer data" ON public.customers;
CREATE POLICY "Users can read own customer data" ON public.customers FOR
SELECT USING (auth.uid() = id);
-- 2. Products
-- Local cache of Stripe Products
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    active BOOLEAN,
    name TEXT,
    description TEXT,
    image TEXT,
    metadata JSONB
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access to products" ON public.products FOR
SELECT USING (true);
-- 3. Prices
-- Local cache of Stripe Prices
CREATE TYPE pricing_type AS ENUM ('one_time', 'recurring');
CREATE TYPE pricing_plan_interval AS ENUM ('day', 'week', 'month', 'year');
CREATE TABLE IF NOT EXISTS public.prices (
    id TEXT PRIMARY KEY,
    product_id TEXT REFERENCES public.products,
    active BOOLEAN,
    description TEXT,
    unit_amount BIGINT,
    currency TEXT,
    type pricing_type,
    interval pricing_plan_interval,
    interval_count INTEGER,
    trial_period_days INTEGER,
    metadata JSONB
);
ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access to prices" ON public.prices FOR
SELECT USING (true);
-- 4. Subscriptions
-- Local cache of Stripe Subscriptions
CREATE TYPE subscription_status AS ENUM (
    'trialing',
    'active',
    'canceled',
    'incomplete',
    'incomplete_expired',
    'past_due',
    'unpaid',
    'paused'
);
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    status subscription_status,
    metadata JSONB,
    price_id TEXT REFERENCES public.prices,
    quantity INTEGER,
    cancel_at_period_end BOOLEAN,
    created TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    current_period_start TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    cancel_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    canceled_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    trial_start TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    trial_end TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Can only view own subs data" ON public.subscriptions FOR
SELECT USING (auth.uid() = user_id);
-- Realtime subscription listening
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE public.products,
public.prices;