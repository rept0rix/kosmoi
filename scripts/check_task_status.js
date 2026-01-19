
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTasks() {
    const { data, error } = await supabase
        .from('agent_tasks')
        .select('title, status, result')
        .in('title', [
            "Implement Reviews Data Wiring",
            "Create Posts Infrastructure",
            "Stripe Product Setup ($1 Hook)",
            "Setup Skills Architecture",
            "Migrate Receptionist to Skill"
        ]);

    if (error) {
        console.error("Error fetching tasks:", error);
    } else {
        console.table(data);
    }
}

checkTasks();
