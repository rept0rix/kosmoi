
import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const TASK_ID = '98cfe279-8a73-4ca1-83dc-07db6af157f0';

async function monitorTask() {
    console.log(`👀 Monitoring Task ${TASK_ID}...`);

    let isComplete = false;
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max (if 5s interval -- actually wait 5s each loop)

    while (!isComplete && attempts < maxAttempts) {
        const { data, error } = await supabase
            .from('agent_tasks')
            .select('*')
            .eq('id', TASK_ID)
            .single();

        if (error) {
            console.error("Error fetching task:", error.message);
            break;
        }

        const status = data.status;
        console.log(`[${new Date().toLocaleTimeString()}] Status: ${status}`);

        if (status === 'completed') {
            isComplete = true;
            console.log("\n✅ Task Completed!");
            console.log("Result:", data.result);
        } else if (status === 'failed') {
            isComplete = true;
            console.error("\n❌ Task Failed!");
            console.error("Error:", data.error);
        } else {
            // Wait 5 seconds
            await new Promise(resolve => setTimeout(resolve, 5000));
            attempts++;
        }
    }
}

monitorTask();
