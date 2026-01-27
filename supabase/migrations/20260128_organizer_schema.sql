-- 1. Trips Table
create table if not exists public.trips (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    name text not null default 'My Trip to Koh Samui',
    start_date date,
    end_date date,
    status text check (
        status in ('planning', 'active', 'completed', 'archived')
    ) default 'planning',
    cover_image text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- 2. Trip Items Table (The Itinerary)
create table if not exists public.trip_items (
    id uuid default gen_random_uuid() primary key,
    trip_id uuid references public.trips(id) on delete cascade not null,
    title text not null,
    type text check (
        type in (
            'booking',
            'place',
            'activity',
            'custom',
            'flight'
        )
    ) not null,
    -- References to other system entities (optional)
    reference_id uuid,
    -- e.g. booking_id or place_id
    -- Scheduling
    start_time timestamp with time zone,
    end_time timestamp with time zone,
    -- Location & Meta
    location_lat double precision,
    location_lng double precision,
    address text,
    notes text,
    position integer default 0,
    -- For manual ordering
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- 3. RLS Policies
-- Enable RLS
alter table public.trips enable row level security;
alter table public.trip_items enable row level security;
-- Policies for Trips
create policy "Users can view their own trips" on public.trips for
select using (auth.uid() = user_id);
create policy "Users can insert their own trips" on public.trips for
insert with check (auth.uid() = user_id);
create policy "Users can update their own trips" on public.trips for
update using (auth.uid() = user_id);
create policy "Users can delete their own trips" on public.trips for delete using (auth.uid() = user_id);
-- Policies for Trip Items
-- (Indirectly verified via trip owner)
create policy "Users can view items for their trips" on public.trip_items for
select using (
        exists (
            select 1
            from public.trips
            where trips.id = trip_items.trip_id
                and trips.user_id = auth.uid()
        )
    );
create policy "Users can insert items for their trips" on public.trip_items for
insert with check (
        exists (
            select 1
            from public.trips
            where trips.id = trip_items.trip_id
                and trips.user_id = auth.uid()
        )
    );
create policy "Users can update items for their trips" on public.trip_items for
update using (
        exists (
            select 1
            from public.trips
            where trips.id = trip_items.trip_id
                and trips.user_id = auth.uid()
        )
    );
create policy "Users can delete items for their trips" on public.trip_items for delete using (
    exists (
        select 1
        from public.trips
        where trips.id = trip_items.trip_id
            and trips.user_id = auth.uid()
    )
);