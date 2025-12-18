
import dotenv from 'dotenv';
import { db } from '../src/api/supabaseClient.js';

dotenv.config();

async function inspectProvider() {
    console.log("Fetching first Service Provider to inspect schema...");
    try {
        const providers = await db.entities.ServiceProvider.list(null, 1);
        if (providers && providers.length > 0) {
            console.log("Keys found:", Object.keys(providers[0]));
        } else {
            console.log("No providers found.");
        }
    } catch (error) {
        console.error("❌ Failed:", error);
    }
}

inspectProvider();
