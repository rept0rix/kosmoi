-- Fix process_transaction to handle Enum Casting
CREATE OR REPLACE FUNCTION process_transaction(
        target_user_id UUID,
        amount NUMERIC,
        type TEXT,
        reference_id TEXT,
        metadata JSONB
    ) RETURNS JSON AS $$
DECLARE target_wallet_id UUID;
is_admin BOOLEAN;
BEGIN -- 1. Check Admin Role
SELECT EXISTS (
        SELECT 1
        FROM auth.users
        WHERE id = auth.uid()
            AND (
                raw_user_meta_data->>'role' = 'admin'
                OR raw_app_meta_data->>'role' = 'admin'
            )
    ) INTO is_admin;
-- Allow "service_role" to bypass this check
IF NOT is_admin
AND auth.role() != 'service_role' THEN RAISE EXCEPTION 'Unauthorized: Admins only';
END IF;
-- 2. Get Target Wallet
SELECT id INTO target_wallet_id
FROM wallets
WHERE user_id = target_user_id;
-- Auto-create wallet if missing
IF target_wallet_id IS NULL THEN
INSERT INTO wallets (user_id, balance)
VALUES (target_user_id, 0)
RETURNING id INTO target_wallet_id;
END IF;
-- 3. Execute Balance Change
IF type = 'topup'
OR type = 'deposit'
OR type = 'earning' THEN
UPDATE wallets
SET balance = balance + amount
WHERE id = target_wallet_id;
ELSIF type = 'withdrawal'
OR type = 'payment'
OR type = 'charge' THEN
UPDATE wallets
SET balance = balance - amount
WHERE id = target_wallet_id;
END IF;
-- 4. Log Transaction (Explicit Cast)
INSERT INTO transactions (
        wallet_id,
        to_wallet_id,
        amount,
        type,
        description,
        status
    )
VALUES (
        target_wallet_id,
        -- for wallet_id (legacy/constraint)
        target_wallet_id,
        -- for to_wallet_id
        amount,
        type::transaction_type,
        -- Explicit cast here
        reference_id,
        'completed'
    );
RETURN json_build_object(
    'success',
    true,
    'message',
    'Transaction processed'
);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;