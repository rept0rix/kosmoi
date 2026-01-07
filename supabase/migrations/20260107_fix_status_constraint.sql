-- 1. Drop existing constraint
ALTER TABLE public.service_providers DROP CONSTRAINT IF EXISTS service_providers_status_check;
-- 2. Add corrected constraint
ALTER TABLE public.service_providers
ADD CONSTRAINT service_providers_status_check CHECK (
        status IN (
            'pending',
            'active',
            'verified',
            'suspended',
            'rejected'
        )
    );