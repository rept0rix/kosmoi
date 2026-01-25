-- 1. Create Roadmap Items Table (Replacing AdminRoadmap.jsx static HTML)
create table if not exists public.roadmap_items (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    status text check (
        status in (
            'planned',
            'in-progress',
            'completed',
            'cancelled'
        )
    ),
    date_range text,
    -- Keeping as text for flexibility "Jan 1 - Jan 7" or real dates
    description text,
    position integer default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.roadmap_items enable row level security;
create policy "Roadmap public read" on public.roadmap_items for
select using (true);
create policy "Admins manage roadmap" on public.roadmap_items for all using (true);
-- Simplified
-- 2. Seed Roadmap Data (The "Real" Journey)
insert into public.roadmap_items (title, status, date_range, description, position)
values (
        'Week 1: Foundation & Revenue',
        'completed',
        'Jan 1 - Jan 7',
        'Fixing Admin Dashboard, Refining Pricing Pages (35฿/1500฿), and Verifying Stripe End-to-End.',
        1
    ),
    (
        'Week 2: The Growth Engine',
        'in-progress',
        'Jan 8 - Jan 14',
        'Activating "Sales Coordinator" Agent, Polish Invitation System, and Mobile View Optimization.',
        2
    ),
    (
        'Week 3: Product Value & Retention',
        'planned',
        'Jan 15 - Jan 21',
        'AI Receptionist Alpha (Auto-reply), Analytics Dashboard Upgrade (ROI Reports).',
        3
    ),
    (
        'Week 4: Scale & Automation',
        'planned',
        'Jan 22 - Jan 31',
        'Autonomous Billing, Commission Engine (8-15%), and full Security Immune System.',
        4
    );
-- 3. Seed Bookings (Populate AdminBookings.jsx)
-- Need valid user_ids and service_provider_ids.
-- We will select random ones from existing tables or insert dummies if empty.
do $$
declare v_user_id uuid;
v_provider_id uuid;
begin -- Get a user (or the first one)
select id into v_user_id
from public.users
limit 1;
-- Get a provider
select id into v_provider_id
from public.service_providers
limit 1;
-- If we have both, insert bookings
if v_user_id is not null
and v_provider_id is not null then
insert into public.bookings (
        user_id,
        service_provider_id,
        service_type,
        service_date,
        status,
        total_amount
    )
values (
        v_user_id,
        v_provider_id,
        'Airport Transfer (SUV)',
        now() + interval '1 day',
        'confirmed',
        1200
    ),
    (
        v_user_id,
        v_provider_id,
        'Full Day Island Tour',
        now() + interval '3 days',
        'pending',
        3500
    ),
    (
        v_user_id,
        v_provider_id,
        'Sunset Dinner Reservation',
        now() - interval '2 days',
        'completed',
        4500
    );
end if;
end $$;