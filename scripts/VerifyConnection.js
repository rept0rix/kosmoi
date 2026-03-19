import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("🔍 Debugging Supabase Connection...");
console.log(`📡 URL: ${url ? url.substring(0, 30) + '...' : 'UNDEFINED'}`);
console.log(`🔑 Key: ${key ? key.substring(0, 5) + '...' : 'UNDEFINED'}`);

if (!url || !key) {
    console.error("❌ Mising environment variables!");
    process.exit(1);
}

const supabase = createClient(url, key);

async function test() {
    // 1. Check Known Good Table
    const { data: tasks, error: tasksError } = await supabase.from('agent_tasks').select('*').limit(1);
    if (tasksError) console.error("❌ 'agent_tasks' Check Failed:", tasksError.message);
    else console.log("✅ 'agent_tasks' Connection OK");

    // 2. Check Problematic Table
    const { data: ck, error: ckError } = await supabase.from('company_knowledge').select('*').limit(1);
    if (ckError) {
        console.error("❌ 'company_knowledge' Check Failed:", ckError.message);
        console.error("   Code:", ckError.code);
        console.error("   Details:", ckError.details);
    } else {
        console.log("✅ 'company_knowledge' Connection OK");
    }
}

test();
