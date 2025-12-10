-- Admin Functions for Samui Service Hub
-- These functions enable the Admin Dashboard to perform privileged actions via safe RPC calls.

-- 1. Get Admin Stats (Avoids heavy client-side aggregation)
create or replace function get_admin_stats()
returns json
language plpgsql
security definer -- Runs with elevated privileges
as $$
declare
  total_users integer;
  total_businesses integer;
  active_subscriptions integer;
  mrr integer;
begin
  select count(*) into total_users from public.profiles;
  select count(*) into total_businesses from public.service_providers;
  select count(*) into active_subscriptions from public.service_providers where badge = 'verified';
  
  -- Simple logic: Verified = $29 MRR. Real logic would query a 'subscriptions' table.
  mrr := active_subscriptions * 29;

  return json_build_object(
    'totalUsers', total_users,
    'totalBusinesses', total_businesses,
    'activeSubscriptions', active_subscriptions,
    'mrr', mrr
  );
end;
$$;

-- 2. Ban User (Toggle Status)
create or replace function admin_ban_user(target_user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- Check if user exists (optional, update handles it)
  update public.profiles
  set status = case when status = 'active' then 'banned' else 'active' end
  where id = target_user_id;
end;
$$;

-- 3. Verify Business (Toggle Verification Badge)
create or replace function admin_verify_business(target_business_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.service_providers
  set badge = case when badge = 'verified' then 'none' else 'verified' end
  where id = target_business_id;
end;
$$;
