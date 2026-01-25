import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("--- RECENT AGENT LOGS ---");
    const { data: logs, error } = await supabase
        .from('agent_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) console.error("Error:", error);
    else {
        logs.forEach(l => {
            console.log(`[${l.created_at}] [${l.type || 'INFO'}] ${l.message}`);
            if (l.payload) console.log(`   Payload: ${JSON.stringify(l.payload).slice(0, 100)}...`);
        });
    }

    process.exit(0);
}

check();
