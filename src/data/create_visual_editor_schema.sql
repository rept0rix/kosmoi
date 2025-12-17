-- Table to store visual edits made by the VisualEditAgent
-- "page_edits" stores overrides for specific elements on specific pages
CREATE TABLE IF NOT EXISTS public.page_edits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- The URL path where this edit applies (e.g., '/about', '/properties')
    page_path TEXT NOT NULL,
    -- unique selector ID (data-visual-selector-id or data-source-location)
    selector_id TEXT NOT NULL,
    -- Type of edit: 'text' (content), 'style' (classes), or 'image' (src)
    edit_type TEXT NOT NULL CHECK (
        edit_type IN ('content', 'style', 'image', 'component')
    ),
    -- The new value (JSONB allows flexibility for different edit types)
    -- content: { "text": "Hello" }
    -- style: { "classes": "text-red-500 p-4" }
    value JSONB NOT NULL,
    -- Status
    status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    -- Metadata
    user_id UUID REFERENCES auth.users(id),
    -- Ensure one active edit per element per property on a page
    UNIQUE(page_path, selector_id, edit_type)
);
-- Enable RLS
ALTER TABLE public.page_edits ENABLE ROW LEVEL SECURITY;
-- Policies (Public Read, Admin Write)
CREATE POLICY "Public can read published edits" ON public.page_edits FOR
SELECT USING (status = 'published');
CREATE POLICY "Admins can do everything" ON public.page_edits FOR ALL USING (
    auth.jwt()->>'email' = 'admin@kosmoi.com'
    OR auth.role() = 'service_role'
);
-- Audit trigger for updated_at
CREATE TRIGGER handle_updated_at BEFORE
UPDATE ON public.page_edits FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);