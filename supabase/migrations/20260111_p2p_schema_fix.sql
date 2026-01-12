-- Fix transactions table schema for P2P
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS from_wallet_id UUID REFERENCES wallets(id),
    ADD COLUMN IF NOT EXISTS to_wallet_id UUID REFERENCES wallets(id);
-- Ensure RLS policies exist for these new columns if needed, 
-- but existing policies on 'transactions' likely cover it if they use 'wallet_id' check?
-- Wait, the old policy was:
-- SELECT USING (auth.uid() IN (SELECT user_id FROM wallets WHERE id = from_wallet_id UNION ...))
-- That policy logic WAS ALREADY THERE in 20260105_p2p_wallet.sql, but the table creation failed/ignored.
-- So the policy might not exist or be broken.
-- Let's drop and recreate the policy to be safe.
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
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
            UNION
            -- Keep support for old wallet_id if used
            SELECT user_id
            FROM wallets
            WHERE id = wallet_id
        )
    );