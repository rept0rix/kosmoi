-- Create business_claims table
CREATE TABLE IF NOT EXISTS business_claims (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID REFERENCES service_providers(id) NOT NULL,
    user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
    -- Link to auth user
    claimer_name TEXT NOT NULL,
    claimer_contact TEXT NOT NULL,
    verification_method TEXT NOT NULL CHECK (
        verification_method IN ('document', 'social', 'email')
    ),
    verification_proof TEXT,
    -- URL to file or text content
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE business_claims ENABLE ROW LEVEL SECURITY;
-- Allow anyone to insert (public submission)
CREATE POLICY "Enable insert for all users" ON business_claims FOR
INSERT WITH CHECK (true);
-- Allow users to view their own claims
CREATE POLICY "Enable select for own claims" ON business_claims FOR
SELECT USING (auth.uid() = user_id);
-- Check if is_admin function exists, if not create a simple one or just a policy for specific email
-- For simplicity in this demo environment, we will allow read access to all authenticated users
-- (assuming the admin dashboard is just an authenticated user for now).
-- REAL WORL: Strictly limit to admin role.
CREATE POLICY "Enable read all for authenticated (Admin view)" ON business_claims FOR
SELECT USING (auth.role() = 'authenticated');