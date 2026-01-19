
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const additionalTasks = [
    {
        title: "Setup Skills Architecture",
        status: "pending",
        description: "Initialize the `skills/` directory. Create a standard `SKILL_TEMPLATE.md` file that defines the structure for all future skills (Metadata, Usage, Tools, Scripts).",
        assigned_to: "dev_agent"
    },
    {
        title: "Migrate Receptionist to Skill",
        status: "pending",
        description: "Refactor the existing `ReceptionistAgent.js` logic into a new `skills/receptionist` module. Create `skills/receptionist/SKILL.md` and move logic to `skills/receptionist/scripts/handle_message.js`.",
        assigned_to: "dev_agent"
    },
    {
        title: "Execute Full Data Ingestion",
        status: "pending",
        description: "Run `node scripts/ingest_harvested_data.js` to ensure all harvested businesses from Samui Map are loaded into the Supabase `service_providers` table. Verify data integrity.",
        assigned_to: "dev_agent"
    },
    {
        title: "Implement Analytics Backend",
        status: "pending",
        description: "Create a PostgreSQL function `get_visitor_stats(provider_id)` (or similar) to return real daily visitor counts. Connect the Analytics Tab charts to this real data source instead of mock data.",
        assigned_to: "dev_agent"
    }
];

async function queueAdditionalTasks() {
    console.log("🚀 Queuing ADDITIONAL tasks (Skills, Data, Analytics)...");

    for (const task of additionalTasks) {
        const { data, error } = await supabase
            .from('agent_tasks')
            .insert([task])
            .select();

        if (error) {
            console.error(`❌ Failed to queue task: ${task.title}`, error.message);
        } else {
            console.log(`✅ Queued: ${task.title}`);
        }
    }
}

queueAdditionalTasks();
