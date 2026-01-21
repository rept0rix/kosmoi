
import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function getStatuses() {
    const { data, error } = await supabase
        .from('service_providers')
        .select('status');

    if (error) {
        console.error(error);
        return;
    }

    const unique = [...new Set(data.map(i => i.status))];
    console.log("Existing Statuses:", unique);
}

getStatuses();
