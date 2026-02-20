-- Secure spatial_ref_sys by revoking public access
-- Since we cannot enable RLS (we are not owner) and cannot move the schema (extension limitation),
-- we will use standard GRANT/REVOKE to restrict access.
-- 1. Revoke generic public access
REVOKE ALL ON public.spatial_ref_sys
FROM PUBLIC;
REVOKE ALL ON public.spatial_ref_sys
FROM anon;
-- 2. Explicitly grant read access to authenticated users and service role
GRANT SELECT ON public.spatial_ref_sys TO authenticated;
GRANT SELECT ON public.spatial_ref_sys TO service_role;
-- Output confirmation
DO $$ BEGIN RAISE NOTICE 'Public access revoked from spatial_ref_sys. Authenticated and service_role have SELECT access.';
END $$;