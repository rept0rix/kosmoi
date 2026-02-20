-- Wallet & Transactions Schema
-- 1. Wallets Table
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    balance DECIMAL(12, 2) DEFAULT 0.00 NOT NULL,
    currency TEXT DEFAULT 'THB' CHECK (length(currency) = 3),
    status TEXT CHECK (status IN ('active', 'frozen', 'suspended')) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- 2. Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    -- Positive for credit, negative for debit
    type TEXT CHECK (
        type IN (
            'topup',
            'payment',
            'refund',
            'withdrawal',
            'adjustment'
        )
    ) NOT NULL,
    status TEXT CHECK (
        status IN (
            'pending',
            'completed',
            'failed',
            'cancelled',
            'held'
        )
    ) DEFAULT 'pending',
    reference_id TEXT,
    -- External ref (Stripe ID, Booking ID)
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON public.transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);
-- RLS Policies
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
-- Wallets: Users can view their own wallet
CREATE POLICY "Users view own wallet" ON public.wallets FOR
SELECT USING (auth.uid() = user_id);
-- Transactions: Users can view their own transactions (via wallet ownership)
CREATE POLICY "Users view own transactions" ON public.transactions FOR
SELECT USING (
        wallet_id IN (
            SELECT id
            FROM public.wallets
            WHERE user_id = auth.uid()
        )
    );
-- 3. Auto-create wallet on user signup (Trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user_wallet() RETURNS TRIGGER AS $$ BEGIN
INSERT INTO public.wallets (user_id)
VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Trigger on auth.users (reusing existing mechanism or new one)
DROP TRIGGER IF EXISTS on_auth_user_created_wallet ON auth.users;
CREATE TRIGGER on_auth_user_created_wallet
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_wallet();
-- Backfill existing users who don't have wallets
INSERT INTO public.wallets (user_id)
SELECT id
FROM auth.users
WHERE id NOT IN (
        SELECT user_id
        FROM public.wallets
    ) ON CONFLICT DO NOTHING;
-- 4. RPC: Process Transaction (Atomic Balance Update)
CREATE OR REPLACE FUNCTION public.process_transaction(
        p_user_id UUID,
        p_amount DECIMAL,
        p_type TEXT,
        p_reference_id TEXT DEFAULT NULL,
        p_metadata JSONB DEFAULT '{}'::jsonb
    ) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_wallet_id UUID;
v_current_balance DECIMAL;
v_new_transaction_id UUID;
BEGIN -- Get User's Wallet (Locking row for update)
SELECT id,
    balance INTO v_wallet_id,
    v_current_balance
FROM public.wallets
WHERE user_id = p_user_id FOR
UPDATE;
IF v_wallet_id IS NULL THEN RAISE EXCEPTION 'Wallet not found for user';
END IF;
-- Check sufficient funds for debits
IF p_amount < 0
AND (v_current_balance + p_amount) < 0 THEN RAISE EXCEPTION 'Insufficient funds';
END IF;
-- 1. Insert Transaction
INSERT INTO public.transactions (
        wallet_id,
        amount,
        type,
        status,
        reference_id,
        metadata,
        created_at
    )
VALUES (
        v_wallet_id,
        p_amount,
        p_type,
        'completed',
        p_reference_id,
        p_metadata,
        now()
    )
RETURNING id INTO v_new_transaction_id;
-- 2. Update Wallet Balance
UPDATE public.wallets
SET balance = balance + p_amount,
    updated_at = now()
WHERE id = v_wallet_id;
RETURN jsonb_build_object(
    'success',
    true,
    'transaction_id',
    v_new_transaction_id,
    'new_balance',
    (v_current_balance + p_amount)
);
EXCEPTION
WHEN OTHERS THEN RAISE;
END;
$$;-- Wallet Migration Part 2: Customers & Payment Methods support
-- 1. Create Customers Table (Mapping Supabase User -> Stripe Customer)
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    stripe_customer_id TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
-- Users can view their own customer mapping (though usually internal)
CREATE POLICY "Users can view own customer data" ON public.customers FOR
SELECT USING (auth.uid() = id);
-- Edge Function (Service Role) needs access - typically bypasses RLS, but just in case:
-- CREATE POLICY "Service Role can manage customers" ON public.customers USING (true) WITH CHECK (true);
-- (Supabase Service Role key bypasses RLS by default)
-- 2. Add 'setup' type support to process_transaction if needed?
-- No, 'setup' doesn't create a transaction in the wallet ledger usually, unless we strip verify charge.