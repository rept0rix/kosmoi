
create table if not exists agent_memory (
  id uuid default uuid_generate_v4() primary key,
  agent_id text not null,
  user_id uuid references auth.users not null,
  history jsonb default '[]'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  unique(agent_id, user_id)
);

create table if not exists agent_files (
  id uuid default uuid_generate_v4() primary key,
  path text not null,
  content text,
  agent_id text,
  user_id uuid references auth.users not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  unique(path, user_id)
);

alter table agent_memory enable row level security;
alter table agent_files enable row level security;

create policy "Users can all agent_memory" on agent_memory for all using (auth.uid() = user_id);
create policy "Users can all agent_files" on agent_files for all using (auth.uid() = user_id);
