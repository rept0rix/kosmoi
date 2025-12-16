-- Allow public access to 'new_lead' service providers
-- Allows anyone (including unauthenticated users) to view providers with 'active' OR 'new_lead' status.
DROP POLICY IF EXISTS "Anyone can view active service providers" ON service_providers;
-- Create new policy
CREATE POLICY "Anyone can view active and new_lead service providers" ON service_providers FOR
SELECT USING (
        status IN ('active', 'new_lead')
        OR auth.uid() IS NOT NULL
    );