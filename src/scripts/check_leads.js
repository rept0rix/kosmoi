import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // Or service role if needed for updates

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLeads() {
    console.log("👀 Polling for new leads (status='new_lead')...");

    let attempts = 0;
    const maxAttempts = 60; // 5 minutes

    while (attempts < maxAttempts) {
        const { data, error } = await supabase
            .from('service_providers')
            .select('*')
            .eq('status', 'new_lead'); // Only look for FRESH leads

        if (error) {
            console.error("Error fetching leads:", error.message);
        } else if (data.length > 0) {
            console.log(`\n🎉 BINGO! Found ${data.length} new leads:`);
            data.forEach(lead => {
                console.log(`- [${lead.id}] ${lead.business_name} (${lead.category})`);
            });
            process.exit(0); // Found it!
        } else {
            process.stdout.write(".");
        }

        attempts++;
        await new Promise(r => setTimeout(r, 5000)); // Sleep 5s
    }

    console.log("\nTimeout waiting for leads.");
}

checkLeads();
