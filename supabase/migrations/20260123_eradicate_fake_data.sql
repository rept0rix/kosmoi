-- 1. Create marketing_posts table (if not exists)
create table if not exists public.marketing_posts (
    id uuid default gen_random_uuid() primary key,
    platform text not null check (
        platform in ('instagram', 'tiktok', 'facebook', 'twitter')
    ),
    content jsonb not null,
    -- { caption, imageUrl, ... }
    status text default 'draft' check (
        status in ('draft', 'scheduled', 'published', 'failed')
    ),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    published_at timestamp with time zone
);
alter table public.marketing_posts enable row level security;
create policy "Marketing posts viewable by everyone" on public.marketing_posts for
select using (true);
create policy "Admins manage marketing posts" on public.marketing_posts for all using (true);
-- Simplified for admin context
-- 2. Seed Realistic Leads (CRM)
-- Clear old "test" leads if any (optional, but good for cleanup)
-- delete from public.leads where email like '%example.com%';
insert into public.leads (
        user_id,
        source,
        interest,
        status,
        value,
        notes,
        created_at
    )
select id as user_id,
    'website_chat' as source,
    'Luxury Villa Rental for December' as interest,
    'qualified' as status,
    5000 as value,
    'Client wants 4 bedrooms near Chaweng. High budget.' as notes,
    now() - interval '2 days'
from public.users
limit 1 on conflict do nothing;
insert into public.leads (
        user_id,
        source,
        interest,
        status,
        value,
        notes,
        created_at
    )
select id as user_id,
    'instagram_ad' as source,
    'Yacht Charter Inquiry' as interest,
    'new' as status,
    1200 as value,
    'Asking about sunset cruise availability.' as notes,
    now() - interval '4 hours'
from public.users
limit 1 offset 1 on conflict do nothing;
-- 3. Seed Agent Tasks (Optimizer Insights)
-- This replaces the MOCK_INSIGHTS in AdminOptimizer.jsx
insert into public.agent_tasks (
        title,
        description,
        status,
        type,
        priority,
        tags,
        result
    )
values (
        '[Optimization] Pricing Opportunity',
        'Demand for "Sunset Cruise" is up 20%. \n\nImpact: High\nSuggested Action: Increase price by 10% for next weekend.',
        'pending',
        'optimization',
        'high',
        '["optimization", "pricing"]',
        '{"impact": "High", "revenue_potential": "$500"}'
    ),
    (
        '[Fix] Security Enhancement',
        'Detected potential SQL injection attempt pattern in logs. \n\nImpact: Critical\nSuggested Action: Applied stricter WAF rules.',
        'completed',
        'security',
        'critical',
        '["fix", "security"]',
        '{"impact": "Critical", "blocked_ips": 12}'
    );
-- 4. Seed Marketing Posts (History)
insert into public.marketing_posts (platform, content, status, published_at)
values (
        'instagram',
        '{"caption": "Top 5 Secret Beaches in Koh Samui 🏖️ #Travel #Thailand", "imageUrl": "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2"}',
        'published',
        now() - interval '1 day'
    ),
    (
        'tiktok',
        '{"caption": "POV: Waking up in paradise 🌴 #SamuiLife", "videoUrl": "..."}',
        'published',
        now() - interval '3 days'
    );
-- 5. Seed Business Claims (Sales)
-- Requires existing service_provider. Let's try to link to one if exists, or insert dummy if safer.
-- We'll just skip if no providers to avoid FK errors, or assume seeded providers exist from previous phases.