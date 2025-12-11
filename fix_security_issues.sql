-- 1. Secure spatial_ref_sys (Mitigation for "RLS Disabled in Public" and "Extension in Public")
-- The PostGIS extension does not support moving schemas via "SET SCHEMA".
-- Instead, we secure the sensitive table by removing public access.
-- Revoke generic public access
REVOKE ALL ON public.spatial_ref_sys
FROM PUBLIC;
REVOKE ALL ON public.spatial_ref_sys
FROM anon;
-- Explicitly grant read access to authenticated users and service role (if needed)
GRANT SELECT ON public.spatial_ref_sys TO authenticated;
GRANT SELECT ON public.spatial_ref_sys TO service_role;
-- 2. Fix "Function Search Path Mutable" warnings
-- We secure these functions by explicitly setting their search_path to 'public'.
-- This prevents malicious code from overriding behavior by manipulating the search path.
-- Fix update_updated_at_column
ALTER FUNCTION public.update_updated_at_column()
SET search_path = public;
-- Fix update_provider_rating
-- Using a dynamic block to handle potential variations in function arguments
DO $$
DECLARE r RECORD;
BEGIN FOR r IN
SELECT oid::regprocedure as func_signature
FROM pg_proc
WHERE proname = 'update_provider_rating'
    AND pronamespace = 'public'::regnamespace LOOP EXECUTE 'ALTER FUNCTION ' || r.func_signature || ' SET search_path = public;';
END LOOP;
END;
$$;