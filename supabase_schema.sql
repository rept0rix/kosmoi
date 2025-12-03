-- Samui Service Hub Database Schema for Supabase
-- Run this SQL in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS for location queries (optional but recommended)
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================
-- SERVICE PROVIDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS service_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_name TEXT NOT NULL,
  description TEXT,
  phone TEXT,
  location TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  super_category TEXT,
  sub_category TEXT,
  category TEXT,
  average_rating DECIMAL(3, 2) DEFAULT 0 CHECK (average_rating >= 0 AND average_rating <= 5),
  total_reviews INTEGER DEFAULT 0 CHECK (total_reviews >= 0),
  price_range TEXT CHECK (price_range IN ('budget', 'moderate', 'premium')),
  verified BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive', 'rejected')),
  google_place_id TEXT UNIQUE,
  images TEXT[],
  website TEXT,
  email TEXT,
  opening_hours JSONB,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for service_providers
CREATE INDEX IF NOT EXISTS idx_service_providers_status ON service_providers(status);
CREATE INDEX IF NOT EXISTS idx_service_providers_verified ON service_providers(verified);
CREATE INDEX IF NOT EXISTS idx_service_providers_super_category ON service_providers(super_category);
CREATE INDEX IF NOT EXISTS idx_service_providers_sub_category ON service_providers(sub_category);
CREATE INDEX IF NOT EXISTS idx_service_providers_category ON service_providers(category);
CREATE INDEX IF NOT EXISTS idx_service_providers_rating ON service_providers(average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_service_providers_created_by ON service_providers(created_by);

-- Spatial index for location-based queries (if PostGIS is enabled)
-- CREATE INDEX IF NOT EXISTS idx_service_providers_location ON service_providers USING GIST(
--   ll_to_earth(latitude, longitude)
-- );

-- ============================================
-- REVIEWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_provider_id UUID NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_name TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  images TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for reviews
CREATE INDEX IF NOT EXISTS idx_reviews_provider ON reviews(service_provider_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- ============================================
-- FAVORITES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_provider_id UUID NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, service_provider_id)
);

-- Indexes for favorites
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_provider ON favorites(service_provider_id);

-- ============================================
-- SEARCH HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  search_query TEXT NOT NULL,
  filters JSONB,
  results_count INTEGER,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for search_history
CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_date ON search_history(created_date DESC);
CREATE INDEX IF NOT EXISTS idx_search_history_query ON search_history(search_query);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for service_providers
DROP TRIGGER IF EXISTS update_service_providers_updated_at ON service_providers;
CREATE TRIGGER update_service_providers_updated_at
  BEFORE UPDATE ON service_providers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for reviews
DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTION TO UPDATE PROVIDER RATINGS
-- ============================================

-- Function to recalculate provider rating when review is added/updated/deleted
CREATE OR REPLACE FUNCTION update_provider_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the service provider's average rating and total reviews
  UPDATE service_providers
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM reviews
      WHERE service_provider_id = COALESCE(NEW.service_provider_id, OLD.service_provider_id)
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews
      WHERE service_provider_id = COALESCE(NEW.service_provider_id, OLD.service_provider_id)
    )
  WHERE id = COALESCE(NEW.service_provider_id, OLD.service_provider_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic rating updates
DROP TRIGGER IF EXISTS update_rating_on_review_insert ON reviews;
CREATE TRIGGER update_rating_on_review_insert
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_provider_rating();

DROP TRIGGER IF EXISTS update_rating_on_review_update ON reviews;
CREATE TRIGGER update_rating_on_review_update
  AFTER UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_provider_rating();

DROP TRIGGER IF EXISTS update_rating_on_review_delete ON reviews;
CREATE TRIGGER update_rating_on_review_delete
  AFTER DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_provider_rating();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

-- Service Providers Policies
-- Anyone can read active providers
CREATE POLICY "Anyone can view active service providers"
  ON service_providers FOR SELECT
  USING (status = 'active' OR auth.uid() IS NOT NULL);

-- Authenticated users can create providers
CREATE POLICY "Authenticated users can create providers"
  ON service_providers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = created_by);

-- Users can update their own providers
CREATE POLICY "Users can update their own providers"
  ON service_providers FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = created_by);

-- Users can delete their own providers
CREATE POLICY "Users can delete their own providers"
  ON service_providers FOR DELETE
  TO authenticated
  USING (auth.uid()::text = created_by);

-- Reviews Policies
-- Anyone can read reviews
CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  USING (true);

-- Authenticated users can create reviews
CREATE POLICY "Authenticated users can create reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update their own reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews"
  ON reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Favorites Policies
-- Users can only see their own favorites
CREATE POLICY "Users can view their own favorites"
  ON favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can create their own favorites
CREATE POLICY "Users can create favorites"
  ON favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own favorites
CREATE POLICY "Users can delete their own favorites"
  ON favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Search History Policies
-- Users can only see their own search history
CREATE POLICY "Users can view their own search history"
  ON search_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can create search history
CREATE POLICY "Users can create search history"
  ON search_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own search history
CREATE POLICY "Users can delete their own search history"
  ON search_history FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Uncomment to insert sample data
/*
INSERT INTO service_providers (
  business_name,
  description,
  phone,
  location,
  latitude,
  longitude,
  super_category,
  sub_category,
  average_rating,
  total_reviews,
  verified,
  status,
  images
) VALUES
  (
    'Samui Plumbing Services',
    'Professional plumbing services in Koh Samui',
    '+66 12 345 6789',
    'Chaweng, Koh Samui',
    9.5381,
    100.0564,
    'fix',
    'plumber',
    4.5,
    12,
    true,
    'active',
    ARRAY['https://example.com/image1.jpg']
  ),
  (
    'Island Electricians',
    'Licensed electricians serving all of Koh Samui',
    '+66 98 765 4321',
    'Lamai, Koh Samui',
    9.5137,
    100.0512,
    'fix',
    'electrician',
    4.8,
    25,
    true,
    'active',
    ARRAY['https://example.com/image2.jpg']
  );
*/

-- ============================================
-- HELPFUL QUERIES
-- ============================================

-- Get all active providers with their ratings
-- SELECT * FROM service_providers WHERE status = 'active' ORDER BY average_rating DESC;

-- Get providers near a location (requires PostGIS)
-- SELECT *, earth_distance(
--   ll_to_earth(latitude, longitude),
--   ll_to_earth(9.5297, 100.0626)
-- ) / 1000 AS distance_km
-- FROM service_providers
-- WHERE status = 'active'
-- ORDER BY distance_km
-- LIMIT 10;

-- Get provider with reviews
-- SELECT 
--   sp.*,
--   json_agg(r.*) AS reviews
-- FROM service_providers sp
-- LEFT JOIN reviews r ON r.service_provider_id = sp.id
-- WHERE sp.id = 'your-provider-id'
-- GROUP BY sp.id;
