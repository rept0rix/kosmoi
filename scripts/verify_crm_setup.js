import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyCRM() {
    console.log("🔍 Verifying CRM Setup...");

    // 1. Check Pipelines
    const { data: pipelines, error: dbError } = await supabase.from('crm_pipelines').select('*');
    if (dbError) {
        console.error("❌ Failed to fetch pipelines:", dbError.message);
        return;
    }
    console.log(`✅ Found ${pipelines.length} pipelines.`);
    pipelines.forEach(p => console.log(`   - [${p.id}] ${p.name} (Default: ${p.is_default})`));

    if (pipelines.length === 0) {
        console.warn("⚠️ No pipelines found! Did you run the SQL script?");
    }

    // 2. Check Defaults
    const defaultPipeline = pipelines.find(p => p.is_default);
    if (defaultPipeline) {
        console.log(`✅ Default Pipeline: ${defaultPipeline.name} (${defaultPipeline.id})`);

        // 3. Check Stages
        const { data: stages } = await supabase.from('crm_stages').select('*').eq('pipeline_id', defaultPipeline.id);
        console.log(`✅ Found ${stages.length} stages for default pipeline.`);

        if (stages.length > 0) {
            // 4. Test Write (Create Lead)
            console.log("📝 Testing Lead Creation...");
            const testLead = {
                first_name: 'Test',
                last_name: 'Lead',
                company: 'Verification Script',
                stage_id: stages[0].id,
                status: 'new'
            };

            const { data: lead, error: createError } = await supabase.from('crm_leads').insert([testLead]).select().single();

            if (createError) {
                console.error("❌ Failed to create lead:", createError.message);
            } else {
                console.log(`✅ Lead created successfully: ${lead.id}`);

                // 5. Cleanup
                await supabase.from('crm_leads').delete().eq('id', lead.id);
                console.log("✅ Test lead deleted (cleanup).");
            }
        }
    } else {
        console.warn("⚠️ No default pipeline found.");
    }
}

verifyCRM();
