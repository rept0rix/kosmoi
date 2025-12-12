import 'dotenv/config';
import { realSupabase } from '../src/api/supabaseClient.js';

async function checkTable() {
    console.log("🔍 Checking access to 'company_knowledge'...");

    // 1. Try to SELECT
    const { data, error } = await realSupabase
        .from('company_knowledge')
        .select('*')
        .limit(1);

    if (error) {
        console.error("❌ SELECT Failed:", error);
    } else {
        console.log("✅ SELECT Success!", data);
    }

    // 2. Try to INSERT dummy
    const { error: insertError } = await realSupabase
        .from('company_knowledge')
        .upsert({
            key: 'TEST_KEY',
            value: { foo: 'bar' },
            category: 'test',
            updated_at: new Date().toISOString()
        });

    if (insertError) {
        console.error("❌ INSERT/UPSERT Failed:", insertError);
    } else {
        console.log("✅ INSERT/UPSERT Success!");
    }
}

checkTable();
