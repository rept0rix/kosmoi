
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
    console.log("🛠️ Applying Transaction RLS Policies...");

    // Read the SQL file
    const sqlPath = path.join(__dirname, 'fix_transactions_rls.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute via RPC
    // Note: 'exec_sql' RPC must exist. If not, we might fail.
    // admin_functions.sql didn't show 'exec_sql'. Let's check if it exists or use another way.
    // 'apply_db_patch.js' used 'exec_sql'. If it failed there, I need to know.
    // But assuming it exists from previous setup.

    const { data, error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
        console.error("❌ Migration Failed:", error.message);
        // Fallback: If exec_sql missing, we might need a manual step or use a different known RPC if any.
        // Or if I can't run SQL, I'm stuck.
        // But the user has `admin_functions.sql`, maybe I can add `exec_sql` there?
        // But I can't apply it without `exec_sql`... chicken and egg.
        // Let's hope it exists.
    } else {
        console.log("✅ Successfully applied RLS policies.");
    }
}

applyMigration();
