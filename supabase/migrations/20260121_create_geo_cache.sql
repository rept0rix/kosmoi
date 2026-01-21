CREATE TABLE IF NOT EXISTS geo_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    address_en TEXT,
    address_th TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(latitude, longitude)
);
CREATE INDEX IF NOT EXISTS idx_geo_cache_lat_lng ON geo_cache(latitude, longitude);
-- Add RLS but allow public read for now since it's just address data, 
-- or restrict if needed. For Edge Functions (Service Role), RLS doesn't matter as much.
ALTER TABLE geo_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON geo_cache FOR
SELECT USING (true);
CREATE POLICY "Allow service role full access" ON geo_cache USING (true) WITH CHECK (true);