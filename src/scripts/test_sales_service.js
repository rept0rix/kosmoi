
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testSalesService() {
    console.log('Testing SalesService...');

    // Dynamic import to ensure env is loaded first
    const { SalesService } = await import('../services/SalesService.js');
    const { supabase } = await import('../api/supabaseClient.js');

    console.log('Authenticating...');
    const email = `test.user.${Date.now()}@gmail.com`;
    const password = 'password123';

    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                first_name: 'Test',
                last_name: 'User'
            }
        }
    });

    if (authError) {
        console.error('Auth Failed:', authError.message);
        return;
    }

    console.log('Authenticated as:', authData.user?.email);

    try {
        // Test 1: Get Pipeline
        console.log('\n1. Testing getPipeline()...');
        const pipeline = await SalesService.getPipeline();
        console.log('Pipeline keys:', Object.keys(pipeline));
        console.log('New Leads:', pipeline.new.length);
        console.log('Qualified Leads:', pipeline.qualified.length);

        // Test 2: Auto Qualify
        console.log('\n2. Testing runAutoQualify()...');
        const qualifyResult = await SalesService.runAutoQualify();
        console.log('Qualify Result:', qualifyResult);

        // Test 3: Verify changes
        console.log('\n3. Verifying changes...');
        const pipelineAfter = await SalesService.getPipeline();
        console.log('Qualified Leads (After):', pipelineAfter.qualified.length);

    } catch (error) {
        console.error('Test Failed:', error);
    }
}

testSalesService();
