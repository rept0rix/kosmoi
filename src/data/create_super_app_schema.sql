-- Super App Schema (Real Estate & Experiences)
-- 1. Real Estate Properties
CREATE TABLE IF NOT EXISTS properties (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(12, 2),
    location TEXT,
    type TEXT,
    -- 'sale', 'rent'
    agent_id UUID,
    -- Can be linked to auth.users or a separate agents table
    status TEXT DEFAULT 'active',
    -- 'active', 'sold', 'rented'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- 2. Property Images
CREATE TABLE IF NOT EXISTS property_images (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- 3. Experiences / Tours
CREATE TABLE IF NOT EXISTS experiences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2),
    duration TEXT,
    -- e.g., '4 Hours', 'Full Day'
    category TEXT,
    -- 'Adventure', 'Nature', 'Culture'
    location TEXT,
    image_url TEXT,
    rating DECIMAL(2, 1),
    reviews_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;
-- Simple Policies (Admin/Public Access)
-- Allow read access to everyone (public catalog)
CREATE POLICY "Public read access" ON properties FOR
SELECT USING (true);
CREATE POLICY "Public read access" ON property_images FOR
SELECT USING (true);
CREATE POLICY "Public read access" ON experiences FOR
SELECT USING (true);
-- Allow write access to authenticated users (simulating admin/agents)
CREATE POLICY "Auth write access" ON properties FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth write access" ON property_images FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth write access" ON experiences FOR ALL TO authenticated USING (true) WITH CHECK (true);