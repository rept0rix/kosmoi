-- =========================================================
-- PART 1: FIX STATUS CONSTRAINT (Re-applying to allow 'new_lead')
-- =========================================================

ALTER TABLE service_providers DROP CONSTRAINT IF EXISTS service_providers_status_check;

ALTER TABLE service_providers 
ADD CONSTRAINT service_providers_status_check 
CHECK (status IN ('pending', 'active', 'inactive', 'rejected', 'new_lead', 'processing'));


-- =========================================================
-- PART 2: FIX SECURITY ADVISOR WARNINGS
-- =========================================================

-- 1. Fix "Function Search Path Mutable" for update_updated_at_column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Fix "Function Search Path Mutable" for update_provider_rating
CREATE OR REPLACE FUNCTION update_provider_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the service provider's average rating and total reviews
  UPDATE service_providers
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM reviews
      WHERE service_provider_id = COALESCE(NEW.service_provider_id, OLD.service_provider_id)
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews
      WHERE service_provider_id = COALESCE(NEW.service_provider_id, OLD.service_provider_id)
    )
  WHERE id = COALESCE(NEW.service_provider_id, OLD.service_provider_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Fix "RLS Disabled in Public" for spatial_ref_sys (PostGIS)
-- NOTE: This table is owned by the PostGIS extension/superuser. 
-- Standard users cannot modify it. We will skip this to avoid "must be owner" errors.
-- ALTER TABLE IF EXISTS "spatial_ref_sys" ENABLE ROW LEVEL SECURITY;

-- Note: Moving the 'postgis' extension to a different schema (like 'extensions') 
-- is recommended but can break existing queries that rely on 'public'. 
-- We will leave it for now to ensure stability.
