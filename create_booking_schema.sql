-- Create Bookings Table
create table if not exists public.bookings (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) not null,
    provider_id uuid references public.service_providers(id) not null,
    service_date date not null,
    start_time time not null,
    end_time time not null,
    status text check (
        status in ('pending', 'confirmed', 'cancelled', 'completed')
    ) default 'pending',
    service_type text,
    -- Optional: e.g., 'plumbing_inspection'
    price decimal(10, 2),
    -- Optional: Locked in price
    created_at timestamp with time zone default now()
);
-- Enable RLS
alter table public.bookings enable row level security;
-- Policies
-- Users can view their own bookings
create policy "Users can view their own bookings" on public.bookings for
select using (auth.uid() = user_id);
-- Users can insert their own bookings
create policy "Users can create their own bookings" on public.bookings for
insert with check (auth.uid() = user_id);
-- Service Providers (if they are users) - For now allow public read for availability check? 
-- No, availability check should be a function or different query.
-- But for "My Bookings" page for provider, they need access.
-- Let's assume provider_id matches auth.uid() if we had that link. 
-- For now, let's allow users to cancel their own bookings.
create policy "Users can cancel their own bookings" on public.bookings for
update using (auth.uid() = user_id) with check (status = 'cancelled');
-- Admin Policy (Assuming Supabase Admin/Service Role bypasses RLS, but for 'admin' role)
-- We'll add this later if we check strict roles.
-- Indexes for performance
create index idx_bookings_provider_date on public.bookings(provider_id, service_date);
create index idx_bookings_user on public.bookings(user_id);
-- Create Provider Slots Table (Availability)
create table if not exists public.provider_slots (
    id uuid primary key default gen_random_uuid(),
    provider_id uuid references public.service_providers(id) not null,
    day_of_week int check (
        day_of_week between 0 and 6
    ),
    -- 0 = Sunday
    start_time time not null,
    end_time time not null,
    is_active boolean default true,
    created_at timestamp with time zone default now()
);
-- Enable RLS
alter table public.provider_slots enable row level security;
-- Policies
create policy "Public read slots" on public.provider_slots for
select using (true);
-- Assuming we will link providers to users eventually:
-- create policy "Providers manage slots" on public.provider_slots for all using (auth.uid() = provider_id);