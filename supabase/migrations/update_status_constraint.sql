-- Allow 'new_lead' and 'processing' statuses
ALTER TABLE service_providers DROP CONSTRAINT IF EXISTS service_providers_status_check;

ALTER TABLE service_providers 
ADD CONSTRAINT service_providers_status_check 
CHECK (status IN ('pending', 'active', 'inactive', 'rejected', 'new_lead', 'processing'));
