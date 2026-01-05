-- Create Wallets Table
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    balance NUMERIC(15, 2) DEFAULT 0.00 CHECK (balance >= 0),
    currency TEXT DEFAULT 'THB',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_user_wallet UNIQUE (user_id)
);
-- Enable RLS
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own wallet" ON wallets FOR
SELECT USING (auth.uid() = user_id);
-- Create Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_wallet_id UUID REFERENCES wallets(id),
    to_wallet_id UUID REFERENCES wallets(id),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    type TEXT NOT NULL CHECK (
        type IN ('transfer', 'deposit', 'withdrawal', 'purchase')
    ),
    status TEXT DEFAULT 'completed',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions" ON transactions FOR
SELECT USING (
        auth.uid() IN (
            SELECT user_id
            FROM wallets
            WHERE id = from_wallet_id
            UNION
            SELECT user_id
            FROM wallets
            WHERE id = to_wallet_id
        )
    );
-- RPC Function for Atomic Transfer
CREATE OR REPLACE FUNCTION transfer_funds(
        sender_id UUID,
        recipient_id UUID,
        amount NUMERIC,
        description TEXT DEFAULT 'P2P Transfer'
    ) RETURNS JSON AS $$
DECLARE sender_wallet UUID;
recipient_wallet UUID;
BEGIN -- Get Wallet IDs
SELECT id INTO sender_wallet
FROM wallets
WHERE user_id = sender_id;
SELECT id INTO recipient_wallet
FROM wallets
WHERE user_id = recipient_id;
IF sender_wallet IS NULL THEN RAISE EXCEPTION 'Sender wallet not found';
END IF;
IF recipient_wallet IS NULL THEN RAISE EXCEPTION 'Recipient wallet not found';
END IF;
-- Check Balance
IF (
    SELECT balance
    FROM wallets
    WHERE id = sender_wallet
) < amount THEN RAISE EXCEPTION 'Insufficient funds';
END IF;
-- Perform Transfer
UPDATE wallets
SET balance = balance - amount
WHERE id = sender_wallet;
UPDATE wallets
SET balance = balance + amount
WHERE id = recipient_wallet;
-- Record Transaction
INSERT INTO transactions (
        from_wallet_id,
        to_wallet_id,
        amount,
        type,
        description
    )
VALUES (
        sender_wallet,
        recipient_wallet,
        amount,
        'transfer',
        description
    );
RETURN json_build_object(
    'success',
    true,
    'message',
    'Transfer successful',
    'amount',
    amount
);
EXCEPTION
WHEN OTHERS THEN RETURN json_build_object(
    'success',
    false,
    'message',
    SQLERRM
);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;