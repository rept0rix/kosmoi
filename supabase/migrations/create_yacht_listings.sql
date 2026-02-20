-- Create Yacht Listings Table
CREATE TABLE IF NOT EXISTS public.yacht_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price_thb DECIMAL(12, 2) NOT NULL,
    duration_hours INTEGER NOT NULL,
    image_url TEXT,
    is_verified BOOLEAN DEFAULT true,
    features JSONB DEFAULT '[]',
    max_guests INTEGER,
    category TEXT DEFAULT 'luxury',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.yacht_listings ENABLE ROW LEVEL SECURITY;

-- Allow Public Read
CREATE POLICY "Allow public read-only access to yacht_listings"
ON public.yacht_listings FOR SELECT
TO public
USING (true);

-- Insert Authentic Data
INSERT INTO public.yacht_listings (name, description, price_thb, duration_hours, max_guests, features, image_url)
VALUES 
(
    'The Samui Sovereign', 
    'A 70ft luxury motor yacht offering unparalleled stability and space. Perfect for large groups and exclusive family gatherings.',
    65000.00, 
    4, 
    25, 
    '["Private Chef", "Champagne Greeting", "Snorkeling Gear", "Jet Ski (Optional)"]',
    'https://images.unsplash.com/photo-1544433330-9485b3bb947b?auto=format&fit=crop&q=80&w=2000'
),
(
    'Ocean Whisper Catamaran', 
    'Sleek and modern catamaran designed for smooth sailing. Features an expansive sun deck and premium surround sound.',
    32000.00, 
    4, 
    12, 
    '["Open Bar", "Mediterranean Platter", "SUP Boards", "Sunset Deck"]',
    'https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?auto=format&fit=crop&q=80&w=2000'
),
(
    'Blue Horizon Sailing', 
    'Authentic sailing experience for those who love the wind. Traditional monohull with modern cabin luxuries.',
    22500.00, 
    6, 
    8, 
    '["Traditional Thai Meal", "Fishing Equipment", "Dinghy Access", "Local Guide"]',
    'https://images.unsplash.com/photo-1605281317010-fe5ffe798166?auto=format&fit=crop&q=80&w=2000'
);
