
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function inspectEvents() {
    const { data: events, error } = await supabase.from('events').select('*').limit(1);
    if (!events || events.length === 0) {
        // Table exists but empty, check columns via error or assuming standard
        // But we can't easily check columns if empty without using postgrest error details often hidden
        console.log("⚠️ 'events' table is empty. Attempting to insert a dummy to check schema constraints.");

        const dummy = { event_type: 'test_check' };
        const { error: insError } = await supabase.from('events').insert(dummy);
        if (insError) console.error("Insert Check Error:", insError.message);
    } else {
        console.log("✅ 'events' columns:", Object.keys(events[0]).join(", "));
        console.log("Sample:", events[0]);
    }
}

inspectEvents();
