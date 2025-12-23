-- Fix Transactions Table Schema
-- Adds missing columns that might have been skipped if table existed previously.
-- 1. Add reference_id
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS reference_id TEXT;
-- 2. Add metadata (just in case)
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
-- 3. Re-apply indexes just to be safe
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON public.transactions(wallet_id);