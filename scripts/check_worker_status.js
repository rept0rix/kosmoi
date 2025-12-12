import 'dotenv/config';
import { db, realSupabase } from '../src/api/supabaseClient.js';

async function checkStatus() {
    console.log("🔍 Checking Worker Status in DB...");

    // 1. Check Task Status
    const { data: tasks, error: taskError } = await realSupabase
        .from('agent_tasks')
        .select('*')
        .eq('assigned_to', 'github-specialist-agent')
        .order('created_at', { ascending: false })
        .limit(1);

    if (tasks && tasks.length > 0) {
        const t = tasks[0];
        console.log(`\n📋 Latest Task: "${t.title}"`);
        console.log(`   Status: [${t.status}]`);
        console.log(`   Result: ${t.result ? t.result.substring(0, 100) + '...' : '(none)'}`);
    } else {
        console.log("\n📋 No tasks found for github-specialist-agent.");
    }

    // 2. Check Worker Heartbeat
    const { data: heartbeat, error: hbError } = await realSupabase
        .from('company_knowledge')
        .select('*')
        .eq('key', 'WORKER_STATUS')
        .single();

    if (heartbeat) {
        console.log(`\n💓 Worker Heartbeat:`);
        console.log(JSON.stringify(heartbeat.value, null, 2));
        console.log(`   Last Updated: ${heartbeat.updated_at}`);
    } else {
        console.log("\n💓 No Worker Heartbeat found.");
    }
}

checkStatus();
