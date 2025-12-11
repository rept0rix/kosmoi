-- Create the audit_logs table
create table if not exists public.audit_logs (
  id uuid default gen_random_uuid() primary key,
  timestamp timestamptz not null default now(),
  actor_id text not null,
  actor_type text not null, -- 'USER', 'AGENT', 'SYSTEM', 'WORKER'
  action_type text not null,
  content jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Add RLS policies (Optional - adjust as needed)
alter table public.audit_logs enable row level security;

-- Allow insert from anon (for now, or authenticated users)
create policy "Allow insert for all"
on public.audit_logs
for insert
to anon, authenticated
with check (true);

-- Allow select for all (for now, for visibility)
create policy "Allow view for all"
on public.audit_logs
for select
to anon, authenticated
using (true);
