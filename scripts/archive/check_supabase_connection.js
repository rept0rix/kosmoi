
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '.env');

console.log('Reading .env from:', envPath);

try {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    const env = {};
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            env[key.trim()] = value.trim();
        }
    });

    const supabaseUrl = env.VITE_SUPABASE_URL;
    const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Missing Supabase credentials in .env');
        process.exit(1);
    }

    console.log('Supabase URL:', supabaseUrl);
    console.log('Supabase Key (first 10 chars):', supabaseAnonKey.substring(0, 10) + '...');

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    console.log('Testing connection...');
    const start = Date.now();
    const { data, error } = await supabase.from('service_providers').select('*').limit(1);
    const duration = Date.now() - start;

    if (error) {
        console.error('Supabase Error:', error);
    } else {
        console.log('Supabase Success!');
        console.log(`Query took ${duration}ms`);
        console.log('Data:', data);
    }

} catch (err) {
    console.error('Script Error:', err);
}
