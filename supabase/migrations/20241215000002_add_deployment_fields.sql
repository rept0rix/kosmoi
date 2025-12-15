-- Add deployment columns to workflows table
alter table public.workflows
add column if not exists deployment_status text default 'draft' check (
        deployment_status in ('draft', 'published', 'archived')
    ),
    add column if not exists version integer default 1,
    add column if not exists published_at timestamp with time zone;
-- Create an index for faster lookup of published workflows
create index if not exists workflows_deployment_status_idx on public.workflows (deployment_status);