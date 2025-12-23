-- RPC for P2P Fund Transfer
-- Deducts from Sender, Adds to Recipient atomically.
CREATE OR REPLACE FUNCTION public.transfer_funds(
        p_sender_id UUID,
        p_recipient_wallet_id UUID,
        p_amount DECIMAL,
        p_note TEXT DEFAULT NULL
    ) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_sender_wallet_id UUID;
v_sender_balance DECIMAL;
v_recipient_balance DECIMAL;
v_txn_out UUID;
v_txn_in UUID;
BEGIN -- 1. Lock Sender Wallet
SELECT id,
    balance INTO v_sender_wallet_id,
    v_sender_balance
FROM public.wallets
WHERE user_id = p_sender_id FOR
UPDATE;
IF v_sender_wallet_id IS NULL THEN RAISE EXCEPTION 'Sender wallet not found';
END IF;
IF v_sender_balance < p_amount THEN RAISE EXCEPTION 'Insufficient funds';
END IF;
-- 2. Lock Recipient Wallet
SELECT balance INTO v_recipient_balance
FROM public.wallets
WHERE id = p_recipient_wallet_id FOR
UPDATE;
IF v_recipient_balance IS NULL THEN RAISE EXCEPTION 'Recipient wallet not found';
END IF;
-- 3. Deduct from Sender
UPDATE public.wallets
SET balance = balance - p_amount,
    updated_at = now()
WHERE id = v_sender_wallet_id;
-- 4. Add to Recipient
UPDATE public.wallets
SET balance = balance + p_amount,
    updated_at = now()
WHERE id = p_recipient_wallet_id;
-- 5. Record Transaction (Debit for Sender)
INSERT INTO public.transactions (
        wallet_id,
        amount,
        type,
        status,
        reference_id,
        metadata
    )
VALUES (
        v_sender_wallet_id,
        - p_amount,
        'transfer',
        'completed',
        'P2P-' || v_sender_wallet_id,
        jsonb_build_object(
            'recipient_wallet',
            p_recipient_wallet_id,
            'note',
            p_note
        )
    )
RETURNING id INTO v_txn_out;
-- 6. Record Transaction (Credit for Recipient)
INSERT INTO public.transactions (
        wallet_id,
        amount,
        type,
        status,
        reference_id,
        metadata
    )
VALUES (
        p_recipient_wallet_id,
        p_amount,
        'transfer',
        'completed',
        'P2P-' || v_sender_wallet_id,
        jsonb_build_object(
            'sender_wallet',
            v_sender_wallet_id,
            'note',
            p_note
        )
    )
RETURNING id INTO v_txn_in;
RETURN jsonb_build_object(
    'success',
    true,
    'transaction_id',
    v_txn_out,
    'new_balance',
    (v_sender_balance - p_amount)
);
EXCEPTION
WHEN OTHERS THEN RAISE;
END;
$$;