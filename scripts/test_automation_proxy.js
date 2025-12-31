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

async function testProxy() {
    console.log("🚀 Invoking 'automation-proxy'...");

    try {
        const { data, error } = await supabase.functions.invoke('automation-proxy', {
            body: { event: 'TEST_EVENT', data: { message: 'Hello from Iron Calendar Day 1' } }
        });

        if (error) {
            console.error("❌ Invocation failed:", error.message);
            console.error("   (If status is 404, the function is not deployed to Supabase yet.)");
        } else {
            console.log("✅ Response:", data);
        }
    } catch (err) {
        console.error("❌ Unexpected error:", err);
    }
}

testProxy();
