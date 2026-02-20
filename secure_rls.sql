-- ==============================================================================
-- KOSMOI SECURITY PROTOCOL: ROW LEVEL SECURITY (RLS)
-- ==============================================================================
-- This script enforces strict data isolation.
-- "Authentication is only half the story. You also need to make sure users can only see their own data."

-- 1. PROFILES (User Identity)
-- ------------------------------------------------------------------------------
-- Ensure table exists (Standard Supabase Pattern)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  website text,
  
  constraint username_length check (char_length(username) >= 3)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile.
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

-- Policy: Users can update their own profile.
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Policy: Public profiles (Optional - if we want public user pages)
-- UNCOMMENT IF NEEDED:
-- CREATE POLICY "Public profiles are viewable by everyone" 
-- ON profiles FOR SELECT 
-- USING ( true ); 


-- 2. SERVICE PROVIDERS (Business Data)
-- ------------------------------------------------------------------------------
-- Enable RLS
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view providers (Public Directory)
CREATE POLICY "Public providers are viewable by everyone" 
ON service_providers FOR SELECT 
USING ( true );

-- Policy: Only the OWNER can update their listing
-- (Assumes 'owner_id' column exists. If not, this is a no-op until column added)
-- CREATE POLICY "Owners can update their own provider listing" 
-- ON service_providers FOR UPDATE 
-- USING ( auth.uid() = owner_id );

-- Policy: Allow Anon Insert (for Signup Flow) - TEMPORARY / PROTOTYPE
-- ideally, we should require auth for insert.
CREATE POLICY "Allow anon insert for onboarding" 
ON service_providers FOR INSERT 
WITH CHECK ( true );


-- 3. BOOKINGS / ORDERS (Transactional Data)
-- ------------------------------------------------------------------------------
-- Ensure table exists
CREATE TABLE IF NOT EXISTS bookings (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users not null, -- The Customer
  provider_id uuid references service_providers not null, -- The Business
  status text default 'pending',
  details jsonb
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own bookings
CREATE POLICY "Users can view own bookings" 
ON bookings FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Users can create bookings
CREATE POLICY "Users can insert bookings" 
ON bookings FOR INSERT 
WITH CHECK (auth.uid() = user_id);
