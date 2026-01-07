CREATE OR REPLACE FUNCTION claim_business(token_input text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_invitation invitations %rowtype;
v_provider_id uuid;
v_user_id uuid;
BEGIN -- Get current user ID
v_user_id := auth.uid();
-- DEBUG: Return immediately if we can't see the user
IF v_user_id IS NULL THEN RETURN jsonb_build_object(
    'success',
    false,
    'error',
    'Not authenticated (auth.uid() is null)'
);
END IF;
-- Validate token
SELECT * INTO v_invitation
FROM invitations
WHERE token = token_input
    AND status = 'pending'
    AND expires_at > now();
IF v_invitation.id IS NULL THEN RETURN jsonb_build_object(
    'success',
    false,
    'error',
    'Invalid or expired token'
);
END IF;
v_provider_id := v_invitation.service_provider_id;
-- Update Service Provider
UPDATE service_providers
SET owner_id = v_user_id,
    status = 'verified',
    claimed_at = now()
WHERE id = v_provider_id;
-- Update Invitation
UPDATE invitations
SET status = 'claimed',
    claimed_at = now(),
    claimed_by = v_user_id
WHERE id = v_invitation.id;
-- DEBUG: Return the IDs we used
RETURN jsonb_build_object(
    'success',
    true,
    'providerId',
    v_provider_id,
    'debug_user_id',
    v_user_id,
    'debug_auth_uid',
    auth.uid()
);
EXCEPTION
WHEN OTHERS THEN RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;