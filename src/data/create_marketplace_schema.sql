-- Create marketplace_categories table
CREATE TABLE marketplace_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    parent_id UUID REFERENCES marketplace_categories(id),
    icon VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Create marketplace_items table
CREATE TABLE marketplace_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID REFERENCES auth.users(id) NOT NULL,
    category_id UUID REFERENCES marketplace_categories(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(12, 2) NOT NULL,
    location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active' CHECK (
        status IN ('active', 'sold', 'pending', 'inactive')
    ),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Create marketplace_images table
CREATE TABLE marketplace_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES marketplace_items(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE marketplace_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_images ENABLE ROW LEVEL SECURITY;
-- Policies for Categories (Public Read, Admin Write)
CREATE POLICY "Public categories are viewable by everyone" ON marketplace_categories FOR
SELECT USING (true);
-- Policies for Items
CREATE POLICY "Public items are viewable by everyone" ON marketplace_items FOR
SELECT USING (status = 'active');
CREATE POLICY "Users can insert their own items" ON marketplace_items FOR
INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Users can update their own items" ON marketplace_items FOR
UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "Users can delete their own items" ON marketplace_items FOR DELETE USING (auth.uid() = seller_id);
-- Policies for Images
CREATE POLICY "Public images are viewable by everyone" ON marketplace_images FOR
SELECT USING (true);
CREATE POLICY "Users can insert images for their items" ON marketplace_images FOR
INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM marketplace_items
            WHERE id = marketplace_images.item_id
                AND seller_id = auth.uid()
        )
    );
-- Seed Categories
INSERT INTO marketplace_categories (name, slug, icon)
VALUES ('Vehicles', 'vehicles', 'Car'),
    ('Electronics', 'electronics', 'Smartphone'),
    ('Furniture', 'furniture', 'Sofa'),
    ('Fashion', 'fashion', 'Shirt'),
    ('Property (Rent/Sale)', 'property', 'Home'),
    -- Will link to Real Estate Hub
    ('Hobbies & Sports', 'hobbies', 'Activity'),
    ('Services', 'services', 'Briefcase'),
    ('Others', 'others', 'Box');