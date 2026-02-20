
import { toolRouter } from './src/services/agents/AgentService.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Mock DB for AgentService (since it imports it)
// Actually, AgentService imports 'db' from '../../api/supabaseClient.js'.
// In Node, that import might fail if it relies on browser-only features.
// But let's try running it. If it fails, we'll know.

async function testSafety() {
    console.log("🛡️ Testing Safety Middleware...");

    // We need a valid user ID for the safety check to trigger (otherwise it blocks as 'Login required')
    // Let's fetch a user or use a dummy UUID if RLS allows.
    // Since we are using Service Role Key in this script, we can bypass RLS for verification,
    // but the toolRouter uses the 'db' client which might be anon.

    // Let's just pass a dummy UUID. The insert might fail if foreign key constraint exists on auth.users.
    // We need a real user ID.

    const { data: users } = await db.auth.admin.listUsers();
    const userId = users.users[0]?.id;

    if (!userId) {
        console.error("No users found to test with.");
        return;
    }

    console.log(`Testing with User ID: ${userId}`);

    // 1. Trigger Sensitive Action
    const result = await toolRouter('send_email', {
        to: 'test@example.com',
        subject: 'Safety Test',
        html: 'This should be intercepted.'
    }, { userId: userId, agentId: 'test-agent' });

    console.log("\n--- Result ---");
    console.log(result);

    if (result.includes('PAUSED')) {
        console.log("\n✅ SUCCESS: Action was intercepted!");
    } else {
        console.log("\n❌ FAILURE: Action was NOT intercepted.");
    }
}

testSafety();
