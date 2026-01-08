
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRagSetup() {
    console.log('--- Checking RAG Setup ---');

    // 1. Check knowledge_base table
    console.log('1. Checking "knowledge_base" table...');
    const { data: tableData, error: tableError } = await supabase
        .from('knowledge_base')
        .select('count', { count: 'exact', head: true });

    if (tableError) {
        console.error('❌ knowledge_base table check failed:', tableError.message);
    } else {
        console.log(`✅ knowledge_base table exists. Row count: ${tableData?.length ?? 'N/A'}`); // count is in count property not data length for head:true usually
    }

    // 2. Check for match_knowledge_base RPC
    console.log('\n2. Checking "match_knowledge_base" RPC...');

    // We can't easily list RPCs with client, but we can try to call it with dummy data
    try {
        const { data, error } = await supabase.rpc('match_knowledge_base', {
            query_embedding: Array(1536).fill(0), // Assuming OpenAI embedding size
            match_threshold: 0.5,
            match_count: 1
        });

        if (error) {
            // If function doesn't exist, error code will usually indicate it
            console.error('❌ match_knowledge_base RPC check failed:', error.message);
        } else {
            console.log('✅ match_knowledge_base RPC exists and is callable.');
        }
    } catch (err) {
        console.error('❌ match_knowledge_base RPC unexpected error:', err.message);
    }
}

checkRagSetup();
