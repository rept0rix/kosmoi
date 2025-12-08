-- Create company_knowledge table for Key-Value storage
create table if not exists company_knowledge (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  category text default 'general',
  updated_by text,
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table company_knowledge enable row level security;

-- Policies
create policy "Anyone can read company knowledge"
  on company_knowledge for select
  using (true);

create policy "Authenticated users can insert/update company knowledge"
  on company_knowledge for all
  using (auth.role() = 'authenticated' or auth.role() = 'service_role')
  with check (auth.role() = 'authenticated' or auth.role() = 'service_role');
