
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedCRM() {
    console.log('Seeding CRM Data...');

    // 1. Check if Pipeline exists
    let { data: pipeline } = await supabase.from('crm_pipelines').select('id').eq('name', 'General Sales').single();

    if (!pipeline) {
        console.log('Creating General Sales pipeline...');
        const { data, error } = await supabase.from('crm_pipelines').insert({ name: 'General Sales', type: 'sales' }).select('id').single();
        if (error) {
            console.error('Error creating pipeline:', error);
            return;
        }
        pipeline = data;
    } else {
        console.log('General Sales pipeline already exists.');
    }

    // 2. Check/Create Stages
    const stages = [
        { name: 'New Lead', position: 1, color: '#3b82f6' },
        { name: 'Contacted', position: 2, color: '#eab308' },
        { name: 'Qualified', position: 3, color: '#a855f7' }, // Added Qualified explicitly to match generic "Qualified" search
        { name: 'Proposal Sent', position: 4, color: '#f97316' },
        { name: 'Won', position: 5, color: '#22c55e' },
        { name: 'Lost', position: 6, color: '#ef4444' }
    ];

    for (const stageDef of stages) {
        const { data: existing } = await supabase.from('crm_stages')
            .select('id')
            .eq('pipeline_id', pipeline.id)
            .eq('name', stageDef.name)
            .single();

        if (!existing) {
            console.log(`Creating stage: ${stageDef.name}`);
            await supabase.from('crm_stages').insert({
                pipeline_id: pipeline.id,
                name: stageDef.name,
                position: stageDef.position,
                color: stageDef.color
            });
        }
    }

    // 3. Seed some dummy leads if empty
    const { count } = await supabase.from('crm_leads').select('*', { count: 'exact', head: true });
    if (count === 0) {
        console.log('Seeding dummy leads...');
        const newStage = await supabase.from('crm_stages').select('id').eq('name', 'New Lead').single();
        if (newStage.data) {
            await supabase.from('crm_leads').insert([
                { first_name: 'John', last_name: 'Doe', company: 'Acme Corp', stage_id: newStage.data.id, source: 'manual', email: 'john@acme.com' },
                { first_name: 'Jane', last_name: 'Smith', company: 'Global Tech', stage_id: newStage.data.id, source: 'website', email: 'jane@global.com' }
            ]);
        }
    }

    console.log('CRM Seeding Complete.');
}

seedCRM();
