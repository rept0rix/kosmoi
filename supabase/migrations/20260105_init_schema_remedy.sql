-- 1. Create service_providers table (if not exists)
create table if not exists public.service_providers (
    id uuid not null default gen_random_uuid(),
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone default now(),
    business_name text not null,
    description text,
    category text,
    sub_category text,
    super_category text,
    location text,
    phone text,
    website text,
    email text,
    status text default 'active',
    verified boolean default false,
    average_rating numeric,
    user_ratings_total integer,
    google_place_id text,
    images text [],
    source_url text unique,
    metadata jsonb default '{}'::jsonb,
    constraint service_providers_pkey primary key (id)
);
-- 2. Enable RLS
alter table public.service_providers enable row level security;
-- 3. Policies for service_providers
create policy "Public providers are viewable by everyone" on public.service_providers for
select using (true);
create policy "Admins can insert providers" on public.service_providers for
insert with check (true);
-- In prod, you might restrict this to authenticated users or specific roles
create policy "Admins can update providers" on public.service_providers for
update using (true);
-- 4. Create provider-images bucket (storage)
-- Note: Buckets are usually created via API/Dashboard, but this ensures RLS policy exists if bucket exists
insert into storage.buckets (id, name, public)
values ('provider-images', 'provider-images', true) on conflict (id) do nothing;
create policy "Public Access to Provider Images" on storage.objects for
select using (bucket_id = 'provider-images');
create policy "Auth users can upload images" on storage.objects for
insert with check (bucket_id = 'provider-images');
-- 5. Fix for Security Issue (spatial_ref_sys)
REVOKE ALL ON TABLE public.spatial_ref_sys
FROM anon,
    authenticated;
REVOKE ALL ON TABLE public.spatial_ref_sys
FROM PUBLIC;