-- Create Roadmap Features Table
create table if not exists "public"."roadmap_features" (
    "id" uuid not null default gen_random_uuid(),
    "title" text not null,
    "description" text,
    "status" text not null default 'planned',
    -- 'planned', 'in_progress', 'live'
    "category" text default 'general',
    "votes" integer default 0,
    "eta" text,
    "created_at" timestamp with time zone default now(),
    primary key ("id")
);
-- Enable RLS
alter table "public"."roadmap_features" enable row level security;
-- Policies
create policy "Enable read access for all users" on "public"."roadmap_features" for
select using (true);
create policy "Enable insert for authenticated users only" on "public"."roadmap_features" for
insert to authenticated with check (true);
create policy "Enable update for authenticated users only" on "public"."roadmap_features" for
update to authenticated using (true);
-- RPC for secure voting (allows anon to increment)
create or replace function increment_vote(row_id uuid) returns void as $$ begin
update "public"."roadmap_features"
set votes = votes + 1
where id = row_id;
end;
$$ language plpgsql security definer;
-- Grant execute on function
grant execute on function increment_vote(uuid) to anon,
    authenticated,
    service_role;
-- Seed Data
insert into "public"."roadmap_features" (
        "title",
        "description",
        "status",
        "votes",
        "category",
        "eta"
    )
values (
        'Autonomous Billing',
        'Agents handle invoicing and commission collection automatically.',
        'planned',
        12,
        'finance',
        'Feb 2026'
    ),
    (
        'AI Receptionist (Voice)',
        'Voice-capable agent to answer phone calls for businesses.',
        'planned',
        45,
        'ai',
        'Mar 2026'
    ),
    (
        'Mobile App (iOS/Android)',
        'Native mobile experience for tourists.',
        'in_progress',
        89,
        'mobile',
        'Jan 2026'
    ),
    (
        'Crypto Payments',
        'Accept USDT/BTC for services.',
        'live',
        150,
        'finance',
        'Dec 2025'
    );