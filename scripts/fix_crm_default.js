import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDefault() {
    console.log("🔧 Setting 'General Sales' as default pipeline...");

    // 1. Update
    const { data, error } = await supabase
        .from('crm_pipelines')
        .update({ is_default: true })
        .eq('name', 'General Sales')
        .select();

    if (error) {
        console.error("❌ Error updating pipeline:", error.message);
    } else {
        console.log("✅ Pipeline updated:", data);
    }
}

fixDefault();
