
import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStatusEnum() {
    // Try to update one record to a random string to see the error message
    const { error } = await supabase
        .from('service_providers')
        .update({ status: 'INVALID_STATUS_TEST' })
        .limit(1)
        .eq('id', '010f5e8b-5780-418d-afcc-8bc5f30d1d65'); // Test entry ID

    if (error) {
        console.log("Status Error:", error.message);
    } else {
        console.log("Status updated successfully! (Field is likely TEXT)");
    }
}

checkStatusEnum();
