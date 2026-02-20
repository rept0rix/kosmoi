-- Enable RLS on the table (just in case)
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to INSERT into service_providers
-- This allows the "Vendor Signup" form to work without login.
CREATE POLICY "Allow public insert to service_providers"
ON service_providers
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anonymous users to SELECT their own records (optional, usually not needed for simple signup)
-- CREATE POLICY "Allow public select service_providers"
-- ON service_providers
-- FOR SELECT
-- TO anon
-- USING (true);
