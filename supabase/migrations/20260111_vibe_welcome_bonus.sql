-- Update default Vibe balance for NEW wallets (Welcome Bonus)
ALTER TABLE wallets
ALTER COLUMN vibes_balance
SET DEFAULT 100;
-- Optional: Grant 100 Vibes to existing users who have 0?
-- UPDATE wallets SET vibes_balance = 100 WHERE vibes_balance = 0;