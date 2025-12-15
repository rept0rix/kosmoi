-- Create Workflows Table
create table if not exists public.workflows (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    name text not null,
    description text,
    graph_data jsonb default '{}'::jsonb,
    -- React Flow Nodes/Edges
    workflow_schema jsonb default '{}'::jsonb,
    -- Executable Schema
    user_id uuid references auth.users(id),
    status text default 'draft' -- draft, active, archived
);
-- Enable RLS
alter table public.workflows enable row level security;
-- Policies
create policy "Enable read access for all users" on public.workflows for
select using (true);
-- Relaxed for MVP/Demo purposes (or user_id = auth.uid())
create policy "Enable insert for authenticated users only" on public.workflows for
insert with check (auth.role() = 'authenticated');
create policy "Enable update for users based on user_id" on public.workflows for
update using (auth.uid() = user_id);
create policy "Enable delete for users based on user_id" on public.workflows for delete using (auth.uid() = user_id);
-- Add to Realtime
alter publication supabase_realtime
add table workflows;