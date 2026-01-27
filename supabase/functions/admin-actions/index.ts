// @ts-nocheck
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

        if (action === 'update_user_role') {
            const { userId, newRole } = payload || {}
            if (!userId || !newRole) throw new Error("Missing userId or newRole")

            // Create Admin Client (Service Role)
            const supabaseAdmin = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            )

            // 1. Update public.users
            const { error: publicError } = await supabaseAdmin
                .from('users')
                .update({ role: newRole })
                .eq('id', userId)

            if (publicError) throw publicError

            // 2. Update auth.users metadata (for JWT claims)
            const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
                userId,
                { app_metadata: { role: newRole } }
            )

            if (authError) throw authError

            return new Response(
                JSON.stringify({ success: true, message: `Role updated to ${newRole}` }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        if (action === 'delete_user') {
            const { userId } = payload || {}
            if (!userId) throw new Error("Missing userId")

            // Create Admin Client (Service Role)
            const supabaseAdmin = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            )

            // Delete from auth.users (cascades to public.users usually)
            const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

            if (error) throw error

            return new Response(
                JSON.stringify({ success: true, message: "User deleted successfully" }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        throw new Error(`Unknown action: ${action}`)

    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message || "An unknown error occurred" }),
            {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )
    }
})
