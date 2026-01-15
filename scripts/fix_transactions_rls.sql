-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN EXISTS (
        SELECT 1
        FROM public.users
        WHERE id = auth.uid()
            AND role = 'admin'
    );
END;
$$;
-- Policy for Admins to view ALL transactions
CREATE POLICY "Admins can view all transactions" ON transactions FOR
SELECT USING (public.is_admin());
-- Policy for Users to view their OWN transactions (involved as sender or receiver)
-- This is likely missing too based on `debug_transactions.js` failure for anon (but anon shouldn't see anyway)
-- authenticated users need this.
CREATE POLICY "Users can view their own transactions" ON transactions FOR
SELECT USING (
        auth.uid() = (
            select user_id
            from wallets
            where id = transactions.wallet_id
        )
        OR auth.uid() = (
            select user_id
            from wallets
            where id = transactions.from_wallet_id
        )
        OR auth.uid() = (
            select user_id
            from wallets
            where id = transactions.to_wallet_id
        )
    );