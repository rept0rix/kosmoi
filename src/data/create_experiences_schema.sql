-- Create experiences table
CREATE TABLE IF NOT EXISTS experiences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    duration TEXT,
    -- e.g. "2 hours", "Full Day"
    location TEXT,
    category TEXT CHECK (
        category IN (
            'adventure',
            'food',
            'culture',
            'nature',
            'nightlife'
        )
    ),
    image_url TEXT,
    rating DECIMAL(2, 1) DEFAULT 0,
    reviews_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Create experience_bookings table
CREATE TABLE IF NOT EXISTS experience_bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    experience_id UUID REFERENCES experiences(id) NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    booking_date TIMESTAMP WITH TIME ZONE NOT NULL,
    guests INT DEFAULT 1,
    total_price DECIMAL(10, 2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (
        status IN ('pending', 'confirmed', 'cancelled', 'completed')
    ),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience_bookings ENABLE ROW LEVEL SECURITY;
-- Policies for experiences
-- Public read access
CREATE POLICY "Public can view experiences" ON experiences FOR
SELECT USING (true);
-- Admin/Provider write access (simplified to authenticated for demo, ideally restrict to admin)
CREATE POLICY "Auth users can insert experiences" ON experiences FOR
INSERT WITH CHECK (auth.role() = 'authenticated');
-- Policies for bookings
-- Users can see their own bookings
CREATE POLICY "Users can view own bookings" ON experience_bookings FOR
SELECT USING (auth.uid() = user_id);
-- Users can create bookings
CREATE POLICY "Users can create bookings" ON experience_bookings FOR
INSERT WITH CHECK (auth.uid() = user_id);