// @ts-nocheck
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

console.log('Admin Actions Function Initialized');

// Helper: write a signal (non-fatal)
async function writeSignal(supabase: any, eventType: string, entityType: string, entityId: string | null, data: object) {
    await supabase.rpc('write_signal', {
        p_event_type: eventType,
        p_entity_type: entityType,
        p_entity_id: entityId,
        p_source: 'admin-actions',
        p_data: data,
    }).catch(() => {});
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('APP_SERVICE_ROLE_KEY') ?? '';
        const anonKey     = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

        const authHeader = req.headers.get('Authorization') ?? '';
        const bearerToken = authHeader.replace('Bearer ', '').trim();
        const isMachineCall = bearerToken === serviceKey;

        // Service-role (machine) client — always available
        const supabaseAdmin = createClient(supabaseUrl, serviceKey);

        const body = await req.json();
        const { action, payload } = body;

        // ============================================================
        // MACHINE-TO-MACHINE ACTIONS (no user JWT required)
        // Called by cron-worker / autonomous brain
        // ============================================================
        if (action === 'REVIEW_PENDING_CLAIMS') {
            if (!isMachineCall) {
                return new Response(JSON.stringify({ error: 'Service role required for this action' }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 403,
                });
            }

            // Find providers who claimed but haven't been verified yet
            const { data: pending, error } = await supabaseAdmin
                .from('service_providers')
                .select('id, business_name, email, claimed_at, stripe_status, metadata')
                .eq('claimed', true)
                .or('stripe_status.is.null,stripe_status.eq.pending')
                .order('claimed_at', { ascending: true })
                .limit(20);

            if (error) throw new Error(`Pending claims query: ${error.message}`);

            const results = { reviewed: 0, flagged: 0, providers: [] as string[] };

            for (const provider of pending ?? []) {
                const claimedHoursAgo = provider.claimed_at
                    ? Math.floor((Date.now() - new Date(provider.claimed_at).getTime()) / 3_600_000)
                    : 0;

                // Flag if claimed >48h ago with no stripe activity
                if (claimedHoursAgo > 48) {
                    await writeSignal(supabaseAdmin, 'claim.stale_unverified', 'provider', provider.id, {
                        business_name: provider.business_name,
                        claimed_hours_ago: claimedHoursAgo,
                        stripe_status: provider.stripe_status,
                    });
                    results.flagged++;
                } else {
                    results.reviewed++;
                }
                results.providers.push(provider.business_name);
            }

            await supabaseAdmin.from('agent_decisions').insert({
                agent_id: 'admin-actions',
                decision_type: 'REVIEW_PENDING_CLAIMS',
                context: { claims_found: pending?.length ?? 0 },
                action: results,
                success: true,
            });

            return new Response(JSON.stringify({ success: true, results }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        }

        // ============================================================
        // USER-AUTH ACTIONS (admin JWT required)
        // ============================================================

        // Verify caller is an admin user
        const supabaseUser = createClient(supabaseUrl, anonKey, {
            global: { headers: { Authorization: authHeader } },
        });

        const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized: Invalid Token' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            });
        }

        const { data: userProfile, error: profileError } = await supabaseAdmin
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profileError || userProfile?.role !== 'admin') {
            return new Response(JSON.stringify({ error: 'Unauthorized: Admin Access Required' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 403,
            });
        }

        if (action === 'impersonate_user') {
            const { email } = payload || {};
            if (!email) throw new Error('Missing email for impersonation');

            const { data, error } = await supabaseAdmin.auth.admin.generateLink({
                type: 'magiclink',
                email,
            });

            if (error) throw error;

            return new Response(JSON.stringify({
                success: true,
                action_link: data.properties.action_link,
                user: data.user,
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (action === 'update_user_role') {
            const { userId, newRole } = payload || {};
            if (!userId || !newRole) throw new Error('Missing userId or newRole');

            const { error: publicError } = await supabaseAdmin.from('users').update({ role: newRole }).eq('id', userId);
            if (publicError) throw publicError;

            const { error: metaError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
                app_metadata: { role: newRole },
            });
            if (metaError) throw metaError;

            return new Response(JSON.stringify({ success: true, message: `Role updated to ${newRole}` }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        if (action === 'delete_user') {
            const { userId } = payload || {};
            if (!userId) throw new Error('Missing userId');

            const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
            if (error) throw error;

            return new Response(JSON.stringify({ success: true, message: 'User deleted successfully' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        throw new Error(`Unknown action: ${action}`);

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message || 'An unknown error occurred' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
