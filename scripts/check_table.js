
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

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

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function check() {
    console.log("🔍 Checking 'agent_logs' table...");
    const { data, error } = await supabase.from('agent_logs').select('count').limit(1);

    if (error) {
        console.error("❌ Table check failed:", error.message);
        if (error.code === '42P01') {
            console.log("ℹ️ Table does not exist (42P01).");
        } else {
            console.log("ℹ️ Error code:", error.code);
        }
    } else {
        console.log("✅ Table 'agent_logs' exists and is accessible.");
    }
}

check();
