
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function seed() {
    console.log("🌱 Seeding leads from leads.json...");

    if (!fs.existsSync('./leads.json')) {
        console.error("❌ leads.json not found.");
        return;
    }

    const leads = JSON.parse(fs.readFileSync('./leads.json', 'utf-8'));
    console.log(`Found ${leads.length} leads to insert.`);

    // 1. Get 'New Lead' Stage ID
    const { data: stage } = await supabase.from('crm_stages').select('id').eq('name', 'New Lead').single();
    const stageId = stage ? stage.id : null;

    if (!stageId) {
        console.error("❌ 'New Lead' stage not found. Please seed stages first.");
        return;
    }
    console.log("Found Stage ID:", stageId);

    for (const lead of leads) {
        // Map fields to DB schema if needed
        const payload = {
            company: lead.company,
            first_name: lead.first_name,
            last_name: lead.last_name,
            email: lead.email,
            value: lead.value === 'High' ? 10000 : 5000,
            source: lead.source || 'ai_prospecting',
            stage_id: stageId // Use correct column
        };

        const { data, error } = await supabase.from('crm_leads').insert([payload]).select().single();
        if (error) {
            console.error(`❌ Failed to insert ${lead.company}:`, error.message);
        } else {
            console.log(`✅ Inserted: ${data.company} (ID: ${data.id})`);
        }
    }
}

seed();
