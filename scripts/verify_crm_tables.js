
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkTables() {
    console.log("🔍 Verifying CRM Tables...");
    const tables = ['crm_leads', 'crm_interactions', 'agent_tasks'];
    let allExist = true;

    for (const table of tables) {
        const { error } = await supabase.from(table).select('id').limit(1);
        if (error && error.code === '42P01') { // undefined_table
            console.error(`❌ Table '${table}' does NOT exist.`);
            allExist = false;
        } else if (error) {
            console.warn(`⚠️ Error checking '${table}':`, error.message);
        } else {
            console.log(`✅ Table '${table}' exists.`);
        }
    }

    if (!allExist) {
        console.log("\n⚠️ Some tables are missing. Please run the schema migration.");
        process.exit(1);
    } else {
        console.log("\n🎉 All required tables are present.");
    }
}

checkTables();
