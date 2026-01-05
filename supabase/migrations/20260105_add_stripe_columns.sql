-- Add Stripe Connect columns to service_providers
ALTER TABLE public.service_providers
ADD COLUMN IF NOT EXISTS stripe_account_id text,
    ADD COLUMN IF NOT EXISTS stripe_status text DEFAULT 'uninitialized';
-- Update RLS policies to allow Admins to view/edit these (already covered by existing Admin policies if they use 'true')
-- But let's be explicit if needed. Existing policies are:
-- "Admins can insert providers" WITH CHECK (true)
-- "Admins can update providers" USING (true)
-- "Public providers are viewable by everyone" USING (true)
-- We might want to protect stripe_account_id from public view strictly, 
-- but for now, the existing "Public Select" selects * (all columns).
-- Ideally, we should restrict sensitive columns, but stripe_account_id itself isn't super sensitive (it's public in many OAuth flows).
-- However, let's keep it simple for now as per the "Speed" requirement.