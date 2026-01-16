-- 1. Add provider_id to board_meetings to link chats to businesses
alter table "public"."board_meetings"
add column if not exists "provider_id" uuid references "public"."service_providers"("id");
-- 2. Create Business Settings table for AI configuration
create table if not exists "public"."business_settings" (
    "provider_id" uuid not null references "public"."service_providers"("id"),
    "ai_auto_reply" boolean default false,
    "ai_tone" text default 'professional',
    -- 'professional', 'friendly', 'enthusiastic'
    "custom_instructions" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    primary key ("provider_id")
);
-- 3. RLS for Business Settings
alter table "public"."business_settings" enable row level security;
-- Allow public read (so the Agent/UI can see settings) - strictly speaking only owner needs write, agent needs read
create policy "Enable read access for all users" on "public"."business_settings" for
select using (true);
create policy "Enable insert/update for owners" on "public"."business_settings" for all using (
    auth.uid() = (
        select user_id
        from service_providers
        where id = provider_id
    )
);
-- 4. Seed some settings for testing (Optional)
-- (We'll do this via the UI or manual script later)