import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars FIRST
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Dynamic import
const { db } = await import('../api/supabaseClient.js');

async function createTestLead() {
    console.log("Creating test lead...");
    const testLead = {
        business_name: `Test Vendor ${Date.now()}`,
        category: 'Restaurant',
        description: 'Auto-generated test vendor for Telegram integration check.',
        location: 'Test City',
        email: 'test@example.com',
        // owner_name and contact_info are NOT in schema, using valid columns
        status: 'new_lead',
        average_rating: 0,
        total_reviews: 0 // column is total_reviews not review_count
    };

    try {
        const { data, error } = await db.entities.ServiceProvider.create(testLead);
        if (error) {
            console.error("Failed to create lead:", error);
        } else {
            console.log("✅ Test Lead Created!");
            // console.log(data);
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

createTestLead();
