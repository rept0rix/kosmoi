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
-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Board Meetings Table
CREATE TABLE IF NOT EXISTS board_meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    status TEXT CHECK (status IN ('active', 'archived', 'paused')) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    summary TEXT
);

-- 2. Board Participants Table
CREATE TABLE IF NOT EXISTS board_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID REFERENCES board_meetings(id) ON DELETE CASCADE,
    agent_id TEXT NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(meeting_id, agent_id)
);

-- 3. Board Messages Table
CREATE TABLE IF NOT EXISTS board_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID REFERENCES board_meetings(id) ON DELETE CASCADE,
    agent_id TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT CHECK (type IN ('text', 'proposal', 'vote', 'task_created')) DEFAULT 'text',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Agent Tasks Table
CREATE TABLE IF NOT EXISTS agent_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    assigned_to TEXT, -- Agent ID or 'HUMAN_USER'
    status TEXT CHECK (status IN ('pending', 'in_progress', 'review', 'done')) DEFAULT 'pending',
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    created_by TEXT,
    meeting_id UUID REFERENCES board_meetings(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE board_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies (Allow all for now for development simplicity, or restrict as needed)
-- In a real app, you'd restrict based on user_id if these were user-specific boards.
-- Assuming this is a single-tenant or admin-only tool for now:

CREATE POLICY "Enable read access for all users" ON board_meetings FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON board_meetings FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON board_meetings FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON board_participants FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON board_participants FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON board_messages FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON board_messages FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON agent_tasks FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON agent_tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON agent_tasks FOR UPDATE USING (true);

-- Enable Realtime for these tables
alter publication supabase_realtime add table board_meetings;
alter publication supabase_realtime add table board_messages;
alter publication supabase_realtime add table agent_tasks;
-- Create table for agent memory
create table if not exists public.agent_memory (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  agent_id text not null,
  history jsonb default '[]'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, agent_id)
);

-- Enable RLS
alter table public.agent_memory enable row level security;

-- Create policies
create policy "Users can view their own agent memory"
  on public.agent_memory for select
  using (auth.uid() = user_id);

create policy "Users can insert/update their own agent memory"
  on public.agent_memory for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own agent memory"
  on public.agent_memory for update
  using (auth.uid() = user_id);
-- Full Reset: Drop table and all dependencies to ensure clean slate
drop table if exists agent_approvals cascade;

-- Table for storing tool calls requiring user approval
create table agent_approvals (
  id uuid default gen_random_uuid() primary key,
  agent_id text not null,
  tool_name text not null,
  payload jsonb not null,
  reasoning text,
  status text check (status in ('pending', 'approved', 'rejected', 'failed')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id)
);

-- RLS Policies
alter table agent_approvals enable row level security;

create policy "Users can view their own approvals"
  on agent_approvals for select
  using (auth.uid() = user_id);

create policy "Users can update their own approvals"
  on agent_approvals for update
  using (auth.uid() = user_id);

create policy "Users can insert approvals"
  on agent_approvals for insert
  with check (auth.uid() = user_id);

-- Realtime (Safe Add)
-- Realtime (Safe Add)
-- Note: If this fails with "duplicate object", it's fine.
alter publication supabase_realtime add table agent_approvals;
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
