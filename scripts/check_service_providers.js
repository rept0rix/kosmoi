
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function checkServiceProviders() {
    console.log('--- Checking Service Providers Table ---');
    try {
        const { error } = await supabase.from('service_providers').select('count').limit(1);

        if (error) {
            console.error('❌ Table Check Failed:', error.message);
            if (error.code === '42P01') {
                console.error('👉 REASON: Table "public.service_providers" DOES NOT EXIST.');
            }
        } else {
            console.log('✅ Table "service_providers" exists.');
        }

    } catch (e) { console.error(e); }
}

checkServiceProviders();
