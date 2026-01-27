-- Create Goals Table
create table if not exists public.goals (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    text text not null,
    category text default 'Personal',
    completed boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- Enable RLS
alter table public.goals enable row level security;
-- Policies
create policy "Users can view their own goals" on public.goals for
select using (auth.uid() = user_id);
create policy "Users can create their own goals" on public.goals for
insert with check (auth.uid() = user_id);
create policy "Users can update their own goals" on public.goals for
update using (auth.uid() = user_id);
create policy "Users can delete their own goals" on public.goals for delete using (auth.uid() = user_id);
-- Add real-time
alter publication supabase_realtime
add table public.goals;