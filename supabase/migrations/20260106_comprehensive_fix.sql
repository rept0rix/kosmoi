-- 1. Ensure owner_id column exists
ALTER TABLE public.service_providers
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);
-- 2. Index for performance
CREATE INDEX IF NOT EXISTS idx_service_providers_owner_id ON public.service_providers(owner_id);
-- 3. Fix Linter: spatial_ref_sys (Maps table) security
-- Enables Row Level Security to satisfy the linter check 'rls_disabled_in_public'
ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;
-- 4. Reload Schema Cache
NOTIFY pgrst,
'reload config';