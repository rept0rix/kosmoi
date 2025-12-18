
import dotenv from 'dotenv';
import { db } from '../src/api/supabaseClient.js';

dotenv.config();

async function testClient() {
    console.log("Testing Refactored Supabase Client...");
    try {
        console.log("Fetching Service Providers...");
        const providers = await db.entities.ServiceProvider.list();
        console.log("✅ Success! Found", providers?.length || 0, "providers.");
        if (providers && providers.length > 0) {
            console.log("First provider:", providers[0].business_name);
        }
    } catch (error) {
        console.error("❌ Failed:", error);
        process.exit(1);
    }
}

testClient();
