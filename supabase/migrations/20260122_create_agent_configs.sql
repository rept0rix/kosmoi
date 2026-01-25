
-- 🤖 Agent Configuration Table
-- Enables persistent storage of Agent instructions and states, replacing LocalStorage.

create table if not exists public.agent_configs (
    id uuid default gen_random_uuid() primary key,
    agent_id text not null unique, -- e.g., 'agent_sales_crm'
    name text,
    role text,
    description text,
    color text default 'blue',
    system_prompt text,
    active boolean default true,
    capabilities text[], -- ARRAY['chat', 'search']
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table public.agent_configs enable row level security;

-- Admins can do everything
create policy "Admins can manage agent configs"
    on public.agent_configs
    for all
    using (
        exists (
            select 1 from public.users 
            where users.id = auth.uid() 
            and users.role = 'admin'
        )
    );

-- Public/Agents can read (for operation)
create policy "Anyone can read agent configs"
    on public.agent_configs
    for select
    using (true);

-- Functions
create or replace function update_agent_config_timestamp()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger update_agent_configs_modtime
    before update on public.agent_configs
    for each row
    execute function update_agent_config_timestamp();
