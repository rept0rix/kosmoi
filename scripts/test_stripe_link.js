import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPaymentLink() {
    console.log("💳 Testing Stripe Payment Link Generation...");

    // Test payload for the 'Operation One Dollar' (35 THB)
    const payload = {
        name: 'Service Hub Verification',
        amount: 35,
        currency: 'thb',
        success_url: 'https://kosmoi.site/dashboard?verified=true',
        cancel_url: 'https://kosmoi.site/dashboard',
        metadata: {
            test_run: 'true',
            operation: 'one_dollar'
        }
    };

    const { data, error } = await supabase.functions.invoke('create-payment-link', {
        body: payload
    });

    if (error) {
        console.error("❌ Function Invoke Error:", error);
        if (error.context && error.context.json) {
            try {
                const errBody = await error.context.json();
                console.error("❌ Error Body:", errBody);
            } catch (e) {
                console.error("Could not parse error body");
            }
        }
    } else if (data?.error) {
        console.error("❌ Stripe Error:", data.error);
    } else if (data?.url) {
        console.log("✅ Payment Link Created Successfully!");
        console.log("🔗 URL:", data.url);
    } else {
        console.log("⚠️ Unexpected response:", data);
    }
}

testPaymentLink();
