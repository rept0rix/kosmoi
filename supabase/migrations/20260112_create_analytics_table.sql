-- Create Business Analytics table
create table if not exists "public"."business_analytics" (
    "id" uuid not null default gen_random_uuid(),
    "provider_id" uuid not null references "public"."service_providers"("id"),
    "event_type" text not null,
    -- 'page_view', 'phone_click', 'whatsapp_click'
    "visitor_id" text,
    -- Anonymous ID or User ID
    "metadata" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now(),
    primary key ("id")
);
-- Enable RLS
alter table "public"."business_analytics" enable row level security;
-- Policies
-- 1. Allow public to insert events (tracking)
create policy "Enable insert for all users" on "public"."business_analytics" for
insert with check (true);
-- 2. Allow business owners to see THEIR analytics
create policy "Enable read for owners" on "public"."business_analytics" for
select using (
        auth.uid() = (
            select user_id
            from service_providers
            where id = provider_id
        )
    );
-- 3. Allow admins (service role) to see all
-- (Service role bypasses RLS, but explicit policy is fine too if needed for authenticated admins)
-- OPTIONAL: Create a view or function for aggregation to make charts faster
-- For now, we will query raw data or simplified counts on the client/edge.