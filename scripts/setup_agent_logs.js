
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Load env vars
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
    console.error("❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
    console.log("🛠️ Creating 'agent_logs' table...");

    const sqlPath = path.join(PROJECT_ROOT, 'supabase', 'migrations', '20260218_create_agent_logs.sql');
    if (!fs.existsSync(sqlPath)) {
        console.error("❌ Migration file not found:", sqlPath);
        process.exit(1);
    }

    const sql = fs.readFileSync(sqlPath, 'utf-8');

    try {
        const { error } = await supabase.rpc('exec_sql', { sql });
        if (error) {
            console.error("❌ RPC 'exec_sql' failed:", error.message);
            console.log("⚠️ If 'exec_sql' doesn't exist, please run the SQL manually in Supabase Dashboard.");
        } else {
            console.log("✅ Successfully created agent_logs table.");
        }
    } catch (e) {
        console.error("❌ Error:", e.message);
    }
}

run();
