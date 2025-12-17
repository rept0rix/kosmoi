import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { toolRouter } from "../src/services/agents/AgentService.js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing Env Vars. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY are in .env");
    process.exit(1);
}

const serviceClient = createClient(supabaseUrl, serviceRoleKey);

async function testMemory() {
    console.log("🧠 Testing Context Memory...");

    try {
        // 1. Test Search (Should find the seeded skill)
        console.log("\nSearching for 'Supabase 401'...");
        const result = await toolRouter('search_skills', {
            query: 'Supabase',
            tags: ['error', 'rls']
        }, { userId: 'test-user', agentId: 'test-agent', dbClient: serviceClient });

        console.log("Result:", result);

        // 2. Test Save
        console.log("\nSaving new skill...");
        const saveResult = await toolRouter('save_skill', {
            category: 'process',
            tags: ['feature', 'context'],
            problem: 'Agent forgets past solutions',
            solution: 'Use agent_skills table to store and retrieve patterns.',
            confidence: 0.95
        }, {
            userId: '2ff0dcb1-37f2-4338-bb3b-f71fb6dd444e',
            agentId: 'optimizer-agent',
            dbClient: serviceClient
        });
        console.log("Save Result:", saveResult);

    } catch (e) {
        console.error("Test Failed:", e);
    }
}

testMemory();
