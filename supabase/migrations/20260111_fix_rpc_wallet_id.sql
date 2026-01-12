-- Fix transfer_funds RPC to populate wallet_id
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
-- 2. Get Sender Wallet
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
-- FIX: We insert sender_wallet_id into wallet_id to satisfy NOT NULL constraint
INSERT INTO transactions (
        wallet_id,
        from_wallet_id,
        to_wallet_id,
        amount,
        type,
        description,
        status
    )
VALUES (
        sender_wallet_id,
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