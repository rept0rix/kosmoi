-- Create Marketplace Listings Table
CREATE TABLE IF NOT EXISTS marketplace_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'THB',
    category_id TEXT NOT NULL,
    subcategory TEXT,
    location_name TEXT,
    latitude FLOAT,
    longitude FLOAT,
    images JSONB DEFAULT '[]'::jsonb,
    -- Array of { url: string }
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'hidden', 'draft')),
    contact_info JSONB DEFAULT '{}'::jsonb,
    -- Phone, Line ID, etc.
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
-- Policies
CREATE POLICY "Public can view active listings" ON marketplace_listings FOR
SELECT USING (status = 'active');
CREATE POLICY "Users can create listings" ON marketplace_listings FOR
INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Users can update own listings" ON marketplace_listings FOR
UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "Users can delete own listings" ON marketplace_listings FOR DELETE USING (auth.uid() = seller_id);
-- Indexes
CREATE INDEX idx_marketplace_category ON marketplace_listings(category_id);
CREATE INDEX idx_marketplace_status ON marketplace_listings(status);
CREATE INDEX idx_marketplace_seller ON marketplace_listings(seller_id);
CREATE INDEX idx_marketplace_location ON marketplace_listings USING GIST (
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
);