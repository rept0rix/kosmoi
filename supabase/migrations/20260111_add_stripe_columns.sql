-- Add missing Stripe columns to service_providers
ALTER TABLE service_providers
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
    ADD COLUMN IF NOT EXISTS stripe_status TEXT DEFAULT 'unverified';
-- Create index for faster webhook lookups
CREATE INDEX IF NOT EXISTS idx_service_providers_stripe_account_id ON service_providers(stripe_account_id);