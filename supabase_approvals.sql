-- Full Reset: Drop table and all dependencies to ensure clean slate
drop table if exists agent_approvals cascade;

-- Table for storing tool calls requiring user approval
create table agent_approvals (
  id uuid default gen_random_uuid() primary key,
  agent_id text not null,
  tool_name text not null,
  payload jsonb not null,
  reasoning text,
  status text check (status in ('pending', 'approved', 'rejected', 'failed')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id)
);

-- RLS Policies
alter table agent_approvals enable row level security;

create policy "Users can view their own approvals"
  on agent_approvals for select
  using (auth.uid() = user_id);

create policy "Users can update their own approvals"
  on agent_approvals for update
  using (auth.uid() = user_id);

create policy "Users can insert approvals"
  on agent_approvals for insert
  with check (auth.uid() = user_id);

-- Realtime (Safe Add)
-- Realtime (Safe Add)
-- Note: If this fails with "duplicate object", it's fine.
alter publication supabase_realtime add table agent_approvals;
