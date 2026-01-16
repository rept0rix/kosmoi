-- Enable Admins to view all transactions
-- This policy allows users with role 'admin' in metadata to SELECT all rows from transactions table.
CREATE POLICY "Admins can view all transactions" ON transactions FOR
SELECT USING (
        (auth.jwt()->>'role') = 'admin'
        OR ((auth.jwt()->'app_metadata')->>'role') = 'admin'
        OR ((auth.jwt()->'user_metadata')->>'role') = 'admin'
    );