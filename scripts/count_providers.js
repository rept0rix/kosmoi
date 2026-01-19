
import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function countProviders() {
    const { count, error } = await supabase
        .from('service_providers')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error("Error counting providers:", error);
    } else {
        console.log("Total Service Providers in DB:", count);
    }
}

countProviders();
