-- Add vibes_balance to wallets table
ALTER TABLE wallets
ADD COLUMN IF NOT EXISTS vibes_balance INTEGER DEFAULT 0;
-- Optional: Update existing wallets to have a starting vibe balance?
-- UPDATE wallets SET vibes_balance = 100 WHERE vibes_balance = 0;