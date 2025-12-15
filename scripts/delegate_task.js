
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load Environment Variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function delegateTask() {
    const taskTitle = "Create Real Estate Schema (properties table)";
    const taskDescription = `
    Create a new SQL migration file at 'src/data/create_real_estate_schema.sql'.
    It must define:
    1. Table 'properties' (id, title, description, price, location, agent_id, status, type: 'sale'|'rent').
    2. Table 'property_images' (id, property_id, url).
    3. Enable RLS on both.
    4. Policy: Anyone can view status='active'. Only 'authenticated' can create.
  `;

    console.log(`🚀 Delegating Task: "${taskTitle}" to Worker...`);

    const { data, error } = await supabase
        .from('agent_tasks')
        .insert({
            title: taskTitle,
            description: taskDescription,
            status: 'pending',
            priority: 'high',
            created_by: 'system_admin', // simulating us
            assigned_to: 'tech-lead-agent' // Pre-assigning to ensure the specific worker picks it up if logic is strict
        })
        .select()
        .single();

    if (error) {
        console.error("❌ Failed to delegate task:", error);
    } else {
        console.log(`✅ Task Delegated Successfully! ID: ${data.id}`);
        console.log("The Worker should pick this up momentarily.");
    }
}

delegateTask();
