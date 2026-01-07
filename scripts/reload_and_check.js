import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function reloadAndCheck() {
    console.log("🔄 Invoking reload_pgrst()...");

    const { error } = await supabase.rpc('reload_pgrst');

    if (error) {
        console.error("❌ RPC Failed:", error);
        // Even if RPC fails (maybe user didn't create it exactly as asked), we'll try checking anyway
    } else {
        console.log("✅ Schema Reload Triggered.");
    }

    console.log("⏳ Waiting 2 seconds...");
    await new Promise(r => setTimeout(r, 2000));

    console.log("⚡️ Checking 'owner_id' column again...");
    // Try to select owner_id
    const { data, error: selectError } = await supabase
        .from('service_providers')
        .select('owner_id')
        .limit(1);

    if (selectError) {
        if (selectError.code === '42703' || selectError.code === 'PGRST204') {
            console.log("❌ MISSING: owner_id column still does not exist.");
        } else {
            console.error("⚠️ ERROR:", selectError.message);
        }
    } else {
        console.log("🎉 SUCCESS: 'owner_id' column FOUND!");
    }
}

reloadAndCheck();
