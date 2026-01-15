-- Create RPC Function for Atomic Transfer v2 (Multi-Currency)
-- Improved security: sender is automatically inferred from auth.uid()
CREATE OR REPLACE FUNCTION transfer_funds_v2(
        recipient_id UUID,
        amount NUMERIC,
        currency TEXT DEFAULT 'THB',
        description TEXT DEFAULT 'P2P Transfer'
    ) RETURNS JSON AS $$
DECLARE sender_id UUID;
sender_wallet UUID;
recipient_wallet UUID;
current_balance NUMERIC;
BEGIN -- 0. Get Sender ID from Auth
sender_id := auth.uid();
IF sender_id IS NULL THEN RAISE EXCEPTION 'Not authenticated';
END IF;
-- 1. Get Wallet IDs
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
-- Self-transfer check
IF sender_wallet = recipient_wallet THEN RAISE EXCEPTION 'Cannot transfer to self';
END IF;
-- 2. Check Balance based on Currency
IF currency = 'VIBES' THEN
SELECT vibes_balance INTO current_balance
FROM wallets
WHERE id = sender_wallet;
ELSE
SELECT balance INTO current_balance
FROM wallets
WHERE id = sender_wallet;
END IF;
IF current_balance < amount THEN RAISE EXCEPTION 'Insufficient % funds',
currency;
END IF;
-- 3. Perform Transfer Updates
IF currency = 'VIBES' THEN -- Link VIBES
UPDATE wallets
SET vibes_balance = vibes_balance - amount,
    updated_at = NOW()
WHERE id = sender_wallet;
UPDATE wallets
SET vibes_balance = vibes_balance + amount,
    updated_at = NOW()
WHERE id = recipient_wallet;
ELSE -- Default THB
UPDATE wallets
SET balance = balance - amount,
    updated_at = NOW()
WHERE id = sender_wallet;
UPDATE wallets
SET balance = balance + amount,
    updated_at = NOW()
WHERE id = recipient_wallet;
END IF;
-- 4. Record Transaction
INSERT INTO transactions (
        from_wallet_id,
        to_wallet_id,
        amount,
        type,
        status,
        description,
        currency,
        metadata
    )
VALUES (
        sender_wallet,
        recipient_wallet,
        amount,
        'transfer',
        'completed',
        description,
        currency,
        jsonb_build_object('version', 'v2')
    );
RETURN json_build_object(
    'success',
    true,
    'message',
    'Transfer successful',
    'amount',
    amount,
    'currency',
    currency
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