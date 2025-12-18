
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
// Start with anon key. Ideally we should test RLS so anon key shouldn't be able to insert arbitrary roles 
// unless we have an open policy (which we don't, we only have read own).
// So this script might fail to insert if RLS is on and we are anon.
// However, let's just check if we can query the table structure or usage via a service role if available, 
// or just try to select (it should return empty or error vs "table not found").

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRbacSchema() {
    console.log("Testing RBAC Schema...");

    // 1. Check if table exists by selecting (even if 0 rows)
    const { data, error } = await supabase.from('user_roles').select('*').limit(1);

    if (error) {
        console.error("❌ Error accessing user_roles:", error);
    } else {
        console.log("✅ user_roles table is accessible. Rows found:", data.length);
    }
}

testRbacSchema();
