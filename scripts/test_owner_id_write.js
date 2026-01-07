import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testColumn() {
    console.log("⚡️ Testing direct UPDATE on 'owner_id' column...");

    // 1. Get a provider ID
    const { data: providers } = await supabase.from('service_providers').select('id').limit(1);
    if (!providers || providers.length === 0) {
        console.log("⚠️ No providers found to test update.");
        return;
    }
    const providerId = providers[0].id;

    // 2. Try to update owner_id
    // If column doesn't exist, this should throw a specific error
    const { error } = await supabase
        .from('service_providers')
        .update({ owner_id: '00000000-0000-0000-0000-000000000000' }) // Dummy UUID
        .eq('id', providerId);

    if (error) {
        console.error("❌ Update Failed:", error);
        if (error.code === '42703') {
            console.log("💡 CONCLUSION: Column 'owner_id' DEFINITELY DOES NOT EXIST in the database.");
        } else {
            console.log(`💡 CONCLUSION: Column might exist, but we got error: ${error.message} (${error.code})`);
        }
    } else {
        console.log("✅ Update Successful! The 'owner_id' column EXISTS.");
    }
}

testColumn();
