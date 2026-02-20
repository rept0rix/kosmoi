
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseAnonKey = envConfig.VITE_SUPABASE_ANON_KEY;
const client = createClient(supabaseUrl, supabaseAnonKey);

const TABLES = [
    'profiles',
    'bookings',
    'agent_memory',
    'agent_tasks',
    'audit_logs',
    'spatial_ref_sys'
];

async function checkTable(table) {
    console.log(`\n🔍 Checking table: ${table}`);

    // 1. Try READ
    const { data: readData, error: readError } = await client
        .from(table)
        .select('*')
        .limit(1);

    if (readError) {
        console.log(`   READ: 🛡️ Blocked or Error (${readError.code})`);
    } else {
        console.log(`   READ: ⚠️  Publicly Readable (${readData.length} rows found)`);
    }

    // 2. Try INSERT (SAFE TEST)
    // We try to insert an empty object or invalid data which should fail validation 
    // BUT if it fails with 42501 (RLS Violated) that means RLS is working.
    // If it fails with 23502 (NotNull Violation) it means RLS PASSED (allowed insert).

    const { error: insertError } = await client
        .from(table)
        .insert({});

    if (insertError) {
        if (insertError.code === '42501') {
            console.log(`   INSERT: 🛡️ Blocked (RLS Policy)`);
        } else {
            console.log(`   INSERT: ⚠️  Allowed (or other error: ${insertError.code} - ${insertError.message})`);
        }
    } else {
        console.log(`   INSERT: 🚨 SUCCESSFUL (This is bad for public tables!)`);
    }
}

async function run() {
    console.log("🔒 Starting RLS Vulnerability Audit...");
    for (const table of TABLES) {
        await checkTable(table);
    }
    console.log("\nDone.");
}

run();
