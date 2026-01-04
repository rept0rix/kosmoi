
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { nanoid } from 'nanoid';

// Load env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function createTestInvitation() {
    // 1. Get a random provider
    // Filter for one that likely has images or is interesting
    const { data: providers } = await supabase
        .from('service_providers')
        .select('id, business_name')
        .ilike('business_name', '%cafe%') // try to find a cafe
        .limit(1);

    let provider = providers?.[0];

    // Fallback if no cafe
    if (!provider) {
        const { data: anyProvider } = await supabase.from('service_providers').select('id, business_name').limit(1);
        provider = anyProvider?.[0];
    }

    if (!provider) {
        console.error("No providers found in DB.");
        return;
    }

    console.log(`Creating invitation for: ${provider.business_name} (${provider.id})`);

    // 2. Create token
    const token = nanoid(32);

    // 3. Insert invitation
    const { error } = await supabase.from('invitations').insert({
        service_provider_id: provider.id,
        token: token,
        status: 'pending',
        metadata: { source: 'test_script' },
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    });

    if (error) {
        console.error("Error creating invite:", error);
    } else {
        console.log("\n✅ Invitation Created!");
        console.log(`👉 Link: http://localhost:5173/claim?token=${token}`);
        console.log(`(Make sure your dev server is running on port 5173)`);
    }
}

createTestInvitation();
