-- Add is_default column if it doesn't exist
ALTER TABLE crm_pipelines
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;
-- update the general sales pipeline to be default
UPDATE crm_pipelines
SET is_default = true
WHERE name = 'General Sales';