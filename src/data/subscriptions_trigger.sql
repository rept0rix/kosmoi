-- Function to handle subscription updates
create or replace function public.handle_subscription_update() returns trigger as $$ begin -- If subscription is active or trialing
    if new.status in ('active', 'trialing') then
update public.service_providers
set badge = 'verified'
where owner_id = new.user_id;
-- If subscription is canceled, unpaid, or past due
elsif new.status in ('canceled', 'unpaid', 'past_due') then
update public.service_providers
set badge = 'basic' -- or null
where owner_id = new.user_id;
end if;
return new;
end;
$$ language plpgsql security definer;
-- Trigger definition
drop trigger if exists on_subscription_change on public.subscriptions;
create trigger on_subscription_change
after
insert
    or
update on public.subscriptions for each row execute procedure public.handle_subscription_update();