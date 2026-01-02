-- Create invitations table
create table if not exists invitations (
    id uuid default gen_random_uuid() primary key,
    service_provider_id uuid references service_providers(id) on delete cascade not null,
    token text unique not null,
    status text not null default 'pending' check (
        status in ('pending', 'clicked', 'claimed', 'expired')
    ),
    -- Tracking
    created_by uuid references auth.users(id),
    -- Admin who created it
    claimed_by uuid references auth.users(id),
    -- User who claimed it
    metadata jsonb default '{}'::jsonb,
    -- Store target email/phone etc
    -- Timestamps
    created_at timestamptz default now(),
    expires_at timestamptz default (now() + interval '7 days'),
    -- Default 7 day expiry
    clicked_at timestamptz,
    claimed_at timestamptz
);
-- RLS Policies
alter table invitations enable row level security;
-- Admins can view/create all invitations
create policy "Admins can do everything" on invitations for all using (
    auth.uid() in (
        select id
        from auth.users
        where raw_user_meta_data->>'is_admin' = 'true'
    )
);
-- Public can view valid invitations via token (for the Claim Page)
create policy "Public can view valid invitations via token" on invitations for
select using (
        status = 'pending'
        and expires_at > now()
    );
-- Indexes
create index invitations_token_idx on invitations(token);
create index invitations_service_provider_id_idx on invitations(service_provider_id);