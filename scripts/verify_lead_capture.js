
import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyLeadCapture() {
    console.log("🧪 Verifying Lead Capture Logic...");

    const testLead = {
        first_name: "Backend",
        last_name: "Verifier",
        phone: "+66999999999",
        notes: "Direct DB verification",
        status: "new",
        source: "verification_script",
        tags: ["taxi", "smoke_test"]
    };

    const { data, error } = await supabase
        .from('crm_leads')
        .insert([testLead])
        .select()
        .single();

    if (error) {
        console.error("❌ Failed to insert lead:", error.message);
        process.exit(1);
    }

    console.log("✅ Lead inserted successfully:", data.id);
    console.log("   Name:", data.name);
    console.log("   Source:", data.source);
}

verifyLeadCapture();
