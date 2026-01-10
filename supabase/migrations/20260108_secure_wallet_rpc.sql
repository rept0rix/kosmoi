-- Secure Transfer Function
-- Drops the old insecure version (if signature matches) or creates a new overload.
-- We should DROP the old one to be safe, but we don't know the exact signature that was successful.
-- We will define the canonical secure version.
CREATE OR REPLACE FUNCTION transfer_funds(
        recipient_wallet_id UUID,
        amount NUMERIC,
        note TEXT DEFAULT 'P2P Transfer'
    ) RETURNS JSON AS $$
DECLARE current_user_id UUID;
sender_wallet_id UUID;
sender_balance NUMERIC;
BEGIN -- 1. Securely get the current user
current_user_id := auth.uid();
IF current_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated';
END IF;
-- 2. Get Sender Wallet (Must belong to auth user)
SELECT id,
    balance INTO sender_wallet_id,
    sender_balance
FROM wallets
WHERE user_id = current_user_id;
IF sender_wallet_id IS NULL THEN RAISE EXCEPTION 'You do not have a wallet';
END IF;
-- 3. Validation
IF sender_wallet_id = recipient_wallet_id THEN RAISE EXCEPTION 'Cannot transfer to yourself';
END IF;
IF amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive';
END IF;
IF sender_balance < amount THEN RAISE EXCEPTION 'Insufficient funds';
END IF;
-- 4. Perform Transfer
UPDATE wallets
SET balance = balance - amount,
    updated_at = NOW()
WHERE id = sender_wallet_id;
UPDATE wallets
SET balance = balance + amount,
    updated_at = NOW()
WHERE id = recipient_wallet_id;
-- 5. Record Transaction
INSERT INTO transactions (
        from_wallet_id,
        to_wallet_id,
        amount,
        type,
        description,
        status
    )
VALUES (
        sender_wallet_id,
        recipient_wallet_id,
        amount,
        'transfer',
        note,
        'completed'
    );
RETURN json_build_object(
    'success',
    true,
    'message',
    'Transfer successful',
    'new_balance',
    sender_balance - amount
);
EXCEPTION
WHEN OTHERS THEN RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Secure Minting/TopUp (Admin Only)
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
-- Allow "service_role" to bypass this check (optional, but good for scripts)
IF NOT is_admin
AND auth.role() != 'service_role' THEN RAISE EXCEPTION 'Unauthorized: Admins only';
END IF;
-- 2. Get Target Wallet
SELECT id INTO target_wallet_id
FROM wallets
WHERE user_id = target_user_id;
-- Auto-create wallet if missing (Convenience for Admins)
IF target_wallet_id IS NULL THEN
INSERT INTO wallets (user_id, balance)
VALUES (target_user_id, 0)
RETURNING id INTO target_wallet_id;
END IF;
-- 3. Execute
IF type = 'topup'
OR type = 'deposit' THEN
UPDATE wallets
SET balance = balance + amount
WHERE id = target_wallet_id;
ELSIF type = 'withdrawal'
OR type = 'charge' THEN
UPDATE wallets
SET balance = balance - amount
WHERE id = target_wallet_id;
END IF;
-- 4. Log
INSERT INTO transactions (to_wallet_id, amount, type, description, status)
VALUES (
        target_wallet_id,
        amount,
        type,
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