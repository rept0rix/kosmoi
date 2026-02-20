-- Create Wallets Table
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    balance DECIMAL(12, 2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'THB',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_user_wallet UNIQUE (user_id)
);
-- Enable RLS on Wallets
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
-- RLS: Users can view their own wallet
CREATE POLICY "Users can view own wallet" ON public.wallets FOR
SELECT USING (auth.uid() = user_id);
-- RLS: Users (via service) can update their own wallet (restricted technically by service logic normally, but we allow simple crud for now securely)
-- Actually, wallet updates should ideally be done via proper functions to prevent tampering, but for MVP we might allow basic RLS if we trust the backend/logic.
-- However, typically specific functions are safer. For now, let's allow read only for users, and service role will handle updates.
-- Wait, if PaymentService runs client side with user token, it might need Update permissions OR we wrap in RPC.
-- Let's stick to RPC for balance updates for security, but for now we might need loose RLS for MVP speed if we don't write RPCs.
-- Let's try to do it right: RPC for updates. But for this step, just tables.
-- Create Transactions Table
CREATE TYPE transaction_type AS ENUM (
    'deposit',
    'withdrawal',
    'payment',
    'refund',
    'earning'
);
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed');
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE
    SET NULL,
        amount DECIMAL(12, 2) NOT NULL,
        type transaction_type NOT NULL,
        status transaction_status DEFAULT 'pending',
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Enable RLS on Transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
-- RLS: Users can view their own transactions (via wallet ownership)
CREATE POLICY "Users can view own transactions" ON public.transactions FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.wallets
            WHERE public.wallets.id = public.transactions.wallet_id
                AND public.wallets.user_id = auth.uid()
        )
    );
-- Function to handle updated_at
CREATE OR REPLACE FUNCTION handle_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Trigger for wallets
DROP TRIGGER IF EXISTS set_wallets_updated_at ON public.wallets;
CREATE TRIGGER set_wallets_updated_at BEFORE
UPDATE ON public.wallets FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
-- RPC Function to Safely Move Money (MVP)
-- This avoids giving direct UPDATE permission on 'balance' to the user
CREATE OR REPLACE FUNCTION process_payment(
        payer_wallet_id UUID,
        receiver_wallet_id UUID,
        amount DECIMAL,
        booking_id UUID,
        description TEXT
    ) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN -- unique transaction check?
    -- Check payer balance
    IF (
        SELECT balance
        FROM public.wallets
        WHERE id = payer_wallet_id
    ) < amount THEN RAISE EXCEPTION 'Insufficient funds';
END IF;
-- Deduct from Payer
UPDATE public.wallets
SET balance = balance - amount
WHERE id = payer_wallet_id;
-- Add to Receiver
UPDATE public.wallets
SET balance = balance + amount
WHERE id = receiver_wallet_id;
-- Record Payer Transaction (Payment)
INSERT INTO public.transactions (
        wallet_id,
        booking_id,
        amount,
        type,
        status,
        description
    )
VALUES (
        payer_wallet_id,
        booking_id,
        - amount,
        'payment',
        'completed',
        description
    );
-- Record Receiver Transaction (Earning)
INSERT INTO public.transactions (
        wallet_id,
        booking_id,
        amount,
        type,
        status,
        description
    )
VALUES (
        receiver_wallet_id,
        booking_id,
        amount,
        'earning',
        'completed',
        description
    );
RETURN TRUE;
END;
$$;