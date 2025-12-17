import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv'; // Ensure dotenv is used

// Helper to get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars from .env in root
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applySchema() {
    const schemaPath = path.join(__dirname, '../src/data/create_analytics_schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Applying schema...');

    // Warning: supabase-js doesn't support raw SQL query execution directly unless enabled via RPC or using pg-connection.
    // However, if we assume the user has a way to run SQL, we might need a different approach.
    // BUT for now, let's try the RPC method if available or just log that it needs to be run.

    // Fallback: This script mostly serves as a manifest. 
    // Ideally, we use a library like `postgres` to connect directly if we have the connection string.
    // Since we only have HTTP keys, we can't run DDL easily unless there's an RPC function `exec_sql`.

    // Check if we have an exec_sql function
    const { error: rpcError } = await supabase.rpc('exec_sql', { query: sql });

    if (rpcError) {
        if (rpcError.message.includes('function "exec_sql" does not exist')) {
            console.error('❌ Function exec_sql does not exist. You must run the SQL manually in Supabase Dashboard.');
            console.log('\nSQL Content:\n', sql);
        } else {
            console.error('❌ Error executing SQL:', rpcError);
        }
    } else {
        console.log('✅ Schema applied successfully via exec_sql');
    }
}

applySchema();
