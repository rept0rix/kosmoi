-- Create 'ads' table
CREATE TABLE IF NOT EXISTS ads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID REFERENCES service_providers(id) ON DELETE CASCADE,
    headline TEXT NOT NULL,
    content TEXT,
    cta_text TEXT DEFAULT 'View Offer',
    cta_link TEXT,
    keywords TEXT [] DEFAULT '{}',
    radius_km INTEGER DEFAULT 50,
    -- Default wide radius
    bid_amount FLOAT DEFAULT 1.0,
    -- Placeholder for future bidding
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'exhausted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Create 'ad_impressions' table for analytics
CREATE TABLE IF NOT EXISTS ad_impressions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ad_id UUID REFERENCES ads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE
    SET NULL,
        -- Optional (might be anon)
        event_type TEXT CHECK (event_type IN ('view', 'click')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_impressions ENABLE ROW LEVEL SECURITY;
-- Policies for 'ads'
-- Anyone can read active ads
CREATE POLICY "Public can view active ads" ON ads FOR
SELECT USING (status = 'active');
-- Service Providers can manage their own ads
CREATE POLICY "Providers manage own ads" ON ads FOR ALL USING (
    auth.uid() IN (
        SELECT owner_id
        FROM service_providers
        WHERE id = ads.provider_id
    )
);
-- Policies for 'ad_impressions'
-- Public (anon) can insert impressions (views/clicks)
CREATE POLICY "Public can insert impressions" ON ad_impressions FOR
INSERT WITH CHECK (true);
-- Only providers see their own stats
CREATE POLICY "Providers view own stats" ON ad_impressions FOR
SELECT USING (
        auth.uid() IN (
            SELECT sp.owner_id
            FROM service_providers sp
                JOIN ads ON ads.provider_id = sp.id
            WHERE ads.id = ad_impressions.ad_id
        )
    );
-- Indexes for performance
CREATE INDEX idx_ads_keywords ON ads USING GIN(keywords);
CREATE INDEX idx_ads_provider ON ads(provider_id);
CREATE INDEX idx_impressions_ad_id ON ad_impressions(ad_id);
-- Seed some sample ads for testing
INSERT INTO ads (
        provider_id,
        headline,
        content,
        cta_text,
        keywords,
        status
    )
SELECT id,
    'Best Service in Samui!',
    'Get 10% off your first booking when you mention AI Chat.',
    'Claim Offer',
    ARRAY ['food', 'pizza', 'taxi', 'massage', 'relax'],
    -- Generic keywords for testing
    'active'
FROM service_providers
ORDER BY created_at DESC
LIMIT 3;
-- Give first 3 providers an ad