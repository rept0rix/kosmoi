-- 1. Add currency support to transactions
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'THB';
-- 2. Create RPC to award Vibes (Admin/System only)
CREATE OR REPLACE FUNCTION award_vibes(
        target_user_id UUID,
        amount INTEGER,
        reason TEXT,
        source TEXT DEFAULT 'system'
    ) RETURNS JSON AS $$
DECLARE target_wallet_id UUID;
is_admin BOOLEAN;
BEGIN -- Check Authorization (Admin or Service Role)
SELECT EXISTS (
        SELECT 1
        FROM auth.users
        WHERE id = auth.uid()
            AND (
                raw_user_meta_data->>'role' = 'admin'
                OR raw_app_meta_data->>'role' = 'admin'
            )
    ) INTO is_admin;
IF NOT is_admin
AND auth.role() != 'service_role' THEN RAISE EXCEPTION 'Unauthorized: Only admins or system can award vibes';
END IF;
-- Get Wallet
SELECT id INTO target_wallet_id
FROM wallets
WHERE user_id = target_user_id;
IF target_wallet_id IS NULL THEN RAISE EXCEPTION 'Wallet not found for user';
END IF;
-- Update Balance
UPDATE wallets
SET vibes_balance = vibes_balance + amount,
    updated_at = NOW()
WHERE id = target_wallet_id;
-- Log Transaction
INSERT INTO transactions (
        wallet_id,
        -- Required NOT NULL (references sender usually, but here it's system grant to target)
        to_wallet_id,
        -- Points to recipient
        amount,
        type,
        status,
        description,
        currency,
        metadata
    )
VALUES (
        target_wallet_id,
        -- using target as wallet_id to satisfy constraint and show in their history
        target_wallet_id,
        amount,
        'deposit',
        -- or 'reward'
        'completed',
        reason,
        'VIBES',
        jsonb_build_object('source', source)
    );
RETURN json_build_object(
    'success',
    true,
    'message',
    'Vibes awarded',
    'amount',
    amount
);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;