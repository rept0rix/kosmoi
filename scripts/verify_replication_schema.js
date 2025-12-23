
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function verifyTable(tableName) {
    console.log(`Checking table: ${tableName}...`);
    const { data, error } = await supabase.from(tableName).select('updated_at').limit(1);

    if (error) {
        console.error(`❌ ${tableName}: Error accessing "updated_at" - ${error.message}`);
        return false;
    }
    console.log(`✅ ${tableName}: "updated_at" exists.`);
    return true;
}

async function run() {
    console.log('--- Verifying Replication Schema ---');
    const tables = ['crm_leads', 'crm_stages'];
    let allOk = true;

    for (const t of tables) {
        const ok = await verifyTable(t);
        if (!ok) allOk = false;
    }

    if (!allOk) {
        console.log('\n❌ MISSING COLUMNS DETECTED.');
    } else {
        console.log('\n✅ ALL TABLES OK.');
    }
}

run();
