
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path'; // Restored
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log("🔍 Inspecting 'messages' table...");

    // Fetch one row to see structure
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error fetching messages:", error);
    } else {
        if (data.length === 0) {
            console.log("Table exists but is empty.");
        } else {
            console.log("Columns found:", Object.keys(data[0]).join(", "));
        }
    }
}

checkSchema();
