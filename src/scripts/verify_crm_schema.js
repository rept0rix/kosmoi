
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyCRM() {
    console.log('Verifying CRM Tables...');

    const { data, error } = await supabase.from('crm_pipelines').select('count', { count: 'exact', head: true });

    if (error) {
        console.error('Error verifying crm_pipelines:', error.message);
        console.log('CRM Schema likely NOT applied.');
    } else {
        console.log('Success: crm_pipelines table exists.');
    }
}

verifyCRM();
