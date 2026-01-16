
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Initialize Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log("🔍 Inspecting Chat Tables...");

    // Check board_meetings
    const { data: meetings, error: meetError } = await supabase
        .from('board_meetings')
        .select('*')
        .limit(1);

    if (meetError) {
        console.error("❌ board_meetings Check Failed:", meetError.message);
    } else if (meetings.length > 0) {
        console.log("✅ board_meetings columns:", Object.keys(meetings[0]).join(", "));
    } else {
        console.log("⚠️ board_meetings is empty (cannot check columns easily, will assume standard schema)");
    }

    // Check board_messages
    const { data: messages, error: msgError } = await supabase
        .from('board_messages')
        .select('*')
        .limit(1);

    if (msgError) {
        console.error("❌ board_messages Check Failed:", msgError.message);
    } else if (messages.length > 0) {
        console.log("✅ board_messages columns:", Object.keys(messages[0]).join(", "));
    } else {
        console.log("⚠️ board_messages is empty");
    }
}

checkSchema();
