-- Create properties table
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL NOT NULL,
    location VARCHAR(255),
    agent_id UUID NOT NULL, -- Foreign key to agents table (assuming there is one)
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- e.g., active, inactive, pending
    type VARCHAR(10) CHECK (type IN ('sale', 'rent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create property_images table
CREATE TABLE property_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    url VARCHAR(255) NOT NULL
);

-- Enable Row Level Security (RLS) on both tables
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;

-- Create policy for properties table: Anyone can view active properties
CREATE POLICY properties_select_active ON properties
    FOR SELECT
    USING (status = 'active');

-- Create policy for properties table: Authenticated users can create properties
CREATE POLICY properties_insert ON properties
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Create policy for property_images table: Authenticated users can create images
CREATE POLICY property_images_insert ON property_images
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Create policy for property_images table: Anyone can select images related to active properties
CREATE POLICY property_images_select ON property_images
    FOR SELECT
    USING (property_id IN (SELECT id FROM properties WHERE status = 'active'));