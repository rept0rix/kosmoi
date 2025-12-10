
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Initialize Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function dispatchTask() {
    const task = {
        title: "Deep Scrape & Data Enrichment (Easy.co.il Style)",
        description: `
        GOAL: Scrape comprehensive data for Koh Samui businesses to match 'Easy.co.il' quality.
        
        STEPS:
        1. Iterate through ALL categories: [Restaurants, Hotels, Nightlife, Health, Services, etc.].
        2. For each category and area (Chaweng, Lamai, Bophut, etc.), fetch places from Google Maps API.
        3. ENRICHMENT:
           - Fetch ALL photos (not just 1).
           - Fetch Opening Hours (structured).
           - Fetch Attributes (Wifi, Parking, Accessibility).
           - Fetch Description/Reviews.
        4. Insert into 'service_providers' table with 'verified: true' and 'status: active'.
        5. Log progress to 'worker_logs' table.
        
        NOTE: Improve the existing 'AdminImporter' logic to be more robust and run headlessly.
        `,
        assigned_to: 'tech-lead-agent', // Assign to the worker role
        status: 'open',
        priority: 'high',
        created_by: 'system_orchestrator',
        created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
        .from('agent_tasks')
        .insert([task])
        .select();

    if (error) {
        console.error("Failed to dispatch task:", error);
    } else {
        console.log("✅ Deep Scrape Task Dispatched to Worker:", data[0].id);
    }
}

dispatchTask();
