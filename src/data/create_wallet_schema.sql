-- ============================================
-- KOSMOI PAY: SECURE WALLET SCHEMA v2 (With Escrow) 🛡️
-- ============================================
-- 1. Create Wallets Table
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    balance DECIMAL(12, 2) DEFAULT 0.00 CHECK (balance >= 0),
    -- Available to spend
    currency TEXT DEFAULT 'THB',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);
-- 2. Create Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL REFERENCES public.wallets(id),
    recipient_wallet_id UUID REFERENCES public.wallets(id),
    -- For P2P/Merchant transfers
    amount DECIMAL(12, 2) NOT NULL,
    type TEXT NOT NULL CHECK (
        type IN (
            'topup',
            'payment_hold',
            'payment_release',
            'refund',
            'p2p_transfer'
        )
    ),
    status TEXT DEFAULT 'completed' CHECK (
        status IN (
            'pending',
            'held',
            'completed',
            'failed',
            'refunded'
        )
    ),
    reference_id TEXT,
    -- Order ID / Booking ID
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 3. Security (RLS)
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own wallet" ON public.wallets FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own transactions" ON public.transactions FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.wallets w
            WHERE w.id = transactions.wallet_id
                AND w.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1
            FROM public.wallets w
            WHERE w.id = transactions.recipient_wallet_id
                AND w.user_id = auth.uid()
        )
    );
-- 4. ESCROW LOGIC (Stored Procedures)
-- Function A: HOLD FUNDS (Start of Ride/Service)
-- Deducts from User immediately (so they can't run away), but does NOT credit merchant yet.
CREATE OR REPLACE FUNCTION public.hold_funds(
        p_user_id UUID,
        p_merchant_id UUID,
        -- Optional, can be NULL if system holds it
        p_amount DECIMAL,
        p_reference_id TEXT,
        p_metadata JSONB DEFAULT '{}'
    ) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_user_wallet_id UUID;
v_merchant_wallet_id UUID;
BEGIN -- Get User Wallet
SELECT id INTO v_user_wallet_id
FROM public.wallets
WHERE user_id = p_user_id FOR
UPDATE;
-- Check Funds
IF (
    SELECT balance
    FROM public.wallets
    WHERE id = v_user_wallet_id
) < p_amount THEN RAISE EXCEPTION 'Insufficient funds';
END IF;
-- Get Merchant Wallet (Just to verify existence if passed)
IF p_merchant_id IS NOT NULL THEN
SELECT id INTO v_merchant_wallet_id
FROM public.wallets
WHERE user_id = p_merchant_id;
END IF;
-- Deduct from User
UPDATE public.wallets
SET balance = balance - p_amount,
    updated_at = NOW()
WHERE id = v_user_wallet_id;
-- Create 'Held' Transaction
INSERT INTO public.transactions (
        wallet_id,
        recipient_wallet_id,
        amount,
        type,
        status,
        reference_id,
        metadata
    )
VALUES (
        v_user_wallet_id,
        v_merchant_wallet_id,
        - p_amount,
        'payment_hold',
        'held',
        p_reference_id,
        p_metadata
    );
RETURN jsonb_build_object('success', true, 'message', 'Funds held');
END;
$$;
-- Function B: RELEASE FUNDS (End of Ride/Service)
-- Finds the held transaction and credits the merchant.
CREATE OR REPLACE FUNCTION public.release_funds(
        p_reference_id TEXT -- The Booking/Order ID
    ) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_txn RECORD;
v_merchant_wallet_id UUID;
BEGIN -- Find the original HOLD transaction
SELECT * INTO v_txn
FROM public.transactions
WHERE reference_id = p_reference_id
    AND status = 'held'
    AND type = 'payment_hold' FOR
UPDATE;
IF v_txn IS NULL THEN RAISE EXCEPTION 'No held funds found for this reference ID';
END IF;
v_merchant_wallet_id := v_txn.recipient_wallet_id;
-- Credit Merchant
UPDATE public.wallets
SET balance = balance + ABS(v_txn.amount),
    updated_at = NOW()
WHERE id = v_merchant_wallet_id;
-- Update Transaction Status to Completed
UPDATE public.transactions
SET status = 'completed',
    updated_at = NOW()
WHERE id = v_txn.id;
-- (Optional) Create a mirror transaction for the merchant's view? 
-- For simplest ledger, we update the status, and the merchant queries 'transactions where recipient_wallet_id = me'
RETURN jsonb_build_object(
    'success',
    true,
    'message',
    'Funds released to merchant'
);
END;
$$;