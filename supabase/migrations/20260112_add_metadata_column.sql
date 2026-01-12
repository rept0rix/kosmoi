alter table public.service_providers
add column if not exists metadata jsonb default '{}'::jsonb;