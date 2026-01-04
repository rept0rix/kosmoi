
// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { token } = await req.json();

        if (!token) {
            throw new Error("Token is required");
        }

        // Initialize Supabase Client with SERVICE ROLE KEY to bypass RLS
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Query the invitation
        const { data: invitation, error: inviteError } = await supabaseAdmin
            .from('invitations')
            .select('*, service_providers(*)')
            .eq('token', token)
            .eq('status', 'pending')
            .single();

        if (inviteError) throw inviteError;

        // Check expiry
        if (new Date(invitation.expires_at) < new Date()) {
            throw new Error("Invitation expired");
        }

        return new Response(JSON.stringify(invitation), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: (error as Error).message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
