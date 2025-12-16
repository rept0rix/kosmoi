-- Add geolocation columns to service_providers if they don't exist
ALTER TABLE service_providers
ADD COLUMN IF NOT EXISTS current_lat FLOAT,
    ADD COLUMN IF NOT EXISTS current_lng FLOAT,
    ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ DEFAULT NOW();
-- Create service_requests table if not exists (for dispatch)
CREATE TABLE IF NOT EXISTS service_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    provider_id UUID REFERENCES service_providers(id),
    service_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    -- pending, accepted, completed, cancelled
    price DECIMAL(10, 2),
    location_lat FLOAT,
    location_lng FLOAT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
-- Policy: Providers can view requests assigned to them
CREATE POLICY "Providers can view assigned requests" ON service_requests FOR
SELECT USING (
        auth.uid() IN (
            SELECT user_id
            FROM service_providers
            WHERE id = provider_id
        )
    );
-- Policy: Users can view their own requests
CREATE POLICY "Users can view own requests" ON service_requests FOR
SELECT USING (auth.uid() = user_id);