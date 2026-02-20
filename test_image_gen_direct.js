
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://gzjzeywhqbwppfxqkptf.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_KEY;

if (!supabaseKey) {
    console.error("❌ No SUPABASE_KEY found in .env (checked SUPABASE_SERVICE_ROLE_KEY, VITE_SUPABASE_ANON_KEY, etc)");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testImageGen() {
    console.log("🎨 Testing generate-image function...");

    const { data, error } = await supabase.functions.invoke('generate-image', {
        body: {
            prompt: "A futuristic banana city on an island, neon lights, cyberpunk style",
            aspectRatio: "16:9",
            resolution: "1024x1024"
        }
    });

    if (error) {
        console.error("❌ Function Invocation Error:", error);
        return;
    }

    if (data.error) {
        console.error("❌ API Error:", data.error);
        if (data.details) console.error("Details:", data.details);
        return;
    }

    console.log("✅ Image Generated Successfully!");
    console.log("Base64 Length:", data.imageBase64?.length);
}

testImageGen();
