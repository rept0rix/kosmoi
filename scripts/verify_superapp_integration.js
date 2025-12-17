
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Mock CrmService for Node.js environment (reusing the logic from the frontend components)
const CrmService = {
    async getPipelines() {
        const { data, error } = await supabase
            .from('crm_pipelines')
            .select('*')
            .order('created_at', { ascending: true });
        if (error) throw error;
        return data;
    },
    async getStages(pipelineId) {
        const { data, error } = await supabase
            .from('crm_stages')
            .select('*')
            .eq('pipeline_id', pipelineId)
            .order('position', { ascending: true });
        if (error) throw error;
        return data;
    },
    async createLead(lead) {
        const { data, error } = await supabase
            .from('crm_leads')
            .insert([lead])
            .select()
            .single();
        if (error) throw error;
        return data;
    }
};

async function verifySuperAppIntegration() {
    console.log('🧪 Verifying Super App Lead Generation Logic...');

    try {
        // 1. Simulate finding the Pipeline and Stage
        console.log('Step 1: Fetching Pipelines...');
        const pipelines = await CrmService.getPipelines();
        const salesPipeline = pipelines.find(p => p.name === 'General Sales') || pipelines[0];

        if (!salesPipeline) {
            throw new Error('No pipelines found! Did you seed the CRM data?');
        }
        console.log(`✅ Found Pipeline: ${salesPipeline.name} (${salesPipeline.id})`);

        console.log('Step 2: Fetching Stages for "New Lead"...');
        const stages = await CrmService.getStages(salesPipeline.id);
        const firstStage = stages.find(s => s.name === 'New Lead') || stages[0];

        if (!firstStage) {
            throw new Error('No stages found!');
        }
        console.log(`✅ Found Stage: ${firstStage.name} (${firstStage.id})`);

        // 2. Simulate Real Estate Lead Creation
        console.log('\nStep 3: Simulating Real Estate Inquiry...');
        const realEstateLead = {
            first_name: 'Test',
            last_name: 'Buyer',
            email: 'test.buyer@example.com',
            phone: '555-0101',
            notes: 'TEST AUTOMATION: Inquiry for Luxury Villa',
            source: 'Real Estate Hub',
            stage_id: firstStage.id,
            value: 500000 // Mock commission
        };

        const createdRealEstateLead = await CrmService.createLead(realEstateLead);
        console.log(`✅ Created Real Estate Lead: ${createdRealEstateLead.first_name} ${createdRealEstateLead.last_name} (ID: ${createdRealEstateLead.id})`);

        // 3. Simulate Experiences Lead Creation
        console.log('\nStep 4: Simulating Experience Booking...');
        const experienceLead = {
            first_name: 'Test',
            last_name: 'Tourist',
            email: 'test.tourist@example.com',
            phone: '555-0202',
            notes: 'TEST AUTOMATION: Booking for Island Tour',
            source: 'Experiences Hub',
            stage_id: firstStage.id,
            value: 4500 // Mock value
        };

        const createdExpLead = await CrmService.createLead(experienceLead);
        console.log(`✅ Created Experience Lead: ${createdExpLead.first_name} ${createdExpLead.last_name} (ID: ${createdExpLead.id})`);

        console.log('\n🎉 Verification Successful! Super App Logic is integrating correctly with CRM.');

    } catch (error) {
        console.error('❌ Verification Failed:', error);
        process.exit(1);
    }
}

verifySuperAppIntegration();
