
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load env vars
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    console.log('DEBUG: Found keys:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function applyRLS() {
    console.log('🛡️  Applying Row Level Security Policies...');

    // Read the SQL file
    const sqlPath = path.join(process.cwd(), 'secure_rls.sql');
    let sqlContent;

    try {
        sqlContent = fs.readFileSync(sqlPath, 'utf8');
    } catch (err) {
        console.error(`❌ Could not read ${sqlPath}:`, err.message);
        process.exit(1);
    }

    // Split into statements (rough split by semicolon at end of line)
    // Note: This is fragile for complex PL/pgSQL but okay for simple DDL/Policy scripts
    const statements = sqlContent
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute.`);

    /* 
       NOTE: Supabase JS Client does NOT support arbitrary SQL execution via `.rpc()` unless you have a helper function.
       However, we can try to use the `pg` library if we had the connection string, IF the user provided it.
       Checking previous context... 
       Wait, usually we CANNOT execute SQL directly from the JS client unless there's a stored procedure.
       So checking if we have a `exec_sql` function or similar already.
    */

    // Attempting to call a common helper 'exec_sql' if it exists, otherwise we warn.
    const { data: rpcData, error: rpcError } = await supabase.rpc('exec_sql', { query: 'SELECT 1' });

    if (rpcError) {
        if (rpcError.code === '42883') { // Undefined function
            console.log('⚠️  Helper function `exec_sql` not found in database.');
            console.log('❗ You must run `secure_rls.sql` manually in the Supabase SQL Editor.');
            console.log('👉 https://supabase.com/dashboard/project/_/sql');
            return;
        }
        // If other error, maybe permissions?
        console.log('⚠️  Error checking for SQL helper:', rpcError.message);
    }

    // If we are here, we might have the function. Let's try to run the whole file?
    // Actually, usually we don't have this.
    // STRATEGY CHANGE: We will output the instruction clearly.
    // It is safer/better to just tell the user to run it than to try to hack a SQL runner without pg-connection-string.

    console.log('\n✅ Script `secure_rls.sql` is ready.');
    console.log('⚠️  AUTOMATED EXECUTION SKIPPED: Direct SQL execution requires admin rights via Dashboard.');
    console.log('\n📋 INSTRUCTIONS:');
    console.log('1. Go to Supabase Dashboard -> SQL Editor');
    console.log('2. Open `secure_rls.sql` (or copy content)');
    console.log('3. Click RUN');
    console.log('\n(Since we are in a web container, we cannot open the browser for you to the exact URL)');
}

applyRLS();
