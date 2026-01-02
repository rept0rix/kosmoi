-- Function to claim a business profile
create or replace function claim_business(token_input text) returns jsonb language plpgsql security definer as $$
declare v_invitation invitations %rowtype;
v_provider_id uuid;
v_user_id uuid;
begin -- Get current user ID
v_user_id := auth.uid();
if v_user_id is null then return jsonb_build_object('success', false, 'error', 'Not authenticated');
end if;
-- Validate token
select * into v_invitation
from invitations
where token = token_input
    and status = 'pending'
    and expires_at > now();
if v_invitation.id is null then return jsonb_build_object(
    'success',
    false,
    'error',
    'Invalid or expired token'
);
end if;
v_provider_id := v_invitation.service_provider_id;
-- Update Service Provider
update service_providers
set owner_id = v_user_id,
    status = 'verified',
    -- Auto verify on claim
    claimed_at = now()
where id = v_provider_id;
-- Update Invitation
update invitations
set status = 'claimed',
    claimed_at = now(),
    claimed_by = v_user_id
where id = v_invitation.id;
return jsonb_build_object('success', true, 'providerId', v_provider_id);
exception
when others then return jsonb_build_object('success', false, 'error', SQLERRM);
end;
$$;
-- Function to get invitation details by token (helper for frontend preview)
-- This allows us to strictly control what data is exposed via token, even if RLS is tricky
create or replace function get_invitation_details(token_input text) returns table (
        business_name text,
        business_id uuid,
        invitation_status text
    ) language plpgsql security definer as $$ begin return query
select sp.business_name,
    sp.id,
    i.status
from invitations i
    join service_providers sp on i.service_provider_id = sp.id
where i.token = token_input
    and i.expires_at > now();
end;
$$;