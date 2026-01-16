
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://gzjzeywhqbwppfxqkptf.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // Using ANON KEY to simulate agent environment

if (!supabaseKey) {
    console.error("❌ Missing VITE_SUPABASE_ANON_KEY in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    console.log("🧪 Testing Agent Logs Insert with ANON key...");

    const { data, error } = await supabase
        .from('agent_logs')
        .insert([
            {
                agent_id: 'test-debugger',
                level: 'info',
                message: 'Test log entry from debug script',
                metadata: { testing: true }
            }
        ])
        .select();

    if (error) {
        console.error("❌ INSERT FAILED:", error);
    } else {
        console.log("✅ INSERT SUCCESS:", data);
    }
}

testInsert();
