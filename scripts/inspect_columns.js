
import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
    const { data, error } = await supabase
        .from('service_providers')
        .select('*')
        .limit(1);

    if (error) {
        console.error(error);
        return;
    }

    if (data.length > 0) {
        console.log('Columns:', Object.keys(data[0]));
        console.log('Sample Record:', data[0]);
    } else {
        console.log('Table is empty.');
    }
}

inspectSchema();
