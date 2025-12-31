
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("❌ Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
    console.log("Testing Supabase Connection...");

    try {
        const { data, error } = await supabase.from('service_providers').select('count', { count: 'exact', head: true });

        if (error) {
            console.error("❌ Connection failed:", error.message);
            return;
        }

        console.log(`✅ Connection successful! Found ${data?.length ?? 'some'} rows (count query).`);

        // Test Insert (Fake record)
        const fakeId = `test_entry_${Date.now()}`;
        const fakeRecord = {
            business_name: "Test Verification Entry",
            location: "Nowhere",
            category: "other",
            verified: false,
            status: 'pending',
            created_by: 'system_verify_script',
            google_place_id: fakeId
        };

        console.log("Attempting insert...");
        const { data: insertData, error: insertError } = await supabase
            .from('service_providers')
            .insert(fakeRecord)
            .select()
            .single();

        if (insertError) {
            console.error("❌ Insert failed:", insertError.message);
        } else {
            console.log("✅ Insert successful:", insertData.id);

            // Cleanup
            console.log("Cleaning up...");
            await supabase.from('service_providers').delete().eq('id', insertData.id);
            console.log("✅ Cleanup complete.");
        }

    } catch (err) {
        console.error("❌ Unexpected error:", err);
    }
}

testConnection();
