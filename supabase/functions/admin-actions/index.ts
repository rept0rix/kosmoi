import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"
import { corsHeaders } from "../_shared/cors.ts"

console.log("Admin Actions Function Initialized")

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // 1. Verify Requestor is Admin
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser()

        if (authError || !user) {
            throw new Error("Unauthorized: Invalid Token")
        }

        // Check 'users' table for role (Application Level RBAC)
        const { data: userProfile, error: profileError } = await supabaseClient
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profileError || userProfile?.role !== 'admin') {
            throw new Error("Unauthorized: Admin Access Required")
        }

        // 2. Process Action
        const { action, payload } = await req.json()

        if (action === 'impersonate_user') {
            const { email } = payload || {}
            if (!email) throw new Error("Missing email for impersonation")

            // Create Admin Client (Service Role)
            const supabaseAdmin = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            )

            // Generate Magic Link
            const { data, error } = await supabaseAdmin.auth.admin.generateLink({
                type: 'magiclink',
                email: email
            })

            if (error) throw error

            // Return the action link (which logs them in as the user)
            return new Response(
                JSON.stringify({
                    success: true,
                    action_link: data.properties.action_link,
                    user: data.user
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        throw new Error(`Unknown action: ${action}`)

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )
    }
})
