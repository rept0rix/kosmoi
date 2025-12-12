
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Load env vars roughly (since we can't use Vite's import.meta.env easily here without setup)
// checking for .env file
const envPath = path.join(PROJECT_ROOT, '.env');
let env = {};
if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    lines.forEach(line => {
        const [key, val] = line.split('=');
        if (key && val) env[key.trim()] = val.trim();
    });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error("❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY in environment or .env file.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
    console.log("🛠️ Attempting to patch 'agent_tasks' table...");

    const sql = `
    ALTER TABLE agent_tasks ADD COLUMN IF NOT EXISTS result TEXT;
    ALTER TABLE agent_tasks ADD COLUMN IF NOT EXISTS input_context JSONB;
    `;

    try {
        const { data, error } = await supabase.rpc('exec_sql', { sql });
        if (error) {
            console.error("❌ RPC 'exec_sql' failed. Error:", error.message);
            console.log("\n⚠️ ACTION REQUIRED: Please run the content of 'add_result_column.sql' in your Supabase Dashboard SQL Editor.");
        } else {
            console.log("✅ Successfully patched database schema.");
        }
    } catch (e) {
        console.error("❌ Unexpected error:", e.message);
    }
}

run();
