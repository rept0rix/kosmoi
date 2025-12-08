
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Helper to load VITE vars
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Missing Supabase credentials. Check .env file.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const DEV_USER_ID = '00000000-0000-0000-0000-000000000000';
const DEV_USER_EMAIL = 'dev@kosmoi.ai';

async function createDevUser() {
    console.log("🛠 Creating Dev User in public.users table...");

    // 1. Check if table 'users' exists and has the right schema (usually handled by triggers from auth.users, but we might have a public profile table)
    // Let's assume there is a public 'users' table or similar that agent_approvals references.
    // The error 23503 on 'user_id' typically references 'auth.users' OR 'public.users'. 
    // Since we can't easily write to 'auth.users' without admin API (service role might work), we try that first.

    // Attempt to create in auth.users via Admin API (if using Service Role)
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: DEV_USER_EMAIL,
        password: 'password123',
        email_confirm: true,
        user_metadata: { name: 'Terminal Dev' }
    });

    if (authError) {
        console.warn("⚠️  Auth User creation warning (might already exist):", authError.message);
    } else {
        console.log("✅ Created Auth User:", authUser.user.id);
        // Note: The ID might be random, not our fixed one. We need to grab it.
    }

    // However, if we want a SPECIFIC ID ('0000...'), we can't force it in auth.users easily. 
    // So let's see what user we got, or find existing.

    // Search for the user to get their REAL UUID
    const { data: users } = await supabase.auth.admin.listUsers();
    const devUser = users.users.find(u => u.email === DEV_USER_EMAIL);

    if (devUser) {
        console.log(`🎯 FOUND DEV USER UUID: ${devUser.id}`);
        console.log(`👉 PLEASE UPDATE AgentService.js WITH THIS UUID!`);
    } else {
        console.error("❌ Could not find or create dev user.");
    }
}

createDevUser();
