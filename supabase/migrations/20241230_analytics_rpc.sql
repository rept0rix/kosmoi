-- Migration: Add Analytics tracking for Service Providers
-- Run this in your Supabase SQL Editor
-- 1. Ensure columns exist (idempotent)
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'service_providers'
        AND column_name = 'views_count'
) THEN
ALTER TABLE service_providers
ADD COLUMN views_count INTEGER DEFAULT 0;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'service_providers'
        AND column_name = 'clicks_count'
) THEN
ALTER TABLE service_providers
ADD COLUMN clicks_count INTEGER DEFAULT 0;
END IF;
END $$;
-- 2. Create RPC function to atomic increment
CREATE OR REPLACE FUNCTION increment_provider_stats(p_id UUID, stat_type TEXT) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN IF stat_type = 'view' THEN
UPDATE service_providers
SET views_count = COALESCE(views_count, 0) + 1
WHERE id = p_id;
ELSIF stat_type = 'click' THEN
UPDATE service_providers
SET clicks_count = COALESCE(clicks_count, 0) + 1
WHERE id = p_id;
END IF;
END;
$$;