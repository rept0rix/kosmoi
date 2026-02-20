-- Create table for agent memory
create table if not exists public.agent_memory (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  agent_id text not null,
  history jsonb default '[]'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, agent_id)
);

-- Enable RLS
alter table public.agent_memory enable row level security;

-- Create policies
create policy "Users can view their own agent memory"
  on public.agent_memory for select
  using (auth.uid() = user_id);

create policy "Users can insert/update their own agent memory"
  on public.agent_memory for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own agent memory"
  on public.agent_memory for update
  using (auth.uid() = user_id);
