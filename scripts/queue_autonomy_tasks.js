
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

const tasks = [
    {
        title: "Implement Reviews Data Wiring",
        status: "pending",
        description: "Connect the Dashboard 'Reviews' tab to the `reviews` table in Supabase. Implement 'useQuery' to fetch reviews and 'useMutation' to reply. Ensure optimistic updates for a snappy feel.",
        assigned_to: "dev_agent"
    },
    {
        title: "Create Posts Infrastructure",
        status: "pending",
        description: "Create a 'posts' table in Supabase (id, business_id, content, image_url, created_at). Determine RLS policies. Update 'DashboardSingleView' to fetch and list these posts.",
        assigned_to: "dev_agent"
    },
    {
        title: "Stripe Product Setup ($1 Hook)",
        status: "pending",
        description: "Use StripeService (or scripts) to create a 'Verified Business' product in Stripe for $1. Store the Price ID for use in the checkout flow.",
        assigned_to: "dev_agent"
    },
    {
        title: "Implement Verified Checkout Flow",
        status: "pending",
        description: "Add a 'Verify Business' button in the dashboard that calls StripeService.createPaymentLink (or checkout) with the $1 product. Handle the success_url to update the business status to 'Verified'.",
        assigned_to: "dev_agent"
    },
    {
        title: "Gate Features Behind Verification",
        status: "pending",
        description: "Modify DashboardSingleView to disable the 'Reply' button on reviews if the business is not 'Verified'. Add a tooltip explaining why.",
        assigned_to: "dev_agent"
    }
];

async function queueTasks() {
    console.log("🚀 Queuing tasks for Autonomous Worker...");

    for (const task of tasks) {
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

queueTasks();
