
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function enableAI() {
    // 1. Get first provider
    const { data: providers } = await supabase.from('service_providers').select('id, business_name').limit(1);
    if (!providers?.length) return console.log("No providers found.");

    const provider = providers[0];
    console.log(`🔌 Enabling AI for: ${provider.business_name} (${provider.id})`);

    // 2. Insert/Update settings
    const { error } = await supabase
        .from('business_settings')
        .upsert({
            provider_id: provider.id,
            ai_auto_reply: true,
            ai_tone: 'friendly',
            custom_instructions: 'Invite them to our Happy Hour (5-7PM)! 🍹'
        });

    if (error) console.error("❌ Failed:", error);
    else console.log("✅ AI Receptionist Enabled!");
}

enableAI();
