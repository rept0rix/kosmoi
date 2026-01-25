import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("--- LISTING TABLES ---");
    const { data, error } = await supabase.rpc('get_tables'); // Trying RPC if it exists

    if (error) {
        console.log("RPC get_tables failed, trying direct query on information_schema...");
        const { data: tables, error: tError } = await supabase.from('pg_tables').select('tablename').eq('schemaname', 'public');
        if (tError) {
            // Fallback to a common table list if possible or just try to query one by one?
            // Actually, let's try the common 'crm_interactions' or 'company_knowledge'
            console.error("Direct query failed:", tError);
        } else {
            console.log("Tables:", tables.map(t => t.tablename));
        }
    } else {
        console.log("Tables:", data);
    }

    process.exit(0);
}

check();
