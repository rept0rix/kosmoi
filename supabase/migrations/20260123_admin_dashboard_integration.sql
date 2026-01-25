-- 1. Create public.users table (Mirror of auth.users)
create table if not exists public.users (
    id uuid references auth.users(id) on delete cascade primary key,
    email text unique not null,
    full_name text,
    avatar_url text,
    role text default 'user' check (role in ('user', 'admin', 'moderator')),
    status text default 'active' check (status in ('active', 'banned', 'suspended')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- Enable RLS
alter table public.users enable row level security;
-- Policies for public.users
create policy "Public profiles are viewable by everyone" on public.users for
select using (true);
create policy "Users can insert their own profile" on public.users for
insert with check (
        (
            select auth.uid()
        ) = id
    );
create policy "Users can update own profile" on public.users for
update using (
        (
            select auth.uid()
        ) = id
    );
-- 2. Sync Trigger (auth.users -> public.users)
create or replace function public.handle_new_user() returns trigger as $$ begin
insert into public.users (id, email, full_name, role)
values (
        new.id,
        new.email,
        new.raw_user_meta_data->>'full_name',
        coalesce(new.raw_user_meta_data->>'role', 'user')
    ) on conflict (id) do nothing;
return new;
end;
$$ language plpgsql security definer;
-- Trigger definition
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after
insert on auth.users for each row execute procedure public.handle_new_user();
-- 3. Backfill existing users (Safe to run multiple times due to ON CONFLICT)
insert into public.users (id, email, full_name)
select id,
    email,
    raw_user_meta_data->>'full_name'
from auth.users on conflict (id) do nothing;
-- 4. Admin Stats RPC
create or replace function get_admin_stats() returns json language plpgsql security definer as $$
declare total_users int;
total_businesses int;
active_subscriptions int;
mrr numeric;
begin
select count(*) into total_users
from public.users;
select count(*) into total_businesses
from public.service_providers;
-- Calculate MRR (Simulated logic: verified businesses pay $29)
select count(*) into active_subscriptions
from public.service_providers
where badge = 'verified';
mrr := active_subscriptions * 29;
return json_build_object(
    'totalUsers',
    total_users,
    'totalBusinesses',
    total_businesses,
    'activeSubscriptions',
    active_subscriptions,
    'mrr',
    mrr
);
end;
$$;
-- 5. Seed Data for Live Feed (Agent Logs)
-- Only insert if empty to avoid cluttering real logs
do $$ begin if not exists (
    select 1
    from public.agent_logs
    limit 1
) then
insert into public.agent_logs (agent_id, level, message, metadata)
values (
        'concierge',
        'info',
        'User checked in to Samui service hub',
        '{"role": "user", "username": "Guest_Visitor"}'
    ),
    (
        'concierge',
        'chat',
        'I need a plumber in Chaweng',
        '{"role": "user", "username": "Sarah_B"}'
    ),
    (
        'sales',
        'success',
        'Verified business document for "Samui Plumbers"',
        '{"role": "system"}'
    ),
    (
        'concierge',
        'chat',
        'Certainly! Here are top rated plumbers near you.',
        '{"role": "assistant", "username": "Concierge"}'
    ),
    (
        'system',
        'warning',
        'High query load detected on listings',
        '{"role": "system"}'
    );
end if;
end $$;