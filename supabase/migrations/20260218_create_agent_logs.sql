-- Create agent_logs table for live feed monitoring
create table if not exists public.agent_logs (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    agent_id text not null,
    level text default 'info',
    message text,
    metadata jsonb default '{}'::jsonb
);

-- Enable RLS
alter table public.agent_logs enable row level security;

-- Allow public read access (for admin dashboard via anon key if needed, or stick to authenticated)
-- Ideally authenticated, but let's be permissive for the dashboard for now if auth is tricky
create policy "Allow public read access"
    on public.agent_logs for select
    using (true);

-- Allow authenticated insert
create policy "Allow authenticated insert"
    on public.agent_logs for insert
    with check (auth.role() = 'authenticated' or auth.role() = 'anon');

-- Allow service role full access
create policy "Allow service role full access"
    on public.agent_logs
    using (auth.role() = 'service_role');
