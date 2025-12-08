import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function simulateError() {
    console.log("Simulating Worker Error...");
    const { error } = await supabase.from('company_knowledge').upsert({
        key: 'WORKER_STATUS',
        value: {
            status: 'STOPPED',
            error: 'Simulated 429 Quota Exceeded Error for Testing',
            last_seen: new Date().toISOString(),
            worker: 'Test-Script'
        },
        category: 'system',
        updated_at: new Date().toISOString()
    });

    if (error) console.error("Failed:", error);
    else console.log("Success! Check the UI for the Red Alert.");
}

simulateError();
