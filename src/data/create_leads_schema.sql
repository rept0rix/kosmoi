-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID REFERENCES service_providers(id),
    -- Link to the business found
    status TEXT DEFAULT 'new' CHECK (
        status IN ('new', 'contacted', 'converted', 'rejected')
    ),
    type TEXT DEFAULT 'cold_email',
    content TEXT,
    -- The AI generated draft
    email TEXT,
    -- The target email
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
-- Policy: Admins can do everything
CREATE POLICY "Admins can do everything on leads" ON leads FOR ALL USING (is_admin());
-- Policy: Authenticated users (Agents/Edge Functions) can insert
-- Note: Edge functions usually use Service Role, bypassing RLS, but good to have.
CREATE POLICY "Service Role can insert leads" ON leads FOR
INSERT WITH CHECK (true);