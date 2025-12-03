
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://gzjzeywhqbwppfxqkptf.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6anpleXdocWJ3cHBmeHFrcHRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MTg5NTMsImV4cCI6MjA3OTE5NDk1M30.y8xbJ06Mr17O4Y0KZH_MlozxlOma92wjIpH4ers8zeI'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function probe() {
    console.log("Probing service_providers table...");
    const { data, error } = await supabase.from('service_providers').select('*').limit(1);
    if (error) {
        console.error("Error:", error);
    } else {
        if (data.length > 0) {
            console.log("Columns found:", Object.keys(data[0]));
        } else {
            console.log("Table is empty, cannot infer columns from data.");
            // Try to insert a dummy record to see errors? No, risky.
        }
    }
}

probe();
